import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Zap, Leaf, DollarSign, Activity, Cloud, Thermometer, RefreshCw, Sun, Battery, Home, ShieldAlert
} from 'lucide-react';
import { getCurrentIntensity } from '../services/gridService';
import { getDevices } from '../services/iotService';
import { getLogs } from '../services/notifierService';

function fmt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard({
  carbonData, tariffData, weatherData, schedules, savings,
  gridSource, agentStatus, tickCount, settings, runAgentTick, telemetry
}) {
  const current = getCurrentIntensity(carbonData);
  const devices = getDevices();
  const activeDevices = devices.filter(d => d.state === 'on').length;
  const recentLogs = getLogs().slice(0, 5);

  const currentTel = useMemo(() => {
    if (telemetry && telemetry.length > 0) return telemetry[0];
    return {
      solarGen: 1800,
      applianceLoad: 3500,
      batterySoC: 45,
      batteryPower: 1200, // positive = charging
      gridPower: 2900,
      indoorTemp: 21.5,
      outdoorTemp: 14,
    };
  }, [telemetry]);

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

  // Determine power flow directions
  const isSolarGenerating = currentTel.solarGen > 0;
  const isBatteryCharging = currentTel.batteryPower > 0;
  const isBatteryDischarging = currentTel.batteryPower < 0;
  const isGridImporting = currentTel.gridPower > 0;
  const isGridExporting = currentTel.gridPower < 0;

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Dashboard</h2>
          <p>Real-time Smart Grid agent optimization overview</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {settings.emergencyMode && (
            <span className="badge red" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldAlert size={14} /> Emergency Grid Mode
            </span>
          )}
          <button className="btn btn-secondary" onClick={runAgentTick} id="btn-refresh">
            <RefreshCw size={16} className={agentStatus === 'running' ? 'spin' : ''} />
            Tick #{tickCount}
          </button>
        </div>
      </div>

      {/* Real-time power flow diagram */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', overflow: 'hidden' }} id="realtime-flow">
        <div className="card-header">
          <span className="card-title">Real-Time Power Flow Telemetry</span>
          <span className="badge green">● Live Twin Loop</span>
        </div>
        
        <div className="power-flow-container">
          <svg className="power-flow-svg" viewBox="0 0 500 300">
            {/* SVG Connecting Paths */}
            
            {/* Solar -> Home */}
            <path
              d="M 100 80 L 250 150"
              className={`flow-line ${isSolarGenerating ? 'active' : ''}`}
              style={{ strokeDashoffset: isSolarGenerating ? undefined : 0 }}
            />
            {/* Solar -> Battery */}
            <path
              d="M 100 80 L 100 220"
              className={`flow-line ${isSolarGenerating && isBatteryCharging ? 'active' : ''}`}
            />
            {/* Battery -> Home */}
            <path
              d="M 100 220 L 250 150"
              className={`flow-line ${isBatteryDischarging ? 'active' : ''}`}
            />
            {/* Grid -> Home / Home -> Grid */}
            <path
              d="M 400 80 L 250 150"
              className={`flow-line ${isGridImporting ? 'active' : isGridExporting ? 'active reverse' : ''}`}
            />

            {/* Nodes */}
            
            {/* Solar Node */}
            <g transform="translate(100, 80)">
              <circle r="40" className="node-circle solar" />
              <foreignObject x="-30" y="-30" width="60" height="60">
                <div className="node-content">
                  <Sun size={20} className="node-icon solar-icon animate-pulse" />
                  <span className="node-val">{currentTel.solarGen}W</span>
                  <span className="node-lbl">Solar</span>
                </div>
              </foreignObject>
            </g>

            {/* Battery Node */}
            <g transform="translate(100, 220)">
              <circle r="40" className="node-circle battery" />
              <foreignObject x="-30" y="-30" width="60" height="60">
                <div className="node-content">
                  <Battery size={20} className="node-icon battery-icon" />
                  <span className="node-val">{currentTel.batterySoC}%</span>
                  <span className="node-lbl" style={{ fontSize: '9px' }}>
                    {isBatteryCharging ? `+${currentTel.batteryPower}W` : isBatteryDischarging ? `${currentTel.batteryPower}W` : 'Idle'}
                  </span>
                </div>
              </foreignObject>
            </g>

            {/* Home Loads Node */}
            <g transform="translate(250, 150)">
              <circle r="45" className="node-circle home-loads" />
              <foreignObject x="-35" y="-35" width="70" height="70">
                <div className="node-content">
                  <Home size={22} className="node-icon home-icon" />
                  <span className="node-val">{currentTel.applianceLoad}W</span>
                  <span className="node-lbl">House Load</span>
                </div>
              </foreignObject>
            </g>

            {/* Grid Node */}
            <g transform="translate(400, 80)">
              <circle r="40" className="node-circle grid-node" />
              <foreignObject x="-30" y="-30" width="60" height="60">
                <div className="node-content">
                  <Zap size={20} className="node-icon grid-icon" />
                  <span className="node-val">
                    {isGridExporting ? `${Math.abs(currentTel.gridPower)}W` : `${currentTel.gridPower}W`}
                  </span>
                  <span className="node-lbl">{isGridExporting ? 'Exporting' : 'Importing'}</span>
                </div>
              </foreignObject>
            </g>
          </svg>
        </div>
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
              <span className="card-title">Weather Status</span>
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
              <span className="card-title">Next Scheduled Runs</span>
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
              <span className="card-title">Agent Team Feed</span>
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
