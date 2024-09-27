import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import moment from 'moment';
import axios from 'axios';
import "../css/EventDetailModal.css";

Modal.setAppElement('#root'); // Necessario per accessibilità

const EventDetailModal = ({ isOpen, onRequestClose, event, onEdit, onDelete, currentUser, onDecline }) => {
    const [parentEventDetails, setParentEventDetails] = useState(null);

    useEffect(() => {
        // Recupera i dettagli dell'evento padre se esiste
        if (!event) return;
        const fetchParentEvent = async () => {
            if (event.parentEvent) {
                const token = localStorage.getItem('authToken');
                try {
                    const response = await axios.get(`/api/events/${event.parentEvent}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        }
                    });
                    const data = response.data;
                    setParentEventDetails(data);
                } catch (error) {
                    console.error('Errore nel recupero dell\'evento padre:', error);
                }
            }
        };

        fetchParentEvent();
    }, [event]);


    if (!event) {
        return null; 
    }

    const isCreator = event.createdBy.email === currentUser;

    return (
        <div className='page-content'>
            <Modal 
                isOpen={isOpen} 
                onRequestClose={onRequestClose} 
                contentLabel="Event Details"
                className="modal-content"
                overlayClassName="modal-overlay"
            >
                <h2>Event Details</h2>
                <p><strong>Title:</strong> {event.title}</p>
                { event.isDeadline ? (
                    <div>
                        <p><strong>Deadline:</strong> {new Date(event.end).toLocaleString()}</p>
                    </div>
                ) : (
                    <div>
                        <p><strong>Start Date:</strong> {new Date(event.start).toLocaleString()}</p>
                        <p><strong>End Date:</strong> {new Date(event.end).toLocaleString()}</p>
                    </div>
                )}
                {event.description.trim() && <p><strong>Description:</strong> {event.description}</p>}
                {event.invited.length > 0 && event.invited[0] !== "" && <p><strong>Invited:</strong> {event.invited.join(', ')}</p>}
                <p><strong>Created by: </strong> {event.createdBy.email || 'Unknown'}</p>
                { event.parentEvent && parentEventDetails && (
                    <small>Repeated from {moment(parentEventDetails.start).format('YYYY-MM-DD')}</small>
                )}
                <div className="modal-buttons">
                    {isCreator ? (
                        <>
                            <button className="edit" onClick={() => onEdit(event)}>Edit</button>
                            <button className="delete" onClick={() => onDelete(event._id)}>Delete</button>
                        </>
                    ) : (
                        <button className="decline" onClick={() => onDecline(event._id)}>Decline</button>
                    )}
                    <button className="cancel" onClick={onRequestClose}>Close</button>
                </div>
            </Modal>
        </div>
    );
};

export default EventDetailModal;
