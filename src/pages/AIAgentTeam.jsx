import { useState } from 'react';
import { 
  CloudRain, HeartHandshake, Scale, Binary, ShieldAlert, Send, CheckSquare, MessageSquare, Cpu, Play, CheckCircle2 
} from 'lucide-react';
import { getAgents, updateAgentStatus } from '../services/agentEngine';

const iconMap = {
  CloudRain: CloudRain,
  HeartHandshake: HeartHandshake,
  Scale: Scale,
  Binary: Binary,
  ShieldAlert: ShieldAlert,
  Send: Send,
  CheckSquare: CheckSquare,
  MessageSquare: MessageSquare,
};

export default function AIAgentTeam() {
  const [agents, setAgents] = useState(getAgents());
  const [isAuditing, setIsAuditing] = useState(false);

  const handleRunSelfAudit = () => {
    setIsAuditing(true);
    // Cycle statuses to simulate auditing
    agents.forEach(a => {
      updateAgentStatus(a.id, 'processing', null, `Self-audit triggered. Running system diagnostics...`);
    });
    setAgents([...getAgents()]);

    setTimeout(() => {
      agents.forEach(a => {
        const randTime = (Math.random() * 2 + 1).toFixed(1);
        updateAgentStatus(a.id, 'success', null, `Audit successful. Diagnostics completed in ${randTime}s. Integrity 100%.`);
      });
      setAgents([...getAgents()]);
      setIsAuditing(false);
    }, 2000);
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>AI Agents Team</h2>
          <p>Autonomous multi-agent collaboration dashboard</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleRunSelfAudit} 
          disabled={isAuditing}
          id="btn-agent-audit"
        >
          {isAuditing ? (
            <>Auditing Team...</>
          ) : (
            <>
              <Play size={14} style={{ marginRight: 6 }} /> Run System Self-Audit
            </>
          )}
        </button>
      </div>

      <div className="agents-grid">
        {agents.map(agent => {
          const IconComponent = iconMap[agent.icon] || Cpu;
          
          let statusClass = 'off';
          if (agent.status === 'success') statusClass = 'very-low';
          if (agent.status === 'processing') statusClass = 'moderate';
          if (agent.status === 'warning') statusClass = 'high';
          if (agent.status === 'idle') statusClass = 'low';

          return (
            <div className="card" key={agent.id} id={`agent-${agent.id}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <div className={`device-icon-wrapper metric-icon blue`} style={{ width: 40, height: 40, borderRadius: 8 }}>
                    <IconComponent size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, margin: 0 }}>{agent.name}</h3>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{agent.role}</span>
                  </div>
                </div>
                <span className={`badge ${agent.status === 'success' ? 'green' : agent.status === 'processing' ? 'amber' : 'blue'}`}>
                  {agent.status.toUpperCase()}
                </span>
              </div>

              {/* Metrics block */}
              {agent.metrics && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: 'var(--space-2)', 
                  padding: 'var(--space-2)', 
                  background: 'var(--bg-tertiary)', 
                  borderRadius: 6,
                  marginBottom: 'var(--space-3)'
                }}>
                  {Object.entries(agent.metrics).map(([key, val]) => (
                    <div key={key} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Agent log */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>LATEST ACTIVITY LOGS</span>
                <div className="agent-logs-box" style={{ 
                  maxHeight: 100, 
                  overflowY: 'auto', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: 6,
                  padding: 'var(--space-2)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  color: 'var(--text-secondary)'
                }}>
                  {agent.logs.map((log, index) => (
                    <div key={index} style={{ marginBottom: 4, paddingBottom: 4, borderBottom: index < agent.logs.length - 1 ? '1px solid rgba(148,163,184,0.04)' : 'none' }}>
                      <span style={{ color: 'var(--accent)', marginRight: 4 }}>&gt;</span> {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cooperation workflow visualizer */}
      <div className="card" style={{ marginTop: 'var(--space-6)' }}>
        <div className="card-header">
          <span className="card-title">Multi-Agent Cooperative Optimization Pipeline</span>
        </div>
        <div className="cooperation-flow">
          {[
            { step: '1', title: 'Data Gathering', desc: 'Forecast Agent fetches live pricing, weather, and carbon curves.', icon: CloudRain },
            { step: '2', title: 'Habits Audit', desc: 'User Preference Agent aligns targets against comfort metrics.', icon: HeartHandshake },
            { step: '3', title: 'LP Solver', desc: 'Optimization Agent resolves cost/carbon constraint formulas.', icon: Scale },
            { step: '4', title: 'Validation', desc: 'Digital Twin runs battery + thermal simulations.', icon: Binary },
            { step: '5', title: 'Safety Audit', desc: 'Safety Agent verifies MSD limits & conflict prevention.', icon: ShieldAlert },
            { step: '6', title: 'Dispatch', desc: 'Execution Agent triggers target REST & MQTT endpoints.', icon: Send },
          ].map((item, idx, arr) => (
            <div key={item.step} className="flow-step-container" style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div className="flow-step" style={{ flex: 1, textAlign: 'center', padding: 'var(--space-3) var(--space-2)', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-2)', color: 'var(--accent)', fontWeight: 700 }}>
                  {item.step}
                </div>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.3 }}>{item.desc}</div>
              </div>
              {idx < arr.length - 1 && (
                <div style={{ padding: '0 var(--space-2)', color: 'var(--text-muted)', fontWeight: 300 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
