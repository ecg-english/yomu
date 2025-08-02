import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './AuthScreen.css';

export default function AuthScreen() {
  const { signup, login, isLoading, error } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isLoginMode) {
        await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
      }
    } catch (error) {
      // エラーは AuthContext で管理されているので何もしない
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({ name: '', email: '', password: '' });
    setShowPassword(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-header">
          <div className="icon-wrapper">
            <img src={import.meta.env.BASE_URL + "YomuLogo.png"} alt="読む！" className="auth-logo" />
          </div>
          <h1 className="auth-title">読む！へようこそ</h1>
          <p className="auth-subtitle">
            {isLoginMode 
              ? 'アカウントにログインして読書を続けましょう'
              : 'アカウントを作成して読書ライフを始めましょう'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLoginMode && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                お名前
              </label>
              <div className="input-wrapper">
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="例: 山田太郎"
                  className="form-input"
                  required={!isLoginMode}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              メールアドレス
            </label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="example@email.com"
                className="form-input"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              パスワード
            </label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="8文字以上で入力"
                className="form-input"
                required
                disabled={isLoading}
                minLength={8}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`btn btn-primary auth-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || !formData.email || !formData.password || (!isLoginMode && !formData.name)}
          >
            {isLoading 
              ? '処理中...' 
              : isLoginMode 
                ? 'ログイン' 
                : 'アカウント作成'
            }
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLoginMode ? 'アカウントをお持ちでない方' : '既にアカウントをお持ちの方'}
            <button
              type="button"
              className="switch-button"
              onClick={toggleMode}
              disabled={isLoading}
            >
              {isLoginMode ? '新規登録' : 'ログイン'}
            </button>
          </p>
        </div>

        <div className="auth-features">
          <div className="feature-item">
            <div className="feature-dot"></div>
            <span>読書の進捗を視覚的に記録</span>
          </div>
          <div className="feature-item">
            <div className="feature-dot"></div>
            <span>タイマー機能で集中読書</span>
          </div>
          <div className="feature-item">
            <div className="feature-dot"></div>
            <span>読了後の感想を振り返り</span>
          </div>
        </div>
      </div>
    </div>
  );
} 