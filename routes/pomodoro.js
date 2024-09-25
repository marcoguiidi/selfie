const express = require('express');
const router = express.Router();
const PomodoroSession = require('../models/PomodoroSession');
const authenticateJWT = require('../middleware/authenticateJWT');

// Funzione per il logging condizionale
const debugLog = (...messages) => {
  //if (process.env.NODE_ENV === 'development') {
    console.log(...messages);
  //}
};

// Route per avviare una nuova sessione di Pomodoro
router.post('/start', authenticateJWT, async (req, res) => {
  try {
    const lastCompletedSession = await PomodoroSession.findOne({
      userId: req.user.id,
      completed: true,
      endTime: { $ne: null },
      $expr: {
        $ne: [{ $subtract: ["$totalCycles", "$cycle"] }, 0]
      }
    }).sort({ endTime: -1 });

    debugLog('Ultima sessione completata trovata:', lastCompletedSession);
    const now = new Date();
    

    // if (lastCompletedSession && lastCompletedSession.endTime) {
    //   const timeSinceLastSessionEnd = (now - lastCompletedSession.endTime) / 1000 / 60;
    //   if (timeSinceLastSessionEnd < lastCompletedSession.maxPausedDuration) {
    //     cycle = (lastCompletedSession.cycle % lastCompletedSession.totalCycles) + 1; 
    //   }
    // }

    const sessionData = {
      userId: req.user.id,
      startTime: now,
      pausedTime: null,
      totalPausedDuration: 0,    
      endTime: null,
      intervalTime: null,
      completed: false,

      // Usa i valori passati nella richiesta, se presenti, altrimenti usa i default
      
      durationMinutes: req.body.durationMinutes || undefined,
      breakMinutes: req.body.breakMinutes || undefined,
      longBreakMinutes: req.body.longBreakMinutes || undefined,
      cyclesBeforeLongBreak: req.body.cyclesBeforeLongBreak || undefined,
      totalCycles: req.body.totalCycles || undefined
    };

    const session = new PomodoroSession(sessionData);
    session.maxPausedDuration = session.cycle === session.cyclesBeforeLongBreak ? session.longBreakMinutes : session.breakMinutes;
    session.cycle = lastCompletedSession ? ( lastCompletedSession.cycle % lastCompletedSession.totalCycles ) + 1 : 1;
    
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error('Errore durante l\'avvio di una nuova sessione:', error);
    res.status(400).json({ error: error.message });
  }
});

// Route per gestire le azioni sulla sessione (pausa, ripresa, stop)
router.patch('/:id/:action', authenticateJWT, async (req, res) => {
  const { action } = req.params;
  const { state } = req.body;

  debugLog('Azione:', action, 'Stato:', state, 'ID Sessione:', req.params.id);

  try {
    const session = await PomodoroSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Sessione non trovata' });
    }

    const now = new Date();

    switch (action) {
      case 'pause':
        if (!session.pausedTime) {
          session.pausedTime = now;
        }
        break;
      case 'resume':
        if (session.pausedTime) {
          const pausedDuration = (now - session.pausedTime) / 1000;
          session.totalPausedDuration += pausedDuration;
          session.pausedTime = null;
        }
        break;
      case 'stop':
        switch (state) {
          case 'aborted':
            session.completed = true;
            break;
          case 'completed':
            // session.effectiveStudyTime = totalTime - session.totalPausedDuration;
            // session.cycle = (session.cycle % session.totalCycles) + 1;
            session.completed = true;
            session.endTime = now;  
            break;
          case 'interval':
            session.intervalTime = now;
            break;
        }
        break;
      default:
        return res.status(400).json({ message: 'Azione non valida' });
    }

    await session.save();
    res.json(session);
  } catch (error) {
    console.error('Errore durante la gestione della sessione:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route per recuperare l'ultima sessione attiva dell'utente
router.get('/last/:date?/:cheated?', authenticateJWT, async (req, res) => {
  debugLog('Inizio ricerca ultima sessione per l\'utente:', req.user.id);
  const date = req.params.date ? new Date(req.params.date) : null;
  const cheated = req.params.cheated ? true : false;

  try {
    if (date) {
      debugLog('Ricerca sessione attiva per data:', date);
      const specificLastSession = await PomodoroSession.findOne({
        userId: req.user.id,
        completed: false,
        startTime: date, 
        $or: [
          { endTime: null },
          { endTime: { $gt: date } }
        ]
      });

      debugLog('Sessione trovata:', specificLastSession);
      
      // if (!specificLastSession){
      //   return res.status(404).json({ message: 'Nessuna sessione attiva per la data specificata' });
      // }

      // if (cheated){
      //   specificLastSession.cheated = true;
      //   //qui dobbiamo ritornare la sessione modificata
      //   //controlliamo la data passara nei parametri e se ( (elapsed = (date - specificLastSession.startTime.getTime()) / 1000) ) - specificLastSession.totalPausedDuration >= specificLastSession.durationMinutes * 60
      //   //allora agiamo come se fosse completata solo 
        
      // }

      // res.json(specificLastSession);
    }

    else {
      let lastSession = await PomodoroSession.findOne({
        userId: req.user.id,
        completed: false
      }).sort({ startTime: -1 });

      if (!lastSession) {
        debugLog('Nessuna sessione attiva trovata');
        return res.status(404).json({ message: 'Nessuna sessione attiva trovata' });
      }

      debugLog('Sessione trovata:', lastSession);
      res.json(lastSession);

      // const now = date;
      // const totalPausedDuration = lastSession.pausedTime 
      //   ? (now.getTime() - new Date(lastSession.pausedTime).getTime()) / 1000 + lastSession.totalPausedDuration 
      //   : lastSession.totalPausedDuration;
      // const elapsed = (now.getTime() - lastSession.startTime.getTime()) / 1000;

      // const currentDuration = lastSession.intervalTime 
      //   ? (lastSession.cycle % lastSession.cyclesBeforeLongBreak === 0 ? lastSession.longBreakMinutes : lastSession.breakMinutes)
      //   : lastSession.durationMinutes;
      // const elapsed = (now.getTime() - lastSession.startTime.getTime()) / 1000;

      // if (totalPausedDuration >= lastSession.maxPausedDuration || 
      //     elapsed - lastSession.totalPausedDuration >= currentDuration * 60) {
      //   lastSession.completed = true;
      //   await lastSession.save();
      // debugLog('Sessione completata automaticamente');
      // return res.status(404).json({ message: 'Nessuna sessione attiva trovata' });
    }
  } catch (error) {
    console.error('Errore durante il recupero dell\'ultima sessione:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;