import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Layout.css';

const Layout = ({ children, darkMode, setDarkMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('User');
  const location = useLocation();
  const navigate = useNavigate();

  // Check if admin
  const isAdmin = () => {
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

  // Get user name from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserName(user.fullName || user.name || 'User');
      } catch (e) {
        setUserName('User');
      }
    }
  }, []);

  const baseMenuItems = [
    { path: '/', icon: '🏠', label: 'Dashboard' },
    { path: '/predict', icon: '🔬', label: 'Predict' },
    { path: '/results', icon: '📊', label: 'Results' },
    { path: '/analytics', icon: '📈', label: 'Analytics' },
    { path: '/recommendations', icon: '💡', label: 'Recommendations' },
    { path: '/history', icon: '📜', label: 'History' },
  ];

  const menuItems = isAdmin() 
    ? [...baseMenuItems, { path: '/admin', icon: '🔒', label: 'Admin' }]
    : baseMenuItems;

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">BiogasOpt</span>
          </div>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="top-bar">
          <h2 className="page-name">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h2>
          <div className="user-info">
            <span className="user-avatar">{getInitials(userName)}</span>
            <span className="user-name">{userName}</span>
          </div>
        </header>
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;