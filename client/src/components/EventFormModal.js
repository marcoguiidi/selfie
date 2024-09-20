import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import moment from'moment';
import "../css/EventFormModal.css";

Modal.setAppElement('#root'); // Necessario per accessibilità

const EventFormModal = ({ isOpen, onRequestClose, onSave, event }) => {
    const [title, setTitle] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState(false);
    const [invited, setInvited] = useState('');
    const [color, setColor] = useState('#007bff');

    useEffect(() => {
        if (event) {
            setTitle(event.title);    
            setStart(moment(event.start).format('YYYY-MM-DDTHH:mm'));
            setEnd(moment(event.end).format('YYYY-MM-DDTHH:mm'));
            setDeadline(event.deadline);
            setDescription(event.description);
            setInvited(event.invited.join(', '));
            setColor(event.color);  
        } else {
            // Se non è un evento esistente, resetta i campi
            setTitle('');
            setStart('');
            setEnd('');
            setDeadline(false);
            setDescription('');
            setInvited('');
            setColor('#007bff');
        }
    }, [event]);  // Esegui l'effetto ogni volta che l'evento cambia
    
    const handleDeadline = (e) => {
        setDeadline(e.target.checked);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!deadline) {
            const event = {
                title,
                start: new Date(start), 
                end: new Date(end),
                deadline,
                description,
                invited: invited.split(',').map(email => email.trim()),
                color
            };
            onSave(event);
        } else {
            const event = {
                title,
                start: new Date(end), 
                end: new Date(end),
                deadline,
                description,
                invited: invited.split(',').map(email => email.trim()),
                color
            };
            onSave(event);
        }
         
        onRequestClose(); // Chiudi la modale dopo il salvataggio
    };

    const colorOptions = ['#007bff', 'green', 'orange', 'gray', 'blue'];
    

    return (
        <div className='page-content' >
            <Modal 
                isOpen={isOpen} 
                onRequestClose={onRequestClose} 
                contentLabel="Add Event"
                className="modal-content"
                overlayClassName="modal-overlay"
            >
                <h2>{event ? 'Edit Event' : 'Add Event'}</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Title:</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div>
                        <p>set deadline <input type="checkbox" id='deadline' checked={deadline} onChange={handleDeadline} /> </p>
                    </div>
                    { deadline ? (
                        <><div>
                            <label>Deadline:</label>
                            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
                        </div></>
                    ) : (
                        <><div>
                            <label>Start Date:</label>
                            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
                        </div><div>
                                <label>End Date:</label>
                                <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
                            </div></>
                    )}
                    <div>
                        <label>Description:</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div>
                        <label>Invited (comma-separated emails):</label>
                        <input type="text" value={invited} onChange={(e) => setInvited(e.target.value)} />
                    </div>
                    <label>Color:</label>
                    <div className="color-picker">
                    {colorOptions.map((option) => (
                        <div
                            key={option}
                            className={`color-option ${color === option ? 'selected' : ''}`}
                            style={{ backgroundColor: option }}
                            onClick={() => setColor(option)}
                        />
                    ))}
                </div>
                    <div className="modal-buttons">
                        <button type="submit" className="save">Save</button>
                        <button type="button" className="cancel" onClick={onRequestClose}>Cancel</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default EventFormModal;
