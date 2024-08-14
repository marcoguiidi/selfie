import React, { useState } from 'react';
import Modal from 'react-modal';
import "../css/EventFormModal.css"; // Assicurati di importare il file CSS

Modal.setAppElement('#root'); // Necessario per accessibilità

const EventFormModal = ({ isOpen, onRequestClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [description, setDescription] = useState('');
    const [invited, setInvited] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const event = {
            title,
            start: new Date(start),
            end: new Date(end),
            description,
            invited: invited.split(',').map(email => email.trim())
        };
        onSave(event);
        onRequestClose(); // Chiude la modale dopo il salvataggio
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Add Event"
            className="modal-content"
            overlayClassName="modal-overlay" // Classe per l'overlay
        >
            <h2 className="modal-title">Add Event</h2>
            <form onSubmit={handleSubmit} className="modal-form">
                <div className="modal-form-group">
                    <label>Title:</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="modal-input" />
                </div>
                <div className="modal-form-group">
                    <label>Start Date:</label>
                    <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required className="modal-input" />
                </div>
                <div className="modal-form-group">
                    <label>End Date:</label>
                    <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required className="modal-input" />
                </div>
                <div className="modal-form-group">
                    <label>Description:</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="modal-textarea" />
                </div>
                <div className="modal-form-group">
                    <label>Invited (comma-separated emails):</label>
                    <input type="text" value={invited} onChange={(e) => setInvited(e.target.value)} className="modal-input" />
                </div>
                <div className="modal-buttons">
                    <button type="submit" className="modal-button modal-save-button">Save</button>
                    <button type="button" onClick={onRequestClose} className="modal-button modal-cancel-button">Cancel</button>
                </div>
            </form>
        </Modal>
    );
};

export default EventFormModal;
