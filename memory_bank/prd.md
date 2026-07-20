# Product Requirements Document (PRD)

## Project: EcoRoute — Smart-Grid Energy Optimizer Agent

---

## 1. Executive Summary
EcoRoute is an intelligent, autonomous energy optimization agent designed to reduce carbon footprints and household electricity bills. By bridging real-time smart-home endpoints with external grid forecasts (price and carbon intensity), EcoRoute automatically schedules high-power appliances (EV chargers, HVAC units, water heaters) to run during optimal windows.

---

## 2. Objective & Scope
The goal of EcoRoute is to demonstrate a production-ready, agentic integration that connects:
1.  **Grid Data Providers** (e.g., UK National Grid Carbon Intensity API, OpenEI, or regional dynamic pricing APIs).
2.  **Weather Forecasts** (to model thermal dynamics and ambient heating/cooling requirements).
3.  **Smart IoT APIs** (e.g., Home Assistant, Tuya Cloud) to execute physical toggles.

### In Scope
- Real-time polling and analysis of grid carbon intensity and electricity prices.
- 24-hour predictive optimization scheduling based on local weather conditions.
- Automated API-driven control of registered IoT devices.
- Fallback mechanisms for offline devices.
- Verification and audit logging of actions via instant alerts (Slack/Telegram).

### Out of Scope
- Direct hardware wiring or firmware modification.
- Multi-user billing and merchant payment settlements (focused on a single-household/control node).

---

## 3. Target Audience & User Personas
- **Eco-Conscious Homeowners:** Users who want to minimize their carbon footprint without manual intervention.
- **Dynamic Tariff Customers:** Consumers on time-of-use tariffs (e.g., Octopus Agile, Amber Electric) looking to avoid high cost spikes.

---

## 4. Functional Requirements

### FR-1: Data Ingestion & Normalization
- The agent must ingest grid carbon data (gCO₂/kWh) and tariff data ($/kWh) every 30 minutes.
- Weather data (temperature, solar irradiance) must be ingested at least every 4 hours.

### FR-2: Intelligent Scheduler
- The agent must generate a daily optimized run schedule for registered appliances.
- High-power events (e.g., EV charging) should be assigned to the lowest cost/carbon windows.
- Users must be able to specify constraints (e.g., "EV must be charged to 80% by 07:00 AM").

### FR-3: IoT Device Control
- The agent must issue start/stop commands to smart plugs or smart chargers using standard APIs (Home Assistant REST/Websockets).
- Read actual power consumption to verify that the device reacted to the control signal.

### FR-4: Real-time Alerting and Verification
- The agent must notify the user via webhook (Discord/Slack/Telegram) when state changes are executed.
- Weekly performance summaries must report carbon offset and financial savings.

---

## 5. Non-Functional Requirements

### NFR-1: Reliability & Fault Tolerance
- If the Grid API is unreachable, the system must fall back to a conservative default static time-of-use table.
- IoT command retries must use exponential backoff (max 3 retries over 5 minutes).

### NFR-2: Security & Privacy
- Local smart home tokens and API keys must be securely stored using environment variables. No credentials should be written to logs.

### NFR-3: Latency
- The optimization computation must complete in under 5 seconds to ensure rapid scheduling adjustments.

---

## 6. Success Metrics
- **Carbon Reduction:** Achieve a minimum of 15% reduction in grid carbon intensity per kWh consumed by optimized devices.
- **Cost Savings:** Achieve a 20-30% reduction in electricity costs compared to flat-schedule baselines on dynamic tariffs.
- **Verification Rate:** >99% success rate on scheduled smart plug state toggles.
