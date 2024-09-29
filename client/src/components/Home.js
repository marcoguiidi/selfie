import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import axios from 'axios';
import '../css/Home.css'; // Assicurati di avere i tuoi stili qui

const Home = () => {
    const [events, setEvents] = useState([]);
    const [orderEvents, setOrderEvents] = useState('next-events');
    const [latestNote, setLatestNote] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await axios.get('/api/events', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const now = new Date();

                // Filtrare eventi in base alla selezione dell'utente
                let filteredEvents = [];
                if (orderEvents === 'next-events') {
                    filteredEvents = response.data.filter(event => {
                        if (event.isDeadline && event.status === 'completed') {
                            return false; // Non mostrare eventi completati
                        }
                        const eventEndDate = new Date(event.end);
                        if (event.isDeadline && eventEndDate < now && event.status === 'expired') {
                            return true; // Mostra evento scaduto
                        }
                        return new Date(event.start) > now; // Mostra eventi futuri
                    });
                } else if (orderEvents === 'today-events') {
                    filteredEvents = response.data.filter(event => {
                        const eventStart = new Date(event.start);
                        const eventEndDate = new Date(event.end);
                        if (event.isDeadline && event.status === 'completed') {
                            return false; // Non mostrare eventi completati
                        }
                        return eventStart.toDateString() === now.toDateString();
                    });
                } else if (orderEvents === 'week-events') {
                    filteredEvents = response.data.filter(event => {
                        const eventStart = new Date(event.start);
                        const eventEndDate = new Date(event.end);
                        const oneWeekFromNow = new Date(now);
                        oneWeekFromNow.setDate(now.getDate() + 7);
                        if (event.isDeadline && event.status === 'completed') {
                            return false; // Non mostrare eventi completati
                        }
                        if (event.isDeadline && eventEndDate <= now && event.status === 'expired') {
                            return true; // Mostra evento scaduto
                        }
                        return eventStart >= now && eventStart <= oneWeekFromNow;
                    });
                } else if (orderEvents === 'month-events') {
                    filteredEvents = response.data.filter(event => {
                        const eventStart = new Date(event.start);
                        const eventEndDate = new Date(event.end);
                        const oneMonthFromNow = new Date(now);
                        oneMonthFromNow.setMonth(now.getMonth() + 1);
                        if (event.isDeadline && event.status === 'completed') {
                            return false; // Non mostrare eventi completati
                        }
                        if (event.isDeadline && eventEndDate <= now && event.status === 'expired') {
                            return true; // Mostra evento scaduto
                        }
                        return eventStart >= now && eventStart <= oneMonthFromNow;
                    });
                } else if (orderEvents === 'next-deadlines') {
                    filteredEvents = response.data.filter(event => {
                        if (event.status === 'completed') {
                            return false; // Non mostrare eventi completati
                        }
                        return event.isDeadline; // Mostra solo eventi deadline
                    });
                }

                const sortedEvents = filteredEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    
                setEvents(sortedEvents.slice(0, 5)); // Mostra i primi 5 eventi filtrati
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
    }, [orderEvents]);

    return (
        <div className='page-content'>
            <h1>Welcome to Home</h1>
            
            {/* Selettore degli eventi */}
            <div className='events-selector-container'>
                <label htmlFor="orderEvents">Seleziona eventi: </label>
                <select
                    id="orderEvents"
                    className="events-selector"
                    value={orderEvents}
                    onChange={(e) => setOrderEvents(e.target.value)}
                >
                    <option value="next-events">Next Events</option>
                    <option value="today-events">Today Events</option>
                    <option value="week-events">Week Events</option>
                    <option value="month-events">Month Events</option>
                    <option value="next-deadlines">Next Deadlines</option>
                </select>
            </div>

            <div className='grid'>
                <div className='req' onClick={() => window.location.href = "/calendar"}>
                    <h2>Calendar</h2>
                    {/* Mostra gli eventi in base all'ordine selezionato */}
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
                                    { event.isDeadline ? (
                                            <>
                                                <div>
                                                    <small>Deadline: {new Date(event.end).toLocaleString('it-IT', { 
                                                        year: 'numeric', 
                                                        month: '2-digit', 
                                                        day: '2-digit', 
                                                        hour: '2-digit', 
                                                        minute: '2-digit', 
                                                        hour12: false 
                                                    })}</small>
                                                    {event.status === 'expired' && <span style={{color: 'red'}}> (Expired)</span>}
                                                </div>
                                            </>
                                        ) : (
                                            <div>
                                                <small>Start Date: {new Date(event.start).toLocaleString('it-IT', { 
                                                    year: 'numeric', 
                                                    month: '2-digit', 
                                                    day: '2-digit', 
                                                    hour: '2-digit', 
                                                    minute: '2-digit', 
                                                    hour12: false 
                                                })}</small>
                                                <br />
                                                <small>End Date: {new Date(event.end).toLocaleString('it-IT', { 
                                                    year: 'numeric', 
                                                    month: '2-digit', 
                                                    day: '2-digit', 
                                                    hour: '2-digit', 
                                                    minute: '2-digit', 
                                                    hour12: false 
                                                })}</small>
                                            </div>
                                        )}

                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No events available.</p>
                    )}
                </div>
                
                <div className='req' onClick={() => window.location.href = "/notes"}>
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
