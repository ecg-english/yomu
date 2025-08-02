import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isLoading: false,
  error: null
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload.user, 
        token: action.payload.token,
        isLoading: false,
        error: null 
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...state, user: null, token: null, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const API_BASE = 'https://yomu-api.onrender.com';

  // 初期化時にローカルストレージからトークンを復元
  useEffect(() => {
    const token = localStorage.getItem('yomu_token');
    if (token) {
      // トークンの有効性を確認
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/api/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        dispatch({
          type: 'SET_USER',
          payload: { user: userData.user, token }
        });
      } else {
        // トークンが無効な場合は削除
        localStorage.removeItem('yomu_token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('yomu_token');
    }
  };

  const signup = async ({ name, email, password }) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登録に失敗しました');
      }

      localStorage.setItem('yomu_token', data.token);
      dispatch({
        type: 'SET_USER',
        payload: { user: { name, email }, token: data.token }
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const login = async ({ email, password }) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ログインに失敗しました');
      }

      localStorage.setItem('yomu_token', data.token);
      
      // ユーザー情報を取得
      const userResponse = await fetch(`${API_BASE}/api/me`, {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        dispatch({
          type: 'SET_USER',
          payload: { user: userData.user, token: data.token }
        });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('yomu_token');
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    ...state,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 