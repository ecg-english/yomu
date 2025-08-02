import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import UserRegistration from './components/UserRegistration';
import BookRegistration from './components/BookRegistration';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import Timer from './components/Timer';
import BookList from './components/BookList';
import CompletedBookDetail from './components/CompletedBookDetail';
import TabNavigation from './components/TabNavigation';

function AppContent() {
  const { state } = useApp();

  // ユーザーが登録されていない場合
  if (!state.user) {
    return <UserRegistration />;
  }

  // 読了した本の詳細を表示中
  if (state.selectedCompletedBook) {
    return <CompletedBookDetail />;
  }

  // 本追加モーダル表示中
  if (state.showAddBookModal) {
    return <BookRegistration isModal={true} />;
  }

  // 読書中の本がない場合は本の登録画面を表示
  if (state.currentBooks.length === 0) {
    return <BookRegistration />;
  }

  // メインアプリケーション画面
  const renderCurrentTab = () => {
    switch (state.currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'calendar':
        return <Calendar />;
      case 'timer':
        return <Timer />;
      case 'wishlist':
        return <BookList />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <main className="app-main">
        {renderCurrentTab()}
      </main>
      <TabNavigation />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <div className="app">
        <AppContent />
      </div>
    </AppProvider>
  );
}

export default App; 