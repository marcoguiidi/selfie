const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  description: String,
  date: Number,
  location: String,
  author: String,
  participants: {
    type: [String], // Tags as an array
    validate: {
      validator: function (participants) {
        //controlla che ogni tag sia di tipo stringa, trimma gli spazi ai lati e controlla che la lunghezza sia > 0 
        return participants.every(part => typeof part === 'string' && part.trim().length > 0);
      },
      message: 'All participants must be non-empty strings', // in caso validator non restituisca true
    },
  },
  color: String,
})

module.exports = mongoose.model('Event', eventSchema);
