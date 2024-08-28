const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



// Login Route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if(!username || !password){
        return res.status(400).json({message: "username and password required"});
    }
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
        

        const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error('Server Error:', err); // Aggiungi un log per l'errore
        res.status(500).json({ message: 'Server error' });
    }
});

// Register Route
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    try {
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ message: 'User already exists' });

        let mail = await User.findOne({ email });
        if (mail) return res.status(400).json({ message: 'Email already in use' });

        user = new User({ username, email, password: await bcrypt.hash(password, 10) });
        await user.save();
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token'); // Cancella il cookie di autenticazione
    res.status(200).json({ message: 'Logout successful' });
  });

  

module.exports = router;
