const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PomodoroSessionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  pausedTime: { type: Date },
  intervalTime: { type: Date },
  totalPausedDuration: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  aborted: { type: Boolean, default: false },
  durationMinutes: { type: Number, required: true },
  breakMinutes: { type: Number, required: true },
  longBreakMinutes: { type: Number, required: true },
  cycle: { type: Number, default: 1 },
  maxPausedDuration: { type: Number, required: true }
});

module.exports = mongoose.model('PomodoroSession', PomodoroSessionSchema);