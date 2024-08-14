import React, { useEffect, useState } from 'react';
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
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

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
            console.error('Error fetching events:', err);
        }
    };

    const handleSelectSlot = (slotInfo) => {
        setSelectedSlot(slotInfo);
        setModalOpen(true); // Apre la modale di aggiunta
    };

    const handleSaveEvent = async (event) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post('/api/events', {
                ...event,
                start: selectedSlot.start,
                end: selectedSlot.end
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setEvents([...events, { ...response.data, start: new Date(response.data.start), end: new Date(response.data.end) }]);
            setModalOpen(false);
        } catch (err) {
            console.error('Error creating event:', err);
        }
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setDetailModalOpen(true); // Apre la modale di dettaglio
    };

    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        setModalOpen(true); // Apre la modale di modifica
        setDetailModalOpen(false); // Chiude la modale di dettaglio
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
        <div>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                style={{ height: 500 }}
            />
            <EventFormModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                onSave={handleSaveEvent}
                event={selectedEvent} // Passa l'evento se esiste
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
