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
        <Modal 
            isOpen={isOpen} 
            onRequestClose={onRequestClose} 
            contentLabel="Event Details"
            className="modal-content"
            overlayClassName="modal-overlay"
        >
            <h2>Event Details</h2>
            <p><strong>Title:</strong> {event.title}</p>
            <p><strong>Start Date:</strong> {new Date(event.start).toLocaleString()}</p>
            <p><strong>End Date:</strong> {new Date(event.end).toLocaleString()}</p>
            <p><strong>Description:</strong> {event.description}</p>
            <p><strong>Invited:</strong> {event.invited.join(', ')}</p>
            <div className="modal-buttons">
                <button className="save" onClick={() => onEdit(event)}>Edit</button>
                <button className="delete" onClick={() => onDelete(event._id)}>Delete</button>
                <button className="cancel" onClick={onRequestClose}>Close</button>
            </div>
        </Modal>
    );
};

export default EventDetailModal;
