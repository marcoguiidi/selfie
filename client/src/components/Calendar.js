import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import EventFormModal from './EventFormModal';
import EventDetailModal from './EventDetailModal';
import TimeMachineModal from './TimeMachineModal';  // Importa la modale TimeMachine

const localizer = momentLocalizer(moment);

const MyCalendar = () => {
    const [events, setEvents] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());
    const [currentDate, setCurrentDate] = useState(new Date());
    const [timeMachineOpen, setTimeMachineOpen] = useState(false); // Stato per TimeMachineModal

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
        console.log('Selected view:', view);
    };

    const handleSelectSlot = (slotInfo) => {
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

    // Funzione per aprire il TimeMachineModal
    const openTimeMachine = () => {
        setTimeMachineOpen(true);
    };

    // Funzione per chiudere il TimeMachineModal e aggiornare la data
    const handleSetDate = (date) => {
        setCurrentDate(date);
        setDate(date); // Aggiorna la vista del calendario
        setTimeMachineOpen(false); // Chiudi la modale
    };
    
    const resetToCurrentDate = () => {
        const today = new Date();
        setCurrentDate(today);
        setDate(today); // Aggiorna la vista del calendario
        setTimeMachineOpen(false); // Chiudi la modale
    };
    

    return (
        <div className="page-content">
            <button onClick={openTimeMachine}>Open Time Machine</button> {/* Pulsante per aprire TimeMachine */}
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
                onNavigate={(newDate, view, action) => {
                    if (action === 'TODAY') {
                        setDate(currentDate); // Imposta la data alla tua data personalizzata
                    } else {
                        setDate(newDate); // Navigazione normale
                    }
                }}
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
            <TimeMachineModal
                isOpen={timeMachineOpen}
                onRequestClose={() => setTimeMachineOpen(false)}
                onSetDate={handleSetDate}
                onResetDate={resetToCurrentDate}
            />
        </div>
    );
};

export default MyCalendar;
