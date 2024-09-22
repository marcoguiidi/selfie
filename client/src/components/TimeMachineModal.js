import React, { useState } from 'react';
import Modal from 'react-modal';
import "../css/TimeMachineModal.css";

Modal.setAppElement('#root');

const TimeMachineModal = ({ isOpen, onRequestClose, onSetDate, onResetDate }) => {
  const [selectedDateTime, setSelectedDateTime] = useState('');

  const handleDateTimeChange = (event) => {
    setSelectedDateTime(event.target.value);
  };

  const handleSetDate = () => {
    if (selectedDateTime) {
      onSetDate(new Date(selectedDateTime));
    }
  };

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
          value={selectedDateTime}
          onChange={handleDateTimeChange}
        />
      </div>
      <div className="modal-buttons">
        <button className="set-date" onClick={handleSetDate}>Set Date and Time</button>
        <button className="reset-date" onClick={onResetDate}>Reset to Current Date and Time</button>
        <button className="close" onClick={onRequestClose}>Close</button>
      </div>
    </Modal>
  );
};

export default TimeMachineModal;