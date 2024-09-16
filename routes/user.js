const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const authenticateJWT = require('../middleware/authenticateJWT');

// Endpoint per ottenere i dettagli dell'utente corrente
router.get('/me', authenticateJWT, async (req, res) => {
    try {
        // Assumiamo che l'ID dell'utente sia memorizzato nel token JWT
        const user = await User.findById(req.user.id).select('-password'); // Non includere la password
        if (!user) return res.sendStatus(404);
        res.json(user);
    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
