const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const jwt = require('jsonwebtoken');

// Middleware per autenticare l'utente
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    if (token) {
        jwt.verify(token, 'your_jwt_secret', (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Ottieni gli eventi creati dall'utente o a cui è invitato
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const events = await Event.find({
            $or: [
                { createdBy: req.user.id },
                { invited: req.user.email }
            ]
        });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Crea un nuovo evento
router.post('/', authenticateJWT, async (req, res) => {
    const { title, start, end, description, invited } = req.body;
    try {
        const newEvent = new Event({
            title,
            start,
            end,
            description,
            createdBy: req.user.id,
            invited: invited || []
        });
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Modifica un evento esistente
router.put('/:id', authenticateJWT, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (event.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedEvent);
    } catch (err) {
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
