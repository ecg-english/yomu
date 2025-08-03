import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';

const { Pool } = pg;

const server = Fastify({ logger: true });

// CORS (allow front domain or * for now)
await server.register(fastifyCors, { origin: '*' });

// JWT setup
const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
await server.register(fastifyJwt, { secret: jwtSecret });

// Postgres pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Database migrations
await pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  total_pages INTEGER,
  target_date DATE,
  started_at TIMESTAMP DEFAULT NOW(),
  current_page INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  final_review TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS reading_records (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  pages_read INTEGER NOT NULL,
  notes TEXT,
  percentage INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS book_wishlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  amazon_link TEXT,
  notes TEXT,
  is_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
`);

// helper
function toJwtPayload(user) {
  return { id: user.id, name: user.name, email: user.email };
}

// register endpoint
server.post('/api/auth/register', async (request, reply) => {
  const { name, email, password } = request.body;
  if (!name || !email || !password) {
    return reply.code(400).send({ error: 'name, email, password required' });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email',
      [name, email, hash]
    );
    const token = server.jwt.sign(toJwtPayload(rows[0]));
    return { token };
  } catch (err) {
    if (err.code === '23505') { // unique violation
      return reply.code(409).send({ error: 'email already exists' });
    }
    server.log.error(err);
    return reply.code(500).send({ error: 'server error' });
  }
});

// login
server.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  if (rows.length === 0) {
    return reply.code(401).send({ error: 'invalid credentials' });
  }
  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return reply.code(401).send({ error: 'invalid credentials' });
  const token = server.jwt.sign(toJwtPayload(user));
  return { token };
});

// auth hook
server.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'unauthorized' });
  }
});

// Books API
server.get('/api/books', { preHandler: [server.authenticate] }, async (request) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM books WHERE user_id = $1 ORDER BY created_at DESC',
      [request.user.id]
    );
    return { books: rows };
  } catch (err) {
    server.log.error(err);
    return reply.code(500).send({ error: 'server error' });
  }
});

server.post('/api/books', { preHandler: [server.authenticate] }, async (request, reply) => {
  const { title, author, totalPages, targetDate } = request.body;
  if (!title) {
    return reply.code(400).send({ error: 'title is required' });
  }
  
  try {
    const { rows } = await pool.query(
      `INSERT INTO books (user_id, title, author, total_pages, target_date) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [request.user.id, title, author, totalPages, targetDate]
    );
    return { book: rows[0] };
  } catch (err) {
    server.log.error(err);
    return reply.code(500).send({ error: 'server error' });
  }
});

server.put('/api/books/:id', { preHandler: [server.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  const updates = request.body;
  
  try {
    const { rows } = await pool.query(
      `UPDATE books SET 
       title = COALESCE($1, title),
       author = COALESCE($2, author),
       total_pages = COALESCE($3, total_pages),
       target_date = COALESCE($4, target_date),
       current_page = COALESCE($5, current_page),
       updated_at = NOW()
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [updates.title, updates.author, updates.totalPages, updates.targetDate, updates.currentPage, id, request.user.id]
    );
    
    if (rows.length === 0) {
      return reply.code(404).send({ error: 'book not found' });
    }
    
    return { book: rows[0] };
  } catch (err) {
    server.log.error(err);
    return reply.code(500).send({ error: 'server error' });
  }
});

server.delete('/api/books/:id', { preHandler: [server.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  
  try {
    const { rows } = await pool.query(
      'DELETE FROM books WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, request.user.id]
    );
    
    if (rows.length === 0) {
      return reply.code(404).send({ error: 'book not found' });
    }
    
    return { success: true };
  } catch (err) {
    server.log.error(err);
    return reply.code(500).send({ error: 'server error' });
  }
});

// Reading Records API
server.get('/api/books/:id/records', { preHandler: [server.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  
  try {
    const { rows } = await pool.query(
      'SELECT * FROM reading_records WHERE book_id = $1 AND user_id = $2 ORDER BY date DESC',
      [id, request.user.id]
    );
    return { records: rows };
  } catch (err) {
    server.log.error(err);
    return reply.code(500).send({ error: 'server error' });
  }
});

server.post('/api/books/:id/records', { preHandler: [server.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  const { pagesRead, notes, percentage } = request.body;
  
  if (!pagesRead || percentage === undefined) {
    return reply.code(400).send({ error: 'pagesRead and percentage are required' });
  }
  
  try {
    const { rows } = await pool.query(
      `INSERT INTO reading_records (book_id, user_id, date, pages_read, notes, percentage) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, request.user.id, new Date().toISOString().split('T')[0], pagesRead, notes, percentage]
    );
    
    // Update book's current page
    await pool.query(
      'UPDATE books SET current_page = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3',
      [pagesRead, id, request.user.id]
    );
    
    return { record: rows[0] };
  } catch (err) {
    server.log.error(err);
    return reply.code(500).send({ error: 'server error' });
  }
});

