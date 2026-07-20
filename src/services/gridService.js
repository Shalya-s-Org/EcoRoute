// Grid Carbon Intensity Service
// Live data from UK National Grid API (free, no key required)
// Fallback to static UK off-peak data on failure

const API_BASE = 'https://api.carbonintensity.org.uk';
let cachedForecast = null;
let cacheTimestamp = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 min

// Static fallback: typical UK carbon intensity pattern (gCO2/kWh)
const STATIC_FALLBACK = Array.from({ length: 48 }, (_, i) => {
  const hour = i / 2;
  // Low at night (1-5am), peaks at 8am and 6pm
  const base = 180;
  const nightDip = hour >= 1 && hour <= 5 ? -80 : 0;
  const morningPeak = hour >= 7 && hour <= 10 ? 60 : 0;
  const eveningPeak = hour >= 17 && hour <= 20 ? 70 : 0;
  const intensity = base + nightDip + morningPeak + eveningPeak + (Math.random() * 20 - 10);
  const from = new Date();
  from.setHours(Math.floor(hour), (i % 2) * 30, 0, 0);
  const to = new Date(from.getTime() + 30 * 60 * 1000);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    intensity: {
      forecast: Math.round(intensity),
      actual: Math.round(intensity + (Math.random() * 10 - 5)),
      index: intensity < 100 ? 'very low' : intensity < 150 ? 'low' : intensity < 200 ? 'moderate' : intensity < 250 ? 'high' : 'very high',
    },
  };
});

function getIndex(val) {
  if (val < 80) return 'very low';
  if (val < 150) return 'low';
  if (val < 220) return 'moderate';
  if (val < 300) return 'high';
  return 'very high';
}

export async function fetchCarbonIntensity() {
  if (cachedForecast && Date.now() - cacheTimestamp < CACHE_TTL) {
    return { data: cachedForecast, source: 'cache', ok: true };
  }

  try {
    const res = await fetch(`${API_BASE}/intensity/date`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = json.data.map(d => ({
      from: d.from,
      to: d.to,
      intensity: {
        forecast: d.intensity.forecast,
        actual: d.intensity.actual ?? d.intensity.forecast,
        index: d.intensity.index ?? getIndex(d.intensity.forecast),
      },
    }));
    cachedForecast = data;
    cacheTimestamp = Date.now();
    return { data, source: 'live', ok: true };
  } catch (err) {
    console.warn('[GridService] API failed, using fallback:', err.message);
    return { data: STATIC_FALLBACK, source: 'fallback', ok: false, error: err.message };
  }
}

// Simulated tariff pricing ($/kWh) based on carbon intensity pattern
export function generateTariffData(carbonData) {
  return carbonData.map(d => {
    const baseCost = 0.15;
    const intensityFactor = d.intensity.forecast / 200;
    const price = baseCost * (0.5 + intensityFactor);
    return {
      from: d.from,
      to: d.to,
      price: Math.round(price * 1000) / 1000,
    };
  });
}

export function getCurrentIntensity(data) {
  if (!data || !data.length) return null;
  const now = new Date();
  return data.find(d => new Date(d.from) <= now && new Date(d.to) > now) || data[0];
}
