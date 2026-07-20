import { useState } from 'react';
import { Save, Key, Sliders, Clock, Globe } from 'lucide-react';
import { addToast } from '../services/notifierService';

export default function Settings({ settings, updateSettings }) {
  const [local, setLocal] = useState({
    openWeatherKey: settings.openWeatherKey || '',
    discordWebhook: settings.discordWebhook || '',
    haUrl: settings.haUrl || 'http://homeassistant.local:8123',
    haToken: settings.haToken || '',
    carbonWeight: settings.carbonWeight ?? 0.6,
    costWeight: settings.costWeight ?? 0.4,
    tickInterval: settings.tickInterval ?? 5,
    fallbackStart: settings.fallbackStart || '01:00',
    fallbackEnd: settings.fallbackEnd || '05:00',
  });

  const handleChange = (key, value) => {
    setLocal(prev => ({ ...prev, [key]: value }));
  };

  const handleWeightChange = (carbonWeight) => {
    const cw = Number(carbonWeight);
    setLocal(prev => ({ ...prev, carbonWeight: cw, costWeight: Math.round((1 - cw) * 100) / 100 }));
  };

  const handleSave = () => {
    updateSettings(local);
    addToast('success', 'Settings Saved', 'Configuration updated. Next tick will use new settings.');
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Settings</h2>
          <p>Configure API keys, optimization preferences, and fallback behavior</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} id="btn-save-settings">
          <Save size={16} /> Save Settings
        </button>
      </div>

      {/* API Keys */}
      <div className="settings-section">
        <h3><Key size={18} style={{ marginRight: 8 }} />API Configuration</h3>
        <div className="settings-grid">
          <div className="input-group">
            <label htmlFor="input-weather-key">OpenWeather API Key</label>
            <input
              className="input"
              id="input-weather-key"
              type="password"
              placeholder="Enter your OpenWeather API key"
              value={local.openWeatherKey}
              onChange={e => handleChange('openWeatherKey', e.target.value)}
            />
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              Free tier at openweathermap.org. Leave blank for demo data.
            </span>
          </div>
          <div className="input-group">
            <label htmlFor="input-discord">Discord Webhook URL</label>
            <input
              className="input"
              id="input-discord"
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={local.discordWebhook}
              onChange={e => handleChange('discordWebhook', e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="input-ha-url">Home Assistant URL</label>
            <input
              className="input"
              id="input-ha-url"
              type="url"
              placeholder="http://homeassistant.local:8123"
              value={local.haUrl}
              onChange={e => handleChange('haUrl', e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="input-ha-token">Home Assistant Token</label>
            <input
              className="input"
              id="input-ha-token"
              type="password"
              placeholder="Long-lived access token"
              value={local.haToken}
              onChange={e => handleChange('haToken', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Optimization Weights */}
      <div className="settings-section">
        <h3><Sliders size={18} style={{ marginRight: 8 }} />Optimization Preferences</h3>
        <div className="card">
          <div className="slider-container">
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Carbon vs. Cost Priority</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                {Math.round(local.carbonWeight * 100)}% Carbon · {Math.round(local.costWeight * 100)}% Cost
              </span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', width: 40 }}>Cost</span>
              <input
                className="slider"
                type="range"
                min="0" max="1" step="0.05"
                value={local.carbonWeight}
                onChange={e => handleWeightChange(e.target.value)}
                id="slider-weight"
              />
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', width: 50 }}>Carbon</span>
            </div>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
              Objective: min Σ(w₁·C(t) + w₂·P(t)) — Slides the balance between minimizing carbon intensity and electricity cost.
            </p>
          </div>
        </div>
      </div>

      {/* Agent Config */}
      <div className="settings-section">
        <h3><Clock size={18} style={{ marginRight: 8 }} />Agent Configuration</h3>
        <div className="settings-grid">
          <div className="input-group">
            <label htmlFor="input-tick">Agent Tick Interval (minutes)</label>
            <input
              className="input"
              id="input-tick"
              type="number"
              min="1" max="60"
              value={local.tickInterval}
              onChange={e => handleChange('tickInterval', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Fallback */}
      <div className="settings-section">
        <h3><Globe size={18} style={{ marginRight: 8 }} />Fallback Schedule</h3>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          Static schedule used when Grid Carbon API is unreachable. Defaults to typical UK off-peak hours.
        </p>
        <div className="settings-grid">
          <div className="input-group">
            <label htmlFor="input-fallback-start">Fallback Start</label>
            <input
              className="input"
              id="input-fallback-start"
              type="time"
              value={local.fallbackStart}
              onChange={e => handleChange('fallbackStart', e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="input-fallback-end">Fallback End</label>
            <input
              className="input"
              id="input-fallback-end"
              type="time"
              value={local.fallbackEnd}
              onChange={e => handleChange('fallbackEnd', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
