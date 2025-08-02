import React, { useState } from 'react';
import { BookOpen, Save, X, Award } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import ReviewVisualization from './ReviewVisualization';
import './ReadingProgress.css';

export default function ReadingProgress({ book, onComplete, onCancel }) {
  const { actions } = useApp();
  const [formData, setFormData] = useState({
    pagesRead: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculatePercentage = (pages) => {
    if (!book.totalPages || pages <= 0) return 0;
    return Math.min(Math.round((pages / book.totalPages) * 100), 100);
  };

  const getCurrentPages = () => {
    if (book.readingHistory.length === 0) return 0;
    const latestRecord = book.readingHistory[book.readingHistory.length - 1];
    return latestRecord.pagesRead || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const pagesRead = parseInt(formData.pagesRead) || 0;
    if (pagesRead <= 0) return;

    setIsSubmitting(true);

    // シンプルなローディング演出
    await new Promise(resolve => setTimeout(resolve, 800));

    const percentage = calculatePercentage(pagesRead);
    
    const record = {
      pagesRead,
      notes: formData.notes.trim(),
      percentage
    };

    actions.addReadingRecord(book.id, record);

    // 100%達成時の処理
    if (percentage >= 100) {
      setShowCompletion(true);
    } else {
      setIsSubmitting(false);
      onComplete();
    }
  };

  const handleBookCompletion = (finalReview) => {
    actions.completeBook(book.id, finalReview);
    setIsSubmitting(false);
    onComplete();
  };

  if (showCompletion) {
    return (
      <ReviewVisualization 
        onComplete={handleBookCompletion}
        readingHistory={book.readingHistory}
        bookTitle={book.title}
      />
    );
  }

  const currentPages = getCurrentPages();
  const suggestedPages = Math.max(currentPages + 1, 1);
  const previewPercentage = calculatePercentage(parseInt(formData.pagesRead) || suggestedPages);

  return (
    <div className="reading-progress">
      <div className="container">
        <header className="progress-header">
          <div className="progress-title">
            <BookOpen className="progress-icon" size={24} />
            <h1>読書記録</h1>
          </div>
          
          <button 
            className="btn btn-secondary close-button"
            onClick={onCancel}
          >
            <X size={20} />
          </button>
        </header>

        <div className="book-info">
          <h2 className="book-title">{book.title}</h2>
          {book.author && (
            <p className="book-author">著者: {book.author}</p>
          )}
        </div>

        <div className="current-status">
          <div className="status-item">
            <span className="status-label">現在のページ数</span>
            <span className="status-value">{currentPages} ページ</span>
          </div>
          
          {book.totalPages && (
            <div className="status-item">
              <span className="status-label">全体の進捗</span>
              <span className="status-value">
                {calculatePercentage(currentPages)}% 完了
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="progress-form">
          <div className="form-group">
            <label className="form-label required" htmlFor="pagesRead">
              今日読んだページ数
            </label>
            <input
              id="pagesRead"
              name="pagesRead"
              type="number"
              min="1"
              max={book.totalPages || 999999}
              value={formData.pagesRead}
              onChange={handleChange}
              placeholder={`例: ${suggestedPages}`}
              className="form-input pages-input"
              required
              disabled={isSubmitting}
            />
            <div className="input-hint">
              {book.totalPages && formData.pagesRead && (
                <span className="progress-preview">
                  進捗: {previewPercentage}% 
                  {previewPercentage >= 100 && " 🎉 読了！"}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="notes">
              感想・読書メモ
              <span className="optional-text">（任意）</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="今日読んだ内容の感想や印象に残ったことを書いてみましょう..."
              className="form-input form-textarea notes-textarea"
              rows="4"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary submit-button ${isSubmitting ? 'loading' : ''}`}
            disabled={!formData.pagesRead || isSubmitting}
          >
            <Save size={20} />
            {isSubmitting ? '記録中...' : '読書記録を保存'}
          </button>
        </form>

        <div className="progress-tips">
          <h3 className="tips-title">📝 記録のコツ</h3>
          <div className="tips-list">
            <div className="tip-item">
              <strong>継続は力なり</strong> - 少しずつでも毎日記録することが大切です
            </div>
            <div className="tip-item">
              <strong>感想を残そう</strong> - 後で振り返る時の貴重な記録になります
            </div>
            <div className="tip-item">
              <strong>正直に記録</strong> - 実際に読んだページ数を正確に記録しましょう
            </div>
          </div>
        </div>

        {book.readingHistory.length > 0 && (
          <div className="recent-records">
            <h3 className="section-title">最近の記録</h3>
            <div className="records-list">
              {book.readingHistory.slice(-3).reverse().map((record) => (
                <div key={record.id} className="record-item">
                  <div className="record-date">
                    {new Date(record.date).toLocaleDateString('ja-JP', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </div>
                  <div className="record-content">
                    <div className="record-progress">
                      {record.pagesRead}ページ ({record.percentage}%)
                    </div>
                    {record.notes && (
                      <div className="record-notes">{record.notes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 