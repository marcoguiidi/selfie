const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const authenticateJWT = require('../middleware/authenticateJWT');

// Ottieni tutte le note dell'utente loggato
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const notes = await Note.find({ createdBy: req.user.id }).populate('category', 'name');
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notes' });
  }
});

// Aggiungi una nuova nota
router.post('/', authenticateJWT, async (req, res) => {
  const { title, content, category } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ message: 'Title, content, and category are required' });
  }

  try {
    const newNote = new Note({
      title,
      content,
      category,
      createdBy: req.user.id,
      creationDate: new Date(),
      lastEdit: new Date(),
    });

    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ message: 'Server error'}); 
  }
});

router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.lastEdit = new Date();
    note.title = title;
    note.content = content;
    note.category = category;

    await note.save();
    res.json(note);
  } catch (err) {
    console.error('update note error: ', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Elimina una nota
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    await Note.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting note' });
  }
});

module.exports = router;
