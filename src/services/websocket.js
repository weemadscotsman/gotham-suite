let ws = null;
let reconnectTimer = null;
const listeners = new Set();

export function connect() {
  if (ws && ws.readyState === WebSocket.OPEN) return ws;

  ws = new WebSocket('ws://localhost:3005/ws');

  ws.onopen = () => {
    console.log('WebSocket connected');
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      listeners.forEach(callback => callback(data));
    } catch (e) {
      console.error('Invalid WebSocket message:', e);
    }
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected, reconnecting...');
    reconnectTimer = setTimeout(connect, 3000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}

export function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function send(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

export function disconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) ws.close();
  ws = null;
}
