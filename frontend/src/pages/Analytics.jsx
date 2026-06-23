import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './Analytics.css';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [hasData, setHasData] = useState(false);
  const [yieldData, setYieldData] = useState([]);
  const [feedstockData, setFeedstockData] = useState([]);
  const [stats, setStats] = useState({
    bestYield: '0.00',
    avgMethane: '0.0',
    totalRuns: 0,
    efficiency: '0'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch('http://localhost:5000/api/predictions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userPredictions = await response.json();

          if (userPredictions.length > 0) {
            setHasData(true);

            const trend = userPredictions
              .slice(-7)
              .map((p, i) => ({
                date: `Run ${i + 1}`,
                yield: p.result.biogasYield,
                methane: p.result.methaneContent
              }));
            setYieldData(trend);

            const feedstockMap = {};
            userPredictions.forEach(p => {
              const name = p.inputs.feedstock || 'Unknown';
              if (!feedstockMap[name]) {
                feedstockMap[name] = { name, yield: 0, count: 0 };
              }
              feedstockMap[name].yield += p.result.biogasYield;
              feedstockMap[name].count += 1;
            });

            const feedstock = Object.values(feedstockMap).map(f => ({
              name: f.name,
              yield: parseFloat((f.yield / f.count).toFixed(2)),
              count: f.count
            }));
            setFeedstockData(feedstock);

            const total = userPredictions.length;
            const avgMethane = (userPredictions.reduce((sum, p) => sum + p.result.methaneContent, 0) / total).toFixed(1);
            const bestYield = Math.max(...userPredictions.map(p => p.result.biogasYield)).toFixed(2);
            const optimalCount = userPredictions.filter(p => p.result.optimalRange).length;
            const efficiency = ((optimalCount / total) * 100).toFixed(0);

            setStats({
              bestYield: `${bestYield} m³/kg`,
              avgMethane: `${avgMethane}%`,
              totalRuns: total,
              efficiency: `${efficiency}%`
            });
          } else {
            setHasData(false);
          }
        } else {
          setHasData(false);
        }
      } catch (e) {
        setHasData(false);
      }
    };

    loadData();
  }, []);

  if (!hasData) {
    return (
      <div className="page-container">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Track your biogas performance trends</p>
        
        <div className="analytics-empty">
          <span className="empty-icon">📊</span>
          <h3>No Data Yet</h3>
          <p>You haven't made any predictions. Start predicting to see your analytics!</p>
          <button className="btn-primary" onClick={() => navigate('/predict')} style={{ marginTop: '20px' }}>
            🔬 Make First Prediction
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="analytics-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Track performance trends and insights</p>
        </div>
        <div className="time-filter">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              className={`filter-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Yield Trend */}
        <div className="chart-card">
          <h3 className="card-title">Your Biogas Yield Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yieldData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="yield" stroke="#FCD34D" strokeWidth={3} dot={{ fill: '#FCD34D', r: 6 }} name="Yield (m³/kg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Methane Content */}
        <div className="chart-card">
          <h3 className="card-title">Your Methane Content Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yieldData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" domain={[50, 75]} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="methane" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 6 }} name="Methane (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Feedstock Comparison */}
        <div className="chart-card full-width">
          <h3 className="card-title">Your Yield by Feedstock Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={feedstockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="yield" fill="#FCD34D" radius={[8, 8, 0, 0]} name="Avg Yield (m³/kg)" />
              <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Predictions Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="analytics-stats">
        <div className="stat-box">
          <span className="stat-label">Best Yield</span>
          <span className="stat-value">{stats.bestYield}</span>
          <span className="stat-sub">Your best result</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Avg. Methane</span>
          <span className="stat-value">{stats.avgMethane}</span>
          <span className="stat-sub">Average across runs</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Total Runs</span>
          <span className="stat-value">{stats.totalRuns}</span>
          <span className="stat-sub">Your predictions</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Efficiency</span>
          <span className="stat-value">{stats.efficiency}</span>
          <span className="stat-sub">Optimal runs</span>
        </div>
      </div>
    </div>
  );
};

export default Analytics;