import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import './History.css';

const History = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterStatus, setFilterStatus] = useState('all');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`${API_URL}/api/predictions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          const formatted = data.map(p => ({
            id: p._id || p.id,
            date: new Date(p.createdAt).toISOString().split('T')[0],
            feedstock: p.inputs.feedstock,
            temp: p.inputs.temperature,
            ph: p.inputs.ph,
            yield: p.result.biogasYield,
            methane: p.result.methaneContent,
            confidence: p.result.confidence,
            status: p.result.optimalRange ? 'optimal' : 'suboptimal',
            inputs: p.inputs
          }));

          setPredictions(formatted);
        } else {
          setPredictions([]);
        }
      } catch (e) {
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPredictions();
  }, []);

  const filtered = predictions
    .filter(p => {
      const matchesSearch = p.feedstock?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'yield') return b.yield - a.yield;
      if (sortBy === 'methane') return b.methane - a.methane;
      return 0;
    });

  const getStatusBadge = (status) => {
    const styles = {
      optimal: { bg: '#D1FAE5', color: '#065F46', label: 'Optimal' },
      suboptimal: { bg: '#FEF3C7', color: '#92400E', label: 'Suboptimal' },
      poor: { bg: '#FEE2E2', color: '#991B1B', label: 'Poor' },
    };
    const style = styles[status] || styles.suboptimal;
    return (
      <span className="status-badge" style={{ background: style.bg, color: style.color }}>
        {style.label}
      </span>
    );
  };

  const getYieldBar = (yieldValue) => {
    const maxYield = 0.6;
    const percentage = Math.min((yieldValue / maxYield) * 100, 100);
    return (
      <div className="yield-bar-container">
        <div className="yield-bar" style={{ width: `${percentage}%` }}></div>
        <span>{yieldValue.toFixed(2)}</span>
      </div>
    );
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/predictions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setPredictions(prev => prev.filter(p => p.id !== id));
      }
    } catch (e) {
      console.error('Delete failed');
    }
  };

  const handleView = (prediction) => {
    localStorage.setItem('last_prediction', JSON.stringify({
      inputs: prediction.inputs,
      result: {
        biogasYield: prediction.yield,
        methaneContent: prediction.methane,
        confidence: prediction.confidence || 0.85,
        optimalRange: prediction.status === 'optimal'
      }
    }));
    navigate('/results');
  };

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title">Prediction History</h1>
        <p className="page-subtitle">Loading your predictions...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Prediction History</h1>
      <p className="page-subtitle">Review and analyze your past biogas predictions</p>

      <div className="history-controls">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by feedstock..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select 
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort by Date</option>
            <option value="yield">Sort by Yield</option>
            <option value="methane">Sort by Methane</option>
          </select>

          <select 
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="optimal">Optimal</option>
            <option value="suboptimal">Suboptimal</option>
            <option value="poor">Poor</option>
          </select>
        </div>
      </div>

      <div className="history-stats">
        <div className="history-stat">
          <span className="history-stat-value">{filtered.length}</span>
          <span className="history-stat-label">Results</span>
        </div>
        <div className="history-stat">
          <span className="history-stat-value">
            {filtered.length > 0 ? (filtered.reduce((sum, p) => sum + p.yield, 0) / filtered.length).toFixed(3) : '0.000'}
          </span>
          <span className="history-stat-label">Avg Yield</span>
        </div>
        <div className="history-stat">
          <span className="history-stat-value">
            {filtered.length > 0 ? Math.max(...filtered.map(p => p.yield)).toFixed(3) : '0.000'}
          </span>
          <span className="history-stat-label">Best Yield</span>
        </div>
      </div>

      <div className="history-table-wrapper">
        {filtered.length > 0 ? (
          <table className="data-table history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Feedstock</th>
                <th>Temp (°C)</th>
                <th>pH</th>
                <th>Biogas Yield</th>
                <th>Methane %</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((prediction) => (
                <tr key={prediction.id} className="history-row">
                  <td>{prediction.date}</td>
                  <td>
                    <span className="feedstock-name">{prediction.feedstock}</span>
                  </td>
                  <td>{prediction.temp}</td>
                  <td>{prediction.ph}</td>
                  <td>{getYieldBar(prediction.yield)}</td>
                  <td>
                    <div className="methane-display">
                      <div className="methane-bar-bg">
                        <div 
                          className="methane-bar-fill" 
                          style={{ width: `${prediction.methane}%` }}
                        ></div>
                      </div>
                      <span>{prediction.methane}%</span>
                    </div>
                  </td>
                  <td>{getStatusBadge(prediction.status)}</td>
                  <td>
                    <button 
                      className="action-btn view-btn" 
                      title="View Details"
                      onClick={() => handleView(prediction)}
                    >
                      👁️
                    </button>
                    <button 
                      className="action-btn delete-btn" 
                      title="Delete"
                      onClick={() => handleDelete(prediction.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No predictions found.</p>
            <p className="empty-subtitle">Make your first prediction to see it here!</p>
            <button className="btn-primary" onClick={() => navigate('/predict')} style={{ marginTop: '16px' }}>
              🔬 Make Prediction
            </button>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="pagination">
          <button className="page-btn" disabled>← Prev</button>
          <span className="page-info">Page 1 of 1</span>
          <button className="page-btn" disabled>Next →</button>
        </div>
      )}
    </div>
  );
};

export default History;