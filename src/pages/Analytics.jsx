import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { TreePine, Car, Zap, Leaf, TrendingDown, DollarSign } from 'lucide-react';

export default function Analytics({ carbonData, savings, schedules }) {
  // Simulated weekly data
  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      optimized: Math.round(80 + Math.random() * 60),
      flat: Math.round(160 + Math.random() * 80),
      carbonSaved: Math.round(50 + Math.random() * 100),
    }));
  }, []);

  const totalWeeklyCarbon = weeklyData.reduce((s, d) => s + d.carbonSaved, 0);
  const totalWeeklyCost = weeklyData.reduce((s, d) => s + (d.flat - d.optimized), 0) / 100;

  // Carbon intensity distribution
  const distribution = useMemo(() => {
    const counts = { 'Very Low': 0, 'Low': 0, 'Moderate': 0, 'High': 0, 'Very High': 0 };
    carbonData.forEach(d => {
      const v = d.intensity.forecast;
      if (v < 80) counts['Very Low']++;
      else if (v < 150) counts['Low']++;
      else if (v < 220) counts['Moderate']++;
      else if (v < 300) counts['High']++;
      else counts['Very High']++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [carbonData]);

  const COLORS = ['#10b981', '#34d399', '#fbbf24', '#f97316', '#ef4444'];

  // Impact conversions
  const treesEquiv = (totalWeeklyCarbon / 21000).toFixed(1); // ~21kg CO2 per tree/year ÷ 52 weeks
  const milesAvoided = (totalWeeklyCarbon / 404).toFixed(1); // 404g CO2 per mile

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Analytics</h2>
        <p>Track your carbon offset and cost savings over time</p>
      </div>

      {/* Impact Cards */}
      <div className="impact-cards">
        <div className="card impact-card" id="impact-carbon">
          <Leaf size={32} color="var(--accent)" style={{ marginBottom: 'var(--space-3)' }} />
          <div className="impact-value" style={{ color: 'var(--accent)' }}>{totalWeeklyCarbon}g</div>
          <div className="impact-label">CO₂ Saved This Week</div>
          <div className="impact-sub">vs. flat schedule baseline</div>
        </div>
        <div className="card impact-card" id="impact-cost">
          <DollarSign size={32} color="var(--amber-400)" style={{ marginBottom: 'var(--space-3)' }} />
          <div className="impact-value" style={{ color: 'var(--amber-400)' }}>${totalWeeklyCost.toFixed(2)}</div>
          <div className="impact-label">Electricity Savings</div>
          <div className="impact-sub">dynamic tariff optimization</div>
        </div>
        <div className="card impact-card" id="impact-trees">
          <TreePine size={32} color="var(--emerald-500)" style={{ marginBottom: 'var(--space-3)' }} />
          <div className="impact-value" style={{ color: 'var(--emerald-500)' }}>≈{treesEquiv}</div>
          <div className="impact-label">Trees Equivalent</div>
          <div className="impact-sub">weekly CO₂ absorption</div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Weekly Cost Comparison */}
        <div className="card" id="chart-weekly-cost">
          <div className="card-header">
            <span className="card-title">Weekly Cost Comparison</span>
            <span className="badge amber">$/kWh</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                />
                <Bar dataKey="flat" fill="rgba(248,113,113,0.5)" name="Flat Schedule (¢)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="optimized" fill="#10b981" name="Optimized (¢)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Carbon Intensity Distribution */}
        <div className="card" id="chart-distribution">
          <div className="card-header">
            <span className="card-title">Today's Intensity Distribution</span>
          </div>
          <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  strokeWidth={0}
                  paddingAngle={3}
                >
                  {distribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
            {distribution.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i] }} />
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Carbon Saved */}
        <div className="card" id="chart-carbon-saved">
          <div className="card-header">
            <span className="card-title">Daily Carbon Avoided</span>
            <span className="badge cyan">gCO₂</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                />
                <Bar dataKey="carbonSaved" fill="#22d3ee" name="CO₂ Avoided (g)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Environmental Impact Card */}
        <div className="card" id="card-env-impact">
          <div className="card-header">
            <span className="card-title">Environmental Equivalents</span>
            <TrendingDown size={16} color="var(--accent)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-4) 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div className="metric-icon green"><TreePine size={24} /></div>
              <div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--accent)' }}>
                  ≈ {treesEquiv} trees
                </div>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                  Weekly CO₂ absorption equivalent
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div className="metric-icon blue"><Car size={24} /></div>
              <div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--blue-400)' }}>
                  ≈ {milesAvoided} miles
                </div>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                  Car driving emissions avoided
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div className="metric-icon amber"><Zap size={24} /></div>
              <div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--amber-400)' }}>
                  {Object.values(schedules).filter(s => s.slots?.length > 0).length} devices
                </div>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                  Currently optimized
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
