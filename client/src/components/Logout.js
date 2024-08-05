import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const performLogout = async () => {
            try {
                await axios.post('/api/auth/logout');
                navigate('/login'); // Reindirizza alla pagina di login dopo il logout
            } catch (err) {
                console.error('Logout failed:', err);
                // Gestisci l'errore se necessario
            }
        };

        performLogout();
    }, [navigate]);

    return (
        <div>
            <h1>Logging out...</h1>
        </div>
    );
};

export default Logout;
