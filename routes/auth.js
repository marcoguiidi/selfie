const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Category = require('../models/Category');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateJWT = require('../middleware/authenticateJWT');

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
    res.json({ token, message: 'Login successful' });
  } catch (err) {
    console.error('Server Error:', err);
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
    const defaultCategories = ['Unibo', 'Altro'];
    defaultCategories.forEach(async (cat) => {
      const category = new Category({ name: cat, createdBy: user._id });
      await category.save();
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
});

router.get('/verify', authenticateJWT, (req, res) => {
  res.status(200).json({ message: 'Token is valid' });
});

module.exports = router;