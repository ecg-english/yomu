import React from 'react';
import { BookOpen, Calendar, Target, TrendingUp, Award, Plus, Eye, LogOut } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const { state, actions, getSelectedBook, getAllReadingHistory } = useApp();
  const { logout } = useAuth();
  const { currentBooks, completedBooks } = state;
  const selectedBook = getSelectedBook();
  const allReadingHistory = getAllReadingHistory();

  // 統計計算
  const getTotalProgress = () => {
    if (!selectedBook || !selectedBook.totalPages || selectedBook.readingHistory.length === 0) return 0;
    const latestRecord = selectedBook.readingHistory[selectedBook.readingHistory.length - 1];
    return Math.min(Math.round((latestRecord.pagesRead / selectedBook.totalPages) * 100), 100);
  };

  const getTodayProgress = () => {
    const today = new Date().toDateString();
    const todayRecord = allReadingHistory.find(record => 
      new Date(record.date).toDateString() === today
    );
    return todayRecord ? todayRecord.percentage : 0;
  };

  const getReadingStreak = () => {
    if (allReadingHistory.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      const hasRecord = allReadingHistory.some(record => 
        new Date(record.date).toDateString() === dateString
      );
      
      if (hasRecord) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };



  const handleAddBook = () => {
    actions.setShowAddBookModal(true);
  };

  const handleViewCompletedBook = (book) => {
    actions.setSelectedCompletedBook(book);
  };

  const totalProgress = getTotalProgress();
  const todayProgress = getTodayProgress();
  const streak = getReadingStreak();

  return (
    <div className="dashboard">
      <div className="container">
        <header className="dashboard-header">
          <div className="user-greeting">
            <div className="greeting-logo">
              <img src="/yomu-logo.png" alt="読む！" className="dashboard-logo" />
            </div>
            <h1>こんにちは、{state.user?.name}さん</h1>
            <p>今日も素敵な読書時間を過ごしましょう</p>
          </div>
          
          <div className="header-actions">
            <div className="completed-books-counter" onClick={() => {}}>
              <Award className="counter-icon" size={20} />
              <div className="counter-content">
                <span className="counter-number">{completedBooks.length}</span>
                <span className="counter-label">冊読了</span>
              </div>
            </div>
            
            <button 
              className="btn btn-secondary logout-btn" 
              onClick={logout}
              title="ログアウト"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* 現在読書中の本のセクション */}
        <div className="current-books-section">
          <div className="section-header">
            <h2 className="section-title">読書中の本</h2>
            <button className="btn btn-secondary add-book-btn" onClick={handleAddBook}>
              <Plus size={16} />
              本を追加
            </button>
          </div>

          {currentBooks.length === 0 ? (
            <div className="no-current-books">
              <BookOpen className="no-books-icon" size={48} />
              <h3>読書中の本がありません</h3>
              <p>新しい本を追加して読書を始めましょう！</p>
              <button className="btn btn-primary" onClick={handleAddBook}>
                <Plus size={20} />
                最初の本を追加
              </button>
            </div>
          ) : (
            <>
              {/* 選択中の本の詳細表示 */}
              {selectedBook && (
                <div className="selected-book-card">
                  <div className="book-header">
                    <div className="book-info">
                      <h3 className="book-title">{selectedBook.title}</h3>
                      {selectedBook.author && (
                        <p className="book-author">著者: {selectedBook.author}</p>
                      )}
                    </div>
                    {currentBooks.length > 1 && (
                      <select 
                        className="book-selector"
                        value={selectedBook.id}
                        onChange={(e) => actions.selectBook(parseInt(e.target.value))}
                      >
                        {currentBooks.map(book => (
                          <option key={book.id} value={book.id}>
                            {book.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="progress-section">
                    <div className="progress-circle">
                      <svg viewBox="0 0 120 120" className="progress-svg">
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="var(--color-border)"
                          strokeWidth="8"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="var(--color-primary)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${totalProgress * 3.14} 314`}
                          transform="rotate(-90 60 60)"
                          className="progress-circle-fill"
                        />
                      </svg>
                      <div className="progress-text">
                        <span className="progress-percentage">{totalProgress}%</span>
                        <span className="progress-label">完了</span>
                      </div>
                    </div>

                    <div className="progress-details">
                      {selectedBook.totalPages && (
                        <div className="detail-item">
                          <BookOpen size={16} />
                          <span>
                            {selectedBook.readingHistory.length > 0 
                              ? selectedBook.readingHistory[selectedBook.readingHistory.length - 1].pagesRead 
                              : 0
                            } / {selectedBook.totalPages} ページ
                          </span>
                        </div>
                      )}
                      
                      {selectedBook.targetDate && (
                        <div className="detail-item">
                          <Target size={16} />
                          <span>
                            目標: {new Date(selectedBook.targetDate).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 他の読書中の本の一覧 */}
              {currentBooks.length > 1 && (
                <div className="other-books-list">
                  <h3 className="other-books-title">他の読書中の本</h3>
                  <div className="books-grid">
                    {currentBooks
                      .filter(book => book.id !== selectedBook?.id)
                      .map(book => {
                        const latestRecord = book.readingHistory[book.readingHistory.length - 1];
                        const progress = book.totalPages && latestRecord
                          ? Math.min(Math.round((latestRecord.pagesRead / book.totalPages) * 100), 100)
                          : 0;
                        
                        return (
                          <div 
                            key={book.id} 
                            className="book-mini-card"
                            onClick={() => actions.selectBook(book.id)}
                          >
                            <h4 className="mini-book-title">{book.title}</h4>
                            {book.author && (
                              <p className="mini-book-author">{book.author}</p>
                            )}
                            <div className="mini-progress-bar">
                              <div 
                                className="mini-progress-fill"
                                style={{ width: `${progress}%` }}
                              ></div>
                              <span className="mini-progress-text">{progress}%</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 統計セクション */}
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon today">
                <Calendar size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-number">{todayProgress}%</span>
                <span className="stat-label">今日の進捗</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon streak">
                <TrendingUp size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-number">{streak}</span>
                <span className="stat-label">連続読書日数</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon total">
                <Award size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-number">{allReadingHistory.length}</span>
                <span className="stat-label">読書記録数</span>
              </div>
            </div>
          </div>
        </div>

        {/* 読了した本のセクション */}
        {completedBooks.length > 0 && (
          <div className="completed-books-section">
            <h2 className="section-title">読了した本</h2>
            <div className="completed-books-grid">
              {completedBooks.slice(-6).reverse().map((book) => (
                <div 
                  key={book.id} 
                  className="completed-book-card"
                  onClick={() => handleViewCompletedBook(book)}
                >
                  <div className="completed-book-header">
                    <h4 className="completed-book-title">{book.title}</h4>
                    {book.author && (
                      <p className="completed-book-author">{book.author}</p>
                    )}
                    <p className="completed-book-date">
                      {new Date(book.completedDate).toLocaleDateString('ja-JP')} 読了
                    </p>
                  </div>
                  <div className="completed-book-action">
                    <Eye size={16} />
                    振り返る
                  </div>
                </div>
              ))}
            </div>
            {completedBooks.length > 6 && (
              <button className="btn btn-secondary view-all-completed">
                すべての読了本を見る ({completedBooks.length}冊)
              </button>
            )}
          </div>
        )}

        {/* 最近の活動 */}
        {allReadingHistory.length > 0 && (
          <div className="recent-activity">
            <h2 className="section-title">最近の活動</h2>
            <div className="activity-list">
              {allReadingHistory.slice(-3).reverse().map((record, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-date">
                    {new Date(record.date).toLocaleDateString('ja-JP', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="activity-content">
                    <div className="activity-book">{record.bookTitle}</div>
                    <div className="activity-progress">{record.percentage}%まで読了</div>
                    {record.notes && (
                      <div className="activity-notes">{record.notes}</div>
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