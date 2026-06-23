import { useState } from 'react';
import './Recommendations.css';

const Recommendations = () => {
  const [filter, setFilter] = useState('all');

  const recommendations = [
    {
      id: 1,
      type: 'temperature',
      priority: 'high',
      title: 'Increase Digester Temperature',
      description: 'Current temperature (32°C) is below optimal range. Increase to 35-37°C for 15% better yield.',
      impact: '+0.06 m³/kg',
      action: 'Adjust heating system',
      icon: '🌡️'
    },
    {
      id: 2,
      type: 'ph',
      priority: 'medium',
      title: 'Adjust pH Level',
      description: 'pH is slightly alkaline at 7.8. Optimal range is 6.8-7.2 for methanogenic bacteria.',
      impact: '+0.03 m³/kg',
      action: 'Add buffering agent',
      icon: '⚗️'
    },
    {
      id: 3,
      type: 'feedstock',
      priority: 'high',
      title: 'Optimize Feedstock Mix',
      description: 'Current C/N ratio of 20 is low. Mix with carbon-rich materials to reach 25-30.',
      impact: '+0.08 m³/kg',
      action: 'Add straw or sawdust',
      icon: '🌾'
    },
    {
      id: 4,
      type: 'hrt',
      priority: 'low',
      title: 'Extend HRT',
      description: 'HRT of 15 days may be insufficient. Consider 20-25 days for complete digestion.',
      impact: '+0.04 m³/kg',
      action: 'Reduce loading rate',
      icon: '⏱️'
    },
    {
      id: 5,
      type: 'mixing',
      priority: 'medium',
      title: 'Improve Mixing',
      description: 'Inadequate mixing causes stratification. Increase mixing frequency to 2x daily.',
      impact: '+0.05 m³/kg',
      action: 'Check mixer operation',
      icon: '🔄'
    }
  ];

  const filtered = filter === 'all' ? recommendations : recommendations.filter(r => r.priority === filter);

  const priorityColors = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981'
  };

  const totalImpact = recommendations.reduce((sum, r) => sum + parseFloat(r.impact), 0).toFixed(2);

  return (
    <div className="page-container">
      <h1 className="page-title">Recommendations</h1>
      <p className="page-subtitle">AI-generated tips to improve your biogas yield</p>

      {/* Summary Card */}
      <div className="rec-summary">
        <div className="summary-item">
          <span className="summary-number">{recommendations.length}</span>
          <span className="summary-label">Total Actions</span>
        </div>
        <div className="summary-item">
          <span className="summary-number" style={{ color: '#EF4444' }}>
            {recommendations.filter(r => r.priority === 'high').length}
          </span>
          <span className="summary-label">High Priority</span>
        </div>
        <div className="summary-item">
          <span className="summary-number" style={{ color: '#10B981' }}>+{totalImpact}</span>
          <span className="summary-label">Potential Gain</span>
        </div>
      </div>

      {/* Filters */}
      <div className="rec-filters">
        {['all', 'high', 'medium', 'low'].map((f) => (
          <button
            key={f}
            className={`filter-pill ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} Priority
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      <div className="rec-list">
        {filtered.map((rec) => (
          <div key={rec.id} className={`rec-card priority-${rec.priority}`}>
            <div className="rec-icon">{rec.icon}</div>
            <div className="rec-content">
              <div className="rec-header">
                <h4 className="rec-title">{rec.title}</h4>
                <span 
                  className="rec-priority"
                  style={{ background: `${priorityColors[rec.priority]}20`, color: priorityColors[rec.priority] }}
                >
                  {rec.priority}
                </span>
              </div>
              <p className="rec-desc">{rec.description}</p>
              <div className="rec-footer">
                <span className="rec-impact">📈 {rec.impact} potential gain</span>
                <span className="rec-action">🔧 {rec.action}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;