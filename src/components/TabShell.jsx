import React from 'react';

export default function TabShell({ tabs, activeTab, onTabChange }) {
  return (
    <div className="tab-shell">
      <nav className="tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            style={{ '--tab-color': tab.color }}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="tab-content">
        <div className="tab-placeholder">
          <div className="placeholder-icon">{tabs.find(t => t.id === activeTab)?.icon}</div>
          <h2>{tabs.find(t => t.id === activeTab)?.label} Module</h2>
          <p>Integration pending — {activeTab} module loading...</p>
        </div>
      </div>
    </div>
  );
}
