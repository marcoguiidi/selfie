import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import '../css/CategoryFormModal.css'

const CategoryFormModal = ({ isOpen, onRequestClose, onSave }) => {
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState([]);

  // Funzione per ottenere le categorie
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

  useEffect(() => {
    fetchCategories(); // Recupera le categorie ogni volta che il modal si apre
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');

    try {
      await axios.post('/api/categories', { name: categoryName }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategoryName(''); // Resetta il campo dopo l'aggiunta
      fetchCategories(); // Ricarica le categorie
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
      fetchCategories(); // Ricarica le categorie dopo l'eliminazione
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Manage Categories">
      <h2>Gestisci Categorie</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Category name:</label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
          />
        </div>
        <button type="submit">Add</button>
        <button type="button" onClick={onRequestClose}>Close</button>
      </form>
      
      <h3>Yuor categories:</h3>
      <ul>
        {categories.map(category => (
          <li key={category._id}>
            {category.name}
            <button className="delete-category-btn" onClick={() => handleDelete(category._id)}>X</button>
          </li>
        ))}
      </ul>
    </Modal>
  );
};

export default CategoryFormModal;
