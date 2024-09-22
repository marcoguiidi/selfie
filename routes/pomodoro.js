const express = require('express');
const router = express.Router();
const PomodoroSession = require('../models/PomodoroSession');
const authenticateJWT = require('../middleware/authenticateJWT');

// Recupera l'ultima sessione Pomodoro
router.get('/last', authenticateJWT, async (req, res) => {
  try {
    const lastSession = await PomodoroSession.findOne({
      user: req.user.id,
    }).sort({ startTime: -1 });

    res.json(lastSession);
  } catch (error) {
    console.error('Errore nel recupero dell\'ultima sessione:', error);
    res.status(500).send('Errore del server');
  }
});

// Avvia una nuova sessione Pomodoro
router.post('/start', authenticateJWT, async (req, res) => {
  try {
    const newSession = new PomodoroSession({
      user: req.user.id,
      startTime: new Date(),
      durationMinutes: req.body.durationMinutes || 25,
      breakMinutes: req.body.breakMinutes || 5,
      longBreakMinutes: req.body.longBreakMinutes || 15,
      cycle: 1,
      totalPausedDuration: 0,
      maxPausedDuration: req.body.maxPausedDuration || 300, // 5 minuti di default
    });

    await newSession.save();
    res.json(newSession);
  } catch (error) {
    console.error('Errore nell\'avvio della sessione:', error);
    res.status(500).send('Errore del server');
  }
});

// Metti in pausa una sessione
router.patch('/:sessionId/pause', authenticateJWT, async (req, res) => {
  try {
    const session = await PomodoroSession.findById(req.params.sessionId);
    if (!session || session.user.toString() !== req.user.id.toString()) {
      return res.status(403).send('Accesso negato');
    }

    session.pausedTime = new Date();
    await session.save();
    res.json(session);
  } catch (error) {
    console.error('Errore nel mettere in pausa la sessione:', error);
    res.status(500).send('Errore del server');
  }
});

// Riprendi una sessione
router.patch('/:sessionId/resume', authenticateJWT, async (req, res) => {
  try {
    const session = await PomodoroSession.findById(req.params.sessionId);
    if (!session || session.user.toString() !== req.user.id.toString()) {
      return res.status(403).send('Accesso negato');
    }

    if (session.pausedTime) {
      const now = new Date();
      const pauseDuration = (now - session.pausedTime) / 1000; // in secondi
      session.totalPausedDuration += pauseDuration;
      session.pausedTime = null;
    }

    await session.save();
    res.json(session);
  } catch (error) {
    console.error('Errore nel riprendere la sessione:', error);
    res.status(500).send('Errore del server');
  }
});

// Completa o interrompi una sessione
router.patch('/:sessionId/stop', authenticateJWT, async (req, res) => {
  try {
    const session = await PomodoroSession.findById(req.params.sessionId);
    if (!session || session.user.toString() !== req.user.id.toString()) {
      return res.status(403).send('Accesso negato');
    }

    const { state } = req.body;
    
    if (state === 'completed') {
      session.completed = true;
    } else if (state === 'interval') {
      session.intervalTime = new Date();
      session.cycle += 1;
    } else if (state === 'aborted') {
      session.completed = true;
      session.aborted = true;
    }

    await session.save();
    res.json(session);
  } catch (error) {
    console.error('Errore nel completare/interrompere la sessione:', error);
    res.status(500).send('Errore del server');
  }
});

// Recupera sessioni non completate (mantenuto per retrocompatibilità)
router.get('/incomplete', authenticateJWT, async (req, res) => {
  try {
    const incompleteSessions = await PomodoroSession.find({
      user: req.user.id,
      completed: false,
    });
    res.json(incompleteSessions);
  } catch (error) {
    console.error('Errore nel recupero delle sessioni incomplete:', error);
    res.status(500).send('Errore del server');
  }
});

// Elimina una sessione (mantenuto per retrocompatibilità)
router.delete('/:sessionId', authenticateJWT, async (req, res) => {
  try {
    const session = await PomodoroSession.findById(req.params.sessionId);
    if (!session || session.user.toString() !== req.user.id.toString()) {
      return res.status(403).send('Accesso negato');
    }
    await PomodoroSession.findByIdAndDelete(req.params.sessionId);
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Errore nell\'eliminazione della sessione:', error);
    res.status(500).send('Errore del server');
  }
});

module.exports = router;