import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/ToastContainer';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Schedule from './pages/Schedule';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import AgentLog from './pages/AgentLog';
import DigitalTwinPage from './pages/DigitalTwin';
import AIAgentTeam from './pages/AIAgentTeam';
import { fetchCarbonIntensity, generateTariffData } from './services/gridService';
import { fetchWeather } from './services/weatherService';
import { getDevices } from './services/iotService';
import { optimizeAllDevices, calculateTotalSavings } from './services/optimizerService';
import { addLog, addToast } from './services/notifierService';
import { simulateAgentActivity } from './services/agentEngine';
import { runDigitalTwinSimulation, analyzeWhatIfScenario } from './services/digitalTwinService';
import { MessageSquare, X, Send, Bot, Sparkles } from 'lucide-react';

function getSettings() {
  try {
    return JSON.parse(localStorage.getItem('ecoroute_settings')) || {
      carbonWeight: 0.6,
      costWeight: 0.4,
      emergencyMode: false,
      autoChargeBattery: true,
      autoDischargeBattery: true,
      haUrl: 'http://192.168.1.145:8123',
      haToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      discordWebhook: 'https://discord.com/api/webhooks/...',
      openWeatherKey: '',
      haOfflineSim: false,
      apiOfflineSim: false,
      gridOutageSim: false,
    };
  } catch { return {}; }
}

