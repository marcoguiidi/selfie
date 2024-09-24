import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import '../css/NoteDetailModal.css'; // Import del file CSS per lo stile personalizzato

const NoteDetailModal = ({ show, onRequestClose, note }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    
    // Controlla se la data è oggi
    const isToday = date.toDateString() === today.toDateString();

    // Formattazione della data
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString(undefined, options);

    // Formattazione dell'orario
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return isToday ? formattedTime : formattedDate;
  };

  return (
    <Modal show={show} onHide={onRequestClose} centered size="lg" dialogClassName="note-detail-modal">
      <Modal.Header closeButton>
        <Modal.Title>{note.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Utilizzo di ReactMarkdown per fare il rendering del Markdown */}
        <ReactMarkdown>
          {note.content}
        </ReactMarkdown>
      </Modal.Body>
      <Modal.Footer>
        <small>Created: {formatDate(note.creationDate)},</small>
        <small>Last Edit: {formatDate(note.lastEdit)}</small>
      </Modal.Footer>
    </Modal>
  );
};

export default NoteDetailModal;