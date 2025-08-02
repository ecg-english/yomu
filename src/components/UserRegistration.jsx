import React, { useState } from 'react';
import { User } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import './UserRegistration.css';

export default function UserRegistration() {
  const { actions } = useApp();
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userName.trim()) return;

    setIsSubmitting(true);
    
    // シンプルなローディング演出
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user = {
      name: userName.trim(),
      registeredAt: new Date().toISOString(),
    };
    
    actions.setUser(user);
    setIsSubmitting(false);
  };

  return (
    <div className="user-registration">
      <div className="registration-container">
        <div className="registration-header">
          <div className="icon-wrapper">
            <User className="registration-icon" size={48} />
          </div>
          <h1 className="registration-title">読書カレンダーへようこそ</h1>
          <p className="registration-subtitle">
            あなたの読書ライフを記録し、<br />
            素敵な読書体験を始めましょう
          </p>
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label className="form-label" htmlFor="userName">
              お名前
            </label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="例: 山田太郎"
              className="form-input registration-input"
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary registration-button ${isSubmitting ? 'loading' : ''}`}
            disabled={!userName.trim() || isSubmitting}
          >
            {isSubmitting ? '登録中...' : '読書を始める'}
          </button>
        </form>

        <div className="registration-features">
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