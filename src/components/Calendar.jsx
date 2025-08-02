import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Check } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import './Calendar.css';

export default function Calendar() {
  const { state, actions, getAllReadingHistory } = useApp();
  const { completedBooks } = state;
  const [currentDate, setCurrentDate] = useState(new Date());

  const allReadingHistory = getAllReadingHistory();

  // 月の最初の日と最後の日を取得
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // カレンダー表示用の日付配列を生成
  const generateCalendarDays = () => {
    const days = [];
    const startDate = new Date(firstDayOfMonth);
    
    // 月の最初の週の前の月の日付を追加
    const startOfWeek = startDate.getDay();
    for (let i = startOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(firstDayOfMonth);
      prevDate.setDate(prevDate.getDate() - (i + 1));
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        readingData: getReadingDataForDate(prevDate)
      });
    }
    
    // 現在の月の日付を追加
    for (let date = 1; date <= lastDayOfMonth.getDate(); date++) {
      const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
      days.push({
        date: currentDay,
        isCurrentMonth: true,
        readingData: getReadingDataForDate(currentDay)
      });
    }
    
    // 残りの週を次の月の日付で埋める
    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextDate = 1;
    for (let i = days.length; i < totalCells; i++) {
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, nextDate);
      days.push({
        date: nextMonth,
        isCurrentMonth: false,
        readingData: getReadingDataForDate(nextMonth)
      });
      nextDate++;
    }
    
    return days;
  };

  // 特定の日付の読書データを取得
  const getReadingDataForDate = (date) => {
    const dateString = date.toDateString();
    
    // その日の読書記録を取得
    const dayRecords = allReadingHistory.filter(record => 
      new Date(record.date).toDateString() === dateString
    );

    if (dayRecords.length === 0) {
      return { hasReading: false, percentage: 0, completedBooks: [], records: [] };
    }

    // 読了した本の記録
    const completedBookRecords = dayRecords.filter(record => record.isCompleted);
    
    // 読書中の本の最高進捗率
    const currentBookRecords = dayRecords.filter(record => !record.isCompleted);
    const maxPercentage = currentBookRecords.length > 0 
      ? Math.max(...currentBookRecords.map(record => record.percentage))
      : 0;

    // 読了した本がある場合は読了優先、なければ最高進捗率
    const displayPercentage = completedBookRecords.length > 0 ? 100 : maxPercentage;

    return {
      hasReading: true,
      percentage: displayPercentage,
      completedBooks: completedBookRecords.map(record => ({
        id: record.bookId,
        title: record.bookTitle
      })),
      records: dayRecords,
      isCompleted: completedBookRecords.length > 0
    };
  };

  // 月を変更
  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // 今日の日付かチェック
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 読了した本の詳細を表示
  const handleCompletedBookClick = (bookId) => {
    const book = completedBooks.find(b => b.id === bookId);
    if (book) {
      actions.setSelectedCompletedBook(book);
    }
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  // 統計情報
  const currentMonthReadingDays = calendarDays.filter(day => 
    day.isCurrentMonth && day.readingData.hasReading
  ).length;

  const thisMonthAverage = currentMonthReadingDays > 0 
    ? Math.round(
        calendarDays
          .filter(day => day.isCurrentMonth && day.readingData.hasReading)
          .reduce((sum, day) => sum + day.readingData.percentage, 0) / currentMonthReadingDays
      )
    : 0;

  const currentMonthCompletions = calendarDays.filter(day =>
    day.isCurrentMonth && day.readingData.completedBooks.length > 0
  ).length;

  return (
    <div className="calendar">
      <div className="container">
        <header className="calendar-header">
          <div className="calendar-title">
            <BookOpen className="calendar-icon" size={24} />
            <div className="calendar-title-logo">
              <img src={import.meta.env.BASE_URL + "YomuLogo.png"} alt="読む！" className="calendar-logo" />
            </div>
          </div>
          
          <div className="calendar-stats">
            <div className="stat-item">
              <span className="stat-number">{currentMonthReadingDays}</span>
              <span className="stat-label">日読書</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{currentMonthCompletions}</span>
              <span className="stat-label">日読了</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{thisMonthAverage}%</span>
              <span className="stat-label">平均進捗</span>
            </div>
          </div>
        </header>

        <div className="calendar-navigation">
          <button 
            className="nav-button"
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          
          <h2 className="current-month">
            {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
          </h2>
          
          <button 
            className="nav-button"
            onClick={() => changeMonth(1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="calendar-grid">
          <div className="day-names">
            {dayNames.map((day) => (
              <div key={day} className="day-name">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-days">
            {calendarDays.map((day, index) => {
              const { readingData } = day;
              const dayClass = [
                'calendar-day',
                !day.isCurrentMonth && 'other-month',
                readingData.hasReading && 'has-reading',
                readingData.isCompleted && 'completed',
                isToday(day.date) && 'today'
              ].filter(Boolean).join(' ');

              // 背景色の計算
              let backgroundColor;
              if (readingData.isCompleted) {
                // 読了した日は薄い緑色
                backgroundColor = 'rgba(141, 181, 150, 0.3)';
              } else if (readingData.hasReading) {
                // 読書した日は赤色（進捗に応じて濃さを変える）
                backgroundColor = `rgba(216, 139, 139, ${0.3 + (readingData.percentage / 100) * 0.7})`;
              }

              return (
                <div
                  key={index}
                  className={dayClass}
                  style={{ backgroundColor }}
                  onClick={() => {
                    if (readingData.completedBooks.length === 1) {
                      handleCompletedBookClick(readingData.completedBooks[0].id);
                    }
                  }}
                >
                  <span className="day-number">
                    {day.date.getDate()}
                  </span>
                  
                  {readingData.isCompleted ? (
                    <div className="completion-indicator">
                      <Check size={14} />
                    </div>
                  ) : readingData.hasReading && (
                    <span className="day-percentage">
                      {readingData.percentage}%
                    </span>
                  )}

                  {/* 複数の本を読了した場合の表示 */}
                  {readingData.completedBooks.length > 1 && (
                    <span className="multiple-completions">
                      +{readingData.completedBooks.length - 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="calendar-legend">
          <h3 className="legend-title">読書記録の見方</h3>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color no-reading"></div>
              <span>読書なし</span>
            </div>
            <div className="legend-item">
              <div className="legend-color light-reading"></div>
              <span>少し読書</span>
            </div>
            <div className="legend-item">
              <div className="legend-color medium-reading"></div>
              <span>しっかり読書</span>
            </div>
            <div className="legend-item">
              <div className="legend-color heavy-reading"></div>
              <span>たくさん読書</span>
            </div>
            <div className="legend-item">
              <div className="legend-color completed">
                <Check size={12} />
              </div>
              <span>読了</span>
            </div>
          </div>
          <p className="legend-description">
            赤色の濃さが読書進捗を表し、数字は累積進捗率です。<br />
            薄い緑色は本を読了した日で、クリックすると振り返りができます。
          </p>
        </div>

        {allReadingHistory.length === 0 && (
          <div className="no-history">
            <BookOpen className="no-history-icon" size={48} />
            <h3>まだ読書記録がありません</h3>
            <p>読書タイマーを使って本を読み、記録を残してみましょう！</p>
          </div>
        )}
      </div>
    </div>
  );
} 