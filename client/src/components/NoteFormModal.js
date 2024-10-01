import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import '../css/NoteFormModal.css'; 

const NoteFormModal = ({ isOpen, onRequestClose, onSave, note, onCategory }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSelectedCategory(note.category ? note.category._id : null);
    } else {
      setTitle('');
      setContent('');
      setSelectedCategory(null);
    }
  }, [note]);

  useEffect(() => {
    const fetchCategories = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const response = await axios.get('/api/categories', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (Array.isArray(response.data)) {
          setCategories(response.data);
        } else {
          console.error('La risposta non è un array:', response.data);
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, [isOpen, onCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const noteData = {
      title,
      content,
      category: selectedCategory,
    };
    onSave(noteData);
    onRequestClose();
  }

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Add/Edit Note" className="note-form-modal">
      <h2 className="note-form-modal__title">Add Note</h2>
      <form onSubmit={handleSubmit} className="note-form-modal__form">
        <div className="note-form-modal__input">
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="note-form-modal__input">
          <label>Content:</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div className="note-form-modal__markdown-instructions">
          <h4>Instructions for Markdown:</h4>
          <p>
            Use **bold** for bold text, *italic* for italic text, and `code` for inline code.
          </p>
          <p>
            For lists, use - for bullet points and 1. for numbered lists.
          </p>
        </div>
        <div className="note-form-modal__input">
          <label>Category:</label>
          <div className="note-form-modal__category-container">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {Array.isArray(categories) && categories.length > 0 ? (
                categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))
              ) : (
                <option value="">No categories available</option>
              )}
            </select>
            <button type="button" onClick={onCategory} className="note-form-modal__button note-form-modal__button--edit"> 
              Edit Categories
            </button>
          </div>
        </div>
        <div className="note-form-modal__button-container">
          <button type="submit" className="note-form-modal__button note-form-modal__button--save">Save Note</button>
          <button type="button" onClick={onRequestClose} className="note-form-modal__button note-form-modal__button--cancel">Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

export default NoteFormModal;
