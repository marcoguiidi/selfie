import React, { useState } from 'react';
import Modal from 'react-modal';
import "../css/TimeMachineModal.css";

Modal.setAppElement('#root'); // Necessario per accessibilità

const TimeMachineModal = ({ isOpen, onRequestClose, onSetDate, onResetDate }) => {
    const [selectedDate, setSelectedDate] = useState('');

    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
    };

    const handleSetDate = () => {
        if (selectedDate) {
            onSetDate(new Date(selectedDate)); // Assicurati che onSetDate sia una funzione valida
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
                <label>Select Date:</label>
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={handleDateChange}
                />
            </div>
            <div className="modal-buttons">
                <button className="set-date" onClick={handleSetDate}>Set Date</button>
                <button className="reset-date" onClick={onResetDate}>Reset to Current Date</button>
                <button className="close" onClick={onRequestClose}>Close</button>
            </div>
        </Modal>
    );
};

export default TimeMachineModal;
