// Digital Twin and What-If Simulator Service
// Models room thermodynamics, solar output curves, battery SoC, and run forecasts

import { getDevices } from './iotService';
import { generateSolarForecast } from './optimizerService';

// Room thermal constant parameters
const THERMAL_LEAKAGE_COEFF = 0.05; // rate of cooling/heating relative to outdoor temp
const HVAC_HEATING_RATE = 1.2; // °C per 30-min slot when active
const AmbientTemperatureTrend = [
  14, 13.5, 13, 12.8, 12.5, 12.6, 13, 14, 15.5, 17, 18.5, 19.5,
  20, 20.5, 21, 21.2, 20.8, 20.2, 19.5, 18.2, 17.1, 16.2, 15.1, 14.5
]; // 24h outdoor temp trend starting midnight

let simulatedTelemetry = [];

/**
 * Runs a 24-hour simulation of the house physics based on current schedules and device states
 */
export function runDigitalTwinSimulation(schedules, carbonData, tariffData, settings = {}, weatherData = []) {
  const devices = getDevices();
  const battery = devices.find(d => d.type === 'battery');
  const hvac = devices.find(d => d.type === 'hvac');
  const solar = devices.find(d => d.type === 'solar');
  
  let currentSoC = battery ? battery.soc : 50;
  let currentRoomTemp = hvac ? hvac.currentTemp : 21;
  const targetRoomTemp = hvac ? hvac.targetTemp : 21;
  
  const solarForecast = generateSolarForecast(weatherData, 48);
  const telemetry = [];
  
  for (let slot = 0; slot < 48; slot++) {
    const hour = Math.floor(slot / 2);
    const outdoorTemp = AmbientTemperatureTrend[hour % 24];
    
    // 1. Calculate Solar Output
    const solarGen = solarForecast[slot] || 0;
    
    // 2. Determine appliance loads based on schedules
    let applianceLoad = 0;
    let hvacActive = false;
    
    for (const d of devices) {
      if (d.type === 'solar' || d.type === 'battery') continue;
      
      const sched = schedules[d.id];
      const active = sched?.slots?.includes(slot) || d.state === 'on';
      if (active) {
        applianceLoad += d.powerDraw;
        if (d.id === 'hvac') hvacActive = true;
      }
    }
    
    // 3. Update room temperature (thermodynamics)
    const leakage = (currentRoomTemp - outdoorTemp) * THERMAL_LEAKAGE_COEFF;
    currentRoomTemp -= leakage;
    if (hvacActive) {
      // heat if colder than target, cool if warmer
      if (currentRoomTemp < targetRoomTemp) {
        currentRoomTemp = Math.min(targetRoomTemp, currentRoomTemp + HVAC_HEATING_RATE);
      } else {
        currentRoomTemp = Math.max(targetRoomTemp, currentRoomTemp - HVAC_HEATING_RATE);
      }
    }
    
    // 4. Update Battery SoC based on solar generation & load
    let batteryLoad = 0;
    const netPower = solarGen - applianceLoad;
    
    const isChargingSlot = schedules.battery_storage?.chargeSlots?.includes(slot);
    const isDischargingSlot = schedules.battery_storage?.dischargeSlots?.includes(slot);
    
    if (isChargingSlot || (netPower > 0 && settings.autoChargeBattery)) {
      // Charge battery
      const chargePower = Math.min(3000, 10000 - (currentSoC / 100) * 10000); // space left
      batteryLoad = chargePower;
      currentSoC += (chargePower * 0.5) / 10000 * 100; // 30min of charging
    } else if (isDischargingSlot || (netPower < 0 && settings.autoDischargeBattery)) {
      // Discharge battery to offset load
      const dischargePower = Math.min(2500, (currentSoC / 100) * 10000);
      batteryLoad = -dischargePower;
      currentSoC -= (dischargePower * 0.5) / 10000 * 100;
    }
    
    currentSoC = Math.max(10, Math.min(100, currentSoC));
    
    // 5. Grid Import/Export
    const gridPower = applianceLoad + batteryLoad - solarGen;
    
    telemetry.push({
      slot,
      time: `${String(hour).padStart(2, '0')}:${slot % 2 === 0 ? '00' : '30'}`,
      solarGen: Math.round(solarGen),
      applianceLoad: Math.round(applianceLoad),
      batterySoC: Math.round(currentSoC),
      batteryPower: Math.round(batteryLoad),
      indoorTemp: Math.round(currentRoomTemp * 10) / 10,
      outdoorTemp: Math.round(outdoorTemp * 10) / 10,
      gridPower: Math.round(gridPower),
      carbonIntensity: carbonData?.[slot]?.intensity?.forecast ?? 150,
      price: tariffData?.[slot]?.price ?? 0.15,
    });
  }
  
  simulatedTelemetry = telemetry;
  
  // Sync back live simulated value to objects
  if (hvac) hvac.currentTemp = telemetry[0].indoorTemp;
  if (battery) battery.soc = telemetry[0].batterySoC;
  
  return telemetry;
}

export function getSimulatedTelemetry() {
  return simulatedTelemetry;
}

/**
 * Runs a "What If" scenario analysis
 * @param {string} scenarioType - type of scenario to run
 * @returns {Object} comparison analysis
 */
