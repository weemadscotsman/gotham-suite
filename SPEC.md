# GOTHAM SUITE — Integrated Security Intelligence Platform

**Status:** PLANNING  
**Date:** 2026-04-14  
**Classification:** OPERATIONS-CRITICAL  
**Hoodie Factor:** 🔒🧥💀🔥

---

## 1. CONCEPT & VISION

GOTHAM Suite is a unified, tabbed intelligence platform that combines OSINT collection, document processing, autonomous penetration testing, privacy guidance, and 3D geospatial analysis into a single interconnected system. Rather than siloed tools, every module feeds data into a shared intelligence graph enabling cross-analysis that no single tool can provide.

**Tagline:** *"The complete picture. No blind spots."*

---

## 2. MODULES

### Module 1: NOX (OSINT/CTI Engine)
- **Source:** `../nox-framework-main`
- **Function:** Automated identity pivoting, breach scanning, password cracking, dorking, paste scraping
- **Entry Points:** Email, username, domain, phone, hash, IP

### Module 2: OpenDataLoader PDF (Document Processor)
- **Source:** `../opendataloader-pdf-main`
- **Function:** AI-ready PDF parsing, OCR, table/formula extraction, metadata
- **Output:** Markdown, JSON with bounding boxes, HTML, extracted IOCs

### Module 3: Decepticon (Red Team Agent)
- **Source:** `../Decepticon/Decepticon-main`
- **Function:** Autonomous penetration testing via coordinated agent phases
- **Phases:** Recon → Initial Access → Privilege Escalation → Lateral Movement → Exfiltration

### Module 4: Privacy Guide
- **Source:** https://anonymousplanet.org/guide/
- **Function:** Interactive privacy/anonymity knowledge base
- **Content:** Route planning, operational security, threat modeling

### Module 5: GOTHAM Globe (3D Intelligence Map)
- **Source:** `../GOTHAM_3077`
- **Function:** Geospatial visualization of intelligence data on 3D globe
- **Features:** Passive feeds, CVE tracking, camera integration

---

## 3. ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    GOTHAM SUITE SHELL                        │
│                  (Tabbed React Frontend)                     │
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│   NOX    │   PDF    │DECEPTCN  │ PRIVACY  │     GOTHAM       │
│   Tab    │   Tab    │   Tab    │   Tab    │     Globe Tab    │
└────┬─────┴────┬────┴────┬────┴────┬────┴────────┬─────────┘
     │          │         │        │             │
     └──────────┴─────────┴────────┴─────────────┘
                       │
              ┌────────▼────────┐
              │  INTELLIGENCE   │
              │  GRAPH ENGINE   │
              │  (Shared SQLite)│
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │   EXPRESS API    │
              │  (Port 3005)    │
              └─────────────────┘
