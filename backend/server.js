const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// ==================== ENVIRONMENT VARIABLES ====================
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'biogas-super-secret-key-2024';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

// ==================== CORS CONFIGURATION ====================
// FIXED: Allow all origins for testing
const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// ==================== DATA FILE SETUP ====================
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PREDICTIONS_FILE = path.join(DATA_DIR, 'predictions.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const readJson = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return [];
  }
};

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// ==================== AUTO-CREATE ADMIN ACCOUNTS ====================
const initializeAdmins = () => {
  const users = readJson(USERS_FILE);
  const adminEmails = ['admin1@biogas.com', 'admin2@biogas.com', 'admin3@biogas.com', 'admin4@biogas.com'];
  const adminNames = ['Admin1', 'Admin2', 'Admin3', 'Admin4'];
  
  let updated = false;
  
  adminEmails.forEach((email, index) => {
    const exists = users.find(u => u.email === email);
    if (!exists) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      users.push({
        id: `admin-${index + 1}`,
        fullName: adminNames[index],
        email: email,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      });
      updated = true;
      console.log(`✅ Created admin account: ${email} / password: admin123`);
    }
  });
  
  if (updated) {
    writeJson(USERS_FILE, users);
  }
};

initializeAdmins();

// ==================== AUTH MIDDLEWARE ====================
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const users = readJson(USERS_FILE);

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString(),
      fullName,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    writeJson(USERS_FILE, users);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminEmails = ['admin1@biogas.com', 'admin2@biogas.com', 'admin3@biogas.com', 'admin4@biogas.com'];

    const users = readJson(USERS_FILE);
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!adminEmails.includes(email)) {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Current User
app.get('/api/auth/me', authenticate, (req, res) => {
  const users = readJson(USERS_FILE);
  const user = users.find(u => u.id === req.user.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  res.json({ id: user.id, fullName: user.fullName, email: user.email });
});

// ==================== PREDICTION ROUTES ====================

// Save Prediction
app.post('/api/predictions', authenticate, (req, res) => {
  try {
    const { inputs, result } = req.body;
    const predictions = readJson(PREDICTIONS_FILE);

    const prediction = {
      id: Date.now().toString(),
      userId: req.user.userId,
      userEmail: req.user.email,
      inputs,
      result,
      createdAt: new Date().toISOString()
    };

    predictions.push(prediction);
    writeJson(PREDICTIONS_FILE, predictions);

    res.json({
      success: true,
      prediction: {
        id: prediction.id,
        inputs,
        result
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get User's Predictions
app.get('/api/predictions', authenticate, (req, res) => {
  const predictions = readJson(PREDICTIONS_FILE);
  const userPredictions = predictions
    .filter(p => p.userId === req.user.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(userPredictions);
});

// Delete Prediction
app.delete('/api/predictions/:id', authenticate, (req, res) => {
  let predictions = readJson(PREDICTIONS_FILE);
  const index = predictions.findIndex(p => p.id === req.params.id && p.userId === req.user.userId);

  if (index === -1) {
    return res.status(404).json({ message: 'Prediction not found' });
  }

  predictions.splice(index, 1);
  writeJson(PREDICTIONS_FILE, predictions);

  res.json({ message: 'Prediction deleted' });
});

// ==================== ADMIN ROUTES ====================

const isAdmin = (req, res, next) => {
  const adminEmails = ['admin1@biogas.com', 'admin2@biogas.com', 'admin3@biogas.com', 'admin4@biogas.com'];
  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// Get all users (Admin only)
app.get('/api/admin/users', authenticate, isAdmin, (req, res) => {
  const users = readJson(USERS_FILE);
  const predictions = readJson(PREDICTIONS_FILE);

  const usersWithStats = users.map(u => {
    const userPredictions = predictions.filter(p => p.userId === u.id);
    const lastPrediction = userPredictions.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      createdAt: u.createdAt,
      predictionsCount: userPredictions.length,
      lastActive: lastPrediction ? lastPrediction.createdAt : 'Never'
    };
  });

  res.json({
    totalUsers: users.length,
    users: usersWithStats
  });
});

// Get all predictions (Admin only)
app.get('/api/admin/predictions', authenticate, isAdmin, (req, res) => {
  const predictions = readJson(PREDICTIONS_FILE);
  const users = readJson(USERS_FILE);

  const predictionsWithUser = predictions.map(p => {
    const user = users.find(u => u.id === p.userId);
    return {
      ...p,
      userName: user ? user.fullName : 'Unknown',
      userEmail: user ? user.email : 'Unknown'
    };
  });

  res.json({
    totalPredictions: predictions.length,
    predictions: predictionsWithUser
  });
});

// ==================== HEALTH CHECK & ROOT ROUTE ====================

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Biogas API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    dataDirectory: DATA_DIR,
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'POST /api/predictions',
      'GET  /api/predictions',
      'DELETE /api/predictions/:id',
      'GET  /api/admin/users',
      'GET  /api/admin/predictions',
      'GET  /api/health'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Biogas API is running',
    timestamp: new Date().toISOString()
  });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API endpoints ready`);
  console.log(`🔐 JWT Secret loaded: ${JWT_SECRET ? 'Yes' : 'No'}`);
  console.log(`💾 Data directory: ${DATA_DIR}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});