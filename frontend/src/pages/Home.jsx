import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');
  const [stats, setStats] = useState([
    { label: 'Total Predictions', value: '0', icon: '📊', color: '#FCD34D' },
    { label: 'Avg. Biogas Yield', value: '0.00 m³/kg', icon: '⚡', color: '#10B981' },
    { label: 'Avg. Methane %', value: '0.0%', icon: '🔥', color: '#3B82F6' },
    { label: 'Optimization Score', value: '-/10', icon: '⭐', color: '#F59E0B' },
  ]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [hasPredictions, setHasPredictions] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserName(user.fullName || 'User');
      } catch (e) {
        setUserName('User');
      }
    }

    const loadPredictions = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`${API_URL}/api/predictions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userPredictions = await response.json();

          if (userPredictions.length > 0) {
            setHasPredictions(true);

            const total = userPredictions.length;
            const avgYield = (userPredictions.reduce((sum, p) => sum + p.result.biogasYield, 0) / total).toFixed(2);
            const avgMethane = (userPredictions.reduce((sum, p) => sum + p.result.methaneContent, 0) / total).toFixed(1);
            const optimalCount = userPredictions.filter(p => p.result.optimalRange).length;
            const score = ((optimalCount / total) * 10).toFixed(1);

            setStats([
              { label: 'Total Predictions', value: total.toString(), icon: '📊', color: '#FCD34D' },
              { label: 'Avg. Biogas Yield', value: `${avgYield} m³/kg`, icon: '⚡', color: '#10B981' },
              { label: 'Avg. Methane %', value: `${avgMethane}%`, icon: '🔥', color: '#3B82F6' },
              { label: 'Optimization Score', value: `${score}/10`, icon: '⭐', color: '#F59E0B' },
            ]);

            const activity = userPredictions
              .slice(-5)
              .reverse()
              .map((p, index) => ({
                id: p._id || p.id || index,
                action: `Prediction: ${p.inputs.feedstock}`,
                date: formatDate(p.createdAt),
                yield: `${p.result.biogasYield.toFixed(2)} m³/kg`,
                status: p.result.optimalRange ? 'optimal' : 'suboptimal'
              }));

            setRecentActivity(activity);
          } else {
            setHasPredictions(false);
          }
        } else {
          setHasPredictions(false);
        }
      } catch (e) {
        setHasPredictions(false);
      }
    };

    loadPredictions();
  }, []);

  return (
    <div className="page-container">
      <h1 className="page-title">Welcome back, {userName}! 👋</h1>
      <p className="page-subtitle">Overview of your biogas optimization performance</p>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="quick-actions">
        <h3 className="section-title">Quick Actions</h3>
        <div className="action-buttons">
          <button className="btn-primary" onClick={() => navigate('/predict')}>
            🔬 New Prediction
          </button>
          <button className="btn-secondary" onClick={() => navigate('/history')}>
            📜 View History
          </button>
          <button className="btn-secondary" onClick={() => navigate('/analytics')}>
            📈 Analytics
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <h3 className="section-title">Recent Activity</h3>
        {hasPredictions ? (
          <div className="activity-list">
            {recentActivity.map((item) => (
              <div key={item.id} className="activity-item">
                <div className={`activity-dot ${item.status}`}></div>
                <div className="activity-content">
                  <span className="activity-action">{item.action}</span>
                  <span className="activity-date">{item.date}</span>
                </div>
                <span className="activity-yield">{item.yield}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-activity">
            <span className="empty-icon">📭</span>
            <p className="empty-text">No activity yet</p>
            <p className="empty-subtitle">Make your first prediction to see activity here!</p>
            <button className="btn-primary" onClick={() => navigate('/predict')} style={{ marginTop: '12px' }}>
              🔬 Start Predicting
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;