```

---

## 4. CROSS-MODULE INTEGRATION (Intelligence Graph)

### Data Flow Rules

| Source | Discovery | Feeds Into | Action |
|--------|-----------|------------|--------|
| NOX | Email/Username | Decepticon | Auto-create target for password attacks |
| NOX | Domain | OpenDataLoader | Fetch & parse all accessible docs |
| NOX | IP Address | GOTHAM Globe | Plot as geographic marker |
| PDF | IOC (email/domain/hash) | NOX | Pivot scan discovered IOCs |
| PDF | Credential | Decepticon | Pre-fill brute force targets |
| Decepticon | Vulnerability | GOTHAM Globe | Plot CVE/exploit on map |
| Decepticon | Finding | NOX | Enrich with breach correlation |
| Privacy | Route config | All modules | Auto-config proxy/VPN for all ops |

### Shared Data Schema

**Table: intelligence_nodes**
```sql
CREATE TABLE intelligence_nodes (
  id TEXT PRIMARY KEY,
  type TEXT,           -- email|domain|ip|username|hash|phone|cve|document
  value TEXT UNIQUE,
  source_module TEXT,  -- NOX|PDF|DECEPTICON|PRIVACY|GOTHAM
  first_seen TEXT,
  last_updated TEXT,
  metadata TEXT         -- JSON blob
);
```

**Table: intelligence_links**
```sql
CREATE TABLE intelligence_links (
  id TEXT PRIMARY KEY,
  source_node TEXT REFERENCES intelligence_nodes(id),
  target_node TEXT REFERENCES intelligence_nodes(id),
  link_type TEXT,      -- discovered_by| contains| related_to| exploit_of
  confidence REAL,
  source_module TEXT,
  created_at TEXT
);
```

**Table: cross_module_events**
```sql
CREATE TABLE cross_module_events (
  id TEXT PRIMARY KEY,
  source_module TEXT,
  event_type TEXT,     -- new_target| finding| ioc_discovered| pivot_created
  target_node TEXT,
  linked_data TEXT,    -- JSON with full context
  created_at TEXT
);
```

---

## 5. API ENDPOINTS

### Core
- `GET /api/health` — Health check

### Intelligence Graph
- `GET /api/graph/nodes` — List all nodes (filter by type/source)
- `GET /api/graph/node/:id` — Get node + linked data
- `POST /api/graph/node` — Create node
- `GET /api/graph/links` — List links (filter by node)
- `GET /api/graph/path/:id1/:id2` — Find connection path between nodes

### Cross-Module Events
- `GET /api/events` — List events (filterable)
- `POST /api/events/publish` — Publish event to all modules

### Module-Specific
- `POST /api/nox/scan` — Trigger NOX scan
- `GET /api/nox/results/:id` — Get NOX results
- `POST /api/pdf/parse` — Parse PDF documents
- `POST /api/pdf/iocs` — Extract IOCs from PDFs
- `POST /api/decepticon/operation` — Start Decepticon operation
- `GET /api/decepticon/operation/:id` — Get operation status/results
- `POST /api/decepticon/stop/:id` — Stop operation
- `GET /api/gotham/visualize` — Get globe data for rendering

---

## 6. FRONTEND

### Shell
- React 19 + Vite
- Tab bar at top (icons + labels)
- Each tab lazy-loads its module
- Shared sidebar for Intelligence Graph (collapsible)
- WebSocket connection for real-time cross-module events

### Tab Modules (rendered as iframes or lazy-loaded React components)
1. **NOX Tab** — Dark theme, terminal aesthetic, scan forms
2. **PDF Tab** — File drop zone, parsed content viewer, IOC extractor
3. **Decepticon Tab** — Operation dashboard, target manager, findings feed
4. **Privacy Tab** — Wiki-style guide with search
5. **GOTHAM Globe Tab** — Full 3D CesiumJS globe with red team overlay

### Intelligence Graph Panel
- D3.js force-directed graph
- Nodes colored by type, sized by link count
- Click node → expand connections
- Filter by module, type, date range
- Real-time updates via WebSocket

---

## 7. TECH STACK

| Layer | Technology |
|-------|------------|
| Frontend Shell | React 19, Vite, TailwindCSS |
| Globe | CesiumJS |
| Graph Visualization | D3.js |
| Backend | Express.js, Node.js |
| Database | SQLite (better-sqlite3) |
| Real-time | WebSocket (ws) |
| Inter-process | child_process for Python modules |
| PDF Processing | OpenDataLoader (Java 11+ required) |
| Red Team | Decepticon (Docker required) |
| OSINT | NOX (Python dependencies) |

---

## 8. PROJECT STRUCTURE

```
GOTHAM_SUITE/
├── SPEC.md
├── README.md
├── package.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   │   ├── TabShell.jsx
│   │   ├── IntelligenceGraph.jsx
│   │   └── CrossModuleEvents.jsx
│   ├── modules/
│   │   ├── nox/          # NOX tab
│   │   ├── pdf/          # PDF tab
│   │   ├── decepticon/   # Decepticon tab
│   │   ├── privacy/      # Privacy guide tab
│   │   └── gotham/       # Globe tab
│   ├── services/
│   │   ├── api.js        # Express API client
│   │   ├── websocket.js   # WebSocket client
│   │   └── graphStore.js  # Shared state
│   └── styles/
│       └── globals.css
├── server/
│   ├── index.js          # Express + WebSocket server
│   ├── db/
│   │   └── schema.sql    # Database schema
│   ├── services/
│   │   ├── intelligenceGraph.js
│   │   ├── noxBridge.js
│   │   ├── pdfBridge.js
│   │   ├── decepticonBridge.js
│   │   └── eventBus.js
│   └── routes/
│       ├── graph.js
│       ├── nox.js
│       ├── pdf.js
│       ├── decepticon.js
│       └── gotham.js
├── integrations/          # Source code for integrated modules
│   ├── nox/
│   ├── opendataloader/
│   ├── decepticon/
│   ├── privacy-guide/
│   └── gotham/
└── data/
    └── gotham-suite.db
```

---

## 9. IMPLEMENTATION PHASES

### Phase 1: Foundation (This Session)
- [x] Create project structure
- [x] Write SPEC.md
- [ ] Set up Express + WebSocket server
- [ ] Initialize SQLite database with schema
- [ ] Build Intelligence Graph API
- [ ] Build React shell with tabs

### Phase 2: Module Integration
- [ ] Integrate NOX CLI bridge
- [ ] Integrate OpenDataLoader bridge  
- [ ] Integrate Decepticon bridge
- [ ] Integrate Privacy Guide content
- [ ] Integrate GOTHAM Globe

### Phase 3: Cross-Module Intelligence
- [ ] Implement event bus
- [ ] Build auto-feed rules (NOX→Decepticon, etc.)
- [ ] Build Intelligence Graph visualization
- [ ] Add real-time updates

### Phase 4: Polish
- [ ] Error handling + retry logic
- [ ] Module status indicators
- [ ] Operation replay/export
- [ ] Security hardening

---

## 10. STATUS

| Component | Status |
|-----------|--------|
| SPEC.md | ✅ Written |
| Project structure | 🔄 In Progress |
| Database schema | ⏳ Pending |
| Express API | ⏳ Pending |
| React shell | ⏳ Pending |
| NOX bridge | ⏳ Pending |
| PDF bridge | ⏳ Pending |
| Decepticon bridge | ⏳ Pending |
| Privacy Guide | ⏳ Pending |
| GOTHAM Globe | ⏳ Pending |
| Intelligence Graph | ⏳ Pending |
| Cross-module feeds | ⏳ Pending |
