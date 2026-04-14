const API_BASE = 'http://localhost:3005';

export async function fetchNodes(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/graph/nodes${query ? '?' + query : ''}`);
  return res.json();
}

export async function fetchNode(id) {
  const res = await fetch(`${API_BASE}/api/graph/node/${id}`);
  return res.json();
}

export async function createNode(data) {
  const res = await fetch(`${API_BASE}/api/graph/node`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchLinks(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/graph/links${query ? '?' + query : ''}`);
  return res.json();
}

export async function createLink(data) {
  const res = await fetch(`${API_BASE}/api/graph/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchEvents(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/events${query ? '?' + query : ''}`);
  return res.json();
}

export async function publishEvent(data) {
  const res = await fetch(`${API_BASE}/api/events/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function healthCheck() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}
