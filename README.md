# 🌱 EcoRoute — Smart-Grid Energy Optimizer Agent

> **Autonomous AI agent that schedules high-power household appliances for minimal cost and carbon footprint.**

![EcoRoute Dashboard](https://img.shields.io/badge/Status-Active-10b981?style=for-the-badge) ![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react) ![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite)

---

## 🎯 Problem

High-power household appliances (EV chargers, HVAC units, smart water heaters) run arbitrarily, often aligning with **peak utility tariff pricing** and **high grid carbon intensity hours**. EcoRoute intercepts these consumption spikes.

## ⚡ Solution

EcoRoute reads **real-time grid carbon intensity data** and **weather forecasts** to automatically calculate and execute the most **cost-efficient, low-carbon** charging schedules for your smart home devices.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    EcoRoute Agent                     │
├──────────┬───────────┬──────────────┬────────────────┤
│ Grid API │ Weather   │ IoT Devices  │ Notifications  │
│ (Live)   │ (Live/    │ (Simulated   │ (Discord +     │
│ UK       │  Demo)    │  Home Asst.) │  In-App)       │
│ National │ OpenWeather│             │                │
│ Grid     │           │              │                │
├──────────┴───────────┼──────────────┴────────────────┤
│    Optimization Engine (Constrained Solver)           │
│    min Σ(w₁·C(t) + w₂·P(t))                         │
└──────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/your-username/EcoRoute.git
cd EcoRoute

# Install
npm install

# Run
npm run dev

# Open http://localhost:5173
```

## 📋 Features

### Core Agent
- **Predictive Cost/Carbon Minimization** — Solves constrained optimization against dynamic pricing + carbon forecasts
- **Live Grid Data** — Real-time UK National Grid Carbon Intensity API (free, no key required)
- **Weather-Aware** — Adjusts HVAC scheduling based on temperature forecasts
- **Device Safety Guardrails** — 30-minute Minimum State Duration prevents relay damage
- **Failsafe Redundancy** — Falls back to static schedules when APIs are unreachable

### Dashboard (6 Pages)
1. **Dashboard** — Live metrics, carbon intensity chart, weather, agent feed
2. **Devices** — IoT device cards with toggle controls, MSD countdown
3. **Schedule** — 24h optimization timeline, deadline constraint editor
4. **Analytics** — Weekly savings charts, environmental equivalents
5. **Settings** — API keys, optimization weights, fallback config
6. **Agent Log** — Filterable real-time activity log

### Design
- Premium dark theme with glassmorphism
- Emerald/teal gradient accents
- Responsive layout (desktop → mobile)
- Smooth animations and transitions

## 🔧 Configuration

Copy `.env.example` to `.env` and fill in optional API keys:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `VITE_OPENWEATHER_API_KEY` | No | OpenWeather API key (demo data used if absent) |
| `VITE_DISCORD_WEBHOOK_URL` | No | Discord webhook for notifications |
| `VITE_HA_URL` | No | Home Assistant URL |
| `VITE_HA_TOKEN` | No | Home Assistant long-lived access token |

## 🧪 Optimization Algorithm

$$\min \sum_{t \in S} (w_1 \cdot C(t) + w_2 \cdot P(t))$$

Where:
- $S$ = selected run intervals
- $C(t)$ = carbon intensity forecast at time $t$
- $P(t)$ = tariff price at time $t$
- $w_1, w_2$ = user-configurable weights (default 60% carbon, 40% cost)

## 📁 Project Structure

```
EcoRoute/
├── public/vite.svg
├── src/
│   ├── main.jsx                 # Entry point
│   ├── App.jsx                  # Router + agent loop
│   ├── index.css                # Design system
│   ├── components/
│   │   ├── Sidebar.jsx          # Navigation
│   │   └── ToastContainer.jsx   # Notifications
│   ├── pages/
│   │   ├── Dashboard.jsx        # Live metrics & charts
│   │   ├── Devices.jsx          # IoT device management
│   │   ├── Schedule.jsx         # 24h timeline
│   │   ├── Analytics.jsx        # Savings tracking
│   │   ├── Settings.jsx         # Configuration
│   │   └── AgentLog.jsx         # Activity log
│   └── services/
│       ├── gridService.js       # Carbon intensity API
│       ├── weatherService.js    # Weather API
│       ├── iotService.js        # Device simulator
│       ├── optimizerService.js  # Optimization engine
│       └── notifierService.js   # Notifications
├── memory_bank/                 # Project documentation
├── package.json
├── vite.config.js
└── .env.example
```

## 📜 License

MIT
