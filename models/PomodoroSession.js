const mongoose = require('mongoose');

const pomodoroSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  durationMinutes: { type: Number, default: 25 },
  breakMinutes: { type: Number, default: 5 },
  longBreakMinutes: { type: Number, default: 15 },
  cycle: { type: Number, default: 1 },
  startTime: { type: Date, required: true },
  pausedTime: { type: Date },
  intervalTime: { type: Date },
  totalPausedDuration: { type: Number, default: 0 },
  maxPausedDuration: { type: Number, default: 5 },
  endTime: { type: Date },
  completed: { type: Boolean, default: false },
  effectiveStudyTime: { type: Number },
  cyclesBeforeLongBreak: { type: Number, default: 4 },
  totalCycles: { type: Number, default: 4 },
  cheated: { type: Boolean, default: false }
});

module.exports = mongoose.model('PomodoroSession', pomodoroSessionSchema);
