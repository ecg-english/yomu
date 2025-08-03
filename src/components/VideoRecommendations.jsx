import React, { useState, useEffect } from 'react';
import { Play, ExternalLink, MessageSquare, ThumbsUp, Eye } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import './VideoRecommendations.css';

export default function VideoRecommendations({ bookId }) {
  const { state } = useApp();
  const { token } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const API_BASE = 'https://yomu-api.onrender.com';

  useEffect(() => {
    if (bookId) {
      loadVideos();
    }
  }, [bookId]);

  const loadVideos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/books/${bookId}/videos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('動画の読み込みに失敗しました');
      }

      const data = await response.json();
      // 動画情報を整形
      const formattedVideos = data.videos?.map(video => ({
        id: video.id,
        title: video.snippet?.title || 'タイトルなし',
        description: video.snippet?.description || '',
        thumbnail: video.snippet?.thumbnails?.medium?.url || '',
        channelTitle: video.snippet?.channelTitle || 'チャンネル名なし',
        publishedAt: video.snippet?.publishedAt || '',
        viewCount: video.statistics?.viewCount || 0,
        likeCount: video.statistics?.likeCount || 0,
        duration: video.snippet?.duration || '',
        url: `https://www.youtube.com/watch?v=${video.id}`
      })) || [];
      setVideos(formattedVideos);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVideoSummary = async (videoId, videoUrl) => {
    setSummaryLoading(true);
    setSelectedVideo(videoId);
    
    try {
      const response = await fetch(`${API_BASE}/api/videos/${videoId}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ videoUrl }),
      });

      if (!response.ok) {
        throw new Error('要約の取得に失敗しました');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
      console.error('Failed to get video summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const formatViewCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDuration = (duration) => {
    // durationがundefinedやnullの場合は'0:00'を返す
    if (!duration) return '0:00';
    
    // ISO 8601 duration format (PT4M13S) を MM:SS 形式に変換
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="video-recommendations">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>関連動画を検索中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-recommendations">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="btn btn-primary" onClick={loadVideos}>
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="video-recommendations">
        <div className="no-videos">
          <MessageSquare className="no-videos-icon" size={48} />
          <h3>関連動画が見つかりませんでした</h3>
          <p>この本に関連する動画が現在見つかりません。後でもう一度お試しください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-recommendations">
      <div className="video-recommendations-header">
        <h2>関連動画</h2>
        <p>この本に関連するYouTube動画をおすすめします</p>
      </div>

      <div className="videos-grid">
        {videos.map((video) => (
          <div key={video.id} className="video-card">
            <div className="video-thumbnail">
              <img src={video.thumbnail} alt={video.title} />
              <div className="video-overlay">
                <Play className="play-icon" size={24} />
              </div>
              <div className="video-duration">{formatDuration(video.duration)}</div>
            </div>

            <div className="video-content">
              <h3 className="video-title">{video.title}</h3>
              <p className="video-channel">{video.channelTitle}</p>
              
              <div className="video-stats">
                <span className="video-views">
                  <Eye size={14} />
                  {formatViewCount(video.viewCount)}
                </span>
                <span className="video-likes">
                  <ThumbsUp size={14} />
                  {formatViewCount(video.likeCount)}
                </span>
              </div>

              <div className="video-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => getVideoSummary(video.id, video.url)}
                  disabled={summaryLoading && selectedVideo === video.id}
                >
                  {summaryLoading && selectedVideo === video.id ? '要約中...' : '要約を見る'}
                </button>
                
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  <ExternalLink size={14} />
                  視聴
                </a>
              </div>

              {selectedVideo === video.id && summary && (
                <div className="video-summary">
                  <h4>動画の要約</h4>
                  <p>{summary}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 