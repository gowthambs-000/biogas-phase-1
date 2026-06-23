import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './Results.css';

const Results = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user came from Predict page (has fresh prediction)
    const fromPredict = location.state?.fromPredict;
    
    // Get prediction data
    const stored = localStorage.getItem('last_prediction');
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Strict check: must have result AND inputs with actual values
        if (
          parsed.result && 
          parsed.inputs &&
          parsed.result.biogasYield !== undefined &&
          parsed.inputs.feedstock &&
          parsed.inputs.feedstock !== ''
        ) {
          setPrediction(parsed);
        } else {
          setPrediction(null);
        }
      } catch (e) {
        setPrediction(null);
      }
    } else {
      setPrediction(null);
    }
    
    setLoading(false);
  }, [location]);

  // Clear prediction when user navigates away from results
  useEffect(() => {
    return () => {
      // Optional: clear when leaving page
      // localStorage.removeItem('last_prediction');
    };
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title">Loading...</h1>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="page-container">
        <h1 className="page-title">No Results Available</h1>
        <p className="page-subtitle">You need to make a prediction first to see results here.</p>
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button className="btn-primary" onClick={() => navigate('/predict')}>
            🔬 Make a Prediction
          </button>
        </div>
      </div>
    );
  }

  const { result, inputs } = prediction;

  const methaneData = [
    { name: 'Methane', value: result.methaneContent || 0 },
    { name: 'CO₂ + Others', value: 100 - (result.methaneContent || 0) },
  ];

  const COLORS = ['#FCD34D', '#E5E7EB'];

  const getConfidenceColor = (conf) => {
    if (conf >= 0.8) return '#10B981';
    if (conf >= 0.6) return '#F59E0B';
    return '#EF4444';
  };

  const getConfidenceLabel = (conf) => {
    if (conf >= 0.8) return 'High';
    if (conf >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Prediction Results</h1>
      <p className="page-subtitle">Biogas yield analysis and composition</p>

      <div className="results-grid">
        {/* Main Result Card */}
        <div className="result-card main-result">
          <div className="result-header">
            <span className="result-badge">Latest Prediction</span>
            <span className="result-time">Just now</span>
          </div>
          <div className="yield-display">
            <span className="yield-value">{result.biogasYield || '0.00'}</span>
            <span className="yield-unit">m³/kg</span>
          </div>
          <p className="yield-label">Biogas Yield</p>
          <div className="confidence-bar">
            <div 
              className="confidence-fill" 
              style={{ 
                width: `${(result.confidence || 0) * 100}%`,
                background: getConfidenceColor(result.confidence || 0)
              }}
            ></div>
          </div>
          <p className="confidence-text">
            Confidence: <span style={{ color: getConfidenceColor(result.confidence || 0) }}>
              {getConfidenceLabel(result.confidence || 0)} ({((result.confidence || 0) * 100).toFixed(0)}%)
            </span>
          </p>
        </div>

        {/* Methane Composition */}
        <div className="result-card chart-card">
          <h3 className="card-title">Gas Composition</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={methaneData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {methaneData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: COLORS[0] }}></span>
              <span>Methane: {result.methaneContent || 0}%</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: COLORS[1] }}></span>
              <span>CO₂ + Others: {100 - (result.methaneContent || 0)}%</span>
            </div>
          </div>
        </div>

        {/* Input Summary */}
        <div className="result-card full-width">
          <h3 className="card-title">Input Parameters</h3>
          <div className="input-summary">
            {inputs && Object.entries(inputs).map(([key, value]) => (
              <div key={key} className="input-item">
                <span className="input-key">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="input-val">{value || '-'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Optimal Range Indicator */}
        <div className={`result-card status-card ${result.optimalRange ? 'optimal' : 'suboptimal'}`}>
          <div className="status-icon">{result.optimalRange ? '✅' : '⚠️'}</div>
          <div className="status-info">
            <h4>{result.optimalRange ? 'Optimal Range' : 'Suboptimal Range'}</h4>
            <p>{result.optimalRange 
              ? 'Parameters are within optimal range for maximum yield.' 
              : 'Some parameters need adjustment for better yield.'}
            </p>
          </div>
        </div>
      </div>

      <div className="results-actions">
        <button className="btn-primary" onClick={() => {
          localStorage.removeItem('last_prediction');
          navigate('/predict');
        }}>
          🔬 New Prediction
        </button>
        <button className="btn-secondary" onClick={() => navigate('/recommendations')}>
          💡 View Recommendations
        </button>
      </div>
    </div>
  );
};

export default Results;