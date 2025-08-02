import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

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

// ensure users table exists (simple migration)
await pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
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

// test protected route
server.get('/api/me', { preHandler: [server.authenticate] }, async (request) => {
  return { user: request.user };
});

const port = process.env.PORT || 3001;
server.listen({ port, host: '0.0.0.0' }).catch((err) => {
  server.log.error(err);
  process.exit(1);
}); 