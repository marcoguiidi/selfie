import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import "../css/TimeMachineModal.css";

Modal.setAppElement('#root');


const formatDateTimeForInput = (date) => {
  const adjustedDate = new Date(date.getTime() + 2 * 60 * 60 * 1000); 
  return adjustedDate.toISOString().slice(0, 16);
};

const TimeMachineModal = ({ isOpen, onRequestClose, onSetDate, onResetDate }) => {
  const [selectedDateTime, setSelectedDateTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedDateTime(''); 
    }
  }, [isOpen]);

  const handleDateTimeChange = (event) => {
    setSelectedDateTime(event.target.value);
  };

  const handleSetDate = () => {
    if (selectedDateTime) {
      onSetDate(new Date(selectedDateTime));
    }
  };

  const handleResetDate = async () => {
    const currentDateTime = formatDateTimeForInput(new Date());
    setSelectedDateTime(currentDateTime);
  
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('/api/pomodoro/delete-cheated', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete cheated Pomodoro sessions');
      }
      onResetDate();
  
      console.log('Cheated Pomodoro sessions deleted successfully');
    } catch (error) {
      console.error('Error deleting cheated Pomodoro sessions:', error);
    }
  };

  const currentDateTime = formatDateTimeForInput(new Date());

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Time Machine"
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      <h2>Time Machine</h2>
      <div className="time-machine-input">
        <label>Select Date and Time:</label>
        <input
          type="datetime-local"
          value={selectedDateTime || currentDateTime}
          onChange={handleDateTimeChange}
        />
      </div>
      <div className="modal-buttons">
        <button className="set-date" onClick={handleSetDate}>Set</button>
        <button className="reset-date" onClick={handleResetDate}>Reset</button>
        <button className="close" onClick={onRequestClose}>Close</button>
      </div>
    </Modal>
  );
};

export default TimeMachineModal;