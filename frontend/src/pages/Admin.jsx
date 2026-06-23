import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPredictions: 0,
    activeToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const checkAdmin = () => {
    const userData = localStorage.getItem('user_data');
    if (!userData) return false;
    try {
      const user = JSON.parse(userData);
      const adminEmails = ['admin1@biogas.com', 'admin2@biogas.com', 'admin3@biogas.com', 'admin4@biogas.com'];
      return adminEmails.includes(user.email);
    } catch (e) {
      return false;
    }
  };

  const isAdmin = checkAdmin();

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        const usersResponse = await fetch(`${API_URL}/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const predResponse = await fetch(`${API_URL}/api/admin/predictions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (usersResponse.ok && predResponse.ok) {
          const usersData = await usersResponse.json();
          const predData = await predResponse.json();

          setUsers(usersData.users);
          setStats({
            totalUsers: usersData.totalUsers,
            totalPredictions: predData.totalPredictions,
            activeToday: predData.predictions.filter(p => {
              const today = new Date().toISOString().split('T')[0];
              return new Date(p.createdAt).toISOString().split('T')[0] === today;
            }).length
          });
        }
      } catch (e) {
        console.error('Admin load error:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdmin]);

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="admin-denied">
          <span className="denied-icon">🚫</span>
          <h2>Access Denied</h2>
          <p>You don't have permission to view this page.</p>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title">Admin Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-subtitle">Manage users and view system analytics</p>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-icon">👥</span>
          <div>
            <span className="admin-stat-value">{stats.totalUsers}</span>
            <span className="admin-stat-label">Total Users</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-icon">📊</span>
          <div>
            <span className="admin-stat-value">{stats.totalPredictions}</span>
            <span className="admin-stat-label">Total Predictions</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-icon">🔥</span>
          <div>
            <span className="admin-stat-value">{stats.activeToday}</span>
            <span className="admin-stat-label">Active Today</span>
          </div>
        </div>
      </div>

      <div className="admin-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="admin-table-wrapper">
        <h3 className="section-title">Registered Users</h3>
        {filteredUsers.length > 0 ? (
          <table className="data-table admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Predictions</th>
                <th>Last Active</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id || index}>
                  <td>#{user.id ? user.id.toString().slice(-4) : index + 1}</td>
                  <td>
                    <div className="user-cell">
                      <span className="user-avatar-small">
                        {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                      </span>
                      <span className="user-name">{user.fullName || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className="prediction-count">{user.predictionsCount || 0}</span>
                  </td>
                  <td>{user.lastActive === 'Never' ? 'Never' : new Date(user.lastActive).toLocaleDateString()}</td>
                  <td>
                    <span className={`user-status ${user.predictionsCount > 0 ? 'active' : 'inactive'}`}>
                      {user.predictionsCount > 0 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">👤</span>
            <p>No users found{searchTerm ? ' matching your search' : ''}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;