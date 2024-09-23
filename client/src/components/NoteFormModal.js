import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import axios from 'axios';

const NoteFormModal = ({ isOpen, onRequestClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

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
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newNote = {
      title,
      content,
      category: selectedCategory,
    };
    onSave(newNote);
    onRequestClose();
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Add Note">
      <h2>Add Note</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Content:</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div>
          <h4>Instructions for Markdown:</h4>
          <p>
            Use **bold** for bold text, *italic* for italic text, and `code` for inline code.
          </p>
          <p>
            For lists, use - for bullet points and 1. for numbered lists.
          </p>
        </div>
        <div>
          <label>Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            required
          >
            <option value="">Select a category</option>
            {Array.isArray(categories) && categories.length > 0 ? (
              categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))
            ) : (
              <option value="">No categories available</option>
            )}
          </select>
        </div>
        <button type="submit">Save Note</button>
        <button type="button" onClick={onRequestClose}>Cancel</button>
      </form>
    </Modal>
  );
};

export default NoteFormModal;
