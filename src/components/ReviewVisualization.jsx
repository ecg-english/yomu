import React, { useState, useRef } from 'react';
import { Award, Download, Save, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import './ReviewVisualization.css';

export default function ReviewVisualization({ onComplete, readingHistory, bookTitle }) {
  const [finalReview, setFinalReview] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const scrollContainerRef = useRef(null);

  // 読書記録を時系列順に整理
  const nodes = readingHistory
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
    date: new Date(),
    content: finalReview,
    percentage: 100,
    isEditable: true,
    isFinal: true
  };

  const allNodes = [...nodes, finalNode];

  const handleSave = () => {
    onComplete(finalReview);
  };

  const downloadVisualization = () => {
    // 簡単なテキスト形式でダウンロード
    const content = [
      `『${bookTitle}』読書記録`,
      '=' + '='.repeat(bookTitle.length + 7),
      '',
      ...nodes.map((node, index) => [
        `${index + 1}. ${node.date.toLocaleDateString('ja-JP')} (${node.percentage}%進捗)`,
        node.content,
        ''
      ].join('\n')),
      '最終感想:',
      finalReview || '（未記入）',
      '',
      `生成日時: ${new Date().toLocaleString('ja-JP')}`
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookTitle}_読書記録.txt`;
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

  return (
    <div className="review-visualization">
      <div className="container">
        <header className="review-header">
          <div className="congrats-section">
            <div className="award-icon">
              <Award size={48} />
            </div>
            <h1 className="congrats-title">🎉 読破おめでとうございます！ 🎉</h1>
            <p className="book-title">『{bookTitle}』</p>
            <p className="congrats-subtitle">
              あなたの読書の軌跡を振り返ってみましょう
            </p>
          </div>
        </header>

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
                      {node.isFinal && (
                        <button
                          className="edit-toggle"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(!isEditing);
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                    
                    {node.isFinal ? (
                      <div className="final-review-section">
                        {isEditing ? (
                          <textarea
                            value={finalReview}
                            onChange={(e) => setFinalReview(e.target.value)}
                            placeholder="この本を読み終えた感想をここに書いてください..."
                            className="final-review-textarea"
                            rows="4"
                            autoFocus
                          />
                        ) : (
                          <div className="node-text final-review">
                            {finalReview || (
                              <span className="placeholder-text">
                                読了後の感想・まとめを記入してください
                              </span>
                            )}
                          </div>
                        )}
                        {!finalReview && !isEditing && (
                          <button
                            className="btn btn-secondary add-review-button"
                            onClick={() => setIsEditing(true)}
                          >
                            感想を追加
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="node-text">
                        {node.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="action-section">
          {nodes.length > 0 && (
            <button
              className="btn btn-secondary download-button"
              onClick={downloadVisualization}
            >
              <Download size={20} />
              記録をダウンロード
            </button>
          )}
          
          <button
            className="btn btn-primary save-button"
            onClick={handleSave}
          >
            <Save size={20} />
            完了して保存
          </button>
        </div>

        {nodes.length === 0 && (
          <div className="no-notes-message">
            <p>
              読書中に感想やメモを残していませんでしたが、<br />
              最終的な感想を記録することができます。
            </p>
          </div>
        )}

        <div className="reading-stats">
          <h3>読書統計</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{readingHistory.length}</span>
              <span className="stat-label">読書記録数</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{nodes.length}</span>
              <span className="stat-label">感想・メモ数</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {Math.ceil((new Date() - new Date(readingHistory[0]?.date || new Date())) / (1000 * 60 * 60 * 24))}
              </span>
              <span className="stat-label">読書日数</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 