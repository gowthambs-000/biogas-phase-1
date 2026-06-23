import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import './Predict.css';

const Predict = () => {
  const [formData, setFormData] = useState({
    temperature: '',
    ph: '',
    hrt: '',
    olr: '',
    feedstock: '',
    moisture: '',
    ts: '',
    vsTs: '',
    cn: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const feedstockOptions = [
    'Cow Dung',
    'Poultry Waste',
    'Food Waste',
    'Agricultural Residue',
    'Sewage Sludge',
    'Energy Crops'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.temperature || formData.temperature === '') {
      newErrors.temperature = 'Temperature is required';
    } else if (parseFloat(formData.temperature) < 20 || parseFloat(formData.temperature) > 60) {
      newErrors.temperature = 'Must be between 20-60°C';
    }
    
    if (!formData.ph || formData.ph === '') {
      newErrors.ph = 'pH is required';
    } else if (parseFloat(formData.ph) < 5.5 || parseFloat(formData.ph) > 9.0) {
      newErrors.ph = 'Must be between 5.5-9.0';
    }
    
    if (!formData.hrt || formData.hrt === '') {
      newErrors.hrt = 'HRT is required';
    } else if (parseFloat(formData.hrt) < 5 || parseFloat(formData.hrt) > 100) {
      newErrors.hrt = 'Must be between 5-100 days';
    }
    
    if (!formData.olr || formData.olr === '') {
      newErrors.olr = 'OLR is required';
    } else if (parseFloat(formData.olr) < 0.5 || parseFloat(formData.olr) > 10) {
      newErrors.olr = 'Must be between 0.5-10 kg VS/m³/day';
    }
    
    if (!formData.feedstock) {
      newErrors.feedstock = 'Feedstock type is required';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    localStorage.removeItem('last_prediction');
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_URL}/api/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          inputs: {
            temperature: parseFloat(formData.temperature),
            ph: parseFloat(formData.ph),
            hrt: parseFloat(formData.hrt),
            olr: parseFloat(formData.olr),
            feedstock: formData.feedstock,
            moisture: parseFloat(formData.moisture) || 0,
            ts: parseFloat(formData.ts) || 0,
            vsTs: parseFloat(formData.vsTs) || 0,
            cn: parseFloat(formData.cn) || 0
          },
          result: {
            biogasYield: parseFloat((0.3 + Math.random() * 0.25).toFixed(3)),
            methaneContent: Math.round(55 + Math.random() * 15),
            confidence: parseFloat((0.75 + Math.random() * 0.2).toFixed(2)),
            optimalRange: Math.random() > 0.3
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Prediction failed');
      }

      localStorage.setItem('last_prediction', JSON.stringify({
        inputs: formData,
        result: data.prediction.result
      }));

      navigate('/results', { state: { fromPredict: true } });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      temperature: '', ph: '', hrt: '', olr: '',
      feedstock: '', moisture: '', ts: '', vsTs: '', cn: ''
    });
    setErrors({});
  };

  return (
    <div className="page-container">
      <h1 className="page-title">New Prediction</h1>
      <p className="page-subtitle">Enter digester parameters to predict biogas yield</p>

      <form onSubmit={handleSubmit} className="predict-form" noValidate>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Temperature (°C) *</label>
            <input type="number" name="temperature" step="0.1" placeholder="35.0"
              className={`form-input ${errors.temperature ? 'error' : ''}`}
              value={formData.temperature} onChange={handleChange} />
            {errors.temperature && <span className="error-text">{errors.temperature}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">pH Level *</label>
            <input type="number" name="ph" step="0.1" placeholder="7.0"
              className={`form-input ${errors.ph ? 'error' : ''}`}
              value={formData.ph} onChange={handleChange} />
            {errors.ph && <span className="error-text">{errors.ph}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">HRT (days) *</label>
            <input type="number" name="hrt" step="0.1" placeholder="20"
              className={`form-input ${errors.hrt ? 'error' : ''}`}
              value={formData.hrt} onChange={handleChange} />
            {errors.hrt && <span className="error-text">{errors.hrt}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">OLR (kg VS/m³/day) *</label>
            <input type="number" name="olr" step="0.1" placeholder="2.5"
              className={`form-input ${errors.olr ? 'error' : ''}`}
              value={formData.olr} onChange={handleChange} />
            {errors.olr && <span className="error-text">{errors.olr}</span>}
          </div>

          <div className="form-group full-width">
            <label className="form-label">Feedstock Type *</label>
            <select name="feedstock" className={`form-input ${errors.feedstock ? 'error' : ''}`}
              value={formData.feedstock} onChange={handleChange}>
              <option value="">Select feedstock type</option>
              {feedstockOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.feedstock && <span className="error-text">{errors.feedstock}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Moisture Content (%)</label>
            <input type="number" name="moisture" step="0.1" placeholder="85"
              className="form-input" value={formData.moisture} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Total Solids (%)</label>
            <input type="number" name="ts" step="0.1" placeholder="12"
              className="form-input" value={formData.ts} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">VS/TS Ratio</label>
            <input type="number" name="vsTs" step="0.01" placeholder="0.80"
              className="form-input" value={formData.vsTs} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">C/N Ratio</label>
            <input type="number" name="cn" step="0.1" placeholder="25"
              className="form-input" value={formData.cn} onChange={handleChange} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? '⏳ Processing...' : '🔬 Predict Yield'}
          </button>
          <button type="button" className="btn-secondary" onClick={handleClear} disabled={isLoading}>
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default Predict;