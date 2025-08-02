import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AppContext = createContext();

// 初期状態
const initialState = {
  user: null,
  currentBooks: [], // 複数の本を管理
  selectedBookId: null, // 現在選択中の本
  completedBooks: [],
  bookWishlist: [],
  currentTab: 'dashboard',
  isTimerRunning: false,
  timerSeconds: 0,
  timerMode: null,
  timerDuration: 0,
  selectedCompletedBook: null, // 詳細表示中の読了本
  showAddBookModal: false, // 本追加モーダルの表示状態
};

// アクションタイプ
const ActionTypes = {
  SET_USER: 'SET_USER',
  ADD_BOOK: 'ADD_BOOK',
  UPDATE_BOOK: 'UPDATE_BOOK',
  REMOVE_BOOK: 'REMOVE_BOOK',
  SELECT_BOOK: 'SELECT_BOOK',
  ADD_READING_RECORD: 'ADD_READING_RECORD',
  COMPLETE_BOOK: 'COMPLETE_BOOK',
  SET_CURRENT_TAB: 'SET_CURRENT_TAB',
  START_TIMER: 'START_TIMER',
  STOP_TIMER: 'STOP_TIMER',
  UPDATE_TIMER: 'UPDATE_TIMER',
  ADD_TO_WISHLIST: 'ADD_TO_WISHLIST',
  UPDATE_WISHLIST_ITEM: 'UPDATE_WISHLIST_ITEM',
  REMOVE_FROM_WISHLIST: 'REMOVE_FROM_WISHLIST',
  SET_SELECTED_COMPLETED_BOOK: 'SET_SELECTED_COMPLETED_BOOK',
  SET_SHOW_ADD_BOOK_MODAL: 'SET_SHOW_ADD_BOOK_MODAL',
  LOAD_DATA: 'LOAD_DATA',
};

