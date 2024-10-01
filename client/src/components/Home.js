import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import '../css/Home.css'; 

const Home = () => {
    const [events, setEvents] = useState([]);
    const [orderEvents, setOrderEvents] = useState('next-events');
    const [latestNote, setLatestNote] = useState(null);
    const [lastPomodoro, setLastPomodoro] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await axios.get('/api/events', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const now = new Date();

                let filteredEvents = [];
                if (orderEvents === 'next-events') {
                    filteredEvents = response.data.filter(event => {
                        if (event.isDeadline && event.status === 'completed') {
                            return false;
                        }
                        const eventEndDate = new Date(event.end);
                        if (event.isDeadline && eventEndDate < now && event.status === 'expired') {
                            return true;
                        }
                        return new Date(event.start) > now;
                    });
                } else if (orderEvents === 'today-events') {
                    filteredEvents = response.data.filter(event => {
                        const eventStart = new Date(event.start);
                        if (event.isDeadline && event.status === 'completed') {
                            return false;
                        }
                        return eventStart.toDateString() === now.toDateString();
                    });
                } else if (orderEvents === 'week-events') {
                    filteredEvents = response.data.filter(event => {
                        const eventStart = new Date(event.start);
                        const oneWeekFromNow = new Date(now);
                        oneWeekFromNow.setDate(now.getDate() + 7);
                        if (event.isDeadline && event.status === 'completed') {
                            return false;
                        }
                        return eventStart >= now && eventStart <= oneWeekFromNow;
                    });
                } else if (orderEvents === 'month-events') {
                    filteredEvents = response.data.filter(event => {
                        const eventStart = new Date(event.start);
                        const oneMonthFromNow = new Date(now);
                        oneMonthFromNow.setMonth(now.getMonth() + 1);
                        if (event.isDeadline && event.status === 'completed') {
                            return false;
                        }
                        return eventStart >= now && eventStart <= oneMonthFromNow;
                    });
                } else if (orderEvents === 'next-deadlines') {
                    filteredEvents = response.data.filter(event => {
                        if (event.status === 'completed') {
                            return false;
                        }
                        return event.isDeadline;
                    });
                }

                const sortedEvents = filteredEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

                setEvents(sortedEvents.slice(0, 5));
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

        const fetchPomodoro = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await axios.get('/api/events/lastPomodoro', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLastPomodoro(response.data);
            } catch (error) {
                console.error('Errore nel recupero del pomodoro:', error);
            }
        };

        fetchEvents();
        fetchLatestNote();
        fetchPomodoro();
    }, [orderEvents]);

    return (
        <div className='page-content'>
            <h1>Homepage</h1>
    
            <div className='events-selector-container'>
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
    
            <div className='flex-container'>
                <div className='req' onClick={() => window.location.href = "/calendar"}>
                    <h2>Calendar</h2>
                    {events.length > 0 ? (
                        <ul>
                            {events.map(event => (
                                <li
                                    key={event._id}
                                    className='event-item'
                                    style={{
                                        backgroundColor: event.color ? `${event.color}99` : 'rgba(255, 255, 255, 0.5)',
                                        borderRadius: '8px',
                                        padding: '10px',
                                        margin: '5px 0',
                                        transition: 'transform 0.2s',
                                    }}
                                >
                                    <p><strong>{event.title}</strong></p>
                                    {event.isDeadline ? (
                                        <div>
                                            <small>Deadline: {new Date(event.end).toLocaleString('it-IT', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: false
                                            })}</small>
                                            {event.status === 'expired' && <span className='expired'> (Expired)</span>}
                                        </div>
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
                    {latestNote ? (
                        <div>
                            <h3><strong>{latestNote.title}</strong></h3>
                            <ReactMarkdown>{latestNote.content.substring(0, 200)}</ReactMarkdown>
                            <small>{moment(new Date(latestNote.creationDate)).format('YYYY-MM-DD')}</small>
                        </div>
                    ) : (
                        <p>No notes available.</p>
                    )}
                </div>
    
                <div className="req" onClick={() => window.location.href = "/pomodoro"}>
                    {lastPomodoro ? (
                        <div>
                            <h2>{lastPomodoro.title}</h2>
                            <p>{lastPomodoro.description}</p>
                            {lastPomodoro.isDeadline && <p>To be completed</p>}
                        </div>
                    ) : (
                        <h2>No Pomodoro session available.</h2>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
