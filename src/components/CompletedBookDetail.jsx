import React, { useState, useRef } from 'react';
import { ArrowLeft, Award, Download, ChevronLeft, ChevronRight, Calendar, BookOpen } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import './CompletedBookDetail.css';

export default function CompletedBookDetail() {
  const { state, actions } = useApp();
  const { selectedCompletedBook } = state;
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const scrollContainerRef = useRef(null);

  if (!selectedCompletedBook) {
    return null;
  }

  const handleBack = () => {
    actions.setSelectedCompletedBook(null);
  };

  // 読書記録を時系列順に整理
  const nodes = selectedCompletedBook.readingHistory
    .filter(record => record.notes && record.notes.trim())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((record, index) => ({
      id: index,
      date: new Date(record.date),
      content: record.notes,
      percentage: record.percentage,
      isEditable: false
    }));

  // 最終レビューノードを追加
  const finalNode = {
    id: nodes.length,
    date: new Date(selectedCompletedBook.completedDate),
    content: selectedCompletedBook.finalReview || '',
    percentage: 100,
    isEditable: false,
    isFinal: true
  };

  const allNodes = [...nodes, finalNode];

  const downloadVisualization = () => {
    const content = [
      `『${selectedCompletedBook.title}』読書記録`,
      '=' + '='.repeat(selectedCompletedBook.title.length + 7),
      '',
      ...nodes.map((node, index) => [
        `${index + 1}. ${node.date.toLocaleDateString('ja-JP')} (${node.percentage}%進捗)`,
        node.content,
        ''
      ].join('\n')),
      '最終感想:',
      selectedCompletedBook.finalReview || '（未記入）',
      '',
      `生成日時: ${new Date().toLocaleString('ja-JP')}`
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCompletedBook.title}_読書記録.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const scrollToNode = (index) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const nodeElement = container.children[index];
      if (nodeElement) {
        nodeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
      }
    }
    setCurrentNodeIndex(index);
  };

  const navigateNode = (direction) => {
    const newIndex = currentNodeIndex + direction;
    if (newIndex >= 0 && newIndex < allNodes.length) {
      scrollToNode(newIndex);
    }
  };

  const readingDays = Math.ceil(
    (new Date(selectedCompletedBook.completedDate) - new Date(selectedCompletedBook.startedAt)) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="completed-book-detail">
      <div className="container">
        <header className="detail-header">
          <button 
            className="btn btn-secondary back-button"
            onClick={handleBack}
          >
            <ArrowLeft size={20} />
            戻る
          </button>

          <div className="book-info-section">
            <div className="award-icon">
              <Award size={32} />
            </div>
            <div className="book-info">
              <h1 className="book-title">{selectedCompletedBook.title}</h1>
              {selectedCompletedBook.author && (
                <p className="book-author">著者: {selectedCompletedBook.author}</p>
              )}
              <p className="completed-date">
                {new Date(selectedCompletedBook.completedDate).toLocaleDateString('ja-JP')} 読了
              </p>
            </div>
          </div>
        </header>

        <div className="book-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{selectedCompletedBook.readingHistory.length}</span>
              <span className="stat-label">読書記録数</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{nodes.length}</span>
              <span className="stat-label">感想・メモ数</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{readingDays}</span>
              <span className="stat-label">読書日数</span>
            </div>
            {selectedCompletedBook.totalPages && (
              <div className="stat-item">
                <span className="stat-number">{selectedCompletedBook.totalPages}</span>
                <span className="stat-label">総ページ数</span>
              </div>
            )}
          </div>
        </div>

        {allNodes.length > 1 && (
          <div className="visualization-section">
            <div className="timeline-header">
              <h2>読書の軌跡</h2>
              <div className="timeline-controls">
                <button
                  className="btn btn-secondary nav-button"
                  onClick={() => navigateNode(-1)}
                  disabled={currentNodeIndex <= 0}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="node-counter">
                  {currentNodeIndex + 1} / {allNodes.length}
                </span>
                <button
                  className="btn btn-secondary nav-button"
                  onClick={() => navigateNode(1)}
                  disabled={currentNodeIndex >= allNodes.length - 1}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="timeline-container" ref={scrollContainerRef}>
              <div className="timeline-line"></div>
              <div className="nodes-container">
                {allNodes.map((node, index) => (
                  <div
                    key={node.id}
                    className={`timeline-node ${node.isFinal ? 'final-node' : ''} ${index === currentNodeIndex ? 'active' : ''}`}
                    onClick={() => scrollToNode(index)}
                  >
                    <div className="node-dot">
                      <span className="node-number">{index + 1}</span>
                    </div>
                    
                    <div className="node-content">
                      <div className="node-header">
                        <span className="node-date">
                          {node.date.toLocaleDateString('ja-JP', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="node-percentage">
                          {node.percentage}%
                        </span>
                      </div>
                      
                      <div className="node-text">
                        {node.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="download-section">
              <button
                className="btn btn-secondary download-button"
                onClick={downloadVisualization}
              >
                <Download size={20} />
                記録をダウンロード
              </button>
            </div>
          </div>
        )}

        {selectedCompletedBook.finalReview && allNodes.length === 1 && (
          <div className="final-review-only">
            <h2>読了後の感想</h2>
            <div className="final-review-content">
              {selectedCompletedBook.finalReview}
            </div>
          </div>
        )}

        {allNodes.length === 1 && !selectedCompletedBook.finalReview && (
          <div className="no-content">
            <BookOpen className="no-content-icon" size={48} />
            <h3>読書記録がありません</h3>
            <p>この本には読書中の感想や最終レビューが記録されていません。</p>
          </div>
        )}

        <div className="reading-history-section">
          <h2>読書記録一覧</h2>
          <div className="history-list">
            {selectedCompletedBook.readingHistory.map((record) => (
              <div key={record.id} className="history-item">
                <div className="history-date">
                  <Calendar size={16} />
                  {new Date(record.date).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </div>
                <div className="history-content">
                  <div className="history-progress">{record.percentage}%まで読了</div>
                  {record.notes && (
                    <div className="history-notes">{record.notes}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 