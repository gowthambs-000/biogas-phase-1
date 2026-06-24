import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Recommendations.css';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('last_prediction');
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.inputs && parsed.result) {
          setPrediction(parsed);
          const recs = generateRecommendations(parsed.inputs, parsed.result);
          setRecommendations(recs);
        }
      } catch (e) {
        console.error('Invalid prediction data');
      }
    }
    
    setLoading(false);
  }, []);

  const generateRecommendations = (inputs, result) => {
    const recs = [];

    // Temperature check (optimal: 35-37°C for mesophilic)
    const temp = parseFloat(inputs.temperature);
    if (temp < 35) {
      const diff = 35 - temp;
      const priority = diff > 5 ? 'high' : 'medium';
      recs.push({
        id: 'temp',
        icon: '🌡️',
        title: 'Increase Digester Temperature',
        description: `Current temperature (${temp}°C) is below optimal range. Increase to 35-37°C for better mesophilic bacterial activity.`,
        priority,
        gain: (diff * 0.015).toFixed(2),
        action: 'Adjust heating system',
        metric: `${temp}°C → 35-37°C`
      });
    } else if (temp > 37) {
      const diff = temp - 37;
      const priority = diff > 5 ? 'high' : 'medium';
      recs.push({
        id: 'temp',
        icon: '🌡️',
        title: 'Decrease Digester Temperature',
        description: `Current temperature (${temp}°C) is above optimal range. Reduce to 35-37°C to prevent bacterial inhibition.`,
        priority,
        gain: (diff * 0.012).toFixed(2),
        action: 'Reduce heating or increase cooling',
        metric: `${temp}°C → 35-37°C`
      });
    }

    // pH check (optimal: 6.8-7.2)
    const ph = parseFloat(inputs.ph);
    if (ph < 6.8) {
      const diff = 6.8 - ph;
      const priority = diff > 0.5 ? 'high' : 'medium';
      recs.push({
        id: 'ph',
        icon: '⚗️',
        title: 'Increase pH Level',
        description: `pH is acidic at ${ph}. Optimal range is 6.8-7.2 for methanogenic bacteria. Low pH inhibits methane production.`,
        priority,
        gain: (diff * 0.04).toFixed(2),
        action: 'Add buffering agent (NaHCO₃ or CaCO₃)',
        metric: `${ph} → 6.8-7.2`
      });
    } else if (ph > 7.2) {
      const diff = ph - 7.2;
      const priority = diff > 0.5 ? 'high' : 'medium';
      recs.push({
        id: 'ph',
        icon: '⚗️',
        title: 'Decrease pH Level',
        description: `pH is alkaline at ${ph}. Optimal range is 6.8-7.2. High pH can cause ammonia toxicity.`,
        priority,
        gain: (diff * 0.03).toFixed(2),
        action: 'Add acidic buffer or dilute feedstock',
        metric: `${ph} → 6.8-7.2`
      });
    }

    // HRT check (optimal: 20-30 days)
    const hrt = parseFloat(inputs.hrt);
    if (hrt < 20) {
      const diff = 20 - hrt;
      const priority = diff > 10 ? 'high' : 'medium';
      recs.push({
        id: 'hrt',
        icon: '⏱️',
        title: 'Increase Hydraulic Retention Time',
        description: `HRT of ${hrt} days is too short. Insufficient time for complete digestion. Increase to 20-30 days.`,
        priority,
        gain: (diff * 0.008).toFixed(2),
        action: 'Reduce feed rate or increase digester volume',
        metric: `${hrt} days → 20-30 days`
      });
    } else if (hrt > 30) {
      const diff = hrt - 30;
      recs.push({
        id: 'hrt',
        icon: '⏱️',
        title: 'Decrease Hydraulic Retention Time',
        description: `HRT of ${hrt} days is longer than necessary. May reduce throughput efficiency.`,
        priority: 'low',
        gain: (diff * 0.003).toFixed(2),
        action: 'Increase feed rate gradually',
        metric: `${hrt} days → 20-30 days`
      });
    }

    // OLR check (optimal: 2-4 kg VS/m³/day)
    const olr = parseFloat(inputs.olr);
    if (olr > 4) {
      const diff = olr - 4;
      const priority = diff > 2 ? 'high' : 'medium';
      recs.push({
        id: 'olr',
        icon: '⚖️',
        title: 'Reduce Organic Loading Rate',
        description: `OLR of ${olr} kg VS/m³/day is too high. Risk of acidification and digester failure.`,
        priority,
        gain: (diff * 0.02).toFixed(2),
        action: 'Dilute feedstock or reduce feed quantity',
        metric: `${olr} → 2-4 kg VS/m³/day`
      });
    } else if (olr < 2) {
      const diff = 2 - olr;
      recs.push({
        id: 'olr',
        icon: '⚖️',
        title: 'Increase Organic Loading Rate',
        description: `OLR of ${olr} kg VS/m³/day is underutilizing digester capacity. Increase feed for better yield.`,
        priority: 'low',
        gain: (diff * 0.015).toFixed(2),
        action: 'Increase feedstock concentration',
        metric: `${olr} → 2-4 kg VS/m³/day`
      });
    }

    // C/N ratio check (optimal: 25-30)
    const cn = parseFloat(inputs.cn);
    if (cn && cn < 25) {
      const diff = 25 - cn;
      const priority = diff > 5 ? 'high' : 'medium';
      recs.push({
        id: 'cn',
        icon: '🌾',
        title: 'Optimize Feedstock Mix',
        description: `Current C/N ratio of ${cn} is low. Nitrogen excess causes ammonia inhibition. Mix with carbon-rich materials.`,
        priority,
        gain: (diff * 0.012).toFixed(2),
        action: 'Add straw, sawdust, or paper waste',
        metric: `${cn} → 25-30`
      });
    } else if (cn && cn > 30) {
      const diff = cn - 30;
      recs.push({
        id: 'cn',
        icon: '🌾',
        title: 'Optimize Feedstock Mix',
        description: `Current C/N ratio of ${cn} is high. Carbon excess slows digestion. Add nitrogen-rich materials.`,
        priority: 'medium',
        gain: (diff * 0.01).toFixed(2),
        action: 'Add manure, legumes, or urea',
        metric: `${cn} → 25-30`
      });
    }

    // Moisture check (optimal: 85-95%)
    const moisture = parseFloat(inputs.moisture);
    if (moisture && moisture < 85) {
      recs.push({
        id: 'moisture',
        icon: '💧',
        title: 'Increase Moisture Content',
        description: `Moisture at ${moisture}% is below optimal. Bacterial activity requires 85-95% moisture.`,
        priority: 'medium',
        gain: '0.04',
        action: 'Add water or dilute feedstock',
        metric: `${moisture}% → 85-95%`
      });
    }

    // If result is not optimal, add general recommendation
    if (!result.optimalRange) {
      recs.push({
        id: 'general',
        icon: '🔧',
        title: 'Review Overall Process Parameters',
        description: 'Multiple parameters are outside optimal range. Consider a systematic review of digester conditions.',
        priority: 'low',
        gain: '0.02',
        action: 'Consult process engineer',
        metric: 'Suboptimal → Optimal'
      });
    }

    // Sort by priority: high > medium > low
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return { bg: '#FEE2E2', color: '#DC2626', border: '#EF4444' };
      case 'medium': return { bg: '#FEF3C7', color: '#D97706', border: '#F59E0B' };
      case 'low': return { bg: '#D1FAE5', color: '#059669', border: '#10B981' };
      default: return { bg: '#F3F4F6', color: '#6B7280', border: '#9CA3AF' };
    }
  };

  const filteredRecs = filter === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.priority === filter);

  const totalGain = recommendations.reduce((sum, r) => sum + parseFloat(r.gain), 0).toFixed(2);
  const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title">Recommendations</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="page-container">
        <h1 className="page-title">Recommendations</h1>
        <p className="page-subtitle">AI-generated tips to improve your biogas yield</p>
        
        <div className="analytics-empty" style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-card)', borderRadius: '16px', marginTop: '24px' }}>
          <span style={{ fontSize: '64px', display: 'block', marginBottom: '20px' }}>💡</span>
          <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>No Prediction Data</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '20px' }}>
            Make a prediction first to get personalized recommendations based on your digester parameters.
          </p>
          <button className="btn-primary" onClick={() => navigate('/predict')} style={{ marginTop: '20px' }}>
            🔬 Make a Prediction
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Recommendations</h1>
      <p className="page-subtitle">AI-generated tips to improve your biogas yield</p>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#F3F4F6', color: '#374151' }}>📋</div>
          <div className="stat-info">
            <span className="stat-value">{recommendations.length}</span>
            <span className="stat-label">Total Actions</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>🔴</div>
          <div className="stat-info">
            <span className="stat-value">{highPriorityCount}</span>
            <span className="stat-label">High Priority</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#D1FAE5', color: '#059669' }}>📈</div>
          <div className="stat-info">
            <span className="stat-value">+{totalGain}</span>
            <span className="stat-label">Potential Gain (m³/kg)</span>
          </div>
        </div>
      </div>

      {/* Input Summary */}
      <div className="result-card" style={{ marginBottom: '24px', padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Current Parameters</h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px' }}>
          <span>🌡️ Temp: <strong>{prediction.inputs.temperature}°C</strong></span>
          <span>⚗️ pH: <strong>{prediction.inputs.ph}</strong></span>
          <span>⏱️ HRT: <strong>{prediction.inputs.hrt} days</strong></span>
          <span>⚖️ OLR: <strong>{prediction.inputs.olr} kg VS/m³/day</strong></span>
          <span>🌾 Feedstock: <strong>{prediction.inputs.feedstock}</strong></span>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="time-filter" style={{ marginBottom: '24px' }}>
        {['all', 'high', 'medium', 'low'].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
            style={{ textTransform: 'capitalize' }}
          >
            {f === 'all' ? 'All Priority' : `${f} Priority`}
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      <div className="recommendations-list">
        {filteredRecs.length > 0 ? (
          filteredRecs.map((rec) => {
            const style = getPriorityColor(rec.priority);
            return (
              <div 
                key={rec.id} 
                className="result-card"
                style={{ 
                  marginBottom: '16px', 
                  padding: '24px',
                  borderLeft: `4px solid ${style.border}`,
                  transition: 'transform 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>{rec.icon}</span>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{rec.title}</h3>
                  </div>
                  <span 
                    style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: style.bg,
                      color: style.color
                    }}
                  >
                    {rec.priority}
                  </span>
                </div>
                
                <p style={{ color: 'var(--text-medium)', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
                  {rec.description}
                </p>

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px' }}>
                  <span style={{ color: '#059669', fontWeight: 600 }}>
                    📈 +{rec.gain} m³/kg potential gain
                  </span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    🔧 {rec.action}
                  </span>
                  <span style={{ color: 'var(--text-light)' }}>
                    📊 {rec.metric}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: '60px' }}>
            <span style={{ fontSize: '48px' }}>✅</span>
            <h3>All Parameters Optimal!</h3>
            <p>Your digester parameters are within ideal ranges. No corrective actions needed.</p>
          </div>
        )}
      </div>

      <div className="results-actions" style={{ marginTop: '32px' }}>
        <button className="btn-primary" onClick={() => navigate('/predict')}>
          🔬 New Prediction
        </button>
        <button className="btn-secondary" onClick={() => navigate('/results')}>
          📊 View Results
        </button>
      </div>
    </div>
  );
};

export default Recommendations;