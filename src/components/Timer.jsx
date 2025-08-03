import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Timer as TimerIcon, BookOpen } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import ReadingProgress from './ReadingProgress';
import './Timer.css';

export default function Timer() {
  const { state, actions, getSelectedBook } = useApp();
  const { currentBooks, isTimerRunning, timerSeconds, timerMode, timerDuration } = state;
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showEndOptions, setShowEndOptions] = useState(false);
  const [selectedBookForReading, setSelectedBookForReading] = useState(null);

  const selectedBook = getSelectedBook();

  // バックグラウンドタイマー機能
  useEffect(() => {
    const checkBackgroundTimer = () => {
      const savedTimerData = localStorage.getItem('yomuTimerData');
      if (savedTimerData) {
        const timerData = JSON.parse(savedTimerData);
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - timerData.startTime) / 1000);
        
        if (timerData.mode === 'timer') {
          const remainingSeconds = Math.max(0, timerData.duration - elapsedSeconds);
          
          if (remainingSeconds <= 0) {
            // タイマー終了
            localStorage.removeItem('yomuTimerData');
            setShowEndOptions(true);
            actions.stopTimer();
          } else {
            // タイマーを更新
            actions.updateTimer(remainingSeconds);
            if (!isTimerRunning) {
              actions.startTimer('timer', remainingSeconds);
            }
          }
        } else if (timerData.mode === 'stopwatch') {
          // ストップウォッチを更新
          actions.updateTimer(elapsedSeconds);
          if (!isTimerRunning) {
            actions.startTimer('stopwatch', elapsedSeconds);
          }
        }
      }
    };

    // ページ読み込み時にチェック
    checkBackgroundTimer();

    // 定期的にチェック（1秒間隔）
    const interval = setInterval(checkBackgroundTimer, 1000);
    
    return () => clearInterval(interval);
  }, [isTimerRunning, actions]);

  // タイマー選択肢（分）
  const timerOptions = [
    { label: '5分', minutes: 5 },
    { label: '10分', minutes: 10 },
    { label: '15分', minutes: 15 },
    { label: '20分', minutes: 20 },
    { label: '25分', minutes: 25 },
    { label: '30分', minutes: 30 },
    { label: '45分', minutes: 45 },
    { label: '60分', minutes: 60 },
    { label: '75分', minutes: 75 },
    { label: '90分', minutes: 90 },
    { label: '120分', minutes: 120 },
    { label: '150分', minutes: 150 },
    { label: '180分', minutes: 180 },
    { label: 'ストップウォッチ', minutes: 'stopwatch' },
    { label: 'なし', minutes: 'none' }
  ];

  // タイマーの更新（リアルタイム表示用）
  useEffect(() => {
    let interval;
    
    if (isTimerRunning && timerMode) {
      interval = setInterval(() => {
        if (timerMode === 'timer') {
          // カウントダウンタイマー
          if (timerSeconds > 0) {
            actions.updateTimer(timerSeconds - 1);
          } else {
            // タイマー終了
            setShowEndOptions(true);
            actions.stopTimer();
            localStorage.removeItem('yomuTimerData');
          }
        } else if (timerMode === 'stopwatch') {
          // ストップウォッチ
          actions.updateTimer(timerSeconds + 1);
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, timerMode, actions]);

  // 時間を分:秒形式でフォーマット
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // タイマー開始
  const startTimer = () => {
    if (selectedDuration === null) return;

    // 読書する本が選択されていない場合はデフォルトの本を選択
    if (!selectedBookForReading) {
      setSelectedBookForReading(selectedBook || currentBooks[0]);
    }

    if (selectedDuration === 'stopwatch') {
      actions.startTimer('stopwatch', 0);
      // バックグラウンドタイマーデータを保存
      const timerData = {
        mode: 'stopwatch',
        startTime: Date.now(),
        duration: 0
      };
      localStorage.setItem('yomuTimerData', JSON.stringify(timerData));
    } else if (selectedDuration === 'none') {
      setShowProgressForm(true);
    } else {
      const durationInSeconds = selectedDuration * 60;
      actions.startTimer('timer', durationInSeconds);
      // バックグラウンドタイマーデータを保存
      const timerData = {
        mode: 'timer',
        startTime: Date.now(),
        duration: durationInSeconds
      };
      localStorage.setItem('yomuTimerData', JSON.stringify(timerData));
    }
  };

  // タイマー停止/再開
  const toggleTimer = () => {
    if (isTimerRunning) {
      actions.stopTimer();
      localStorage.removeItem('yomuTimerData'); // 一時停止時はバックグラウンドタイマーをリセット
    } else {
      if (timerMode === 'timer') {
        actions.startTimer('timer', timerSeconds);
        // 再開時にバックグラウンドタイマーデータを更新
        const timerData = {
          mode: 'timer',
          startTime: Date.now() - (timerDuration - timerSeconds) * 1000,
          duration: timerDuration
        };
        localStorage.setItem('yomuTimerData', JSON.stringify(timerData));
      } else if (timerMode === 'stopwatch') {
        actions.startTimer('stopwatch', timerSeconds);
        // 再開時にバックグラウンドタイマーデータを更新
        const timerData = {
          mode: 'stopwatch',
          startTime: Date.now() - timerSeconds * 1000,
          duration: 0
        };
        localStorage.setItem('yomuTimerData', JSON.stringify(timerData));
      }
    }
  };

  // タイマーリセット
  const resetTimer = () => {
    actions.stopTimer();
    setSelectedDuration(null);
    setShowEndOptions(false);
    setSelectedBookForReading(null);
    localStorage.removeItem('yomuTimerData'); // リセット時はバックグラウンドタイマーをリセット
  };

  // 終了選択肢のハンドリング
  const handleEndOption = (option) => {
    setShowEndOptions(false);
    
    switch (option) {
      case 'more':
        // もう1ページだけ読む
        setShowProgressForm(true);
        break;
      case 'reset':
        // タイマーを設定し直す
        resetTimer();
        break;
      case 'finish':
        // 今日はここまで！読書記録に移動
        setShowProgressForm(true);
        break;
      default:
        break;
    }
  };

  // 読書記録完了時
  const handleProgressComplete = () => {
    setShowProgressForm(false);
    resetTimer();
  };

  // 本選択時
  const handleBookSelect = (bookId) => {
    const book = currentBooks.find(b => b.id === bookId);
    setSelectedBookForReading(book);
    actions.selectBook(bookId);
  };

  if (showProgressForm) {
    return (
      <ReadingProgress 
        book={selectedBookForReading || selectedBook || currentBooks[0]}
        onComplete={handleProgressComplete}
        onCancel={() => setShowProgressForm(false)}
      />
    );
  }

  return (
    <div className="timer">
      <div className="container">
        <header className="timer-header">
          <div className="timer-title">
            <TimerIcon className="timer-icon" size={24} />
            <div className="timer-title-logo">
              <img src={import.meta.env.BASE_URL + "YomuLogo.png"} alt="読む！" className="timer-logo" />
            </div>
          </div>
          
          {currentBooks.length > 0 && (
            <div className="current-book-info">
              <span className="book-title">
                {selectedBookForReading ? selectedBookForReading.title : (selectedBook ? selectedBook.title : '本を選択してください')}
              </span>
            </div>
          )}
        </header>

        {currentBooks.length === 0 ? (
          <div className="no-books-message">
            <BookOpen className="no-books-icon" size={48} />
            <h3>読書中の本がありません</h3>
            <p>
              タイマーを使用するには、まず本を登録してください。
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => actions.setCurrentTab('dashboard')}
            >
              本を追加
            </button>
          </div>
        ) : !isTimerRunning && !timerMode && (
          <div className="timer-setup">
            {/* 本の選択 */}
            {currentBooks.length > 1 && (
              <div className="book-selection-section">
                <h2 className="book-selection-title">どの本を読みますか？</h2>
                <div className="book-selection-grid">
                  {currentBooks.map((book) => {
                    const latestRecord = book.readingHistory[book.readingHistory.length - 1];
                    const progress = book.totalPages && latestRecord
                      ? Math.min(Math.round((latestRecord.pagesRead / book.totalPages) * 100), 100)
                      : 0;
                    
                    return (
                      <div
                        key={book.id}
                        className={`book-selection-card ${selectedBookForReading?.id === book.id ? 'selected' : ''}`}
                        onClick={() => handleBookSelect(book.id)}
                      >
                        <h3 className="selection-book-title">{book.title}</h3>
                        {book.author && (
                          <p className="selection-book-author">{book.author}</p>
                        )}
                        <div className="selection-progress-bar">
                          <div 
                            className="selection-progress-fill"
                            style={{ width: `${progress}%` }}
                          ></div>
                          <span className="selection-progress-text">{progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <h2 className="setup-title">読書時間を設定してください</h2>
            
            <div className="timer-options">
              {timerOptions.map((option) => (
                <button
                  key={option.minutes}
                  className={`timer-option ${selectedDuration === option.minutes ? 'selected' : ''}`}
                  onClick={() => setSelectedDuration(option.minutes)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary start-button"
              onClick={startTimer}
              disabled={selectedDuration === null || (currentBooks.length > 1 && !selectedBookForReading)}
            >
              <Play size={20} />
              読書開始
            </button>

            <div className="timer-tips">
              <h3 className="tips-title">⏰ タイマーの使い方</h3>
              <div className="tips-list">
                <div className="tip-item">
                  <strong>集中読書</strong>には15-25分がおすすめです
                </div>
                <div className="tip-item">
                  <strong>ストップウォッチ</strong>で読書時間を記録できます
                </div>
                {currentBooks.length > 1 && (
                  <div className="tip-item">
                    <strong>本を選択</strong>してから読書を開始します
                  </div>
                )}
                <div className="tip-item">
                  <strong>なし</strong>を選ぶと直接読書記録画面に移動します
                </div>
              </div>
            </div>
          </div>
        )}

        {(isTimerRunning || timerMode) && !showEndOptions && (
          <div className="timer-display">
            {selectedBookForReading && (
              <div className="reading-book-info">
                <h3>読書中: {selectedBookForReading.title}</h3>
                {selectedBookForReading.author && (
                  <p>著者: {selectedBookForReading.author}</p>
                )}
              </div>
            )}

            <div className="timer-circle">
              <svg viewBox="0 0 200 200" className="timer-svg">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="8"
                />
                {timerMode === 'timer' && (
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${((timerDuration - timerSeconds) / timerDuration) * 565.5} 565.5`}
                    transform="rotate(-90 100 100)"
                    className="timer-progress"
                  />
                )}
              </svg>
              
              <div className="timer-content">
                <div className="timer-time">
                  {formatTime(timerSeconds)}
                </div>
                <div className="timer-mode">
                  {timerMode === 'timer' ? 'タイマー' : 'ストップウォッチ'}
                </div>
              </div>
            </div>

            <div className="timer-controls">
              <button
                className="btn btn-secondary control-button"
                onClick={resetTimer}
              >
                <RotateCcw size={20} />
                リセット
              </button>
              
              <button
                className={`btn ${isTimerRunning ? 'btn-secondary' : 'btn-primary'} control-button main-control`}
                onClick={toggleTimer}
              >
                {isTimerRunning ? (
                  <>
                    <Pause size={24} />
                    一時停止
                  </>
                ) : (
                  <>
                    <Play size={24} />
                    再開
                  </>
                )}
              </button>
              
              <button
                className="btn btn-secondary control-button"
                onClick={() => setShowProgressForm(true)}
              >
                <Clock size={20} />
                記録する
              </button>
            </div>

            <div className="reading-encouragement">
              <p>集中して読書を楽しんでください 📖</p>
              {timerMode === 'timer' && (
                <p>残り時間: {formatTime(timerSeconds)}</p>
              )}
            </div>
          </div>
        )}

        {showEndOptions && (
          <div className="end-options">
            <div className="end-message">
              <h2>タイマーが終了しました！</h2>
              <p>お疲れさまでした。次はどうしますか？</p>
            </div>
            
            <div className="end-buttons">
              <button
                className="btn btn-primary end-button main-option"
                onClick={() => handleEndOption('more')}
              >
                もう1ページだけ読む
              </button>
              
              <button
                className="btn btn-secondary end-button"
                onClick={() => handleEndOption('reset')}
              >
                タイマーを設定し直す
              </button>
              
              <button
                className="btn btn-secondary end-button"
                onClick={() => handleEndOption('finish')}
              >
                今日はここまで！読書記録に移動
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 