import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import EventFormModal from './EventFormModal';
import EventDetailModal from './EventDetailModal';
import TimeMachineModal from './TimeMachineModal';  
import '../css/Calendar.css';

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
    const [currentUser, setCurrentUser] = useState(null); 
    const [initialStart, setInitialStart] = useState(null);
    

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

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get('/api/users/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setCurrentUser(response.data.email); // Imposta l'email dell'utente autenticato

        } catch (err) {
            console.error('Error fetching current user:', err.response ? err.response.data : err.message);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
        fetchEvents();
    }, []);

    const handleSelectView = (view) => {
        setView(view);
    };

    const handleSelectSlot = (slotInfo) => {
        setSelectedEvent(null);
        setInitialStart(moment(slotInfo.start).toDate());
        setModalOpen(true);
      };
    
      const handleCloseModal = () => {
        setModalOpen(false);
        setInitialStart(null);
        setSelectedEvent(null);
      };

    const handleSaveEvent = async (event) => {
        try {
          const token = localStorage.getItem('authToken');
          const eventData = {
            title: event.title,
            start: event.start,
            end: event.isDeadline ? event.start : event.end,
            isDeadline: event.isDeadline,
            description: event.description,
            invited: event.invited,
            color: event.color,
            repetition: event.repetition,
            endRepetition: event.endRepetition
          };
    
          if (selectedEvent && selectedEvent._id) {
            const response = await axios.put(`/api/events/${selectedEvent._id}`, eventData, {
              headers: { Authorization: `Bearer ${token}` },
            });

          } else {
            const response = await axios.post('/api/events', eventData, {
              headers: { Authorization: `Bearer ${token}` },
            });

          }
          
          fetchEvents();
          handleCloseModal();
        } catch (err) {
          console.error('Error saving event:', err.response ? err.response.data : err.message);
        }
      };

    const eventStyleGetter = (event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        const isExpired = event.isDeadline && currentDate > eventEnd;
        const isPast = currentDate > eventEnd;
        
        let backgroundColor = event.color || '#007bff';
        if (isExpired) {
            backgroundColor = '#d9534f';
        } else if (isPast) {
            backgroundColor = '#6c757d';
        }

        const style = {
            backgroundColor,
            borderRadius: '5px',
            opacity: 0.8,
            color: 'white',
            border: '0',
            display: 'block'
        };

        if (event.isDeadline) {
            style.borderLeft = '5px solid #ffc107';
        }

        return { style };
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setDetailModalOpen(true);
    };

    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        console.log('edit', event);
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
                // setEvents(events.filter(e => e._id !== eventId));
                fetchEvents();
                setDetailModalOpen(false);
            } catch (err) {
                console.error('Error deleting event:', err);
            }
        }
    };

    const handleDeclineEvent = async (eventId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(`/api/events/${eventId}/decline`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
    
            if (response.status === 200) {
                // Aggiorna la lista degli eventi rimuovendo l'utente corrente
                setEvents(prevEvents => 
                    prevEvents.map(event => 
                        event._id === eventId ? { 
                            ...event, 
                            invited: event.invited.filter(email => email !== currentUser.email)
                        } : event
                    )
                );
            }
            setDetailModalOpen(false);
            fetchEvents();
        } catch (err) {
            console.error('Error declining event:', err.response ? err.response.data : err.message);
        }
    };
    

    const openTimeMachine = () => {
        setTimeMachineOpen(true);
    };
    
    const handleSetDate = (newDate) => {
        setCurrentDate(newDate);
        setDate(newDate);
        setTimeMachineOpen(false);
    };

    const resetToCurrentDate = () => {
        const now = new Date();
        setCurrentDate(now);
        setDate(now);
        setTimeMachineOpen(false);
    };
    
    

    return (
        <div className="page-content">
          <button onClick={openTimeMachine}>Open Time Machine</button>
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
                setDate(currentDate);
              } else {
                setDate(newDate);
              }
            }}
          />
    <EventFormModal
        isOpen={modalOpen}
        onRequestClose={handleCloseModal}
        onSave={handleSaveEvent}
        event={selectedEvent}
        initialStart={initialStart}
      />
          <EventDetailModal
            isOpen={detailModalOpen}
            onRequestClose={() => setDetailModalOpen(false)}
            event={selectedEvent}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
            currentUser={currentUser}
            onDecline={handleDeclineEvent}
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
