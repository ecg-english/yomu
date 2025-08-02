import React from 'react';
import { Home, Calendar, Timer, BookOpen } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import './TabNavigation.css';

const tabs = [
  { id: 'dashboard', label: 'ダッシュボード', icon: Home },
  { id: 'calendar', label: '読書カレンダー', icon: Calendar },
  { id: 'timer', label: '読書タイマー', icon: Timer },
  { id: 'wishlist', label: '気になる本', icon: BookOpen },
];

export default function TabNavigation() {
  const { state, actions } = useApp();

  return (
    <nav className="tab-navigation">
      <div className="tab-container">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = state.currentTab === tab.id;
          
          return (
            <button
              key={tab.id}
              className={`tab-button ${isActive ? 'active' : ''}`}
              onClick={() => actions.setCurrentTab(tab.id)}
            >
              <Icon className="tab-icon" size={20} />
              <span className="tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
} 