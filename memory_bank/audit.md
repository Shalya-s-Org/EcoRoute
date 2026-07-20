# Security and Reliability Audit

## Project: EcoRoute — Smart-Grid Energy Optimizer Agent

---

## 1. Audit Overview
This audit evaluates the reliability, security, and integrity of EcoRoute's integration system. Because EcoRoute has physical-world control over high-power home appliances, safety-critical guardrails are paramount.

---

## 2. Build Status Audit (Plan vs. Reality)

### Initial Audit Date: 2026-07-20 (0/13 Built)
### Final Audit Date: 2026-07-20 (100% Built & Verified)

| Component | File(s) | Status | Notes |
|---|---|---|---|
| Package Config | `package.json` | ✅ BUILT | Vite + React 19 + Recharts + Lucide |
| Entry Point & App Shell | `src/main.jsx`, `src/App.jsx` | ✅ BUILT | React Router with agent tick loop |
| Design System | `src/index.css` | ✅ BUILT | Dark theme, glassmorphism, HSL tokens |
| Sidebar Navigation | `src/components/Sidebar.jsx` | ✅ BUILT | Responsive sidebar with glowing badges |
| Toast Notifications | `src/components/ToastContainer.jsx` | ✅ BUILT | Auto-dismissing alerts with severity icons |
| Grid Connector | `src/services/gridService.js` | ✅ BUILT | Live UK National Grid Carbon Intensity API |
| Weather Connector | `src/services/weatherService.js` | ✅ BUILT | OpenWeather API + realistic demo fallback |
| IoT Dispatcher | `src/services/iotService.js` | ✅ BUILT | Simulated HA devices + 30-min MSD lock |
| Optimization Engine | `src/services/optimizerService.js` | ✅ BUILT | Constrained solver $\min \sum(w_1C + w_2P)$ |
| Notification Service | `src/services/notifierService.js` | ✅ BUILT | In-app toasts, activity log, Discord webhook |
| Dashboard Page | `src/pages/Dashboard.jsx` | ✅ BUILT | Live metrics, carbon chart, weather, feed |
| Devices Page | `src/pages/Devices.jsx` | ✅ BUILT | Power stats, toggles, MSD countdowns |
| Schedule Page | `src/pages/Schedule.jsx` | ✅ BUILT | 24h timeline, deadline constraint editor |
| Analytics Page | `src/pages/Analytics.jsx` | ✅ BUILT | Weekly cost/carbon charts, tree equivalents |
| Settings Page | `src/pages/Settings.jsx` | ✅ BUILT | API keys, carbon/cost slider, fallbacks |
| Agent Log Page | `src/pages/AgentLog.jsx` | ✅ BUILT | Filterable log feed with auto-scroll |
| Environment Template | `.env.example` | ✅ BUILT | OpenWeather, Discord, HA templates |
| README & Documentation | `README.md` | ✅ BUILT | Architecture diagrams, quick start, formula |

### Summary
**18 out of 18 planned components are built and verified.** Production bundle compiled cleanly (`npx vite build`). Dev server operational on `http://localhost:5173`.

---

## 3. Threat Modeling & Vulnerability Analysis

### Threat T-1: API Token Leakage (High Severity)
*   **Vulnerability:** Environment variables containing Home Assistant Long-Lived Access Tokens or OpenWeather API keys getting serialized into debugging logs or webhook payloads.
*   **Mitigation:** 
    *   API keys stored in `.env` (git-ignored) or client `localStorage` for demo.
    *   No credentials serialized in logs or toast notifications.

### Threat T-2: Rapid-Cycling Relay Fatigue (Medium Severity)
*   **Vulnerability:** Fluctuating carbon intensity forecasts could cause the optimizer to toggle physical relays (e.g., HVAC power line) on and off rapidly, damaging hardware.
*   **Mitigation:** 
    *   Enforced **Minimum State Duration (MSD)** of 30 minutes in `src/services/iotService.js`.
    *   Once a device toggles ON/OFF, manual or automated toggles are locked for 30 minutes.

### Threat T-3: Replay Attacks / Unauthenticated Hook Control (Medium Severity)
*   **Vulnerability:** Malicious actors sending spoofed webhooks to trigger grid surges.
*   **Mitigation:** 
    *   Agent only initiates egress calls to Discord webhooks and grid APIs.

---

## 4. Data Integrity & Validation Guardrails

### Input Sanitation
Grid data, weather forecasts, and custom user input deadlines are sanitized prior to optimization:
- Carbon intensity values checked for valid numeric ranges ($0 - 600\text{ gCO}_2/\text{kWh}$).
- Time inputs formatted via standard ISO-8601 string parsing.
- Constraint deadlines bound between 00:00 and 23:59.

---

## 5. Fail-Safe Operations (Offline & Error Modes)
- **API Failure Fallback:** If UK Carbon Intensity API is unreachable, `gridService.js` gracefully activates `STATIC_FALLBACK` (UK off-peak table) and emits a warning log + toast notification.
- **IoT Command Failures:** IoT connector simulates connection retries and logs state errors to `AgentLog` with red error badges and toast alerts.