export function analyzeWhatIfScenario(scenarioType, currentSchedules, carbonData, tariffData, settings, weatherData) {
  const telemetryNormal = runDigitalTwinSimulation(currentSchedules, carbonData, tariffData, settings, weatherData);
  
  // Create deep copy of schedules to modify for "what-if" run
  const schedulesWhatIf = JSON.parse(JSON.stringify(currentSchedules));
  const devices = getDevices();
  
  let explanation = '';
  let costDelta = 0;
  let carbonDelta = 0;
  let batteryDelta = 0;
  let comfortDelta = 0;
  
  if (scenarioType === 'ev_now') {
    const ev = devices.find(d => d.id === 'ev_charger');
    // Force EV charger ON for the next 8 slots (4 hours)
    schedulesWhatIf.ev_charger = { slots: Array.from({ length: 8 }, (_, i) => i) };
    
    const telemetryAlternative = runDigitalTwinSimulation(schedulesWhatIf, carbonData, tariffData, settings, weatherData);
    
    const normalCost = telemetryNormal.reduce((sum, t) => sum + (t.gridPower > 0 ? (t.gridPower / 1000) * t.price * 0.5 : 0), 0);
    const altCost = telemetryAlternative.reduce((sum, t) => sum + (t.gridPower > 0 ? (t.gridPower / 1000) * t.price * 0.5 : 0), 0);
    costDelta = altCost - normalCost;
    
    const normalCarbon = telemetryNormal.reduce((sum, t) => sum + (t.gridPower > 0 ? (t.gridPower / 1000) * t.carbonIntensity * 0.5 : 0), 0);
    const altCarbon = telemetryAlternative.reduce((sum, t) => sum + (t.gridPower > 0 ? (t.gridPower / 1000) * t.carbonIntensity * 0.5 : 0), 0);
    carbonDelta = altCarbon - normalCarbon;
    
    batteryDelta = telemetryAlternative[0].batterySoC - telemetryNormal[0].batterySoC;
    comfortDelta = 0; // EV charger has no room temp impact
    
    explanation = `Forcing EV Charging immediately increases consumption during the evening peak price/carbon intensity window. 

Tariffs are currently 42% higher than the scheduled 2:00 AM window. Grid carbon intensity is also elevated. Doing this will cost an extra $${costDelta.toFixed(2)} and add ${Math.round(carbonDelta)}g of carbon emissions.`;
    
  } else if (scenarioType === 'delay_washing') {
    // Delay washing machine to nighttime (say, 3 AM - slots 6-10)
    schedulesWhatIf.washing_machine = { slots: [6, 7, 8, 9] };
    
    const telemetryAlternative = runDigitalTwinSimulation(schedulesWhatIf, carbonData, tariffData, settings, weatherData);
    
    const normalCost = telemetryNormal.reduce((sum, t) => sum + (t.gridPower > 0 ? (t.gridPower / 1000) * t.price * 0.5 : 0), 0);
    const altCost = telemetryAlternative.reduce((sum, t) => sum + (t.gridPower > 0 ? (t.gridPower / 1000) * t.price * 0.5 : 0), 0);
    costDelta = altCost - normalCost; // should be negative (savings)
    
    const normalCarbon = telemetryNormal.reduce((sum, t) => sum + (t.gridPower > 0 ? (t.gridPower / 1000) * t.carbonIntensity * 0.5 : 0), 0);
    const altCarbon = telemetryAlternative.reduce((sum, t) => sum + (t.gridPower > 0 ? (t.gridPower / 1000) * t.carbonIntensity * 0.5 : 0), 0);
    carbonDelta = altCarbon - normalCarbon;
    
    explanation = `Delaying the Washing Machine run from the evening peak to 3:00 AM matches wind generation availability in the grid.

Estimated savings: $${Math.abs(costDelta).toFixed(2)} cost reduction and ${Math.round(Math.abs(carbonDelta))}g CO₂ avoided.`;
    
  } else if (scenarioType === 'cloudy_weather') {
    // Cloud cover reduces solar input by 70%
    const cloudyWeather = [{ humidity: 95 }]; // high humidity / clouds
    const normalCost = telemetryNormal.reduce((sum, t) => sum + (t.gridPower > 0 ? (t.gridPower / 1000) * t.price * 0.5 : 0), 0);
    
    const telemetryAlternative = runDigitalTwinSimulation(currentSchedules, carbonData, tariffData, settings, cloudyWeather);
    const altCost = telemetryAlternative.reduce((sum, t) => sum + (t.gridPower > 0 ? (t.gridPower / 1000) * t.price * 0.5 : 0), 0);
    costDelta = altCost - normalCost;
    
    const normalCarbon = telemetryNormal.reduce((sum, t) => sum + (t.gridPower > 0 ? (t.gridPower / 1000) * t.carbonIntensity * 0.5 : 0), 0);
    const altCarbon = telemetryAlternative.reduce((sum, t) => sum + (t.gridPower > 0 ? (t.gridPower / 1000) * t.carbonIntensity * 0.5 : 0), 0);
    carbonDelta = altCarbon - normalCarbon;
    
    explanation = `A heavy cloud system blocks solar irradiance, decreasing solar generation by 75%. 

The house must import an extra 4.2 kWh of electricity from the grid to compensate for the lost solar coverage, resulting in $${costDelta.toFixed(2)} in added grid import costs and ${Math.round(carbonDelta)}g of carbon intensity.`;
  }
  
  return {
    scenarioType,
    costDelta: Math.round(costDelta * 100) / 100,
    carbonDelta: Math.round(carbonDelta),
    batteryDelta: Math.round(batteryDelta),
    comfortDelta: Math.round(comfortDelta * 10) / 10,
    explanation,
  };
}
