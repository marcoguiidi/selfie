const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true }, // deve essere unico nel database
    password: { type: String, required: true },
  });

module.exports = mongoose.model('User', userSchema);