import React from 'react';
import { useEffect } from'react';
import { useLocation } from 'react-router-dom';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Logout from './components/Logout';
import MyCalendar from './components/Calendar';
import Navbar from './components/Navbar';




// Funzione per verificare se l'utente è autenticato
const isAuthenticated = () => {
    // Verifica se c'è un token JWT nel localStorage
    const token = localStorage.getItem('authToken');
    return !!token; // doppia negazione per avere il booleano
};

// Componente di routing protetto per tutte le route eseguibili solo con autenticazione
const ProtectedRoute = ({ element }) => {
    // se l'utente è autenticato allora vado all'elemento richiesto, altrimenti a /login
    return isAuthenticated() ? element : <Navigate to="/login" replace />;
};

const App = () => {

    useEffect(() => {
        // Rimuove il token quando l'utente chiude o ricarica la pagina
        const handleUnload = () => {
            localStorage.removeItem('authToken');
        };
    
        window.addEventListener('beforeunload', handleUnload);
    
        return () => {
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, []);

    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
                <Route path="/logout" element={<ProtectedRoute element={<Logout />} />} />
                <Route path="/calendar" element={<ProtectedRoute element={<MyCalendar />} />} />
                <Route path="*" element={<Navigate to="/home" replace />} />  {/* uso navigate to al posto di dare il componenete per avere la route protetta */}
            </Routes>
        </Router>
    );
};

export default App;
