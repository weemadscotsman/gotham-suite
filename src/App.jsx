import React, { useState, useEffect } from 'react';
import TabShell from './components/TabShell';
import IntelligenceGraph from './components/IntelligenceGraph';

const TABS = [
  { id: 'nox', label: 'NOX', icon: '🔍', color: '#00ff88' },
  { id: 'pdf', label: 'PDF', icon: '📄', color: '#ff6b6b' },
  { id: 'decepticon', label: 'DECEPTICON', icon: '💀', color: '#ff3366' },
  { id: 'privacy', label: 'PRIVACY', icon: '🔒', color: '#00ccff' },
  { id: 'gotham', label: 'GOTHAM', icon: '🌍', color: '#9933ff' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('nox');
  const [showGraph, setShowGraph] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:3005/ws');
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    return () => ws.close();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">🏙️</span>
          <span className="logo-text">GOTHAM SUITE</span>
        </div>
        <div className="header-controls">
          <button 
            className={`graph-toggle ${showGraph ? 'active' : ''}`}
            onClick={() => setShowGraph(!showGraph)}
          >
            🕸️ Intelligence Graph
          </button>
          <div className={`status-dot ${wsConnected ? 'connected' : 'disconnected'}`} title={wsConnected ? 'Connected' : 'Disconnected'} />
        </div>
      </header>

      <div className="app-body">
        {showGraph && (
          <aside className="graph-panel">
            <IntelligenceGraph />
          </aside>
        )}
        <main className="main-content">
          <TabShell tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        </main>
      </div>
    </div>
  );
}
