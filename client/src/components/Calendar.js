import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import EventFormModal from './EventFormModal';
import EventDetailModal from './EventDetailModal';

const localizer = momentLocalizer(moment);

const MyCalendar = () => {
    const [events, setEvents] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get('/api/events', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const events = response.data.map(event => ({
                ...event,
                start: new Date(event.start),
                end: new Date(event.end)
            }));
            setEvents(events);
        } catch (err) {
            console.error('Error fetching events:', err.response ? err.response.data : err.message);
        }
    };

    const handleSelectView = (view) => {
        setView(view);
    };

    const handleSelectSlot = () => {
        setSelectedEvent(null);
        setModalOpen(true);
    };

    const handleSaveEvent = async (event) => {
        try {
            const token = localStorage.getItem('authToken');
            const eventData = {
                title: event.title,
                start: event.start,
                end: event.end,
                description: event.description,
                invited: event.invited,
                color: event.color
            };

            if (selectedEvent && selectedEvent._id) {
                const response = await axios.put(`/api/events/${selectedEvent._id}`, eventData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setEvents((prevEvents) =>
                    prevEvents.map((e) =>
                        e._id === selectedEvent._id ? { ...response.data } : e
                    )
                );
            } else {
                const response = await axios.post('/api/events', eventData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setEvents([...events, { ...response.data }]);
            }

            setModalOpen(false);
            setSelectedEvent(null);
            fetchEvents();
            setView('month');
        } catch (err) {
            console.error('Error saving event:', err.response ? err.response.data : err.message);
        }
    };

    const eventStyleGetter = (event) => {
        const backgroundColor = event.color || '#007bff';
        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0',
                display: 'block'
            }
        };
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setDetailModalOpen(true);
    };

    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        setModalOpen(true);
        setDetailModalOpen(false);
    };

    const handleDeleteEvent = async (eventId) => {
        const confirmDelete = window.confirm('Would you like to delete this event?');
        if (confirmDelete) {
            try {
                const token = localStorage.getItem('authToken');
                await axios.delete(`/api/events/${eventId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setEvents(events.filter(e => e._id !== eventId));
                setDetailModalOpen(false);
            } catch (err) {
                console.error('Error deleting event:', err);
            }
        }
    };

    return (
        <div className="page-content">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                selectable
                views={['month', 'week', 'day', 'agenda']}
                view={view}
                onView={handleSelectView}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                style={{ height: 500 }}
                eventPropGetter={eventStyleGetter}
                date={date}
                onNavigate={(newDate) => setDate(newDate)}
            />
            <EventFormModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                onSave={handleSaveEvent}
                event={selectedEvent}
            />
            <EventDetailModal
                isOpen={detailModalOpen}
                onRequestClose={() => setDetailModalOpen(false)}
                event={selectedEvent}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
            />
        </div>
    );
};

export default MyCalendar;
