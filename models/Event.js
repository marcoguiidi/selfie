const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  isDeadline: { type: Boolean, default: false },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invited: [String],
  color: { type: String, default: '#007bff' },
  status: { type: String, enum: ['active', 'expired', 'completed'], default: 'active' },
  repetition: { type: String, default: 'no-repetition' },
  endRepetition: Date,
  cheated: { type: Boolean, default: false },
  parentEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null }
});

module.exports = mongoose.model('Event', EventSchema);
