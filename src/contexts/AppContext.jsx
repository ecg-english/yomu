import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';

const AppContext = createContext();

// 初期状態
const initialState = {
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
  isLoading: false,
  error: null,
};

// アクションタイプ
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  LOAD_BOOKS: 'LOAD_BOOKS',
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
  LOAD_WISHLIST: 'LOAD_WISHLIST',
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
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    
    case ActionTypes.LOAD_BOOKS:
      const { books, completedBooks } = action.payload;
      
      // バックエンドデータをフロントエンド形式に変換
      const convertBook = (book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        totalPages: book.total_pages,
        targetDate: book.target_date,
        startedAt: book.started_at,
        currentPage: book.current_page,
        readingHistory: [], // 初期化（後でAPIから取得）
      });
      
      const currentBooks = books.filter(book => !book.is_completed).map(convertBook);
      const completedBooksList = (completedBooks || books.filter(book => book.is_completed)).map(convertBook);
      
      return {
        ...state,
        currentBooks,
        completedBooks: completedBooksList,
        selectedBookId: currentBooks.length > 0 ? currentBooks[0].id : null,
        isLoading: false,
        error: null,
      };
    
    case ActionTypes.ADD_BOOK:
      const newBook = {
        id: action.payload.id,
        title: action.payload.title,
        author: action.payload.author,
        totalPages: action.payload.total_pages,
        targetDate: action.payload.target_date,
        startedAt: action.payload.started_at,
        currentPage: action.payload.current_page,
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
        id: record.id,
        date: record.date,
        pagesRead: record.pages_read,
        notes: record.notes,
        percentage: record.percentage,
      };
      
      return {
        ...state,
        currentBooks: state.currentBooks.map(book =>
          book.id === bookId
            ? { ...book, readingHistory: [...book.readingHistory, newRecord] }
            : book
        ),
      };
    
    case ActionTypes.COMPLETE_BOOK:
      const { bookId: completedBookId, finalReview } = action.payload;
      const completedBook = state.currentBooks.find(book => book.id === completedBookId);
      
      if (!completedBook) return state;
      
      const completedBookWithReview = {
        ...completedBook,
        finalReview,
        completedAt: new Date().toISOString(),
      };
      
      return {
        ...state,
        currentBooks: state.currentBooks.filter(book => book.id !== completedBookId),
        completedBooks: [...state.completedBooks, completedBookWithReview],
        selectedBookId: state.currentBooks.length > 1 
          ? state.currentBooks.find(book => book.id !== completedBookId)?.id 
          : null,
      };
    
    case ActionTypes.SET_CURRENT_TAB:
      return { ...state, currentTab: action.payload };
    
    case ActionTypes.START_TIMER:
      return {
        ...state,
        isTimerRunning: true,
        timerMode: action.payload.mode,
        timerDuration: action.payload.duration,
        timerSeconds: action.payload.duration,
      };
    
    case ActionTypes.STOP_TIMER:
      return {
        ...state,
        isTimerRunning: false,
      };
    
    case ActionTypes.UPDATE_TIMER:
      return {
        ...state,
        timerSeconds: action.payload,
      };
    
    case ActionTypes.LOAD_WISHLIST:
      // バックエンドデータをフロントエンド形式に変換
      const convertWishlistItem = (item) => ({
        id: item.id,
        title: item.title,
        author: item.author,
        amazonLink: item.amazon_link,
        notes: item.notes,
        isCompleted: item.is_checked,
      });
      
      return {
        ...state,
        bookWishlist: action.payload.map(convertWishlistItem),
        isLoading: false,
      };
    
    case ActionTypes.ADD_TO_WISHLIST:
      const newWishlistItem = {
        id: action.payload.id,
        title: action.payload.title,
        author: action.payload.author,
        amazonLink: action.payload.amazon_link,
        notes: action.payload.notes,
        isCompleted: action.payload.is_checked,
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
      return { ...state, ...action.payload };
    
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [persistedData, setPersistedData] = useLocalStorage('bookCalendarData', null);
  const { user, token } = useAuth();

  const API_BASE = 'https://yomu-api.onrender.com';

  // API 呼び出しヘルパー
  const apiCall = async (endpoint, options = {}) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API error');
      }

      return await response.json();
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  // データの永続化（ローカルストレージ）
  useEffect(() => {
    if (persistedData && !user) {
      dispatch({ type: ActionTypes.LOAD_DATA, payload: persistedData });
    }
  }, []);

  useEffect(() => {
    if (user) {
      setPersistedData(null); // 認証後はローカルストレージをクリア
    } else {
      setPersistedData(state);
    }
  }, [state, user]);

  // ユーザーが認証されたらデータを読み込み
  useEffect(() => {
    if (user && token) {
      loadUserData();
    }
  }, [user, token]);

  const loadUserData = async () => {
    try {
      // 本のデータを読み込み
      const booksData = await apiCall('/api/books');
      dispatch({ 
        type: ActionTypes.LOAD_BOOKS, 
        payload: { 
          books: booksData.books,
          completedBooks: booksData.books.filter(book => book.is_completed)
        } 
      });

      // ウィッシュリストを読み込み
      const wishlistData = await apiCall('/api/wishlist');
      dispatch({ type: ActionTypes.LOAD_WISHLIST, payload: wishlistData.wishlist });
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // ヘルパー関数
  const getSelectedBook = () => {
    return state.currentBooks.find(book => book.id === state.selectedBookId) || null;
  };

  const getAllReadingHistory = () => {
    // 全ての本の読書記録を統合（カレンダー表示用）
    const allRecords = [];
    
    // 現在読書中の本の記録
    state.currentBooks.forEach(book => {
      if (book.readingHistory && Array.isArray(book.readingHistory)) {
        book.readingHistory.forEach(record => {
          allRecords.push({
            ...record,
            bookId: book.id,
            bookTitle: book.title,
            isCompleted: false,
          });
        });
      }
    });
    
    // 読了済みの本の記録
    state.completedBooks.forEach(book => {
      if (book.readingHistory && Array.isArray(book.readingHistory)) {
        book.readingHistory.forEach(record => {
          allRecords.push({
            ...record,
            bookId: book.id,
            bookTitle: book.title,
            isCompleted: true,
          });
        });
      }
    });
    
    return allRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // アクションクリエイター
  const actions = {
    addBook: async (book) => {
      try {
        const response = await apiCall('/api/books', {
          method: 'POST',
          body: JSON.stringify({
            title: book.title,
            author: book.author,
            totalPages: book.totalPages,
            targetDate: book.targetDate,
          }),
        });
        
        dispatch({ type: ActionTypes.ADD_BOOK, payload: response.book });
      } catch (error) {
        console.error('Failed to add book:', error);
      }
    },
    
    updateBook: async (id, updates) => {
      try {
        const response = await apiCall(`/api/books/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        
        dispatch({ 
          type: ActionTypes.UPDATE_BOOK, 
          payload: { id, updates: response.book } 
        });
      } catch (error) {
        console.error('Failed to update book:', error);
      }
    },
    
    removeBook: async (id) => {
      try {
        await apiCall(`/api/books/${id}`, { method: 'DELETE' });
        dispatch({ type: ActionTypes.REMOVE_BOOK, payload: id });
      } catch (error) {
        console.error('Failed to remove book:', error);
      }
    },
    
    selectBook: (id) => dispatch({ type: ActionTypes.SELECT_BOOK, payload: id }),
    
    addReadingRecord: async (bookId, record) => {
      try {
        const response = await apiCall(`/api/books/${bookId}/records`, {
          method: 'POST',
          body: JSON.stringify({
            pagesRead: record.pagesRead,
            notes: record.notes,
            percentage: record.percentage,
          }),
        });
        
        dispatch({ 
          type: ActionTypes.ADD_READING_RECORD, 
          payload: { bookId, record: response.record } 
        });
      } catch (error) {
        console.error('Failed to add reading record:', error);
      }
    },
    
    completeBook: async (bookId, finalReview) => {
      try {
        const response = await apiCall(`/api/books/${bookId}/complete`, {
          method: 'POST',
          body: JSON.stringify({ finalReview }),
        });
        
        dispatch({ 
          type: ActionTypes.COMPLETE_BOOK, 
          payload: { bookId, finalReview } 
        });
      } catch (error) {
        console.error('Failed to complete book:', error);
      }
    },
    
    setCurrentTab: (tab) => dispatch({ type: ActionTypes.SET_CURRENT_TAB, payload: tab }),
    
    startTimer: (mode, duration) => dispatch({ 
      type: ActionTypes.START_TIMER, 
      payload: { mode, duration } 
    }),
    
    stopTimer: () => dispatch({ type: ActionTypes.STOP_TIMER }),
    
    updateTimer: (seconds) => dispatch({ type: ActionTypes.UPDATE_TIMER, payload: seconds }),
    
    addToWishlist: async (item) => {
      try {
        const response = await apiCall('/api/wishlist', {
          method: 'POST',
          body: JSON.stringify({
            title: item.title,
            author: item.author,
            amazonLink: item.amazonLink,
            notes: item.notes,
          }),
        });
        
        dispatch({ type: ActionTypes.ADD_TO_WISHLIST, payload: response.item });
      } catch (error) {
        console.error('Failed to add to wishlist:', error);
      }
    },
    
    updateWishlistItem: async (id, updates) => {
      try {
        const response = await apiCall(`/api/wishlist/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        
        dispatch({ 
          type: ActionTypes.UPDATE_WISHLIST_ITEM, 
          payload: { id, updates: response.item } 
        });
      } catch (error) {
        console.error('Failed to update wishlist item:', error);
      }
    },
    
    removeFromWishlist: async (id) => {
      try {
        await apiCall(`/api/wishlist/${id}`, { method: 'DELETE' });
        dispatch({ type: ActionTypes.REMOVE_FROM_WISHLIST, payload: id });
      } catch (error) {
        console.error('Failed to remove from wishlist:', error);
      }
    },
    
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
    state: { ...state, user },
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