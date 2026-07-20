# Error Log & Troubleshooting Guide

## Project: EcoRoute — Smart-Grid Energy Optimizer Agent

---

## 1. Simulated Error Log
Below is a reproduction of real-world runtime exceptions encountered during agent validation loops and external system outages.

```text
[2026-07-20T12:00:05.102Z] INFO: Starting hourly optimization tick...
[2026-07-20T12:00:05.412Z] ERROR: [GridConnector] Fetch failed for endpoint '/intensity'. Response code 503 (Service Unavailable).
[2026-07-20T12:00:05.413Z] WARN: [AgentCore] External Grid API is unreachable. Activating fallback configuration: 'STATIC_CHEAP_HOURS_UK'.
[2026-07-20T12:00:05.415Z] INFO: [Optimizer] Scheduled execution slots resolved: [01:00 - 05:00] (Fallback mode).
[2026-07-20T12:00:05.416Z] INFO: Optimization tick complete.
...
[2026-07-20T13:00:00.005Z] INFO: Starting hourly optimization tick...
[2026-07-20T13:00:00.650Z] INFO: [GridConnector] Ingested forecast values. Lowest-carbon slots found: [03:00, 03:30, 04:00, 04:30].
[2026-07-20T13:00:00.670Z] INFO: [IoTConnector] Attempting turn_on for switch.ev_charger_plug...
[2026-07-20T13:00:05.800Z] ERROR: [IoTConnector] Connection to Home Assistant host '192.168.1.145:8123' timed out.
[2026-07-20T13:00:05.801Z] WARN: [IoTConnector] Retrying turn_on command. Attempt 1/3 in 60s...
[2026-07-20T13:01:05.810Z] ERROR: [IoTConnector] Command failed. switch.ev_charger_plug is currently reporting offline.
[2026-07-20T13:01:05.820Z] ERROR: [AgentCore] Critical Action Failure. Device execution slot [13:00] failed.
[2026-07-20T13:01:05.825Z] INFO: [Notifier] Dispatched HIGH-priority Slack alert for 'switch.ev_charger_plug execution failure'.
```

---

## 2. Troubleshooting & Recovery Procedures

### Issue 1: Grid API 503 / Timeout
*   **Root Cause:** Rate-limiting or service outage on the National Grid Carbon API.
*   **Resolution:** 
    1.  Ensure you have caching implemented. Store the last successful 24-hour forecast locally in `db.json`.
    2.  Check if the API has been updated to require a registration token.
    3.  Ensure the fallback scheduler in `config/default.json` matches your regional off-peak tariff hours.

### Issue 2: IoT Device Offline / Host Unreachable
*   **Root Cause:** Local network DHCP changed the IP address of the Home Assistant hub or smart gateway, or the smart plug lost Wi-Fi connectivity.
*   **Resolution:**
    1.  Assign a static IP reservation to the smart home gateway on your router.
    2.  Check the webhook/REST token configuration in `.env` to verify the bearer token hasn't expired.
    3.  Inspect if the device responds to manual toggle via the native Tuya/Home Assistant UI; if not, cycle power to the plug.
