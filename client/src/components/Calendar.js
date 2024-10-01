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
    const [timeMachineOpen, setTimeMachineOpen] = useState(false); 
    const [currentUser, setCurrentUser] = useState(null); 
    const [initialStart, setInitialStart] = useState(null);

    const fetchEvents = async (selectedDate) => {
        console.log('Fetching events for date:', selectedDate);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get('/api/events', {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    currentDate: selectedDate || new Date() 
                }
            });
    
            const events = response.data.map(event => ({
                ...event,
                start: new Date(event.start),
                end: new Date(event.end)
            }));
            setEvents(events);
            console.log('Fetched events:', events);
        } catch (err) {
            console.error('Error fetching events:', err.response ? err.response.data : err.message);
        }
    };

    const fetchCurrentUser = async () => {
        console.log('Fetching current user');
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get('/api/users/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setCurrentUser(response.data.email); 
            console.log('Fetched current user:', response.data.email);
        } catch (err) {
            console.error('Error fetching current user:', err.response ? err.response.data : err.message);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
        fetchEvents();
    }, []);

    const handleSelectView = (view) => {
        console.log('Selected view:', view);
        setView(view);
    };

    const handleSelectSlot = (slotInfo) => {
        console.log('Selected slot:', slotInfo);
        setSelectedEvent(null);
        setInitialStart(moment(slotInfo.start).toDate());
        setModalOpen(true);
    };
    
    const handleCloseModal = () => {
        console.log('Closing modal');
        setModalOpen(false);
        setInitialStart(null);
        setSelectedEvent(null);
    };

    const handleSaveEvent = async (event) => {
        console.log('Saving event:', event);
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
                console.log('Updated event:', response.data);
            } else {
                const response = await axios.post('/api/events', eventData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log('Created event:', response.data);
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
        const isExpired = event.status === 'expired';
        const isCompleted = event.status === 'completed';
        const isPast = currentDate > eventEnd && !event.isDeadline;
        
        let backgroundColor = event.color || '#007bff';
        if (isCompleted) {
            backgroundColor = '#5cb85c';
        } else if (isExpired) {
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
        console.log('Selected event:', event);
        setSelectedEvent(event);
        setDetailModalOpen(true);
    };

    const handleEditEvent = (event) => {
        console.log('Editing event:', event);
        setSelectedEvent(event);
        setModalOpen(true);
        setDetailModalOpen(false);
    };

    const handleDeleteEvent = async (eventId) => {
        const confirmDelete = window.confirm('Would you like to delete this event?');
        if (confirmDelete) {
            console.log('Deleting event:', eventId);
            try {
                const token = localStorage.getItem('authToken');
                await axios.delete(`/api/events/${eventId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                fetchEvents();
                setDetailModalOpen(false);
            } catch (err) {
                console.error('Error deleting event:', err);
            }
        }
    };

    const handleDeclineEvent = async (eventId) => {
        console.log('Declining event:', eventId);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(`/api/events/${eventId}/decline`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
    
            if (response.status === 200) {
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

    const handleCompleteEvent = async (eventId) => {
        console.log('Completing event:', eventId);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(`/api/events/${eventId}/complete`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setDetailModalOpen(false);
            fetchEvents();
        } catch (error){
            console.error('Error completing event:', error.response ? error.response.data : error.message);
        }
    };

    const openTimeMachine = () => {
        console.log('Opening Time Machine');
        setTimeMachineOpen(true);
    };

    const handleSetDate = (newDate) => {
        console.log('Setting new date:', newDate);
        setCurrentDate(newDate);
        setDate(newDate);
        setTimeMachineOpen(false);
        fetchEvents(newDate); 
    };

    const resetToCurrentDate = () => {
        console.log('Resetting to current date');
        const now = new Date();
        setCurrentDate(now);
        setDate(now);
        fetchEvents();
        setTimeMachineOpen(false);
    };

    return (
        <div className="page-content">
            <button onClick={openTimeMachine}>Open Time Machine</button>
            <Calendar
                key={date.toISOString()} // Use toISOString() for a more precise key
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
                    console.log('Navigating to date:', newDate, 'Action:', action);
                    if (action === 'TODAY') {
                        setDate(currentDate);
                    } else {
                        setDate(newDate);
                    }
                }}
                components={{
                    toolbar: (toolbarProps) => (
                        <CustomToolbar
                            {...toolbarProps}
                            currentDate={currentDate}
                        />
                    ),
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
                onComplete={handleCompleteEvent}
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

// Custom Toolbar component
const CustomToolbar = (props) => {
    const { label, onNavigate, onView, currentDate } = props;

    return (
        <div className="rbc-toolbar">
            <span className="rbc-btn-group">
                <button type="button" onClick={() => onNavigate('PREV')}>Back</button>
                <button type="button" onClick={() => onNavigate('TODAY')}>
                    {moment(currentDate).format('MMM D, YYYY')}
                </button>
                <button type="button" onClick={() => onNavigate('NEXT')}>Next</button>
            </span>
            <span className="rbc-toolbar-label">{label}</span>
            <span className="rbc-btn-group">
                {['month', 'week', 'day', 'agenda'].map(value => (
                    <button key={value} type="button" onClick={() => onView(value)}>
                        {value}
                    </button>
                ))}
            </span>
        </div>
    );
};

export default MyCalendar;