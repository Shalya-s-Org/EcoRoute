// Multi-Agent Simulation Engine
// Models the behaviors and outputs of the 8 specialized AI agents

const INITIAL_AGENTS = [
  {
    id: 'forecast_agent',
    name: 'Forecast Agent',
    role: 'Forecast & Data Ingestion',
    icon: 'CloudRain',
    status: 'idle',
    lastUpdated: null,
    metrics: { APIStatus: 'Healthy', weatherSync: 'OK', pricingFeed: 'Octopus Agile' },
    logs: [
      'Initialized connection to UK National Grid Intensity API.',
      'Successfully synchronized OpenWeather maps for lat/lon.',
      'Updated tariff pricing matrix (48 intervals ingested).',
    ],
  },
  {
    id: 'pref_agent',
    name: 'Preference Agent',
    role: 'User Habits & Preference Learning',
    icon: 'HeartHandshake',
    status: 'idle',
    lastUpdated: null,
    metrics: { comfortPreference: 'Balanced', learnedHabitsCount: 5, overrideRate: '2%' },
    logs: [
      'Learned habit: EV departs at 7:00 AM on weekdays (confidence: 94%).',
      'Learned habit: HVAC pre-heating requested at 6:30 AM (confidence: 88%).',
      'User override registered: Water heater manual toggle. Adjusting model weights.',
    ],
  },
  {
    id: 'opt_agent',
    name: 'Optimization Agent',
    role: 'Constrained Optimization Solver',
    icon: 'Scale',
    status: 'idle',
    lastUpdated: null,
    metrics: { objective: 'Min Cost + Carbon', solverTime: '4.2 ms', variables: '432 constraints' },
    logs: [
      'Constructed linear programming objective function: min Σ(w1*C + w2*P).',
      'Applied hard deadline limits for EV Charging (7:00 AM target).',
      'Solved schedule matrix. Found 14 low-carbon slots matching comfort criteria.',
    ],
  },
  {
    id: 'twin_agent',
    name: 'Digital Twin Agent',
    role: 'Thermodynamics & What-If Simulation',
    icon: 'Binary',
    status: 'idle',
    lastUpdated: null,
    metrics: { simulationDelta: '0.12%', batterySoCAccuracy: '99.1%', thermalModel: 'RC-Network' },
    logs: [
      'Simulated household thermal leakage (ambient temperature difference: -3.2°C).',
      'Simulated battery state-of-charge curve (predicted end state: 68% SoC).',
      'What-If engine validated EV charge timing. Result: 2.1kg CO2 delta vs immediate run.',
    ],
  },
  {
    id: 'safety_agent',
    name: 'Safety Guardrail Agent',
    role: 'Hardware Protection & Guardrails',
    icon: 'ShieldAlert',
    status: 'idle',
    lastUpdated: null,
    metrics: { activeLocks: 0, relaySafetyRating: '100%', guardrailsVerified: 7 },
    logs: [
      'MSD (Minimum State Duration) active: 30-minute lock enforced on HVAC and plugs.',
      'Verified battery capacity limits. Confirmed charge rate stays below 5kW limits.',
      'Completed automation conflict check: No contradictory triggers found.',
    ],
  },
  {
    id: 'execution_agent',
    name: 'Execution Agent',
    role: 'IoT Command Dispatcher',
    icon: 'Send',
    status: 'idle',
    lastUpdated: null,
    metrics: { activeCommands: 0, connectionRetries: 0, dispatchQueue: 0 },
    logs: [
      'Mapped commands to Home Assistant REST endpoints (/api/services/switch/turn_on).',
      'Verified local network routes to smart plugs.',
      'State-change command sent: EV Charger turned ON.',
    ],
  },
  {
    id: 'verification_agent',
    name: 'Verification & Audit Agent',
    role: 'State Verification & Savings Auditing',
    icon: 'CheckSquare',
    status: 'idle',
    lastUpdated: null,
    metrics: { verificationRate: '99.8%', auditLogsLogged: 1240, notificationDeliveries: '100%' },
    logs: [
      'Polled power draw for switch.ev_charger_plug (confirmed consumption of 7180W).',
      'Verified successful toggle response from HVAC smart relay.',
      'Dispatched Slack/Discord execution logs with saving matrices.',
    ],
  },
  {
    id: 'assistant_agent',
    name: 'AI Chat Assistant',
    role: 'Natural Language Explainer',
    icon: 'MessageSquare',
    status: 'idle',
    lastUpdated: null,
    metrics: { avgResponseTime: '0.4s', queriesAnswered: 42, activeSession: 'Session-A' },
    logs: [
      'Explainable AI response generated for: "Why is the EV delayed?".',
      'Parsed user command: "Charge battery to 100%". Triggering outage prep.',
      'Report compiled: Monthly eco-savings summary prepared for exporting.',
    ],
  },
];

let agents = JSON.parse(JSON.stringify(INITIAL_AGENTS));

export function getAgents() {
  return agents;
}

export function updateAgentStatus(id, status, metricUpdates = {}, logMessage = null) {
  const agent = agents.find(a => a.id === id);
  if (!agent) return;
  agent.status = status;
  agent.lastUpdated = Date.now();
  if (metricUpdates) {
    agent.metrics = { ...agent.metrics, ...metricUpdates };
  }
  if (logMessage) {
    agent.logs.unshift(logMessage);
    if (agent.logs.length > 20) agent.logs.pop();
  }
}

export function simulateAgentActivity(eventName, data = {}) {
  // Update agents depending on events
  if (eventName === 'optimize') {
    updateAgentStatus('forecast_agent', 'success', null, 'Regenerated tariff forecasts and temperature trends.');
    updateAgentStatus('pref_agent', 'success', null, 'Retrieved active schedules & verified current deadlines.');
    updateAgentStatus('opt_agent', 'success', { solverTime: '3.8 ms' }, 'Re-solved schedule timeline against carbon goals.');
    updateAgentStatus('twin_agent', 'success', null, 'Simulated battery depletion and indoor temperature curves.');
    updateAgentStatus('safety_agent', 'success', null, 'Checked and approved 24h schedule against MSD lockout conditions.');
  } else if (eventName === 'device_toggle') {
    updateAgentStatus('execution_agent', 'success', { activeCommands: 1 }, `Triggered toggle for device entity ${data.entityId}.`);
    updateAgentStatus('verification_agent', 'processing', null, `Polled device ${data.name} to verify state changes.`);
    setTimeout(() => {
      updateAgentStatus('verification_agent', 'success', { activeCommands: 0 }, `Verified device ${data.name} is drawing expected power.`);
    }, 1500);
  } else if (eventName === 'failsafe_trigger') {
    updateAgentStatus('safety_agent', 'warning', { guardrailsVerified: 6 }, `Failsafe alert: ${data.reason}. Transitioning state.`);
    updateAgentStatus('opt_agent', 'warning', null, 'Shifted optimization bounds to fallback configurations.');
  }
}
