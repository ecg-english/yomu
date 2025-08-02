import React, { useState } from 'react';
import { BookOpen, Calendar, FileText, User2, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import './BookRegistration.css';

export default function BookRegistration({ isModal = false }) {
  const { state, actions } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    totalPages: '',
    targetDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    
    // シンプルなローディング演出
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const book = {
      title: formData.title.trim(),
      author: formData.author.trim() || null,
      totalPages: formData.totalPages ? parseInt(formData.totalPages) : null,
      targetDate: formData.targetDate || null,
    };
    
    actions.addBook(book);
    
    // モーダルモードの場合はモーダルを閉じる
    if (isModal) {
      actions.setShowAddBookModal(false);
    }
    
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    if (isModal) {
      actions.setShowAddBookModal(false);
    }
  };

  const isValidForm = formData.title.trim();
  const isFirstBook = state.currentBooks.length === 0;

  return (
    <div className={`book-registration ${isModal ? 'modal' : ''}`}>
      <div className="book-registration-container">
        {isModal && (
          <div className="modal-header">
            <h1 className="modal-title">新しい本を追加</h1>
            <button 
              className="btn btn-secondary close-modal-button"
              onClick={handleCancel}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {!isModal && (
          <div className="book-registration-header">
            <div className="icon-wrapper">
              <img src="/yomu-logo.png" alt="読む！" className="book-registration-logo" />
            </div>
            <h1 className="book-registration-title">
              {isFirstBook ? '読む！で最初の一冊を登録しましょう' : '新しい本を追加'}
            </h1>
            <p className="book-registration-subtitle">
              {isFirstBook 
                ? '読書の旅を始めるために、読みたい本の情報を入力してください'
                : '並行して読む本を追加できます'
              }
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="book-registration-form">
          <div className="form-group">
            <label className="form-label required" htmlFor="title">
              <FileText size={16} />
              本のタイトル
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="例: 吾輩は猫である"
              className="form-input"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label optional" htmlFor="author">
              <User2 size={16} />
              著者名
              <span className="optional-text">（任意）</span>
            </label>
            <input
              id="author"
              name="author"
              type="text"
              value={formData.author}
              onChange={handleChange}
              placeholder="例: 夏目漱石"
              className="form-input"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label optional" htmlFor="totalPages">
                <BookOpen size={16} />
                総ページ数
                <span className="optional-text">（任意）</span>
              </label>
              <input
                id="totalPages"
                name="totalPages"
                type="number"
                min="1"
                value={formData.totalPages}
                onChange={handleChange}
                placeholder="例: 300"
                className="form-input"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label optional" htmlFor="targetDate">
                <Calendar size={16} />
                目標読了日
                <span className="optional-text">（任意）</span>
              </label>
              <input
                id="targetDate"
                name="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={handleChange}
                className="form-input"
                disabled={isSubmitting}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="form-actions">
            {isModal && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                キャンセル
              </button>
            )}
            <button
              type="submit"
              className={`btn btn-primary book-registration-button ${isSubmitting ? 'loading' : ''}`}
              disabled={!isValidForm || isSubmitting}
            >
              {isSubmitting ? '登録中...' : (isFirstBook ? '登録して読み始める' : '本を追加')}
            </button>
          </div>
        </form>

        {!isModal && (
          <>
            <div className="registration-tips">
              <h3 className="tips-title">📚 読書記録のヒント</h3>
              <div className="tips-list">
                <div className="tip-item">
                  <strong>ページ数</strong>を入力すると、読書進捗がパーセンテージで表示されます
                </div>
                <div className="tip-item">
                  <strong>目標読了日</strong>を設定すると、1日の目安ページ数を計算できます
                </div>
                <div className="tip-item">
                  <strong>複数の本</strong>を並行して読み進めることができます
                </div>
                <div className="tip-item">
                  後からでも<strong>情報の追加・変更</strong>が可能です
                </div>
              </div>
            </div>

            {!isFirstBook && (
              <div className="current-books-info">
                <h3>現在読書中の本</h3>
                <div className="current-books-list">
                  {state.currentBooks.map(book => (
                    <div key={book.id} className="current-book-item">
                      <span className="book-title">{book.title}</span>
                      {book.author && <span className="book-author">by {book.author}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 