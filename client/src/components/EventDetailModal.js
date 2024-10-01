import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import moment from 'moment';
import axios from 'axios';
import "../css/EventDetailModal.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faTimes, faCheck, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

Modal.setAppElement('#root'); 

const EventDetailModal = ({ isOpen, onRequestClose, event, onEdit, onDelete, onComplete, currentUser, onDecline }) => {
    const [parentEventDetails, setParentEventDetails] = useState(null);

    useEffect(() => {
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
        <div className='event-modal-wrapper'>
            <Modal 
                isOpen={isOpen} 
                onRequestClose={onRequestClose} 
                contentLabel="Dettagli Evento"
                className="event-detail-modal-content"
                overlayClassName="event-detail-modal-overlay"
            >
                <button className="event-modal-btn-close" onClick={onRequestClose}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
                <h2 className="event-modal-title">Event Details</h2>
                <p><strong>Title:</strong> {event.title}</p>
                { event.isDeadline ? (
                    <div>
                        <p><strong>Deadline:</strong> {new Date(event.end).toLocaleString()}</p>
                    </div>
                ) : (
                    <div>
                        <p><strong>Start:</strong> {new Date(event.start).toLocaleString()}</p>
                        <p><strong>End:</strong> {new Date(event.end).toLocaleString()}</p>
                    </div>
                )}
                {event.description && event.description.trim() && <p><strong>Description:</strong> {event.description}</p>}
                {event.invited && event.invited.length > 0 && event.invited[0] !== "" && <p><strong>Invited:</strong> {event.invited.join(', ')}</p>}
                <p><strong>Created By: </strong> {event.createdBy.email || 'unknown'}</p>
                { event.parentEvent && parentEventDetails && (
                    <small>Repeated from {moment(parentEventDetails.start).format('YYYY-MM-DD')}</small>
                )}
                <div className="event-modal-btn">
                    {isCreator ? (
                        <>
                            <button className="event-modal-btn-icon event-modal-btn-edit" onClick={() => onEdit(event)}>
                                <FontAwesomeIcon icon={faPen} />
                            </button>
                            <button className="event-modal-btn-icon event-modal-btn-delete" onClick={() => onDelete(event._id)}>
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </>
                    ) : (
                        <button className="event-modal-btn-icon event-modal-btn-decline" onClick={() => onDecline(event._id)}>
                            <FontAwesomeIcon icon={faTimesCircle} />
                        </button>
                    )}
                    {event.isDeadline && event.status !== 'completed' && (
                        <button className="event-modal-btn-icon event-modal-btn-complete" onClick={() => onComplete(event._id)}>
                            <FontAwesomeIcon icon={faCheck} />
                        </button>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default EventDetailModal;
