import { Navigate } from 'react-router-dom';

const AuthPage = ({ children }) => {
  const isAuth = !!localStorage.getItem('auth_token');
  return isAuth ? children : <Navigate to="/login" replace />;
};

export default AuthPage;