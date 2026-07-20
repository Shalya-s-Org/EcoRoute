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
import { fetchCarbonIntensity, generateTariffData } from './services/gridService';
import { fetchWeather } from './services/weatherService';
import { getDevices } from './services/iotService';
import { optimizeAllDevices, calculateTotalSavings } from './services/optimizerService';
import { addLog, addToast } from './services/notifierService';

function getSettings() {
  try {
    return JSON.parse(localStorage.getItem('ecoroute_settings')) || {};
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

  const runAgentTick = useCallback(async () => {
    setAgentStatus('running');
    addLog('info', 'AgentCore', 'Starting optimization tick...');

    // 1. Fetch grid data
    const grid = await fetchCarbonIntensity();
    setCarbonData(grid.data);
    setGridSource(grid.source);
    const tariff = generateTariffData(grid.data);
    setTariffData(tariff);

    if (!grid.ok) {
      addLog('warn', 'GridConnector', `API unreachable. Using ${grid.source} data.`);
      addToast('warning', 'Grid API Fallback', 'Using static schedule — live data unavailable');
    } else {
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
    });
    setSchedules(s);
    const sv = calculateTotalSavings(s);
    setSavings(sv);

    addLog('success', 'Optimizer', `Schedule optimized. Est. savings: $${sv.costSaved}, ${sv.carbonSaved}g CO₂`);
    setAgentStatus('idle');
    setTickCount(c => c + 1);
  }, [settings]);

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

  const sharedProps = {
    carbonData, tariffData, weatherData, schedules, savings,
    gridSource, agentStatus, tickCount, settings, updateSettings, runAgentTick,
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
            <Route path="/settings" element={<Settings {...sharedProps} />} />
            <Route path="/logs" element={<AgentLog />} />
          </Routes>
        </main>
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}
