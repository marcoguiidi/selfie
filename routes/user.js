const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const authenticateJWT = require('../middleware/authenticateJWT');


router.get('/me', authenticateJWT, async (req, res) => {
    try {

        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.sendStatus(404);
        res.json(user);
    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
