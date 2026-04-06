// AuthContext.js
import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('isAuthenticated', true);
    localStorage.setItem('NAV_USER_CACHE', JSON.stringify(Array.isArray(userData) ? userData : [userData]));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('API_TOKEN');
    localStorage.removeItem('NAV_USER_CACHE');
    localStorage.removeItem('NAV_PERMISSIONS_CACHE');
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
