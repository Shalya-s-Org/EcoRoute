// Optimization Engine
// Solves: min Σ (w1·C(t) + w2·P(t)) subject to runtime and deadline constraints

/**
 * Find optimal run slots for a device given carbon + tariff forecasts.
 * @param {Object} params
 * @param {number} params.requiredSlots - Number of 30-min slots needed
 * @param {string} params.deadline - HH:MM deadline
 * @param {Array} params.carbonData - [{from, to, intensity: {forecast}}]
 * @param {Array} params.tariffData - [{from, to, price}]
 * @param {number} params.carbonWeight - 0-1
 * @param {number} params.costWeight - 0-1
 * @returns {Array} Selected slot indices sorted by time
 */
export function optimizeSchedule({
  requiredSlots,
  deadline,
  carbonData,
  tariffData,
  carbonWeight = 0.5,
  costWeight = 0.5,
}) {
  if (!carbonData?.length || requiredSlots <= 0) return [];

  // Filter to only slots before deadline
  const now = new Date();
  const deadlineDate = new Date();
  const [dh, dm] = (deadline || '23:59').split(':').map(Number);
  deadlineDate.setHours(dh, dm, 0, 0);
  if (deadlineDate <= now) deadlineDate.setDate(deadlineDate.getDate() + 1);

  const availableSlots = carbonData
    .map((slot, i) => ({
      index: i,
      from: new Date(slot.from),
      to: new Date(slot.to),
      carbon: slot.intensity.forecast,
      price: tariffData?.[i]?.price ?? 0.15,
    }))
    .filter(s => s.from >= now && s.to <= deadlineDate);

  if (availableSlots.length < requiredSlots) {
    // Not enough slots — use all available
    return availableSlots.map(s => s.index);
  }

  // Normalize carbon and price to [0,1]
  const maxCarbon = Math.max(...availableSlots.map(s => s.carbon), 1);
  const minCarbon = Math.min(...availableSlots.map(s => s.carbon), 0);
  const maxPrice = Math.max(...availableSlots.map(s => s.price), 0.01);
  const minPrice = Math.min(...availableSlots.map(s => s.price), 0);

  const scored = availableSlots.map(s => ({
    ...s,
    score:
      carbonWeight * ((s.carbon - minCarbon) / (maxCarbon - minCarbon || 1)) +
      costWeight * ((s.price - minPrice) / (maxPrice - minPrice || 1)),
  }));

  // Sort by score (lowest = best), pick top N
  scored.sort((a, b) => a.score - b.score);
  const selected = scored.slice(0, requiredSlots).map(s => s.index);
  selected.sort((a, b) => a - b); // chronological order

  return selected;
}

/**
 * Run optimization for all devices.
 */
export function optimizeAllDevices(devices, carbonData, tariffData, settings = {}) {
  const carbonWeight = settings.carbonWeight ?? 0.6;
  const costWeight = settings.costWeight ?? 0.4;

  const schedules = {};
  for (const device of devices) {
    if (device.requiredRuntime <= 0 || !device.deadline) {
      schedules[device.id] = { slots: [], reason: 'No runtime requirement' };
      continue;
    }
    const requiredSlots = device.requiredRuntime * 2; // 30-min slots
    const slots = optimizeSchedule({
      requiredSlots,
      deadline: device.deadline,
      carbonData,
      tariffData,
      carbonWeight,
      costWeight,
    });

    // Calculate savings vs flat schedule
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
      reason: slots.length > 0 ? 'Optimized' : 'No available slots',
    };
  }
  return schedules;
}

/**
 * Calculate total estimated savings across all devices.
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
