const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    deadline: { type: Boolean },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invited: [String],
    color: { type: String, default: '#007bff' }
});

module.exports = mongoose.model('Event', EventSchema);
