import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className='page-content' >
            <h1>Welcome to Home</h1>
            <Link to="/logout">
                <button>Logout</button>
            </Link>
            <Link to="/calendar">
                <button>Calendar</button>
            </Link>
            <Link to="/pomodoro">
                <button>Pomodoro</button>
            </Link>
        </div>
    );
};

export default Home;
