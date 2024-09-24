import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Dropdown } from 'react-bootstrap';
import NoteDetailModal from './NoteDetailModal';
import NoteFormModal from './NoteFormModal';
import CategoryFormModal from './CategoryFormModal';

const NoteViewer = () => {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchNotes();
    fetchCategories();
  }, []);

  const fetchNotes = async () => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get('/api/notes', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotes(response.data);
  };

  const fetchCategories = async () => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get('/api/categories', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCategories(response.data);
  };

  const handleAddNote = () => {
    setNoteModalOpen(true);
  };

  const handleAddCategory = () => {
    setCategoryModalOpen(true);
  };

  const handleNoteSave = () => {
    setNoteModalOpen(false);
    fetchNotes();
  };

  const handleCategorySave = () => {
    setCategoryModalOpen(false);
    fetchCategories();
  };

  const handleShowDetailModal = (note) => {
    setSelectedNote(note);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
  };

  const handleDeleteNote = async (noteId) => {
    const token = localStorage.getItem('authToken');
    try {
      await axios.delete(`/api/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotes(); // Aggiorna la lista delle note dopo l'eliminazione
    } catch (error) {
      console.error('Errore durante l\'eliminazione della nota:', error);
    }
  };

  return (
    <div>
      <h2>Le tue Note</h2>
      <button onClick={handleAddNote}>Aggiungi Nota</button>
      <button onClick={handleAddCategory}>Gestisci Categorie</button>
      <div className="note-list">
        {notes.map((note) => (
          <Card key={note._id} className="mb-3">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5>{note.title}</h5>
                <Dropdown>
                  <Dropdown.Toggle variant="secondary" id="dropdown-basic"></Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleShowDetailModal(note)}>
                      Visualizza
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleDeleteNote(note._id)}>Elimina</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </Card.Header>
            <Card.Body>
              <p>{note.content.substring(0, 200)}...</p>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Modale per aggiungere una nota */}
      <NoteFormModal
        isOpen={isNoteModalOpen}
        onRequestClose={() => setNoteModalOpen(false)}
        onSave={handleNoteSave}
        categories={categories}
      />

      {/* Modale per gestire le categorie */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onRequestClose={() => setCategoryModalOpen(false)}
        onSave={handleCategorySave}
      />

      {/* Modale per visualizzare la nota completa */}
      {selectedNote && (
        <NoteDetailModal
          show={showDetailModal} // usa "show" invece di "isOpen"
          onRequestClose={handleCloseDetailModal}
          note={selectedNote}
        />
      )}
    </div>
  );
};

export default NoteViewer;
