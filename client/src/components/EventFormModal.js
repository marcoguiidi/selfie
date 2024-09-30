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

      let endTime = startTime.clone().add(1, 'hour');
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
      endRepetition: repetition === 'no-repetition' ? null : new Date(endRepetition)
    };
    onSave(eventData);
    onRequestClose();
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Add/Edit Event" className="event-modal-content" overlayClassName="event-modal-overlay">
      <h2 className="event-modal-title">{event ? 'Edit Event' : 'Add Event'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="event-modal-form-group">
          <label>Title:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="event-modal-form-row">
          <div className="event-modal-form-group inline">
            <label>Deadline:</label>
            <input type="checkbox" checked={isDeadline} onChange={() => setIsDeadline(!isDeadline)} />
          </div>
          <div className="event-modal-form-group inline">
            <label>{isDeadline ? 'Deadline date:' : 'Start date:'}</label>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
          </div>
          {!isDeadline && (
            <div className="event-modal-form-group inline">
              <label>End date:</label>
              <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
            </div>
          )}
        </div>
        <div className="event-modal-form-group">
          <label>Repetition:</label>
          <select value={repetition} onChange={(e) => setRepetition(e.target.value)}>
            <option value="no-repetition">no repetition</option>
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
            <option value="yearly">yearly</option>
          </select>
          {repetition !== 'no-repetition' && (
            <div className="event-modal-form-group inline">
              <label>End Repetition:</label>
              <input type="date" value={endRepetition} onChange={(e) => setEndRepetition(e.target.value)} />
            </div>
          )}
        </div>
        <div className="event-modal-form-group">
          <label>Description:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="event-modal-form-group">
          <label>Invited (comma-separated mail):</label>
          <input type="text" value={invited} onChange={(e) => setInvited(e.target.value)} />
        </div>
        <div className="event-modal-form-row">
          <div className="event-modal-form-group">
            <label>Color:</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>
        <div className="event-modal-buttons">
          <button type="submit" className="event-modal-save">SaSavelva</button>
          <button type="button" className="event-modal-cancel" onClick={onRequestClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

export default EventFormModal;