// Complete book
server.post('/api/books/:id/complete', { preHandler: [server.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  const { finalReview } = request.body;
  
  try {
    const { rows } = await pool.query(
      `UPDATE books SET 
       is_completed = TRUE, 
       completed_at = NOW(), 
       final_review = $1,
       updated_at = NOW()
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [finalReview, id, request.user.id]
    );
    
    if (rows.length === 0) {
      return reply.code(404).send({ error: 'book not found' });
    }
    
    return { book: rows[0] };
  } catch (err) {
    server.log.error(err);
    return reply.code(500).send({ error: 'server error' });
  }
});

// Wishlist API
server.get('/api/wishlist', { preHandler: [server.authenticate] }, async (request) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM book_wishlist WHERE user_id = $1 ORDER BY created_at DESC',
      [request.user.id]
    );
    return { wishlist: rows };
  } catch (err) {
    server.log.error(err);
    return reply.code(500).send({ error: 'server error' });
  }
});

// YouTube Video Recommendations API
server.get('/api/books/:id/videos', { preHandler: [server.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  
  try {
    // 本の情報を取得
    const { rows: books } = await pool.query(
      'SELECT * FROM books WHERE id = $1 AND user_id = $2',
      [id, request.user.id]
    );
    
    if (books.length === 0) {
      return reply.code(404).send({ error: 'book not found' });
    }
    
    const book = books[0];
    
    // YouTube Data API v3を使用して動画を検索
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
    
    // 検索クエリを作成（本のタイトル + 著者）
    const searchQuery = `${book.title} ${book.author || ''} 解説 レビュー 要約`;
    
    const response = await youtube.search.list({
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      maxResults: 3,
      relevanceLanguage: 'ja',
      regionCode: 'JP'
    });
    
    const videos = response.data.items || [];
    
    // 動画の詳細情報を取得
    const videoIds = videos.map(video => video.id?.videoId).filter(Boolean);
    
    if (videoIds.length === 0) {
      return { videos: [] };
    }
    
    const videoDetailsResponse = await youtube.videos.list({
      part: 'snippet,statistics',
      id: videoIds.join(',')
    });
    
    const videoDetails = videoDetailsResponse.data.items || [];
    
    // 動画情報を整形
    const formattedVideos = videoDetails.map(video => ({
      id: video.id,
      title: video.snippet?.title || 'タイトルなし',
      description: video.snippet?.description || '',
      thumbnail: video.snippet?.thumbnails?.medium?.url || '',
      channelTitle: video.snippet?.channelTitle || 'チャンネル名なし',
      publishedAt: video.snippet?.publishedAt || '',
      viewCount: parseInt(video.statistics?.viewCount) || 0,
      likeCount: parseInt(video.statistics?.likeCount) || 0,
      duration: video.snippet?.duration || '',
      url: `https://www.youtube.com/watch?v=${video.id}`
    }));
    
    return { videos: formattedVideos };
  } catch (err) {
    server.log.error(err);
    return reply.code(500).send({ error: 'server error' });
  }
});

