import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import "../css/TimeMachineModal.css";

Modal.setAppElement('#root');

const formatDateTimeForInput = (date) => {
  return date.toISOString().slice(0, 16);
};

const TimeMachineModal = ({ isOpen, onRequestClose, onSetDate, onResetDate }) => {
  const [selectedDateTime, setSelectedDateTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedDateTime(''); // Reset state when modal opens
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

  const handleResetDate = () => {
    const currentDateTime = formatDateTimeForInput(new Date());
    setSelectedDateTime(currentDateTime);
    onResetDate();
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
        <button className="set-date" onClick={handleSetDate}>Set Date and Time</button>
        <button className="reset-date" onClick={handleResetDate}>Reset to Current Date and Time</button>
        <button className="close" onClick={onRequestClose}>Close</button>
      </div>
    </Modal>
  );
};

export default TimeMachineModal;