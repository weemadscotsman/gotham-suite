import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import initSqlJs from 'sql.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3005;

let db;

async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Try to load existing database
  const dbPath = join(__dirname, 'db', 'gotham-suite.db');
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // Load and execute schema
  const schema = readFileSync(join(__dirname, 'db', 'schema.sql'), 'utf-8');
  db.run(schema);
  
  console.log('Database initialized');
}

app.use(cors());
app.use(express.json());

// Save database periodically
setInterval(() => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    const dbPath = join(__dirname, 'db', 'gotham-suite.db');
    require('fs').writeFileSync(dbPath, buffer);
  }
}, 30000);

// ============================================
// EVENT BUS (WebSocket)
// ============================================
const clients = new Set();

function broadcast(event) {
  const message = JSON.stringify(event);
  clients.forEach(client => {
    if (client.readyState === 1) client.send(message);
  });
}

// ============================================
// INTELLIGENCE GRAPH API
// ============================================

// List all nodes
app.get('/api/graph/nodes', (req, res) => {
  const { type, source, search } = req.query;
  let query = 'SELECT * FROM intelligence_nodes WHERE 1=1';
  const params = [];
  let conditionCount = 0;
  
  if (type) { query += ` AND type = ?`; params.push(type); }
  if (source) { query += ` AND source_module = ?`; params.push(source); }
  if (search) { query += ` AND value LIKE ?`; params.push(`%${search}%`); }
  
  query += ' ORDER BY last_updated DESC LIMIT 500';
  
  const results = db.exec(query, params);
  const nodes = results.length > 0 ? results[0].values.map(row => ({
    id: row[0], type: row[1], value: row[2], source_module: row[3],
    first_seen: row[4], last_updated: row[5], metadata: row[6]
  })) : [];
  
  res.json({ nodes });
});

// Get single node with links
app.get('/api/graph/node/:id', (req, res) => {
  const result = db.exec('SELECT * FROM intelligence_nodes WHERE id = ?', [req.params.id]);
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Node not found' });
  }
  const row = result[0].values[0];
  const node = { id: row[0], type: row[1], value: row[2], source_module: row[3], first_seen: row[4], last_updated: row[5], metadata: row[6] };
  
  const linksResult = db.exec(`
    SELECT l.id, l.source_node, l.target_node, l.link_type, l.confidence, l.source_module, l.created_at,
           n1.value as source_value, n1.type as source_type, n2.value as target_value, n2.type as target_type
    FROM intelligence_links l
    JOIN intelligence_nodes n1 ON l.source_node = n1.id
    JOIN intelligence_nodes n2 ON l.target_node = n2.id
    WHERE l.source_node = ? OR l.target_node = ?
  `, [req.params.id, req.params.id]);
  
  const links = linksResult.length > 0 ? linksResult[0].values.map(row => ({
    id: row[0], source_node: row[1], target_node: row[2], link_type: row[3],
    confidence: row[4], source_module: row[5], created_at: row[6],
    source_value: row[7], source_type: row[8], target_value: row[9], target_type: row[10]
  })) : [];
  
  res.json({ node, links });
});

