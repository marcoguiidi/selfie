import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Logout from './components/Logout';
import MyCalendar from './components/Calendar';
import Navbar from './components/Navbar';
import PomodoroTimer from './components/PomodoroTimer';
import NoteViewer from './components/NoteViewer';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Verifica il token con il backend
          await axios.get('/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  // Componente di routing protetto
  const ProtectedRoute = ({ element }) => {
    if (loading) {
      return <div>Loading...</div>;
    }
    return isAuthenticated ? element : <Navigate to="/login" replace />;
  };

  return (
    <Router>
      {/* Mostra la Navbar solo se non ci si trova nelle pagine di login o registrazione */}
      {(isAuthenticated || window.location.pathname !== '/login' && window.location.pathname !== '/register') && <Navbar />}
      <div className="page-content"> 
        <Routes>
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
          <Route path="/logout" element={<ProtectedRoute element={<Logout setIsAuthenticated={setIsAuthenticated} />} />} />
          <Route path="/calendar" element={<ProtectedRoute element={<MyCalendar />} />} />
          <Route path="/pomodoro" element={<ProtectedRoute element={<PomodoroTimer />} />} />
          <Route path="/notes" element={<ProtectedRoute element={<NoteViewer />} />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

