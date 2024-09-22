import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Logout = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        const token = localStorage.getItem('authToken');
        await axios.post('/api/auth/logout', {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        navigate('/login');
      } catch (err) {
        console.error('Logout failed:', err);
      }
    };

    performLogout();
  }, [navigate, setIsAuthenticated]);

  return (
    <div>
      <h1>Logging out...</h1>
    </div>
  );
};

export default Logout;