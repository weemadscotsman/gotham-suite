-- GOTHAM Suite Intelligence Graph Database Schema

-- Core intelligence nodes (unified identifiers across all modules)
CREATE TABLE IF NOT EXISTS intelligence_nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN (
    'email', 'domain', 'ip', 'username', 'hash', 'phone', 
    'cve', 'document', 'vulnerability', 'credential', 'target'
  )),
  value TEXT UNIQUE NOT NULL,
  source_module TEXT NOT NULL CHECK(source_module IN (
    'NOX', 'PDF', 'DECEPTICON', 'PRIVACY', 'GOTHAM', 'MANUAL'
  )),
  first_seen TEXT DEFAULT (datetime('now')),
  last_updated TEXT DEFAULT (datetime('now')),
  metadata TEXT DEFAULT '{}'
);

-- Links between intelligence nodes
CREATE TABLE IF NOT EXISTS intelligence_links (
  id TEXT PRIMARY KEY,
  source_node TEXT NOT NULL REFERENCES intelligence_nodes(id) ON DELETE CASCADE,
  target_node TEXT NOT NULL REFERENCES intelligence_nodes(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK(link_type IN (
    'discovered_by', 'contains', 'related_to', 'exploit_of', 
    'shares_credential_with', 'located_at', 'belongs_to', 'derived_from'
  )),
  confidence REAL DEFAULT 1.0,
  source_module TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(source_node, target_node, link_type)
);

-- Cross-module event log for real-time feed system
CREATE TABLE IF NOT EXISTS cross_module_events (
  id TEXT PRIMARY KEY,
  source_module TEXT NOT NULL,
  event_type TEXT NOT NULL,
  target_node TEXT,
  linked_data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

-- NOX scan results
CREATE TABLE IF NOT EXISTS nox_scans (
  id TEXT PRIMARY KEY,
  scan_type TEXT NOT NULL,
  query TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed', 'aborted')),
  results TEXT DEFAULT '[]',
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- PDF documents and parsed content
CREATE TABLE IF NOT EXISTS pdf_documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  parsed_content TEXT,
  iocs TEXT DEFAULT '[]',
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Decepticon operations
CREATE TABLE IF NOT EXISTS decepticon_operations (
  id TEXT PRIMARY KEY,
  target TEXT NOT NULL,
  objective TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'aborted', 'failed')),
  agent_phases TEXT DEFAULT '[]',
  findings TEXT DEFAULT '[]',
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nodes_type ON intelligence_nodes(type);
CREATE INDEX IF NOT EXISTS idx_nodes_source ON intelligence_nodes(source_module);
CREATE INDEX IF NOT EXISTS idx_nodes_value ON intelligence_nodes(value);
CREATE INDEX IF NOT EXISTS idx_links_source ON intelligence_links(source_node);
CREATE INDEX IF NOT EXISTS idx_links_target ON intelligence_links(target_node);
CREATE INDEX IF NOT EXISTS idx_events_type ON cross_module_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_source ON cross_module_events(source_module);
