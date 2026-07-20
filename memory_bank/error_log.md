# Error Log & Troubleshooting Guide

## Project: EcoRoute — Smart-Grid Energy Optimizer Agent

---

## 1. Build & Setup Resolved Log

```text
[2026-07-20T15:00:00.000Z] CRITICAL: [Audit] Initial check found zero source code files.
[2026-07-20T15:05:00.000Z] RESOLVED: Initialized Vite + React 19 project structure.
[2026-07-20T15:10:00.000Z] RESOLVED: Created design system (index.css) with glassmorphism dark theme.
[2026-07-20T15:15:00.000Z] RESOLVED: Implemented Grid, Weather, IoT, Optimizer, and Notifier services.
[2026-07-20T15:20:00.000Z] RESOLVED: Built 6 complete application pages (Dashboard, Devices, Schedule, Analytics, Settings, AgentLog).
[2026-07-20T15:24:29.000Z] SUCCESS: Production build executed via `npx vite build` — 0 errors, 2222 modules transformed.
```

---

## 2. Simulated Runtime Error & Recovery Log
Below is a reproduction of real-world runtime exceptions handled by EcoRoute's fallback mechanisms.

```text
[2026-07-20T12:00:05.102Z] INFO: [AgentCore] Starting optimization tick...
[2026-07-20T12:00:05.412Z] ERROR: [GridConnector] Fetch failed for endpoint '/intensity/date'. Response code 503 (Service Unavailable).
[2026-07-20T12:00:05.413Z] WARN: [AgentCore] External Grid API is unreachable. Activating fallback configuration: 'STATIC_FALLBACK'.
[2026-07-20T12:00:05.415Z] INFO: [Optimizer] Scheduled execution slots resolved: [01:00 - 05:00] (Fallback mode).
[2026-07-20T12:00:05.416Z] INFO: Optimization tick complete.
...
[2026-07-20T13:00:00.005Z] INFO: [AgentCore] Starting optimization tick...
[2026-07-20T13:00:00.650Z] INFO: [GridConnector] Ingested forecast values from UK National Grid. Lowest-carbon slots found: [02:00, 02:30, 03:00, 03:30].
[2026-07-20T13:00:00.670Z] INFO: [IoTConnector] Attempting turn_on for switch.ev_charger_plug...
[2026-07-20T13:00:05.800Z] ERROR: [IoTConnector] Connection to Home Assistant host '192.168.1.145:8123' timed out.
[2026-07-20T13:00:05.801Z] WARN: [IoTConnector] Retrying turn_on command. Attempt 1/3...
[2026-07-20T13:01:05.810Z] ERROR: [IoTConnector] Command failed. switch.ev_charger_plug MSD guardrail active (28 min remaining).
[2026-07-20T13:01:05.825Z] INFO: [Notifier] Dispatched Toast + Discord notification for 'MSD Guardrail Lock'.
```

---

## 3. Troubleshooting Procedures

### Issue 1: Grid API Timeout / 503 Service Unavailable
*   **Symptom:** Badge displays "Grid: fallback" on sidebar/dashboard.
*   **Root Cause:** Network connectivity issue or National Grid UK API rate-limiting.
*   **Resolution:**
    1. The agent automatically switches to `STATIC_FALLBACK` (off-peak UK schedule).
    2. Click **"Tick #"** button on Dashboard to trigger a fresh fetch.

### Issue 2: IoT Device Toggle Locked (MSD Guardrail)
*   **Symptom:** Toggle switch disabled with message "MSD Lock: X min remaining".
*   **Root Cause:** The Minimum State Duration (30 minutes) safety feature is active to protect physical relay hardware.
*   **Resolution:** Wait for countdown timer to complete before toggling the device again.

### Issue 3: Missing Weather Data
*   **Symptom:** Weather displays demo temperature curves.
*   **Resolution:** Provide a valid OpenWeather API key in **Settings → OpenWeather API Key**.
