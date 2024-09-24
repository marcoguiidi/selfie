import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../css/Navbar.css'; // Associa il file CSS per lo stile

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navbarMenuRef = useRef(null);
    const location = useLocation(); // Rileva la posizione attuale

    const toggleNavbar = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const pageContent = document.querySelector('.page-content');
        const navbarMenu = navbarMenuRef.current;

        if (pageContent && navbarMenu) {
            // Condizione basata sulla larghezza dello schermo
            const isMobile = window.innerWidth <= 768; // Modifica il valore per adattarlo ai tuoi requisiti

            if (isMobile) {
                pageContent.style.marginTop = `${isOpen ? '80px' : '10px'}`; // Imposta il margine per mobile
            }
        }
    }, [isOpen]);

    useEffect(() => {
        // Chiudi la navbar quando si cambia pagina
        if (isOpen) {
            setIsOpen(false);
        }
    }, [location]); // Aggiungi location come dipendenza

    return (
        <nav className="navbar">
            <div className="navbar-toggle" onClick={toggleNavbar}>
                <span className="menu-icon">&#9776;</span>
            </div>
            <div className="navbar-icons">
                <Link to="/home" className="nav-icon">
                    <span className="icon">&#8962;</span> 
                </Link>
                <Link to="/logout" className="nav-icon">
                    <span className="icon">&#xf08b;</span>
                </Link>
            </div>
            <div ref={navbarMenuRef} className={`navbar-menu ${isOpen ? 'open' : ''}`}>
                <ul>
                    <li>
                        <Link to="/home">Home</Link>
                    </li>
                    <li>
                        <Link to="/logout">Logout</Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
