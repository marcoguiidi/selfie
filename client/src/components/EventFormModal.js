import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import moment from 'moment';
import "../css/EventFormModal.css";

Modal.setAppElement('#root');

const EventFormModal = ({ isOpen, onRequestClose, onSave, event, initialStart }) => {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [isDeadline, setIsDeadline] = useState(false);
  const [description, setDescription] = useState('');
  const [invited, setInvited] = useState('');
  const [color, setColor] = useState('#007bff');
  const [repetition, setRepetition] = useState('no-repetition');
  const [endRepetition, setEndRepetition] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setStart(moment(event.start).format('YYYY-MM-DDTHH:mm'));
      setEnd(moment(event.end).format('YYYY-MM-DDTHH:mm'));
      setIsDeadline(event.isDeadline);
      setDescription(event.description);
      setInvited(event.invited.join(', '));
      setColor(event.color);
      setRepetition(event.repetition);
      setEndRepetition(moment(event.endRepetition).format('YYYY-MM-DD'));
    } else {
      const startTime = initialStart ? moment(initialStart) : moment();
      setStart(startTime.format('YYYY-MM-DDTHH:mm'));  

      // Calculate end time considering AM/PM transitions
      let endTime = startTime.clone().add(1, 'hour');
      if (startTime.format('A') === 'AM' && endTime.format('A') === 'PM') {
        // Transition from AM to PM
        endTime = startTime.clone().hour(12).minute(0); // Set to 12:00 PM
      } else if (startTime.format('A') === 'PM' && endTime.format('A') === 'AM') {
        // Transition from PM to next day AM
        endTime = startTime.clone().add(1, 'day').hour(0).minute(0); // Set to 12:00 AM next day
      }
      setEnd(endTime.format('YYYY-MM-DDTHH:mm'));

      setTitle('');
      setIsDeadline(false);
      setDescription('');
      setInvited('');
      setColor('#007bff');
      setRepetition('no-repetition');
      setEndRepetition('');
    }
  }, [event, initialStart]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const eventData = {
      title,
      start: new Date(start),
      end: new Date(end),
      isDeadline,
      description,
      invited: invited.split(',').map(email => email.trim()),
      color, 
      repetition,
      endRepetition: repetition === 'no-repetition'? null : new Date(endRepetition)
    };
    onSave(eventData);
    onRequestClose();
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Add/Edit Event" className="modal-content" overlayClassName="modal-overlay">
      <h2>{event ? 'Edit Event' : 'Add Event'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setIsDeadline(!isDeadline)}
              className={`deadline-button ${isDeadline ? 'active' : ''}`}
              style={{ marginRight: '8px' }} // Space between button and label
            >
              {isDeadline ? 'Deadline On' : 'Deadline Off'}
            </button>
          </label>
        </div>
        <div>
          <label>{isDeadline ? 'Deadline:' : 'Start Date:'}</label>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
        </div>
        {!isDeadline && (
          <div>
            <label>End Date:</label>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
          </div>
        )}
        <div>
        <div>
          <label>Repetition:</label>
          <select value={repetition} onChange={(e) => setRepetition(e.target.value)}>
            <option value="no-repetition">No Repetition</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          {repetition !== 'no-repetition' && (
            <div>
              <label>End Repetition:</label>
              <input type="date" value={endRepetition} onChange={(e) => setEndRepetition(e.target.value)} />
            </div>
          )}
        </div>
          <label>Description:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label>Invited (comma-separated emails):</label>
          <input type="text" value={invited} onChange={(e) => setInvited(e.target.value)} />
        </div>
        <div>
          <label>Color:</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <div className="modal-buttons">
          <button type="submit" className="save">Save</button>
          <button type="button" className="cancel" onClick={onRequestClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

export default EventFormModal;