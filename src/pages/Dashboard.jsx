import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Zap, Leaf, DollarSign, Activity, Cloud, Thermometer, RefreshCw,
} from 'lucide-react';
import { getCurrentIntensity } from '../services/gridService';
import { getDevices } from '../services/iotService';
import { getLogs } from '../services/notifierService';

function fmt(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard({
  carbonData, tariffData, weatherData, schedules, savings,
  gridSource, agentStatus, tickCount, runAgentTick,
}) {
  const current = getCurrentIntensity(carbonData);
  const devices = getDevices();
  const activeDevices = devices.filter(d => d.state === 'on').length;
  const recentLogs = getLogs().slice(0, 6);

  const chartData = useMemo(() =>
    carbonData.map((d, i) => ({
      time: fmt(d.from),
      carbon: d.intensity.forecast,
      price: tariffData[i]?.price ? Math.round(tariffData[i].price * 100) : 15,
    })),
    [carbonData, tariffData]
  );

  const nextActions = useMemo(() => {
    const actions = [];
    for (const [deviceId, schedule] of Object.entries(schedules)) {
      if (schedule.slots?.length) {
        const device = devices.find(d => d.id === deviceId);
        const slot = carbonData[schedule.slots[0]];
        if (device && slot) {
          actions.push({
            device: device.name,
            time: fmt(slot.from),
            color: device.color,
          });
        }
      }
    }
    return actions.slice(0, 4);
  }, [schedules, devices, carbonData]);

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Dashboard</h2>
          <p>Real-time energy optimization overview</p>
        </div>
        <button className="btn btn-secondary" onClick={runAgentTick} id="btn-refresh">
          <RefreshCw size={16} className={agentStatus === 'running' ? 'spin' : ''} />
          Tick #{tickCount}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="card metric-card" id="metric-carbon">
          <div className="metric-icon green"><Leaf size={20} /></div>
          <div className="metric-value" style={{ color: 'var(--accent)' }}>
            {current?.intensity?.forecast ?? '—'}
          </div>
          <div className="metric-label">gCO₂/kWh — {current?.intensity?.index || 'loading'}</div>
          <span className={`badge ${gridSource === 'live' ? 'green' : 'amber'}`}>
            {gridSource === 'live' ? '● Live' : `● ${gridSource}`}
          </span>
        </div>

        <div className="card metric-card" id="metric-savings">
          <div className="metric-icon amber"><DollarSign size={20} /></div>
          <div className="metric-value" style={{ color: 'var(--amber-400)' }}>
            ${savings.costSaved.toFixed(2)}
          </div>
          <div className="metric-label">Estimated cost savings today</div>
          <span className="metric-trend up">↑ optimized</span>
        </div>

        <div className="card metric-card" id="metric-carbon-saved">
          <div className="metric-icon cyan"><Zap size={20} /></div>
          <div className="metric-value" style={{ color: 'var(--cyan-400)' }}>
            {savings.carbonSaved}g
          </div>
          <div className="metric-label">CO₂ avoided today</div>
        </div>

        <div className="card metric-card" id="metric-devices">
          <div className="metric-icon purple"><Activity size={20} /></div>
          <div className="metric-value" style={{ color: 'var(--purple-400)' }}>
            {activeDevices}/{devices.length}
          </div>
          <div className="metric-label">Active devices</div>
        </div>
      </div>

      {/* Charts + Sidebar */}
      <div className="content-grid">
        {/* Carbon Intensity Chart */}
        <div className="card" id="chart-carbon">
          <div className="card-header">
            <span className="card-title">24h Carbon Intensity Forecast</span>
            <span className="badge blue">48 intervals</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="carbonGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tickLine={false} interval={5} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Area type="monotone" dataKey="carbon" stroke="#10b981" fill="url(#carbonGradient)" strokeWidth={2} name="Carbon (gCO₂)" />
                <Area type="monotone" dataKey="price" stroke="#fbbf24" fill="url(#priceGradient)" strokeWidth={2} name="Price (¢/kWh)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Weather */}
          <div className="card" id="card-weather">
            <div className="card-header">
              <span className="card-title">Weather</span>
              <Cloud size={16} color="var(--text-tertiary)" />
            </div>
            {weatherData[0] && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <Thermometer size={28} color="var(--blue-400)" />
                <div>
                  <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>{weatherData[0].temp}°C</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                    {weatherData[0].description} · {weatherData[0].humidity}% humidity
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next Actions */}
          <div className="card" id="card-next-actions">
            <div className="card-header">
              <span className="card-title">Next Scheduled</span>
            </div>
            {nextActions.length ? nextActions.map((a, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--space-2) 0',
                borderBottom: i < nextActions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <span className={`badge ${a.color}`}>{a.device}</span>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{a.time}</span>
              </div>
            )) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>No actions scheduled</p>
            )}
          </div>

          {/* Agent Feed */}
          <div className="card" id="card-agent-feed">
            <div className="card-header">
              <span className="card-title">Agent Activity</span>
              <span className={`badge ${agentStatus === 'idle' ? 'green' : 'amber'}`}>{agentStatus}</span>
            </div>
            <div style={{ maxHeight: 180, overflow: 'auto' }}>
              {recentLogs.map(log => (
                <div key={log.id} className={`log-entry ${log.level}`} style={{ padding: 'var(--space-2) 0', borderLeft: 'none' }}>
                  <span className="log-timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={`log-level ${log.level}`}>{log.level.toUpperCase()}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
