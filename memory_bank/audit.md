# Security and Reliability Audit

## Project: EcoRoute — Smart-Grid Energy Optimizer Agent

---

## 1. Audit Overview
This audit evaluates the reliability, security, and integrity of EcoRoute's proposed integration system. Because EcoRoute has physical-world control over high-power home appliances, safety-critical guardrails are paramount.

---

## 2. Threat Modeling & Vulnerability Analysis

### Threat T-1: API Token Leakage (High Severity)
*   **Vulnerability:** Environment variables containing Home Assistant Long-Lived Access Tokens or OpenWeather API keys getting serialized into debugging logs or webhook payloads.
*   **Mitigation:** 
    *   Implement a log-scrubbing utility that filters out substrings matching key patterns (e.g., `eyJ...` for JWTs).
    *   Utilize standard `.env` patterns, enforced by `dotenv-safe`, and ensure `.env` is globally git-ignored.

### Threat T-2: Rapid-Cycling relay fatigue (Medium Severity)
*   **Vulnerability:** A fluctuating carbon intensity forecast or code bug could cause the optimizer to toggle a physical relay (e.g., HVAC power line) on and off every few minutes, damaging the physical device.
*   **Mitigation:** 
    *   Enforce a **Minimum State Duration (MSD)** of 30 minutes in the core controller logic.
    *   Once a device is toggled ON, it cannot be toggled OFF by the optimization loop until 30 minutes have elapsed, unless a manual safety override command is issued by the user.

### Threat T-3: Replay Attacks / Unauthenticated Hook Control (Medium Severity)
*   **Vulnerability:** A malicious actor sending spoofed webhook responses to trigger grid load surges.
*   **Mitigation:** 
    *   The agent only initiates egress calls. Ingress webhooks (if implemented for manual overrides) must validate signatures (e.g., HMAC-SHA256 signature verification for Discord commands).

---

## 3. Data Integrity & Validation Guardrails

### Input Sanitation
Grid data, weather data, and custom user input deadlines must be validated schema-wise using a validation library (e.g., `zod` in TypeScript or `pydantic` in Python):
```typescript
import { z } from 'zod';

export const GridForecastSchema = z.array(z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  intensity: z.object({
    forecast: z.number().nonnegative(),
    actual: z.number().nonnegative(),
    index: z.enum(['very low', 'low', 'moderate', 'high', 'very high'])
  })
}));
```

---

## 4. Fail-Safe Operations (Offline & Error Modes)
- **API Failure Fallback:** If the external APIs are down, the agent defaults to running on local time schedules (e.g. charge EV between 01:00 AM and 05:00 AM only).
- **IoT Outage:** If a smart plug is offline, the agent fires a Priority Discord alert indicating that the optimization schedule failed execution. It retries at 1, 3, and 10 minutes before terminating the queue event.
