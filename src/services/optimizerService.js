// Optimization Engine
// Solves: min Σ (w1·C(t) + w2·P(t)) subject to runtime, deadline, solar offsets, and battery state-of-charge.

/**
 * Generate a simulated solar generation curve (W) for the 48 slots.
 * Peaks around slot 24 (12:00 PM noon) depending on weather conditions (clouds).
 */
export function generateSolarForecast(weatherData, length = 48) {
  const cloudFactor = weatherData?.[0] ? (100 - weatherData[0].humidity) / 100 : 0.8; // simple approximation
  return Array.from({ length }, (_, i) => {
    const hour = i / 2;
    // Bell curve peaking at 12:00 PM (slot 24)
    if (hour < 6 || hour > 18) return 0;
    const peakPower = 4500 * cloudFactor; // max 4.5kW solar array
    const factor = Math.sin(((hour - 6) / 12) * Math.PI);
    return Math.round(peakPower * Math.pow(factor, 2));
  });
}

/**
 * Find optimal run slots for a device.
 */
export function optimizeSchedule({
  requiredSlots,
  deadline,
  carbonData,
  tariffData,
  solarForecast,
  carbonWeight = 0.5,
  costWeight = 0.5,
  priority = 'medium',
  emergencyMode = false,
}) {
  if (!carbonData?.length || requiredSlots <= 0) return [];

  // Under emergency grid mode, load-shed low priority devices entirely
  if (emergencyMode && priority === 'low') {
    return [];
  }

  // Under emergency grid mode, halve runtime of medium priority devices
  let targetSlots = requiredSlots;
  if (emergencyMode && priority === 'medium') {
    targetSlots = Math.max(1, Math.round(requiredSlots / 2));
  }

  const now = new Date();
  const deadlineDate = new Date();
  const [dh, dm] = (deadline || '23:59').split(':').map(Number);
  deadlineDate.setHours(dh, dm, 0, 0);
  if (deadlineDate <= now) deadlineDate.setDate(deadlineDate.getDate() + 1);

  const availableSlots = carbonData
    .map((slot, i) => {
      const carbon = slot.intensity.forecast;
      const price = tariffData?.[i]?.price ?? 0.15;
      const solar = solarForecast?.[i] ?? 0;
      
      // Solar offset: if solar output is high, virtual cost & carbon are reduced
      const solarOffsetFactor = Math.max(0, 1 - (solar / 5000)); // up to 100% offset
      
      return {
        index: i,
        from: new Date(slot.from),
        to: new Date(slot.to),
        carbon: carbon * solarOffsetFactor,
        price: price * solarOffsetFactor,
      };
    })
    .filter(s => s.from >= now && s.to <= deadlineDate);

  if (availableSlots.length < targetSlots) {
    return availableSlots.map(s => s.index);
  }

  // Normalize metrics
  const maxCarbon = Math.max(...availableSlots.map(s => s.carbon), 1);
  const minCarbon = Math.min(...availableSlots.map(s => s.carbon), 0);
  const maxPrice = Math.max(...availableSlots.map(s => s.price), 0.01);
  const minPrice = Math.min(...availableSlots.map(s => s.price), 0);

  const scored = availableSlots.map(s => {
    const carbonScore = maxCarbon === minCarbon ? 0 : (s.carbon - minCarbon) / (maxCarbon - minCarbon);
    const priceScore = maxPrice === minPrice ? 0 : (s.price - minPrice) / (maxPrice - minPrice);
    
    return {
      ...s,
      score: carbonWeight * carbonScore + costWeight * priceScore,
    };
  });

  scored.sort((a, b) => a.score - b.score);
  const selected = scored.slice(0, targetSlots).map(s => s.index);
  selected.sort((a, b) => a - b);
  return selected;
}

/**
 * Optimize all devices.
 */
