import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Logout from './components/Logout';

// Funzione per verificare se l'utente è autenticato
const isAuthenticated = () => {
    // Verifica se c'è un token JWT nel localStorage
    const token = localStorage.getItem('authToken');
    return !!token; // Ritorna true se il token esiste, altrimenti false
};

// Componente di routing protetto
const ProtectedRoute = ({ element }) => {
    return isAuthenticated() ? element : <Navigate to="/login" replace />;
};

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
                <Route path="/logout" element={<ProtectedRoute element={<Logout />} />} />
                <Route path='*' element={<ProtectedRoute element={<Home />} />} />
            </Routes>
        </Router>
    );
};

export default App;
