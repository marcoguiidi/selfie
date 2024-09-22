import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../css/Navbar.css'; // Associa il file CSS per lo stile

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navbarMenuRef = useRef(null); // Referenza per ottenere il menu

    const toggleNavbar = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        // Ottieni l'elemento di contenuto della pagina
        const pageContent = document.querySelector('.page-content');
        const navbarMenu = navbarMenuRef.current;

        if (pageContent && navbarMenu) {
            if (isOpen) {
                // Calcola l'altezza del menu aperto
                const menuHeight = navbarMenu.scrollHeight;
                pageContent.style.marginTop = `${menuHeight + 60}px`; // Imposta il margine in base all'altezza del menu
            } else {
                pageContent.style.marginTop = '60px'; // Ripristina il margine originale
            }
        }
    }, [isOpen]);

    return (
        <nav className="navbar">
            <div className="navbar-toggle" onClick={toggleNavbar}>
                {/* Icona del menu, qui puoi usare un'icona come FontAwesome o simili */}
                <span className="menu-icon">&#9776;</span>
            </div>
            <div ref={navbarMenuRef} className={`navbar-menu ${isOpen ? 'open' : ''}`}>
                <ul>
                    <li>
                        <Link to="/home" >Home</Link>
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
