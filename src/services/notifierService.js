// Notification & Agent Activity Log Service

const initialHistoricalLogs = [
  {
    level: 'info',
    source: 'AgentCore',
    message: 'Initializing EcoRoute Multi-Agent Energy Optimizer...',
    timeOffset: 120 * 60 * 1000, // 2 hours ago
  },
  {
    level: 'info',
    source: 'ForecastAgent',
    message: 'Synced solar irradiance forecast. Cloud cover projection: 35%.',
    timeOffset: 118 * 60 * 1000,
  },
  {
    level: 'success',
    source: 'GridConnector',
    message: 'Ingested 48 intensity and dynamic pricing intervals from UK Grid API.',
    timeOffset: 117 * 60 * 1000,
  },
  {
    level: 'info',
    source: 'PrefAgent',
    message: 'User constraints loaded. EV Charger deadline set: 07:00 AM (Target: 80%).',
    timeOffset: 115 * 60 * 1000,
  },
  {
    level: 'success',
    source: 'Optimizer',
    message: 'Generated optimal schedule. Savings projection: $3.84, 940g CO₂ saved.',
    timeOffset: 114 * 60 * 1000,
  },
  {
    level: 'info',
    source: 'SafetyAgent',
    message: 'Verified MSD (Minimum State Duration) states. All active locks: 0.',
    timeOffset: 110 * 60 * 1000,
  },
  {
    level: 'info',
    source: 'ExecutionAgent',
    message: 'Dispatching command turn_on to switch.water_heater endpoint.',
    timeOffset: 90 * 60 * 1000, // 1.5 hours ago
  },
  {
    level: 'success',
    source: 'VerificationAgent',
    message: 'Polled switch.water_heater. Verified active draw: 4492W (State: ON).',
    timeOffset: 89 * 60 * 1000,
  },
  {
    level: 'info',
    source: 'TwinAgent',
    message: 'Simulated household thermodynamics. Room temp: 21.2°C (leakage: -0.12°C/hr).',
    timeOffset: 60 * 60 * 1000, // 1 hour ago
  },
  {
    level: 'info',
    source: 'TwinAgent',
    message: 'Simulated battery charging SoC. Projected 12:00 PM state: 75% SoC.',
    timeOffset: 59 * 60 * 1000,
  },
  {
    level: 'success',
    source: 'Optimizer',
    message: 'Re-resolved schedule intervals. Solar generation matching active.',
    timeOffset: 30 * 60 * 1000, // 30 mins ago
  },
  {
    level: 'info',
    source: 'SafetyAgent',
    message: 'Enforced 30-min MSD lock on switch.water_heater post-dispatch.',
    timeOffset: 29 * 60 * 1000,
  },
  {
    level: 'info',
    source: 'ForecastAgent',
    message: 'Synchronized live weather telemetry. Current temperature: 18.5°C.',
    timeOffset: 15 * 60 * 1000, // 15 mins ago
  },
];

let logs = initialHistoricalLogs.map((log, i) => ({
  id: Date.now() - log.timeOffset + i,
  timestamp: new Date(Date.now() - log.timeOffset).toISOString(),
  level: log.level,
  source: log.source,
  message: log.message,
}));

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
