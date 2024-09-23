const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authenticateJWT');
const Category = require('../models/Category');

// Ottieni le categorie
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const categories = await Category.find(
      { createdBy: req.user.id }
    );

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Aggiungi categoria
router.post('/', authenticateJWT, async (req, res) => {
  const { name } = req.body;
  try {
    const newCategory = new Category({
      name,
      createdBy: req.user.id
    });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Elimina categoria
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
