import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Predict from './pages/Predict';
import Results from './pages/Results';
import Recommendations from './pages/Recommendations';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Layout from './components/Layout';
import Admin from './pages/Admin';
import './App.css';

// Auth check
const isAuthenticated = () => !!localStorage.getItem('auth_token');

const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
              <Home />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/predict" element={
          <ProtectedRoute>
            <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
              <Predict />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/results" element={
          <ProtectedRoute>
            <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
              <Results />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/recommendations" element={
          <ProtectedRoute>
            <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
              <Recommendations />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
              <History />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
  <ProtectedRoute>
    <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
      <Admin />
    </Layout>
  </ProtectedRoute>
} />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
              <Analytics />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;