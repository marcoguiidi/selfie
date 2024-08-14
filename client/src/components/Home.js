import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div>
            <h1>Welcome to Home</h1>
            <Link to="/logout">
                <button>Logout</button>
            </Link>
            <Link to="/calendar">
                <button>Calendar</button>
            </Link>
        </div>
    );
};

export default Home;
