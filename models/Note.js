const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  creationDate: { type: Date, required: true },
  lastEdit: { type: Date, required: true },
  content: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // Cambiato da String a Array di ObjectId
});

module.exports = mongoose.model('Note', NoteSchema);
