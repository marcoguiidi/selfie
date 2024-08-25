import React from 'react';
import Modal from 'react-modal';
import "../css/EventDetailModal.css";

Modal.setAppElement('#root'); // Necessario per accessibilità

const EventDetailModal = ({ isOpen, onRequestClose, event, onEdit, onDelete }) => {
    // Verifica se l'evento è definito
    if (!event) {
        return null; // Non mostrare nulla se non c'è un evento
    }


    return (
        <div className='page-content' >
            <Modal 
                isOpen={isOpen} 
                onRequestClose={onRequestClose} 
                contentLabel="Event Details"
                className="modal-content"
                overlayClassName="modal-overlay"
            >
                <h2>Event Details</h2>
                <p><strong>Title:</strong> {event.title}</p>
                { event.deadline ? (
                    <div>
                        <p><strong>Deadline:</strong> {new Date(event.end).toLocaleString()}</p>
                    </div>
                ) : (
                    <div>
                        <p><strong>Start Date:</strong> {new Date(event.start).toLocaleString()}</p>
                        <p><strong>End Date:</strong> {new Date(event.end).toLocaleString()}</p>
                    </div>
                )}
                {/* { !event.deadline && (
                    <div>
                        <p><strong>Start Date:</strong> {new Date(event.start).toLocaleString()}</p>
                        <p><strong>End Date:</strong> {new Date(event.end).toLocaleString()}</p>
                    </div>
                )} */}
                {event.description.trim() && <p><strong>Description:</strong> {event.description}</p>}
                {event.invited.length > 0 && event.invited[0] !== "" && <p><strong>Invited:</strong> {event.invited.join(', ')}</p>}
                <p><strong>Created by: </strong> {event.createdBy.email || 'Unknown'}</p>
                <div className="modal-buttons">
                    <button className="edit" onClick={() => onEdit(event)}>Edit</button>
                    <button className="delete" onClick={() => onDelete(event._id)}>Delete</button>
                    <button className="cancel" onClick={onRequestClose}>Close</button>
                </div>
            </Modal>
        </div>
    );
};

export default EventDetailModal;
