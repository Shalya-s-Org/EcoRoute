import { useState, useEffect } from 'react';
import {
  Zap, Thermometer, Droplets, Sun, Power, Shield, Clock, RefreshCw, GlassWater, Waves, Plug, Battery, AlertCircle, HeartPulse
} from 'lucide-react';
import { getDevices, toggleDevice, canToggle, getMSDRemaining, updateDeviceProperty } from '../services/iotService';
import { addLog, addToast } from '../services/notifierService';
import { simulateAgentActivity } from '../services/agentEngine';

const iconMap = { 
  Zap, Thermometer, Droplets, Sun, RefreshCw, GlassWater, Waves, Plug, Battery 
};

export default function Devices() {
  const [devices, setDevices] = useState(getDevices());
  const [, setTick] = useState(0);

  // Refresh MSD timers every second
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const handleToggle = (deviceId) => {
    const result = toggleDevice(deviceId);
    if (result.ok) {
      addLog('success', 'IoTConnector', `Toggled ${deviceId} → ${result.newState}`);
      addToast('success', 'Device Toggled', `${getDeviceName(deviceId)} is now ${result.newState.toUpperCase()}`);
      simulateAgentActivity('device_toggle', { id: deviceId, entityId: getDeviceEntity(deviceId), name: getDeviceName(deviceId) });
    } else {
      addLog('error', 'IoTConnector', `Toggle failed for ${deviceId}: ${result.error}`);
      addToast('error', 'Toggle Failed', result.error);
    }
    setDevices([...getDevices()]);
  };

  const getDeviceName = (id) => devices.find(d => d.id === id)?.name || id;
  const getDeviceEntity = (id) => devices.find(d => d.id === id)?.entityId || '';

  const handlePropertyChange = (id, prop, val) => {
    updateDeviceProperty(id, prop, val);
    setDevices([...getDevices()]);
    addLog('info', 'PreferenceAgent', `User updated ${prop} for ${getDeviceName(id)} to: ${val}`);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>IoT Devices</h2>
        <p>Manage physical smart appliances, targets, and safety guardrails</p>
      </div>

      <div className="devices-grid">
        {devices.map(device => {
          const Icon = iconMap[device.icon] || Zap;
          const msd = getMSDRemaining(device);
          const locked = !canToggle(device);

          return (
            <div className="card" key={device.id} id={`device-${device.id}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="device-card-header" style={{ marginBottom: 'var(--space-3)' }}>
                  <div className="device-info">
                    <div className={`device-icon-wrapper metric-icon ${device.color}`}>
                      <Icon size={22} className={device.state === 'on' || device.state === 'charging' || device.state === 'discharging' ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--font-base)' }}>{device.name}</div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{device.entityId}</div>
                    </div>
                  </div>
                  
                  {device.type !== 'solar' && (
                    <button
                      className={`toggle ${device.state === 'on' || device.state === 'charging' || device.state === 'discharging' ? 'on' : ''}`}
                      onClick={() => handleToggle(device.id)}
                      disabled={locked}
                      style={locked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      id={`toggle-${device.id}`}
                      aria-label={`Toggle ${device.name}`}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <span className={`badge ${device.state === 'on' || device.state === 'charging' || device.state === 'discharging' ? 'green' : 'red'}`}>
                    <Power size={10} /> {device.state.toUpperCase()}
                  </span>
                  <span className={`badge ${device.status === 'online' ? 'green' : 'red'}`}>
                    ● {device.status}
                  </span>
                  <span className={`badge ${device.health === 'Good' ? 'blue' : 'amber'}`} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <HeartPulse size={10} /> {device.health}
                  </span>
                </div>

                {/* Device settings and sliders */}
                <div className="device-settings-panel" style={{ background: 'var(--bg-secondary)', padding: 'var(--space-3)', borderRadius: 8, marginBottom: 'var(--space-4)', border: '1px solid var(--border-subtle)' }}>
                  {device.type === 'ev' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Target Charge:</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{device.chargeTarget}% SoC</span>
                      </div>
                      <input
                        type="range" min="50" max="100" step="5"
                        value={device.chargeTarget}
                        onChange={e => handlePropertyChange(device.id, 'chargeTarget', Number(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}

                  {device.type === 'hvac' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Target Temp:</span>
                        <span style={{ fontWeight: 700, color: 'var(--blue-400)' }}>{device.targetTemp}°C</span>
                      </div>
                      <input
                        type="range" min="18" max="25" step="0.5"
                        value={device.targetTemp}
                        onChange={e => handlePropertyChange(device.id, 'targetTemp', Number(e.target.value))}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                        <span>Current: {device.currentTemp}°C</span>
                        <span>Range: 18 - 24°C</span>
                      </div>
                    </div>
                  )}

                  {device.type === 'battery' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Capacity SoC:</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{device.soc}%</span>
                      </div>
                      <input
                        type="range" min="10" max="100" step="5"
                        value={device.soc}
                        onChange={e => handlePropertyChange(device.id, 'soc', Number(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}

                  {device.type !== 'solar' && device.type !== 'battery' && device.type !== 'hvac' && device.type !== 'ev' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Priority:</span>
                        <select 
                          value={device.priority} 
                          onChange={e => handlePropertyChange(device.id, 'priority', e.target.value)}
                          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '11px', borderRadius: 4, padding: '2px 4px' }}
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {device.type === 'solar' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Solar Output Cap:</span>
                        <span style={{ fontWeight: 700, color: 'var(--amber-400)' }}>{device.generation}W</span>
                      </div>
                      <input
                        type="range" min="500" max="4500" step="100"
                        value={device.generation}
                        onChange={e => handlePropertyChange(device.id, 'generation', Number(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                {locked && device.type !== 'battery' && device.type !== 'solar' && (
                  <div className="msd-timer" style={{ marginBottom: 'var(--space-3)' }}>
                    <Shield size={12} />
                    MSD Lock: {Math.ceil(msd)} min remaining
                  </div>
                )}

                <div className="device-stats" style={{ paddingTop: 'var(--space-2)', borderTop: '1px solid rgba(148,163,184,0.06)' }}>
                  <div className="device-stat">
                    <span className="device-stat-label">Power Load</span>
                    <span className="device-stat-value">
                      {device.type === 'solar' ? `-${device.generation}W` : `${device.powerDraw}W`}
                    </span>
                  </div>
                  <div className="device-stat">
                    <span className="device-stat-label">Priority</span>
                    <span className="device-stat-value" style={{ textTransform: 'capitalize' }}>
                      {device.priority || 'N/A'}
                    </span>
                  </div>
                  <div className="device-stat">
                    <span className="device-stat-label">Status</span>
                    <span className="device-stat-value" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AlertCircle size={10} color={device.health === 'Good' ? 'var(--accent)' : 'var(--amber-400)'} />
                      {device.health === 'Good' ? 'Normal' : 'Warning'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Info */}
      <div className="card" style={{ marginTop: 'var(--space-6)', borderColor: 'rgba(251,191,36,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Shield size={20} color="var(--amber-400)" />
          <div>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Hardware Protection Guardrails — Safety Agent active</div>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              To protect household switches from inductive load spikes and thermal wear, the Safety Agent strictly locks relay cycling. Toggles require a 30-minute cooling delay. Solar inverters and battery storage modules operate via cloud telemetry and bypass the physical relay lock.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
