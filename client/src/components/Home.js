import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import axios from 'axios';
import '../css/Home.css'; // Assicurati di avere i tuoi stili qui

const Home = () => {
    const [events, setEvents] = useState([]);
    const [latestNote, setLatestNote] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await axios.get('/api/events', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Filtra solo gli eventi futuri e limita a 5 eventi
                const now = new Date();
                const futureEvents = response.data.filter(event => new Date(event.start) > now);
                setEvents(futureEvents.slice(0, 5));
            } catch (error) {
                console.error('Errore nel recupero degli eventi:', error);
            }
        };

        const fetchLatestNote = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await axios.get('/api/notes/latest', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLatestNote(response.data);
            } catch (error) {
                console.error('Errore nel recupero dell\'ultima nota:', error);
            }
        };

        fetchEvents();
        fetchLatestNote();
    }, []);

    return (
        <div className='page-content'>
            <h1>Welcome to Home</h1>
            <div className='grid'>
                <div className='card' onClick={() => window.location.href = "/calendar"}>
                    <h2>Calendar</h2>
                    {/* Mostra gli eventi in Agenda View */}
                    {events.length > 0 ? (
                        <ul>
                            {events.map(event => (
                                <li 
                                    key={event._id} 
                                    style={{ 
                                        backgroundColor: event.color, // Imposta il colore di sfondo
                                        padding: '5px', 
                                        margin: '5px 0', 
                                        borderRadius: '10px',
                                        color: '#fff' // Imposta il colore del testo (bianco) per leggibilità
                                    }}
                                >
                                    <p><strong>{event.title}</strong></p>
                                    <small>From: {moment(new Date(event.start)).format('YYYY-MM-DD, HH:mm')}</small>
                                    <br />
                                    <small> to: {moment(new Date(event.end)).format('YYYY-MM-DD, HH:mm')}</small>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No events available.</p>
                    )}
                </div>
                <div className='card' onClick={() => window.location.href = "/notes"}>
                    <h2>Latest Note</h2>
                    {/* Mostra l'ultima nota creata */}
                    {latestNote ? (
                        <div>
                            <h3>{latestNote.title}</h3> 
                            <p>{latestNote.content.substring(0, 100)}...</p>
                            <small>{moment(new Date(latestNote.creationDate)).format('YYYY-MM-DD')}</small>
                        </div>
                    ) : (
                        <p>No notes available.</p>
                    )}
                </div>
            </div>
            <Link to='/pomodoro'>
                <button>Pomodoro</button>
                </Link>
        </div>
    );
};

export default Home;
