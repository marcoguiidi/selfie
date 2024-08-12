import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const performLogout = async () => {
            try {
                // Ottieni il token dal localStorage
                const token = localStorage.getItem('authToken');
    
                // Esegui il logout, inviando il token nell'header Authorization
                await axios.post('/api/auth/logout', {}, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
    
                // Rimuovi il token dal localStorage
                localStorage.removeItem('authToken');
    
                // Reindirizza alla pagina di login dopo il logout
                navigate('/login');
            } catch (err) {
                console.error('Logout failed:', err);
            }
        };
    
        performLogout();
    }, [navigate]);
    

    return (
        <div>
            <h1>Logging out...</h1> {/*  inutile */}
        </div>
    );
};

export default Logout;
