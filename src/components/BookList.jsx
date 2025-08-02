import React, { useState } from 'react';
import { BookOpen, Plus, Check, Edit2, Trash2, ExternalLink, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import './BookList.css';

export default function BookList() {
  const { state, actions } = useApp();
  const { bookWishlist } = state;
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    details: '',
    amazonLink: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      details: '',
      amazonLink: ''
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingId) {
      // 編集
      actions.updateWishlistItem(editingId, {
        title: formData.title.trim(),
        details: formData.details.trim(),
        amazonLink: formData.amazonLink.trim()
      });
    } else {
      // 新規追加
      actions.addToWishlist({
        title: formData.title.trim(),
        details: formData.details.trim(),
        amazonLink: formData.amazonLink.trim()
      });
    }

    resetForm();
  };

  const startEdit = (item) => {
    setFormData({
      title: item.title,
      details: item.details || '',
      amazonLink: item.amazonLink || ''
    });
    setEditingId(item.id);
    setShowAddForm(true);
  };

  const toggleComplete = (id) => {
    const item = bookWishlist.find(item => item.id === id);
    if (item) {
      actions.updateWishlistItem(id, {
        isCompleted: !item.isCompleted
      });
    }
  };

  const deleteItem = (id) => {
    if (window.confirm('この本をリストから削除しますか？')) {
      actions.removeFromWishlist(id);
    }
  };

  const pendingBooks = bookWishlist.filter(item => !item.isCompleted);
  const completedBooks = bookWishlist.filter(item => item.isCompleted);

  return (
    <div className="book-list">
      <div className="container">
        <header className="book-list-header">
          <div className="book-list-title">
            <BookOpen className="book-list-icon" size={24} />
            <h1>気になる本リスト</h1>
          </div>
          
          <button
            className="btn btn-primary add-button"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={20} />
            本を追加
          </button>
        </header>

        {showAddForm && (
          <div className="add-form-overlay">
            <div className="add-form-container">
              <div className="add-form-header">
                <h2>{editingId ? '本の情報を編集' : '気になる本を追加'}</h2>
                <button
                  className="btn btn-secondary close-form-button"
                  onClick={resetForm}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="add-form">
                <div className="form-group">
                  <label className="form-label required" htmlFor="title">
                    本のタイトル
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="例: 人生を変える読書術"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="details">
                    詳細・メモ
                    <span className="optional-text">（任意）</span>
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    placeholder="著者名、内容、なぜ気になったかなど..."
                    className="form-input form-textarea"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="amazonLink">
                    Amazon リンク
                    <span className="optional-text">（任意）</span>
                  </label>
                  <input
                    id="amazonLink"
                    name="amazonLink"
                    type="url"
                    value={formData.amazonLink}
                    onChange={handleChange}
                    placeholder="https://amazon.co.jp/..."
                    className="form-input"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!formData.title.trim()}
                  >
                    {editingId ? '更新' : '追加'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="book-list-content">
          {pendingBooks.length > 0 && (
            <section className="book-section">
              <h2 className="section-title">
                読みたい本 ({pendingBooks.length}冊)
              </h2>
              <div className="book-items">
                {pendingBooks.map((item) => (
                  <div key={item.id} className="book-item">
                    <div className="book-item-header">
                      <button
                        className="checkbox"
                        onClick={() => toggleComplete(item.id)}
                        title="読了・購入済みにする"
                      >
                        <div className="checkbox-inner"></div>
                      </button>
                      <h3 className="book-item-title">{item.title}</h3>
                    </div>

                    {item.details && (
                      <p className="book-item-details">{item.details}</p>
                    )}

                    <div className="book-item-actions">
                      {item.amazonLink && (
                        <a
                          href={item.amazonLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-button amazon-link"
                          title="Amazon で見る"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                      
                      <button
                        className="action-button edit-button"
                        onClick={() => startEdit(item)}
                        title="編集"
                      >
                        <Edit2 size={16} />
                      </button>
                      
                      <button
                        className="action-button delete-button"
                        onClick={() => deleteItem(item.id)}
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="book-item-date">
                      {new Date(item.createdAt).toLocaleDateString('ja-JP')} に追加
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {completedBooks.length > 0 && (
            <section className="book-section completed-section">
              <h2 className="section-title">
                購入済み・読了済み ({completedBooks.length}冊)
              </h2>
              <div className="book-items">
                {completedBooks.map((item) => (
                  <div key={item.id} className="book-item completed">
                    <div className="book-item-header">
                      <button
                        className="checkbox checked"
                        onClick={() => toggleComplete(item.id)}
                        title="未読に戻す"
                      >
                        <div className="checkbox-inner">
                          <Check size={14} />
                        </div>
                      </button>
                      <h3 className="book-item-title">{item.title}</h3>
                    </div>

                    {item.details && (
                      <p className="book-item-details">{item.details}</p>
                    )}

                    <div className="book-item-actions">
                      {item.amazonLink && (
                        <a
                          href={item.amazonLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-button amazon-link"
                          title="Amazon で見る"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                      
                      <button
                        className="action-button delete-button"
                        onClick={() => deleteItem(item.id)}
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {bookWishlist.length === 0 && (
            <div className="empty-state">
              <BookOpen className="empty-icon" size={64} />
              <h3>まだ気になる本がありません</h3>
              <p>
                本屋で見かけた本や、友人におすすめされた本など、<br />
                気になる本を記録してみましょう！
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                <Plus size={20} />
                最初の本を追加
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 