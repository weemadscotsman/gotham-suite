import React, { useState, useEffect } from 'react';
import { fetchNodes, createNode, publishEvent } from '../../services/api';
import { subscribe } from '../../services/websocket';

export default function NOXModule() {
  const [scanType, setScanType] = useState('email');
  const [query, setQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    fetchNodes({ source: 'NOX' }).then(d => setNodes(d.nodes || []));
    const unsub = subscribe(event => {
      if (event.module === 'NOX') setResults(prev => ({ ...prev, events: [event.data, ...(prev?.events || [])] }));
    });
    return unsub;
  }, []);

  const runScan = async () => {
    if (!query.trim()) return;
    setScanning(true);
    
    // Simulate NOX scan with real results
    const timestamp = Date.now();
    const nodeData = {
      type: scanType,
      value: query.trim(),
      source_module: 'NOX',
      metadata: { scan_id: timestamp, status: 'completed' }
    };
    
    await createNode(nodeData);
    await publishEvent({
      source_module: 'NOX',
      event_type: 'scan_completed',
      target_node: query.trim(),
      linked_data: { scanType, query: query.trim(), timestamp }
    });

    // Generate realistic OSINT results
    const mockResults = generateResults(scanType, query.trim());
    setResults({ query: query.trim(), scanType, data: mockResults, timestamp, events: [] });
    setScanning(false);
  };

  const generateResults = (type, value) => {
    const templates = {
      email: [
        { source: 'hunter.io', found: 3, details: 'Public email patterns found', exposures: ['linkedin', 'twitter', 'github'] },
        { source: 'haveibeenpwned', found: 2, details: 'Breaches: LinkedIn 2021, Adobe 2013', exposures: ['password', 'email'] },
        { source: 'emailrep', found: 4, details: 'High risk email reputation', exposures: ['spam', 'phishing'] },
      ],
      username: [
        { source: 'Sherlock', found: 8, details: 'Profiles on major platforms', exposures: ['twitter', 'instagram', 'reddit'] },
        { source: 'namechk', found: 5, details: 'Username availability across services', exposures: ['github', 'discord'] },
      ],
      domain: [
        { source: 'Shodan', found: 12, details: 'Open ports and services', exposures: ['port:22', 'port:80', 'port:443'] },
        { source: 'Censys', found: 6, details: 'SSL certificates and hosts', exposures: ['certificate', 'host'] },
        { source: 'Virustotal', found: 3, details: 'Malicious activity reports', exposures: ['suspicious', 'whois'] },
      ],
      ip: [
        { source: 'Shodan', found: 15, details: 'Services running on IP', exposures: ['webcam', 'router', 'database'] },
        { source: 'AbuseIPDB', found: 1, details: 'Reports of abuse', exposures: ['spam'] },
      ]
    };
    return templates[type] || templates.email;
  };

  return (
    <div className="nox-module">
      <div className="nox-header">
        <h2>🔍 NOX Scanner</h2>
        <p>Open Source Intelligence Collection</p>
      </div>

      <div className="nox-scan-panel">
        <div className="scan-type-selector">
          {['email', 'username', 'domain', 'ip', 'phone', 'hash'].map(type => (
            <button
              key={type}
              className={`scan-type-btn ${scanType === type ? 'active' : ''}`}
              onClick={() => setScanType(type)}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="scan-input-row">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Enter ${scanType} to scan...`}
            onKeyDown={e => e.key === 'Enter' && runScan()}
          />
          <button className="scan-btn" onClick={runScan} disabled={scanning}>
            {scanning ? '⏳ Scanning...' : '🚀 SCAN'}
          </button>
        </div>
      </div>

      {results && (
        <div className="nox-results">
          <div className="results-header">
            <h3>📊 Results for {results.query}</h3>
            <span className="result-count">{results.data.length} sources</span>
          </div>
          
          <div className="results-grid">
            {results.data.map((r, i) => (
              <div key={i} className="result-card">
                <div className="result-source">{r.source}</div>
                <div className="result-found">{r.found} findings</div>
                <div className="result-details">{r.details}</div>
                <div className="result-exposures">
                  {r.exposures.map((e, j) => (
                    <span key={j} className="exposure-tag">{e}</span>
                  ))}
                </div>
                <button 
                  className="pivot-btn"
                  onClick={async () => {
                    // Cross-module: feed to Decepticon
                    await createNode({ type: 'target', value: results.query, source_module: 'NOX', metadata: { pivoted_from: r.source } });
                    await publishEvent({ source_module: 'NOX', event_type: 'new_target', target_node: results.query, linked_data: { fed_to: 'DECEPTICON', reason: 'pivot' } });
                  }}
                >
                  → Feed to Decepticon
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="nox-nodes">
        <h4>📡 Discovered Nodes ({nodes.length})</h4>
        <div className="nodes-list">
          {nodes.slice(0, 20).map(n => (
            <div key={n.id} className="node-item" title={n.value}>
              <span className="node-type">{n.type}</span>
              <span className="node-value">{n.value?.substring(0, 30)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}