// Video Summary API (Google AI SDK)
server.post('/api/videos/:id/summary', { preHandler: [server.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  const { videoUrl, videoTitle, videoDescription } = request.body;
  
  // Google AI APIキーの確認
  if (!process.env.GOOGLE_AI_API_KEY) {
    return reply.code(500).send({ 
      error: 'Google AI APIキーが設定されていません',
      summary: 'APIキーが設定されていないため、要約を生成できません。'
    });
  }
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    server.log.info('Google AI API initialized successfully');
    
    // 動画の説明文とタイトルから要約を生成
    const prompt = `
    以下のYouTube動画の情報を基に、読書に活かせる要約を作成してください。
    
    動画URL: ${videoUrl}
    動画タイトル: ${videoTitle || 'タイトルなし'}
    動画説明: ${videoDescription || '説明なし'}
    
    要約のポイント:
    1. 動画の主要な内容（2-3行）
    2. 読書に活かせる学習ポイント（2-3行）
    3. 読書の理解を深める要素（1-2行）
    
    簡潔で分かりやすい要約をお願いします。日本語で回答してください。
    `;
    
    server.log.info('Sending prompt to Google AI API');
    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    
    server.log.info('Google AI API response received successfully');
    return { summary };
  } catch (err) {
    server.log.error('Google AI API Error:', err);
    server.log.error('Error details:', {
      message: err.message,
      stack: err.stack,
      apiKey: process.env.GOOGLE_AI_API_KEY ? 'Set' : 'Not set',
      videoTitle: videoTitle,
      videoDescription: videoDescription ? 'Has description' : 'No description'
    });
    
    // フォールバック要約を返す
    const fallbackSummary = `
【動画の要約】
動画タイトル: ${videoTitle || 'タイトルなし'}
チャンネル: ${videoDescription ? '説明あり' : '説明なし'}

この動画は読書に関連する内容のようです。
動画を視聴して、読書の理解を深めるヒントを見つけてください。

※AI要約機能が一時的に利用できません。動画を直接視聴することをお勧めします。
    `;
    
    return { 
      summary: fallbackSummary,
      error: 'AI要約機能が一時的に利用できません。フォールバック要約を表示しています。'
    };
  }
});

server.post('/api/wishlist', { preHandler: [server.authenticate] }, async (request, reply) => {
  const { title, author, amazonLink, notes } = request.body;
  
  if (!title) {
    return reply.code(400).send({ error: 'title is required' });
  }
  
  try {
    const { rows } = await pool.query(
      `INSERT INTO book_wishlist (user_id, title, author, amazon_link, notes) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [request.user.id, title, author, amazonLink, notes]
    );
    return { item: rows[0] };
  } catch (err) {
    server.log.error(err);
    return reply.code(500).send({ error: 'server error' });
  }
});

server.put('/api/wishlist/:id', { preHandler: [server.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  const updates = request.body;
  
  try {
    const { rows } = await pool.query(
      `UPDATE book_wishlist SET 
       title = COALESCE($1, title),
       author = COALESCE($2, author),
       amazon_link = COALESCE($3, amazon_link),
       notes = COALESCE($4, notes),
       is_checked = COALESCE($5, is_checked)
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [updates.title, updates.author, updates.amazonLink, updates.notes, updates.isChecked, id, request.user.id]
    );
    
    if (rows.length === 0) {
      return reply.code(404).send({ error: 'item not found' });
    }
    
    return { item: rows[0] };
  } catch (err) {
    server.log.error(err);
    return reply.code(500).send({ error: 'server error' });
  }
});

server.delete('/api/wishlist/:id', { preHandler: [server.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  
  try {
    const { rows } = await pool.query(
      'DELETE FROM book_wishlist WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, request.user.id]
    );
    
    if (rows.length === 0) {
      return reply.code(404).send({ error: 'item not found' });
    }
    
    return { success: true };
  } catch (err) {
    server.log.error(err);
    return reply.code(500).send({ error: 'server error' });
  }
});

// test protected route
server.get('/api/me', { preHandler: [server.authenticate] }, async (request) => {
  return { user: request.user };
});

const port = process.env.PORT || 3001;
server.listen({ port, host: '0.0.0.0' }).catch((err) => {
  server.log.error(err);
  process.exit(1);
}); 