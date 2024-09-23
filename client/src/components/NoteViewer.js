import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NoteFormModal from './NoteFormModal';
import CategoryFormModal from './CategoryFormModal';

const NoteViewer = () => {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);

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
    fetchNotes();
    setNoteModalOpen(false);
  };

  const handleCategorySave = () => {
    setCategoryModalOpen(false);
    fetchCategories();
  };

  return (
    <div>
      <h2>Le tue Note</h2>
      <button onClick={handleAddNote}>Aggiungi Nota</button>
      <button onClick={handleAddCategory}>Gestisci Categorie</button>
      <ul>
        {notes.map(note => (
          <li key={note._id}>
            <h3>{note.title}</h3>
            <p>{note.content.substring(0, 200)}...</p>
          </li>
        ))}
      </ul>
      <NoteFormModal isOpen={isNoteModalOpen} onRequestClose={() => setNoteModalOpen(false)} onSave={handleNoteSave} categories={categories} />
      <CategoryFormModal isOpen={isCategoryModalOpen} onRequestClose={() => setCategoryModalOpen(false)} onSave={handleCategorySave} />
    </div>
  );
};

export default NoteViewer;