// Create node
app.post('/api/graph/node', (req, res) => {
  const { type, value, source_module, metadata } = req.body;
  if (!type || !value || !source_module) {
    return res.status(400).json({ error: 'type, value, source_module required' });
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  const metadataJson = JSON.stringify(metadata || {});
  
  try {
    db.run(`INSERT INTO intelligence_nodes (id, type, value, source_module, first_seen, last_updated, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, type, value, source_module, now, now, metadataJson]);
    
    broadcast({ type: 'module_event', module: source_module, data: { event_type: 'node_created', target_node: id, linked_data: { type, value } } });
    
    res.json({ id, type, value, source_module });
  } catch (e) {
    // Check if unique constraint violation (node exists)
    const existing = db.exec('SELECT * FROM intelligence_nodes WHERE value = ?', [value]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      const row = existing[0].values[0];
      res.json({ id: row[0], type: row[1], value: row[2], source_module: row[3] });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

// List links
app.get('/api/graph/links', (req, res) => {
  const result = db.exec(`
    SELECT l.id, l.source_node, l.target_node, l.link_type, l.confidence, l.source_module, l.created_at,
           n1.value as source_value, n1.type as source_type, n2.value as target_value, n2.type as target_type
    FROM intelligence_links l
    JOIN intelligence_nodes n1 ON l.source_node = n1.id
    JOIN intelligence_nodes n2 ON l.target_node = n2.id
    LIMIT 500
  `);
  
  const links = result.length > 0 ? result[0].values.map(row => ({
    id: row[0], source_node: row[1], target_node: row[2], link_type: row[3],
    confidence: row[4], source_module: row[5], created_at: row[6],
    source_value: row[7], source_type: row[8], target_value: row[9], target_type: row[10]
  })) : [];
  
  res.json({ links });
});

// Create link
app.post('/api/graph/link', (req, res) => {
  const { source_node, target_node, link_type, source_module, confidence } = req.body;
  if (!source_node || !target_node || !link_type || !source_module) {
    return res.status(400).json({ error: 'source_node, target_node, link_type, source_module required' });
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  try {
    db.run(`INSERT INTO intelligence_links (id, source_node, target_node, link_type, source_module, confidence, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, source_node, target_node, link_type, source_module, confidence || 1.0, now]);
    res.json({ id, source_node, target_node, link_type });
  } catch (e) {
    res.json({ error: 'Link may already exist' });
  }
});

// Find path between two nodes
app.get('/api/graph/path/:id1/:id2', (req, res) => {
  const { id1, id2 } = req.params;
  if (id1 === id2) return res.json({ path: [id1] });
  
  // BFS
  const visited = new Set();
  const queue = [[id1]];
  visited.add(id1);
  
  const linksResult = db.exec('SELECT source_node, target_node FROM intelligence_links');
  const adj = {};
  if (linksResult.length > 0) {
    for (const row of linksResult[0].values) {
      if (!adj[row[0]]) adj[row[0]] = [];
      if (!adj[row[1]]) adj[row[1]] = [];
      adj[row[0]].push(row[1]);
      adj[row[1]].push(row[0]);
    }
  }
  
  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];
    const neighbors = adj[current] || [];
    
    for (const neighbor of neighbors) {
      if (neighbor === id2) {
        return res.json({ path: [...path, id2] });
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  
  res.json({ path: null, message: 'No path found' });
});

// ============================================
// CROSS-MODULE EVENTS
// ============================================
app.get('/api/events', (req, res) => {
  const { module, type, limit } = req.query;
  let query = 'SELECT * FROM cross_module_events WHERE 1=1';
  const params = [];
  
  if (module) { query += ' AND source_module = ?'; params.push(module); }
  if (type) { query += ' AND event_type = ?'; params.push(type); }
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit) || 100);
  
  const result = db.exec(query, params);
  const events = result.length > 0 ? result[0].values.map(row => ({
    id: row[0], source_module: row[1], event_type: row[2], target_node: row[3], linked_data: row[4], created_at: row[5]
  })) : [];
  
  res.json({ events });
});

app.post('/api/events/publish', (req, res) => {
  const { source_module, event_type, target_node, linked_data } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.run(`INSERT INTO cross_module_events (id, source_module, event_type, target_node, linked_data, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`, [id, source_module, event_type, target_node, JSON.stringify(linked_data || {}), now]);
  
  broadcast({ type: 'module_event', module: source_module, data: { id, event_type, target_node, linked_data, created_at: now } });
  res.json({ success: true, id });
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), modules: ['NOX', 'PDF', 'DECEPTICON', 'PRIVACY', 'GOTHAM'] });
});

// ============================================
// HTTP SERVER + WEBSOCKET
// ============================================
const server = app.listen(PORT, async () => {
  await initDatabase();
  console.log(`GOTHAM Suite API running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'subscribe' && msg.module) {
        console.log(`Client subscribed to ${msg.module} events`);
      }
    } catch (e) {
      console.error('Invalid message:', e);
    }
  });
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  if (db) {
    const data = db.export();
    require('fs').writeFileSync(join(__dirname, 'db', 'gotham-suite.db'), Buffer.from(data));
    db.close();
  }
  server.close(() => process.exit(0));
});