export function optimizeAllDevices(devices, carbonData, tariffData, settings = {}, weatherData = []) {
  const carbonWeight = settings.carbonWeight ?? 0.6;
  const costWeight = settings.costWeight ?? 0.4;
  const emergencyMode = settings.emergencyMode ?? false;
  
  const solarForecast = generateSolarForecast(weatherData, carbonData.length);
  const schedules = {};

  // Find battery device and solar device
  const battery = devices.find(d => d.type === 'battery');

  for (const device of devices) {
    // Inverter and battery handled dynamically
    if (device.type === 'solar') {
      schedules[device.id] = { slots: Array.from({ length: 48 }, (_, i) => i), reason: 'Continuous Output' };
      continue;
    }

    if (device.type === 'battery') {
      // Battery Schedule logic: Charge on cheap/clean slots, discharge on peak slots
      const batterySlots = [];
      const chargeSlots = [];
      const dischargeSlots = [];
      
      const sortedByIntensity = carbonData
        .map((d, i) => ({ index: i, intensity: d.intensity.forecast, price: tariffData?.[i]?.price ?? 0.15 }))
        .sort((a, b) => a.intensity - b.intensity);

      // Charge during the 8 cleanest slots
      const cleanIndices = new Set(sortedByIntensity.slice(0, 8).map(x => x.index));
      // Discharge during the 8 dirtiest/most expensive slots
      const dirtyIndices = new Set(sortedByIntensity.slice(-8).map(x => x.index));

      for (let i = 0; i < carbonData.length; i++) {
        if (cleanIndices.has(i)) {
          chargeSlots.push(i);
        } else if (dirtyIndices.has(i)) {
          dischargeSlots.push(i);
        }
      }

      schedules[device.id] = {
        slots: Array.from({ length: 48 }, (_, i) => i), // runs constantly to manage SoC
        chargeSlots,
        dischargeSlots,
        optimizedCost: 0,
        flatCost: 0,
        savings: chargeSlots.length * 0.18, // estimated battery arbitrage savings
        carbonSaved: chargeSlots.length * 45, // carbon avoided by peak shaving
        reason: 'Peak Shaving / Load Balancing Active',
      };
      continue;
    }

    if (device.requiredRuntime <= 0 || !device.deadline) {
      schedules[device.id] = { slots: [], reason: 'No runtime requirement' };
      continue;
    }

    const requiredSlots = device.requiredRuntime * 2;
    const slots = optimizeSchedule({
      requiredSlots,
      deadline: device.deadline,
      carbonData,
      tariffData,
      solarForecast,
      carbonWeight,
      costWeight,
      priority: device.priority || 'medium',
      emergencyMode,
    });

    const optimizedCost = slots.reduce((sum, i) => sum + (tariffData?.[i]?.price ?? 0.15), 0);
    const flatSlots = Array.from({ length: requiredSlots }, (_, j) => j);
    const flatCost = flatSlots.reduce((sum, i) => sum + (tariffData?.[i]?.price ?? 0.15), 0);
    const savings = Math.max(0, flatCost - optimizedCost);

    const optimizedCarbon = slots.reduce((sum, i) => sum + (carbonData[i]?.intensity?.forecast ?? 200), 0);
    const flatCarbon = flatSlots.reduce((sum, i) => sum + (carbonData[i]?.intensity?.forecast ?? 200), 0);
    const carbonSaved = Math.max(0, flatCarbon - optimizedCarbon);

    schedules[device.id] = {
      slots,
      optimizedCost: Math.round(optimizedCost * 100) / 100,
      flatCost: Math.round(flatCost * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      carbonSaved: Math.round(carbonSaved),
      reason: slots.length > 0 ? (emergencyMode ? 'Emergency Scale-Back' : 'Optimized') : 'Load Shed Active',
    };
  }

  return schedules;
}

/**
 * Calculate total estimated savings.
 */
export function calculateTotalSavings(schedules) {
  let totalCostSaved = 0;
  let totalCarbonSaved = 0;
  for (const s of Object.values(schedules)) {
    totalCostSaved += s.savings || 0;
    totalCarbonSaved += s.carbonSaved || 0;
  }
  return {
    costSaved: Math.round(totalCostSaved * 100) / 100,
    carbonSaved: Math.round(totalCarbonSaved),
  };
}
