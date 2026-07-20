import { useMemo, useState } from 'react';
import { getDevices, updateDeviceConstraint } from '../services/iotService';
import { CalendarClock, Clock, Target, RefreshCw } from 'lucide-react';

function fmt(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getSlotClass(intensity) {
  if (!intensity) return 'off';
  if (intensity < 80) return 'very-low';
  if (intensity < 150) return 'low';
  if (intensity < 220) return 'moderate';
  if (intensity < 300) return 'high';
  return 'very-high';
}

export default function Schedule({ carbonData, schedules, runAgentTick }) {
  const devices = getDevices();
  const [editDevice, setEditDevice] = useState(null);
  const [editRuntime, setEditRuntime] = useState(4);
  const [editDeadline, setEditDeadline] = useState('07:00');

  // Build 48-slot timeline for each device
  const timelines = useMemo(() => {
    return devices.filter(d => d.requiredRuntime > 0).map(device => {
      const schedule = schedules[device.id];
      const activeSlots = new Set(schedule?.slots || []);
      const slots = carbonData.map((d, i) => ({
        index: i,
        active: activeSlots.has(i),
        intensity: d.intensity.forecast,
        time: fmt(d.from),
      }));
      return { device, slots, schedule };
    });
  }, [devices, schedules, carbonData]);

  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

  const handleSaveConstraint = () => {
    if (editDevice) {
      updateDeviceConstraint(editDevice, editRuntime, editDeadline);
      setEditDevice(null);
      runAgentTick();
    }
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Schedule</h2>
          <p>24-hour optimization timeline with device run windows</p>
        </div>
        <button className="btn btn-primary" onClick={runAgentTick} id="btn-reoptimize">
          <RefreshCw size={16} /> Re-optimize
        </button>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <span className="card-title">Carbon Intensity Legend</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {[
            { label: 'Very Low (<80g)', cls: 'very-low' },
            { label: 'Low (<150g)', cls: 'low' },
            { label: 'Moderate (<220g)', cls: 'moderate' },
            { label: 'High (<300g)', cls: 'high' },
            { label: 'Very High (300g+)', cls: 'very-high' },
          ].map(l => (
            <div key={l.cls} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{
                width: 16, height: 16, borderRadius: 4,
              }} className={`timeline-slot ${l.cls}`} />
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>{l.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div style={{
              width: 16, height: 16, borderRadius: 4,
              border: '2px solid var(--accent)', background: 'var(--accent-dim)',
            }} />
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Scheduled ON</span>
          </div>
        </div>
      </div>

      {/* Timelines */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Device Schedules</span>
          <span className="badge green">{carbonData.length} slots</span>
        </div>

        <div className="timeline-container">
          {timelines.map(({ device, slots, schedule }) => (
            <div key={device.id}>
              <div className="timeline-row">
                <div className="timeline-label">
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{device.name}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    {schedule?.slots?.length || 0} slots · {device.deadline ? `by ${device.deadline}` : '—'}
                  </div>
                </div>
                <div className="timeline-bar">
                  {slots.map((s, i) => (
                    <div
                      key={i}
                      className={`timeline-slot ${s.active ? getSlotClass(s.intensity) : 'off'}`}
                      style={{
                        flex: 1,
                        border: s.active ? '1px solid var(--accent)' : 'none',
                        boxShadow: s.active ? 'inset 0 0 8px var(--accent-glow)' : 'none',
                      }}
                      title={`${s.time} — ${s.intensity}g CO₂/kWh ${s.active ? '(SCHEDULED)' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Hour labels */}
          <div className="timeline-hours">
            {hours.map(h => (
              <span key={h} className="timeline-hour" style={{ flex: 2 }}>{h}</span>
            ))}
          </div>
        </div>

        {/* Savings Summary */}
        {Object.entries(schedules).map(([id, s]) => {
          const device = devices.find(d => d.id === id);
          if (!device || !s.slots?.length) return null;
          return (
            <div key={id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
              marginTop: 'var(--space-3)',
            }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{device.name}</span>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <span className="badge green">Saved ${s.savings}</span>
                <span className="badge cyan">-{s.carbonSaved}g CO₂</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Constraint Editor */}
      <div className="card" style={{ marginTop: 'var(--space-6)' }}>
        <div className="card-header">
          <span className="card-title"><Target size={14} style={{ marginRight: 6 }} />Deadline Constraints</span>
        </div>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          Set charging targets (e.g., "Charge EV to 100% by 7 AM"). The optimizer will find the cheapest slots that meet your deadline.
        </p>
        {devices.filter(d => d.requiredRuntime > 0).map(device => (
          <div key={device.id} className="constraint-row">
            <span style={{ fontWeight: 600, width: 120, flexShrink: 0 }}>{device.name}</span>
            <Clock size={14} color="var(--text-muted)" />
            <input
              type="number"
              min="1" max="12" step="0.5"
              defaultValue={device.requiredRuntime}
              style={{ width: 60 }}
              onChange={e => {
                if (editDevice === device.id) setEditRuntime(Number(e.target.value));
                else { setEditDevice(device.id); setEditRuntime(Number(e.target.value)); setEditDeadline(device.deadline); }
              }}
              id={`constraint-runtime-${device.id}`}
            />
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>hours by</span>
            <input
              type="time"
              defaultValue={device.deadline}
              onChange={e => {
                if (editDevice === device.id) setEditDeadline(e.target.value);
                else { setEditDevice(device.id); setEditDeadline(e.target.value); setEditRuntime(device.requiredRuntime); }
              }}
              id={`constraint-deadline-${device.id}`}
            />
            {editDevice === device.id && (
              <button className="btn btn-primary" onClick={handleSaveConstraint} style={{ padding: '4px 12px' }}>
                Save
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
