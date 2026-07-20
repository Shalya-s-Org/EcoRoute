import { useState, useEffect } from 'react';
import {
  Zap, Thermometer, Droplets, Sun, Power, Shield, Clock,
} from 'lucide-react';
import { getDevices, toggleDevice, canToggle, getMSDRemaining } from '../services/iotService';
import { addLog, addToast } from '../services/notifierService';

const iconMap = { Zap, Thermometer, Droplets, Sun };

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
      addToast('success', 'Device Toggled', `${deviceId} is now ${result.newState}`);
    } else {
      addLog('error', 'IoTConnector', `Toggle failed for ${deviceId}: ${result.error}`);
      addToast('error', 'Toggle Failed', result.error);
    }
    setDevices([...getDevices()]);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Devices</h2>
        <p>Manage IoT devices and safety guardrails</p>
      </div>

      <div className="devices-grid">
        {devices.map(device => {
          const Icon = iconMap[device.icon] || Zap;
          const msd = getMSDRemaining(device);
          const locked = !canToggle(device);

          return (
            <div className="card" key={device.id} id={`device-${device.id}`}>
              <div className="device-card-header">
                <div className="device-info">
                  <div className={`device-icon-wrapper metric-icon ${device.color}`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-base)' }}>{device.name}</div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{device.entityId}</div>
                  </div>
                </div>
                <button
                  className={`toggle ${device.state === 'on' ? 'on' : ''}`}
                  onClick={() => handleToggle(device.id)}
                  disabled={locked}
                  style={locked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  id={`toggle-${device.id}`}
                  aria-label={`Toggle ${device.name}`}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <span className={`badge ${device.state === 'on' ? 'green' : 'red'}`}>
                  <Power size={10} /> {device.state.toUpperCase()}
                </span>
                <span className={`badge ${device.status === 'online' ? 'green' : 'red'}`}>
                  {device.status}
                </span>
              </div>

              {locked && (
                <div className="msd-timer">
                  <Shield size={12} />
                  MSD Lock: {Math.ceil(msd)} min remaining
                </div>
              )}

              <div className="device-stats">
                <div className="device-stat">
                  <span className="device-stat-label">Power</span>
                  <span className="device-stat-value">
                    {device.powerDraw < 0 ? `+${Math.abs(device.powerDraw)}` : device.powerDraw}W
                  </span>
                </div>
                <div className="device-stat">
                  <span className="device-stat-label">Runtime</span>
                  <span className="device-stat-value">{device.requiredRuntime}h</span>
                </div>
                <div className="device-stat">
                  <span className="device-stat-label">Deadline</span>
                  <span className="device-stat-value">{device.deadline || '—'}</span>
                </div>
                <div className="device-stat">
                  <span className="device-stat-label">Last Toggle</span>
                  <span className="device-stat-value" style={{ fontSize: 'var(--font-xs)' }}>
                    {device.lastToggled
                      ? new Date(device.lastToggled).toLocaleTimeString()
                      : 'Never'}
                  </span>
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
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Device Safety Guardrail — Minimum State Duration (MSD)</div>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              Each device enforces a 30-minute minimum toggle interval to prevent physical relay damage from rapid cycling. 
              Toggle buttons are locked during MSD countdown.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
