import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { Binary, HelpCircle, AlertTriangle, ArrowRight, Lightbulb, Thermometer, Battery, DollarSign, Leaf } from 'lucide-react';
import { analyzeWhatIfScenario } from '../services/digitalTwinService';

export default function DigitalTwin({ carbonData, tariffData, schedules, settings, weatherData, telemetry }) {
  const [activeScenario, setActiveScenario] = useState(null);
  const [scenarioResults, setScenarioResults] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const chartData = useMemo(() => {
    if (!telemetry || !telemetry.length) return [];
    return telemetry;
  }, [telemetry]);

  const handleRunScenario = (scenario) => {
    setActiveScenario(scenario);
    const result = analyzeWhatIfScenario(scenario, schedules, carbonData, tariffData, settings, weatherData);
    setScenarioResults(result);
  };

  const handleCustomSimulate = () => {
    if (!customPrompt.trim()) return;
    // Map custom query keywords to presets
    const query = customPrompt.toLowerCase();
    if (query.includes('ev') || query.includes('car') || query.includes('charge')) {
      handleRunScenario('ev_now');
    } else if (query.includes('wash') || query.includes('delay') || query.includes('postpone')) {
      handleRunScenario('delay_washing');
    } else if (query.includes('weather') || query.includes('cloud') || query.includes('rain')) {
      handleRunScenario('cloudy_weather');
    } else {
      handleRunScenario('ev_now'); // default simulation fallback
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Digital Twin & Simulation</h2>
        <p>Real-time thermodynamic modeling and "What-If" sandbox testing</p>
      </div>

      {/* Intro info */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', borderColor: 'rgba(59,130,246,0.15)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <div className="metric-icon blue" style={{ flexShrink: 0 }}><Binary size={22} /></div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>How the Digital Twin Works</div>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              EcoRoute maintains a continuous mathematical model of your home's physical thermodynamics (wall insulation, thermal leakage, temperature differentials) and battery chemistry (charge curves, capacity degradation). Before executing any agent schedules, they are pre-validated in this simulated sandbox to verify cost reductions, carbon constraints, and battery health constraints.
            </p>
          </div>
        </div>
      </div>

      {/* Split sandbox + telemetry */}
      <div className="content-grid">
        
        {/* Sandbox Controls */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card-header">
            <span className="card-title">What-If Simulator Sandbox</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>PRESET WHAT-IF SCENARIOS</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <button 
                className={`btn ${activeScenario === 'ev_now' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleRunScenario('ev_now')}
                style={{ justifyContent: 'space-between', width: '100%' }}
              >
                <span>Forcing EV Charging Immediately</span>
                <ArrowRight size={14} />
              </button>
              <button 
                className={`btn ${activeScenario === 'delay_washing' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleRunScenario('delay_washing')}
                style={{ justifyContent: 'space-between', width: '100%' }}
              >
                <span>Delaying Washing Machine to 3:00 AM</span>
                <ArrowRight size={14} />
              </button>
              <button 
                className={`btn ${activeScenario === 'cloudy_weather' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleRunScenario('cloudy_weather')}
                style={{ justifyContent: 'space-between', width: '100%' }}
              >
                <span>Simulating Heavy Cloud Cover (Solar drop)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>CUSTOM NATURAL LANGUAGE SIMULATOR</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                type="text"
                placeholder="e.g. What if I turn on EV now?"
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                style={{ flex: 1 }}
                onKeyDown={e => e.key === 'Enter' && handleCustomSimulate()}
              />
              <button className="btn btn-secondary" onClick={handleCustomSimulate}>Simulate</button>
            </div>
          </div>

          {/* Scenario Simulation Results */}
          {scenarioResults && (
            <div className="card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', marginTop: 'var(--space-3)' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-3)' }}>
                <Lightbulb size={16} color="var(--amber-400)" /> Scenario Results Analysis
              </div>

              {/* Grid Deltas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-2)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={16} color={scenarioResults.costDelta <= 0 ? 'var(--accent)' : 'var(--red-400)'} />
                  <div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Cost Delta</div>
                    <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: scenarioResults.costDelta <= 0 ? 'var(--accent)' : 'var(--red-400)' }}>
                      {scenarioResults.costDelta <= 0 ? `${scenarioResults.costDelta.toFixed(2)}` : `+${scenarioResults.costDelta.toFixed(2)}`}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-2)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Leaf size={16} color={scenarioResults.carbonDelta <= 0 ? 'var(--accent)' : 'var(--red-400)'} />
                  <div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Carbon Delta</div>
                    <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: scenarioResults.carbonDelta <= 0 ? 'var(--accent)' : 'var(--red-400)' }}>
                      {scenarioResults.carbonDelta <= 0 ? `${scenarioResults.carbonDelta}g` : `+${scenarioResults.carbonDelta}g`}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-2)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Battery size={16} color="var(--cyan-400)" />
                  <div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Battery Delta</div>
                    <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--cyan-400)' }}>
                      {scenarioResults.batteryDelta > 0 ? `+${scenarioResults.batteryDelta}%` : `${scenarioResults.batteryDelta}%`}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-2)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Thermometer size={16} color="var(--blue-400)" />
                  <div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Comfort Delta</div>
                    <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--blue-400)' }}>
                      {scenarioResults.comfortDelta >= 0 ? `+${scenarioResults.comfortDelta}°C` : `${scenarioResults.comfortDelta}°C`}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)' }}>
                {scenarioResults.explanation}
              </div>
            </div>
          )}
        </div>

        {/* Telemetry Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Battery State of Charge (SoC) Forecast */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Simulated 24h Battery SoC Curve</span>
            </div>
            <div className="chart-container" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                  <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={9} tickLine={false} interval={7} />
                  <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6 }} />
                  <Line type="monotone" dataKey="batterySoC" stroke="var(--accent)" strokeWidth={2} dot={false} name="SoC (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Temperature Forecast */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Thermodynamic Temperature Simulation</span>
            </div>
            <div className="chart-container" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="indoorTempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                  <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={9} tickLine={false} interval={7} />
                  <YAxis stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6 }} />
                  <Area type="monotone" dataKey="indoorTemp" stroke="#3b82f6" fill="url(#indoorTempGrad)" strokeWidth={2} name="Indoor Room (°C)" />
                  <Line type="monotone" dataKey="outdoorTemp" stroke="var(--text-muted)" strokeWidth={1} dot={false} name="Outdoor Ambient (°C)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
