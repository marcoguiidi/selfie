import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Dropdown, ButtonGroup } from 'react-bootstrap';
import NoteDetailModal from './NoteDetailModal';
import NoteFormModal from './NoteFormModal';
import CategoryFormModal from './CategoryFormModal';
import '../css/NoteViewer.css';

const NoteViewer = () => {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sortOption, setSortOption] = useState('creation date'); 

  useEffect(() => {
    fetchNotes();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [isNoteModalOpen, isCategoryModalOpen]);

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


  const sortedNotes = () => {
    let sorted = [...notes]; 
    switch (sortOption) {
      case 'creation date':
        sorted.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate)); 
        break;
      case 'last modified':
        sorted.sort((a, b) => new Date(b.lastEdit) - new Date(a.lastEdit)); 
        break;
      case 'category':
        sorted.sort((a, b) => {
          const categoryA = categories.find(e => e._id === a.category?._id)?.name || 'other';
          const categoryB = categories.find(e => e._id === b.category?._id)?.name || 'other';
          return categoryA.localeCompare(categoryB);
        });
        break;
      default:
        break;
    }
    return sorted;
  };

  const handleSortChange = (option) => {
    setSortOption(option);
  };

  const handleAddNote = () => {
    setNoteModalOpen(true);
  };

  const handleEditNote = (note) => {
    setSelectedNote(note);
    setNoteModalOpen(true);
  };

  const handleAddCategory = () => {
    setCategoryModalOpen(true);
  };

  const handleCloseModal = () => {
    setNoteModalOpen(false);
    setSelectedNote(null);
  };

  const handleNoteSave = async (note) => {
    try {
      const token = localStorage.getItem('authToken');
      const noteData = {
        title: note.title,
        content: note.content,
        category: note.category,
      };
      if (selectedNote && selectedNote._id) {
        const response = await axios.put(`/api/notes/${selectedNote._id}`, noteData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotes((prevNotes) =>
          prevNotes.map((e) => (e._id === selectedNote._id ? { ...response.data } : e))
        );
      } else {
        const response = await axios.post('/api/notes', noteData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotes((prevNotes) => [...prevNotes, { ...response.data }]);
      }
      fetchNotes();
      handleCloseModal();
    } catch (err) {
      console.error('error saving note', err.response ? err.response.data : err.message);
    }
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
    setSelectedNote(null);
  };

  const handleDeleteNote = async (noteId) => {
    const confirmDelete = window.confirm('Would you like to delete this event?');
    if (confirmDelete) {
      const token = localStorage.getItem('authToken');
      try {
        await axios.delete(`/api/notes/${noteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchNotes(); 
      } catch (error) {
        console.error('Errore durante l\'eliminazione della nota:', error);
      }
    }
  };

  return (
    <div>
      <h2>Notes</h2>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <button className="add-note-btn" onClick={handleAddNote}>+</button>
          <button onClick={handleAddCategory}>Manage Categories</button>
        </div>
        <Dropdown as={ButtonGroup}>
          <Dropdown.Toggle variant="secondary" id="dropdown-sort">
            Sort by
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => handleSortChange('creation date')}>
              creation date
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleSortChange('last modified')}>
              last edit
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleSortChange('category')}>
              category
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <div className="note-list">
        {sortedNotes().map((note) => {
          const noteCategoryId = note.category ? note.category._id : null;
          const noteCategory = categories.find(e => e._id === noteCategoryId);
          const categoryName = noteCategory ? noteCategory.name : 'other';

          return (
            <Card key={note._id} className="mb-3">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5>{note.title}</h5>
                  <small>{categoryName}</small>
                  <Dropdown>
                    <Dropdown.Toggle variant="secondary" id="dropdown-basic"></Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handleShowDetailModal(note)}>
                        View
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleDeleteNote(note._id)}>
                        Delete
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleEditNote(note)}>
                        Edit
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </Card.Header>
              <Card.Body>
                <p>{note.content.substring(0, 200)}...</p>
              </Card.Body>
            </Card>
          );
        })}
      </div>

      <NoteFormModal
        isOpen={isNoteModalOpen}
        onRequestClose={handleCloseModal}
        note={selectedNote}
        onSave={handleNoteSave}
        onCategory={handleAddCategory}
      />

      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onRequestClose={() => setCategoryModalOpen(false)}
        onSave={handleCategorySave}
      />

      {selectedNote && (
        <NoteDetailModal
          show={showDetailModal}
          onRequestClose={handleCloseDetailModal}
          note={selectedNote}
        />
      )}
    </div>
  );
};

export default NoteViewer;