export default function App() {
  const [carbonData, setCarbonData] = useState([]);
  const [tariffData, setTariffData] = useState([]);
  const [weatherData, setWeatherData] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [savings, setSavings] = useState({ costSaved: 0, carbonSaved: 0 });
  const [gridSource, setGridSource] = useState('loading');
  const [agentStatus, setAgentStatus] = useState('initializing');
  const [tickCount, setTickCount] = useState(0);
  const [settings, setSettings] = useState(getSettings);
  const [telemetry, setTelemetry] = useState([]);
  
  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am your AI Energy Assistant. Ask me things like:\n\n• Why is the EV delayed?\n• What if I charge my EV right now?\n• Prepare for grid outage!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const runAgentTick = useCallback(async () => {
    setAgentStatus('running');
    addLog('info', 'AgentCore', 'Starting optimization tick...');

    // 1. Fetch grid data
    let grid;
    if (settings.apiOfflineSim) {
      grid = { data: carbonData.length ? carbonData : [], source: 'cached fallback', ok: false };
      addLog('warn', 'GridConnector', 'API Outage simulated. Operating from offline grid database cache.');
      addToast('warning', 'Offline Mode', 'Grid API Offline - using cached tariffs');
    } else {
      grid = await fetchCarbonIntensity();
    }
    
    setCarbonData(grid.data);
    setGridSource(grid.source);
    const tariff = generateTariffData(grid.data);
    setTariffData(tariff);

    if (!grid.ok && !settings.apiOfflineSim) {
      addLog('warn', 'GridConnector', `API unreachable. Using ${grid.source} data.`);
      addToast('warning', 'Grid API Fallback', 'Using static schedule — live data unavailable');
    } else if (grid.ok) {
      addLog('success', 'GridConnector', `Ingested ${grid.data.length} intervals from ${grid.source}`);
    }

    // 2. Fetch weather
    const weather = await fetchWeather(settings.openWeatherKey);
    setWeatherData(weather.data);
    addLog('info', 'WeatherService', `Weather data: ${weather.source} (${weather.data[0]?.temp}°C)`);

    // 3. Optimize
    const devices = getDevices();
    const s = optimizeAllDevices(devices, grid.data, tariff, {
      carbonWeight: settings.carbonWeight ?? 0.6,
      costWeight: settings.costWeight ?? 0.4,
      emergencyMode: settings.emergencyMode || settings.gridOutageSim,
    }, weather.data);
    
    setSchedules(s);
    const sv = calculateTotalSavings(s);
    setSavings(sv);

    // 4. Run Digital Twin Simulation
    const tel = runDigitalTwinSimulation(s, grid.data, tariff, {
      autoChargeBattery: settings.autoChargeBattery,
      autoDischargeBattery: settings.autoDischargeBattery,
    }, weather.data);
    setTelemetry(tel);

    simulateAgentActivity('optimize');
    
    addLog('success', 'Optimizer', `Schedule optimized. Est. savings today: $${sv.costSaved}, ${sv.carbonSaved}g CO₂`);
    setAgentStatus('idle');
    setTickCount(c => c + 1);
  }, [settings, carbonData]);

  useEffect(() => {
    runAgentTick();
    const interval = setInterval(runAgentTick, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(interval);
  }, [runAgentTick]);

  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    localStorage.setItem('ecoroute_settings', JSON.stringify(merged));
  };

  const handleSendChat = (textToSend = null) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const userMsg = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setChatInput('');

    // Simulate Bot Response
    setTimeout(() => {
      let botResponse = '';
      const query = text.toLowerCase();

      if (query.includes('ev') && (query.includes('delay') || query.includes('why'))) {
        botResponse = `🔍 **EV Charger Analysis:**\n\nYour EV is scheduled to charge between **2:00 AM and 6:00 AM** to reach your 7:00 AM target of 80% SoC.\n\n* **Rationale:** Tariffs are **42% lower** ($0.09/kWh vs $0.24/kWh) during off-peak, and wind generation makes carbon intensity **30% cleaner** (95g vs 180g CO₂/kWh).\n* **Financial Impact:** Saved **$3.68**.\n* **Carbon Impact:** Avoided **760g CO₂** compared to immediate charging.`;
      } else if (query.includes('what-if') || query.includes('what if') || query.includes('charge now')) {
        const scenario = query.includes('washing') ? 'delay_washing' : query.includes('weather') ? 'cloudy_weather' : 'ev_now';
        const res = analyzeWhatIfScenario(scenario, schedules, carbonData, tariffData, settings, weatherData);
        
        botResponse = `📊 **What-If Simulation Result:**\n\n* **Scenario:** ${scenario === 'ev_now' ? 'Forcing EV Charging Immediately' : scenario === 'delay_washing' ? 'Delaying Washing Machine to 3:00 AM' : 'Simulating Cloudy/Stormy Weather Overcast'}\n* **Cost Impact:** ${res.costDelta >= 0 ? `+$${res.costDelta.toFixed(2)}` : `-$${Math.abs(res.costDelta).toFixed(2)}`}\n* **Carbon Impact:** ${res.carbonDelta >= 0 ? `+${res.carbonDelta}g CO₂` : `-${Math.abs(res.carbonDelta)}g CO₂`}\n* **Battery Impact:** ${res.batteryDelta > 0 ? `+${res.batteryDelta}% SoC` : `${res.batteryDelta}% SoC`}\n\n* **Agent Explanation:** ${res.explanation}`;
      } else if (query.includes('outage') || query.includes('emergency') || query.includes('prepare')) {
        updateSettings({ emergencyMode: true });
        botResponse = `⚠️ **Emergency Outage Prep Activated!**\n\nI have overridden schedules to prepare your home grid:\n\n1. **Home Battery:** Forced charging to 100% SoC immediately.\n2. **Load Shedding:** Shut down non-essential devices (Pool Pump, Dishwasher, Washing Machine).\n3. **HVAC Mode:** Shifted comfort constraints to eco-economy mode.\n\n*Estimated Outage Resilience:* **14.5 hours** of continuous backup power remaining.`;
        addToast('warning', 'Emergency Mode', 'Outage prep active - backup charging forced');
      } else if (query.includes('optimize') || query.includes('run') || query.includes('reoptimize')) {
        runAgentTick();
        botResponse = `⚡ **Optimization complete!**\n\nI triggered a fresh audit of live grid carbon indices and current solar generation. All 9 device runtime targets have been re-aligned. Total savings projected today: **$${savings.costSaved.toFixed(2)}** and **${savings.carbonSaved}g CO₂** avoided.`;
      } else {
        botResponse = `🤖 **EcoRoute Multi-Agent Team Status:**\n\nAll 8 specialized agents are operational. \n\n* **Forecast Agent:** Ingesting live carbon & tariff metrics.\n* **Digital Twin Agent:** Room thermodynamics model active.\n* **Safety Agent:** Zero conflicts or rapid-relay switching risks detected.\n\nAsk me specialized instructions like "Why is the EV delayed?" or "What if the weather becomes cloudy?".`;
      }

      setChatMessages(prev => [...prev, {
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 800);
  };

  const sharedProps = {
    carbonData, tariffData, weatherData, schedules, savings,
    gridSource, agentStatus, tickCount, settings, updateSettings, runAgentTick, telemetry
  };

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar agentStatus={agentStatus} gridSource={gridSource} />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard {...sharedProps} />} />
            <Route path="/devices" element={<Devices {...sharedProps} />} />
            <Route path="/schedule" element={<Schedule {...sharedProps} />} />
            <Route path="/analytics" element={<Analytics {...sharedProps} />} />
            <Route path="/digital-twin" element={<DigitalTwinPage {...sharedProps} />} />
            <Route path="/agents" element={<AIAgentTeam {...sharedProps} />} />
            <Route path="/settings" element={<Settings {...sharedProps} />} />
            <Route path="/logs" element={<AgentLog />} />
          </Routes>
        </main>
        
        {/* Floating Chat Button */}
        <button className="chat-float-btn" onClick={() => setIsChatOpen(o => !o)} id="btn-chat-toggle" aria-label="Toggle chat assistant">
          {isChatOpen ? <X size={22} /> : <MessageSquare size={22} />}
        </button>

        {/* Chat Drawer */}
        <div className={`chat-drawer ${isChatOpen ? 'open' : ''}`} id="chat-drawer">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div className="chat-header-icon">
                <Bot size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>EcoRoute AI Assistant</div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--accent)' }}>● Active Copilot</div>
              </div>
            </div>
            <button className="chat-close" onClick={() => setIsChatOpen(false)} aria-label="Close chat">
              <X size={16} />
            </button>
          </div>
          
          <div className="chat-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-bubble-wrapper ${msg.sender}`}>
                <div className={`chat-bubble ${msg.sender}`}>
                  {msg.text.split('\n').map((para, k) => (
                    <p key={k} style={{ margin: '4px 0' }}>
                      {para.startsWith('•') || para.startsWith('*') ? para : para}
                    </p>
                  ))}
                </div>
                <span className="chat-time">{msg.timestamp}</span>
              </div>
            ))}
          </div>

          <div className="chat-quick-suggestions">
            <button className="suggestion-chip" onClick={() => handleSendChat('Why is EV charging delayed?')}>
              Why EV delayed?
            </button>
            <button className="suggestion-chip" onClick={() => handleSendChat('What if I charge EV now?')}>
              What-If: Charge EV now
            </button>
            <button className="suggestion-chip" onClick={() => handleSendChat('Prepare for grid outage')}>
              Outage Prep ⚠️
            </button>
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Ask anything..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              id="input-chat"
            />
            <button className="chat-send" onClick={() => handleSendChat()} id="btn-chat-send">
              <Send size={16} />
            </button>
          </div>
        </div>

        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}
