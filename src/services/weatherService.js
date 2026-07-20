// Weather Service
// Uses OpenWeather API if key available, otherwise demo data

export async function fetchWeather(apiKey) {
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=London&units=metric&appid=${apiKey}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return {
        data: json.list.slice(0, 16).map(item => ({
          time: item.dt_txt,
          temp: item.main.temp,
          clouds: item.clouds.all,
          humidity: item.main.humidity,
          wind: item.wind.speed,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
        })),
        source: 'live',
        ok: true,
      };
    } catch (err) {
      console.warn('[WeatherService] API failed:', err.message);
    }
  }

  // Demo data: realistic 24h London summer pattern
  const now = new Date();
  const data = Array.from({ length: 16 }, (_, i) => {
    const time = new Date(now.getTime() + i * 3 * 3600 * 1000);
    const hour = time.getHours();
    // Temperature curve: cool at night, warm afternoon
    const baseTemp = 16 + 6 * Math.sin(((hour - 6) / 24) * Math.PI * 2);
    return {
      time: time.toISOString(),
      temp: Math.round(baseTemp * 10) / 10,
      clouds: Math.round(30 + Math.random() * 40),
      humidity: Math.round(55 + Math.random() * 20),
      wind: Math.round((3 + Math.random() * 5) * 10) / 10,
      description: baseTemp > 20 ? 'partly cloudy' : 'overcast clouds',
      icon: baseTemp > 20 ? '02d' : '04d',
    };
  });

  return { data, source: 'demo', ok: true };
}

export function getHVACRecommendation(weatherData) {
  if (!weatherData?.length) return { action: 'idle', reason: 'No data' };
  const current = weatherData[0];
  if (current.temp > 26) return { action: 'cool', reason: `${current.temp}°C — above comfort threshold` };
  if (current.temp < 18) return { action: 'heat', reason: `${current.temp}°C — below comfort threshold` };
  return { action: 'idle', reason: `${current.temp}°C — within comfort range` };
}
