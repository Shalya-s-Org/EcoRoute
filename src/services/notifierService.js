// Notification & Agent Activity Log Service

let logs = [];
let toasts = [];
let toastId = 0;
let listeners = new Set();

function notify() {
  listeners.forEach(fn => fn());
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function addLog(level, source, message) {
  const entry = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
  };
  logs.unshift(entry);
  if (logs.length > 500) logs.pop();
  notify();
  return entry;
}

export function getLogs() {
  return logs;
}

export function clearLogs() {
  logs = [];
  notify();
}

export function addToast(type, title, message, duration = 5000) {
  const id = ++toastId;
  const toast = { id, type, title, message };
  toasts.push(toast);
  notify();
  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }
  return id;
}

export function removeToast(id) {
  toasts = toasts.filter(t => t.id !== id);
  notify();
}

export function getToasts() {
  return toasts;
}

// Send Discord webhook (if configured)
export async function sendDiscordNotification(webhookUrl, message) {
  if (!webhookUrl) return { ok: false, error: 'No webhook URL configured' };
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `⚡ **EcoRoute Agent** — ${message}`,
        username: 'EcoRoute',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
