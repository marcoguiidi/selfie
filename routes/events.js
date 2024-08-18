const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const jwt = require('jsonwebtoken');
const authenticateJWT = require('../middleware/authenticateJWT');

// Ottieni gli eventi creati dall'utente o a cui è invitato
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Trova eventi creati dall'utente o a cui è stato invitato
        const events = await Event.find({
            $or: [
                { createdBy: req.user.id },
                { invited: { $in: [userEmail] } }
            ]
        }).populate('createdBy', 'email');

        res.json(events);
    } catch (err) {
        console.error('Server Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});



// Crea un nuovo evento
router.post('/', authenticateJWT, async (req, res) => {
    const { title, start, end, description, invited, color } = req.body;
    try {
        const newEvent = new Event({
            title,
            start,
            end,
            description,
            createdBy: req.user.id,
            invited: invited,
            color
        });

        const savedEvent = await newEvent.save();
        
        res.status(201).json(newEvent);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Modifica un evento esistente
router.put('/:id', authenticateJWT, async (req, res) => {
    try {
        const { title, start, end, description, invited, color } = req.body;

        const event = await Event.findById(req.params.id);
        if (event.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id, 
            { title, start, end, description, invited, color }, 
            { new: true }
        );

        res.json(updatedEvent);
    } catch (err) {
        console.error('Update Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Elimina un evento
router.delete('/:id', authenticateJWT, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (event.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
