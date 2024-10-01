import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../css/Navbar.css'; 

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navbarMenuRef = useRef(null);
    const location = useLocation(); 

    const toggleNavbar = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const pageContent = document.querySelector('.page-content');
        const navbarMenu = navbarMenuRef.current;

        if (pageContent && navbarMenu) {

            const isMobile = window.innerWidth <= 768; 

            if (isMobile) {
                pageContent.style.marginTop = `${isOpen ? '150px' : '40px'}`; 
            }
        }
    }, [isOpen]);

    useEffect(() => {

        if (isOpen) {
            setIsOpen(false);
        }
    }, [location]); 

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
                    <span className="icon">&#9211;</span>
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
