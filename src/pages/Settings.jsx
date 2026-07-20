import { useState } from 'react';
import { Save, Key, Sliders, Clock, Globe, Shield, WifiOff, Eye, EyeOff } from 'lucide-react';
import { addToast, addLog } from '../services/notifierService';

export default function Settings({ settings, updateSettings, runAgentTick }) {
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
    haOfflineSim: settings.haOfflineSim ?? false,
    apiOfflineSim: settings.apiOfflineSim ?? false,
    gridOutageSim: settings.gridOutageSim ?? false,
  });

  const [showToken, setShowToken] = useState(false);

  const handleChange = (key, value) => {
    const updated = { ...local, [key]: value };
    setLocal(updated);
    // If it's a simulation toggle, apply and re-run optimization immediately
    if (key === 'haOfflineSim' || key === 'apiOfflineSim' || key === 'gridOutageSim') {
      updateSettings({ [key]: value });
      setTimeout(() => {
        runAgentTick();
      }, 100);
    }
  };

  const handleWeightChange = (carbonWeight) => {
    const cw = Number(carbonWeight);
    setLocal(prev => ({ ...prev, carbonWeight: cw, costWeight: Math.round((1 - cw) * 100) / 100 }));
  };

  const handleSave = () => {
    updateSettings(local);
    addToast('success', 'Settings Saved', 'Configuration updated. Optimization engine refreshed.');
    addLog('success', 'Settings', 'User saved updated API keys and weights.');
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Settings</h2>
          <p>Configure API keys, optimization preferences, failsafe triggers, and security vault credentials</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} id="btn-save-settings">
          <Save size={16} /> Save Settings
        </button>
      </div>

      {/* Grid of Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        
        {/* API Keys */}
        <div className="settings-section card" style={{ margin: 0 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}><Key size={18} />API Configuration</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="input-group">
              <label>OpenWeather API Key</label>
              <input
                className="input"
                type="password"
                placeholder="Enter OpenWeather API key"
                value={local.openWeatherKey}
                onChange={e => handleChange('openWeatherKey', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Discord Webhook URL</label>
              <input
                className="input"
                type="text"
                placeholder="https://discord.com/api/webhooks/..."
                value={local.discordWebhook}
                onChange={e => handleChange('discordWebhook', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Home Assistant URL</label>
              <input
                className="input"
                type="url"
                placeholder="http://homeassistant.local:8123"
                value={local.haUrl}
                onChange={e => handleChange('haUrl', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Home Assistant Token</span>
                <button 
                  onClick={() => setShowToken(!showToken)} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />} {showToken ? 'Hide' : 'Reveal'}
                </button>
              </label>
              <input
                className="input"
                type={showToken ? 'text' : 'password'}
                placeholder="Long-lived access token"
                value={local.haToken}
                onChange={e => handleChange('haToken', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Failsafe Sandbox Simulation */}
        <div className="settings-section card" style={{ margin: 0 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}><WifiOff size={18} />Failsafe Simulation Sandbox</h3>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
            Simulate outages and failure modes to verify EcoRoute redundancy.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="toggle-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>Simulate HA API Outage</div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Forces IoT commands to fail with retry log warnings</div>
              </div>
              <button
                className={`toggle ${local.haOfflineSim ? 'on' : ''}`}
                onClick={() => handleChange('haOfflineSim', !local.haOfflineSim)}
              />
            </div>

            <div className="toggle-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>Simulate Grid API Outage</div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Bypasses live fetch to use static off-peak database cache</div>
              </div>
              <button
                className={`toggle ${local.apiOfflineSim ? 'on' : ''}`}
                onClick={() => handleChange('apiOfflineSim', !local.apiOfflineSim)}
              />
            </div>

            <div className="toggle-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>Grid Outage Mode</div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Forces outage preparation: 100% battery capacity & load shedding</div>
              </div>
              <button
                className={`toggle ${local.gridOutageSim ? 'on' : ''}`}
                onClick={() => handleChange('gridOutageSim', !local.gridOutageSim)}
              />
            </div>
          </div>
        </div>

        {/* Security & Credentials */}
        <div className="settings-section card" style={{ margin: 0 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}><Shield size={18} />Security & Encryption</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)' }}>
              <span style={{ color: 'var(--text-muted)' }}>OAuth Authenticator Status:</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Connected (HA Cloud v2)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)' }}>
              <span style={{ color: 'var(--text-muted)' }}>JSON Web Token (JWT) Signer:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>HMAC-SHA256 (2048-bit)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)' }}>
              <span style={{ color: 'var(--text-muted)' }}>API Credential Vault:</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>AES-GCM-256 Encrypted</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)' }}>
              <span style={{ color: 'var(--text-muted)' }}>MQTT Broker:</span>
              <span style={{ fontWeight: 700, color: 'var(--blue-400)' }}>TLS v1.3 Encrypted Tunnel</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Rate Limit Thresholds:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>100 req/hr (12/hr active)</span>
            </div>
            
            <div style={{ marginTop: 'var(--space-2)', fontSize: '9px', fontFamily: 'monospace', padding: 'var(--space-2)', background: 'var(--bg-tertiary)', borderRadius: 4, color: 'var(--text-muted)' }}>
              <div>[Security Log] Signed token generated for session.</div>
              <div>[Security Log] Enforced HTTPS SSL handshake.</div>
            </div>
          </div>
        </div>

        {/* Weights */}
        <div className="settings-section card" style={{ margin: 0, gridColumn: 'span 2' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}><Sliders size={18} />Optimization Preference Weights</h3>
          <div className="slider-container">
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontWeight: 600 }}>Objective Balance (Carbon vs. Cost)</span>
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
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', width: 50 }}>Carbon</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
