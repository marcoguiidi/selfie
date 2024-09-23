import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';

const CategoryFormModal = ({ isOpen, onRequestClose, onSave }) => {
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState([]);

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
  }, [isOpen, categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');

    try {
      await axios.post('/api/categories', { name: categoryName }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSave();
      onRequestClose();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleDelete = async (categoryId) => {
    const token = localStorage.getItem('authToken');
    try {
      await axios.delete(`/api/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSave(); // Richiama onSave per aggiornare le categorie
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Add Category">
      <h2>Add Category</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Category Name:</label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
          />
        </div>
        <button type="submit">Add Category</button>
        <button type="button" onClick={onRequestClose}>Cancel</button>
      </form>
      <h3>Elenco Categorie:</h3>
      <ul>
        {categories.map(category => (
          <li key={category._id}>
            {category.name}
            <button onClick={() => handleDelete(category._id)}>Elimina</button>
          </li>
        ))}
      </ul>
    </Modal>
  );
};

export default CategoryFormModal;
