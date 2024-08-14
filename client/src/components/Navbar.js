// Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../css/Navbar.css"; // Importa il file CSS per la Navbar

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Aggiungi qui la logica per il logout
        // Dopo il logout, reindirizza alla pagina di login
        navigate('/logout');
    };

    return (
        <nav className="navbar">
            <div className="navbar-links">
                <Link to="/home" className="navbar-link">Home</Link>
                <button onClick={handleLogout} className="navbar-logout">Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;