// リデューサー
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return { ...state, user: action.payload };
    
    case ActionTypes.ADD_BOOK:
      const newBook = {
        id: Date.now(),
        title: action.payload.title,
        author: action.payload.author || null,
        totalPages: action.payload.totalPages || null,
        targetDate: action.payload.targetDate || null,
        startedAt: new Date().toISOString(),
        currentPage: 0,
        readingHistory: [],
      };
      return {
        ...state,
        currentBooks: [...state.currentBooks, newBook],
        selectedBookId: newBook.id,
      };
    
    case ActionTypes.UPDATE_BOOK:
      return {
        ...state,
        currentBooks: state.currentBooks.map(book =>
          book.id === action.payload.id
            ? { ...book, ...action.payload.updates }
            : book
        ),
      };
    
    case ActionTypes.REMOVE_BOOK:
      const remainingBooks = state.currentBooks.filter(book => book.id !== action.payload);
      return {
        ...state,
        currentBooks: remainingBooks,
        selectedBookId: state.selectedBookId === action.payload 
          ? (remainingBooks.length > 0 ? remainingBooks[0].id : null)
          : state.selectedBookId,
      };
    
    case ActionTypes.SELECT_BOOK:
      return { ...state, selectedBookId: action.payload };
    
    case ActionTypes.ADD_READING_RECORD:
      const { bookId, record } = action.payload;
      const newRecord = {
        id: Date.now(),
        date: new Date().toISOString(),
        pagesRead: record.pagesRead,
        notes: record.notes,
        percentage: record.percentage,
      };
      
      return {
        ...state,
        currentBooks: state.currentBooks.map(book =>
          book.id === bookId
            ? {
                ...book,
                currentPage: record.pagesRead,
                readingHistory: [...book.readingHistory, newRecord],
              }
            : book
        ),
      };
    
    case ActionTypes.COMPLETE_BOOK:
      const { bookId: completedBookId, finalReview } = action.payload;
      const bookToComplete = state.currentBooks.find(book => book.id === completedBookId);
      
      if (!bookToComplete) return state;
      
      const completedBook = {
        ...bookToComplete,
        completedDate: new Date().toISOString(),
        finalReview,
      };
      
      const remainingCurrentBooks = state.currentBooks.filter(book => book.id !== completedBookId);
      
      return {
        ...state,
        completedBooks: [...state.completedBooks, completedBook],
        currentBooks: remainingCurrentBooks,
        selectedBookId: state.selectedBookId === completedBookId 
          ? (remainingCurrentBooks.length > 0 ? remainingCurrentBooks[0].id : null)
          : state.selectedBookId,
      };
    
    case ActionTypes.SET_CURRENT_TAB:
      return { ...state, currentTab: action.payload };
    
    case ActionTypes.START_TIMER:
      return {
        ...state,
        isTimerRunning: true,
        timerMode: action.payload.mode,
        timerDuration: action.payload.duration,
        timerSeconds: action.payload.mode === 'timer' ? action.payload.duration : 0,
      };
    
    case ActionTypes.STOP_TIMER:
      return {
        ...state,
        isTimerRunning: false,
        timerMode: null,
        timerDuration: 0,
        timerSeconds: 0,
      };
    
    case ActionTypes.UPDATE_TIMER:
      return { ...state, timerSeconds: action.payload };
    
    case ActionTypes.ADD_TO_WISHLIST:
      const newWishlistItem = {
        id: Date.now(),
        title: action.payload.title,
        details: action.payload.details || '',
        amazonLink: action.payload.amazonLink || '',
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        bookWishlist: [...state.bookWishlist, newWishlistItem],
      };
    
    case ActionTypes.UPDATE_WISHLIST_ITEM:
      return {
        ...state,
        bookWishlist: state.bookWishlist.map(item =>
          item.id === action.payload.id
            ? { ...item, ...action.payload.updates }
            : item
        ),
      };
    
    case ActionTypes.REMOVE_FROM_WISHLIST:
      return {
        ...state,
        bookWishlist: state.bookWishlist.filter(item => item.id !== action.payload),
      };
    
    case ActionTypes.SET_SELECTED_COMPLETED_BOOK:
      return { ...state, selectedCompletedBook: action.payload };
    
    case ActionTypes.SET_SHOW_ADD_BOOK_MODAL:
      return { ...state, showAddBookModal: action.payload };
    
    case ActionTypes.LOAD_DATA:
      // 旧データ形式との互換性を保つ
      let loadedData = { ...action.payload };
      
      // 旧形式のcurrentBookを新形式に変換
      if (loadedData.currentBook && !loadedData.currentBooks) {
        loadedData.currentBooks = [{
          ...loadedData.currentBook,
          readingHistory: loadedData.readingHistory || [],
        }];
        loadedData.selectedBookId = loadedData.currentBook.id;
        delete loadedData.currentBook;
        delete loadedData.readingHistory;
      }
      
      // デフォルト値の設定
      if (!loadedData.currentBooks) loadedData.currentBooks = [];
      if (!loadedData.selectedBookId && loadedData.currentBooks.length > 0) {
        loadedData.selectedBookId = loadedData.currentBooks[0].id;
      }
      
      return { ...state, ...loadedData };
    
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [persistedData, setPersistedData] = useLocalStorage('bookCalendarData', null);

  // データの永続化
  useEffect(() => {
    if (persistedData) {
      dispatch({ type: ActionTypes.LOAD_DATA, payload: persistedData });
    }
  }, []);

  useEffect(() => {
    setPersistedData(state);
  }, [state, setPersistedData]);

  // ヘルパー関数
  const getSelectedBook = () => {
    return state.currentBooks.find(book => book.id === state.selectedBookId) || null;
  };

  const getAllReadingHistory = () => {
    // 全ての本の読書記録を統合（カレンダー表示用）
    const allRecords = [];
    
    // 現在読書中の本の記録
    state.currentBooks.forEach(book => {
      book.readingHistory.forEach(record => {
        allRecords.push({
          ...record,
          bookId: book.id,
          bookTitle: book.title,
          isCompleted: false,
        });
      });
    });
    
    // 読了済みの本の記録
    state.completedBooks.forEach(book => {
      book.readingHistory.forEach(record => {
        allRecords.push({
          ...record,
          bookId: book.id,
          bookTitle: book.title,
          isCompleted: true,
        });
      });
    });
    
    return allRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // アクションクリエイター
  const actions = {
    setUser: (user) => dispatch({ type: ActionTypes.SET_USER, payload: user }),
    
    addBook: (book) => dispatch({ type: ActionTypes.ADD_BOOK, payload: book }),
    
    updateBook: (id, updates) => dispatch({ 
      type: ActionTypes.UPDATE_BOOK, 
      payload: { id, updates } 
    }),
    
    removeBook: (id) => dispatch({ type: ActionTypes.REMOVE_BOOK, payload: id }),
    
    selectBook: (id) => dispatch({ type: ActionTypes.SELECT_BOOK, payload: id }),
    
    addReadingRecord: (bookId, record) => dispatch({ 
      type: ActionTypes.ADD_READING_RECORD, 
      payload: { bookId, record } 
    }),
    
    completeBook: (bookId, finalReview) => dispatch({ 
      type: ActionTypes.COMPLETE_BOOK, 
      payload: { bookId, finalReview } 
    }),
    
    setCurrentTab: (tab) => dispatch({ type: ActionTypes.SET_CURRENT_TAB, payload: tab }),
    
    startTimer: (mode, duration) => dispatch({ 
      type: ActionTypes.START_TIMER, 
      payload: { mode, duration } 
    }),
    
    stopTimer: () => dispatch({ type: ActionTypes.STOP_TIMER }),
    
    updateTimer: (seconds) => dispatch({ type: ActionTypes.UPDATE_TIMER, payload: seconds }),
    
    addToWishlist: (item) => dispatch({ type: ActionTypes.ADD_TO_WISHLIST, payload: item }),
    
    updateWishlistItem: (id, updates) => dispatch({ 
      type: ActionTypes.UPDATE_WISHLIST_ITEM, 
      payload: { id, updates } 
    }),
    
    removeFromWishlist: (id) => dispatch({ type: ActionTypes.REMOVE_FROM_WISHLIST, payload: id }),
    
    setSelectedCompletedBook: (book) => dispatch({ 
      type: ActionTypes.SET_SELECTED_COMPLETED_BOOK, 
      payload: book 
    }),
    
    setShowAddBookModal: (show) => dispatch({
      type: ActionTypes.SET_SHOW_ADD_BOOK_MODAL,
      payload: show
    }),
  };

  const contextValue = {
    state,
    actions,
    getSelectedBook,
    getAllReadingHistory,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
} 