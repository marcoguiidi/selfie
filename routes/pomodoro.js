const express = require('express');
const router = express.Router();
const PomodoroSession = require('../models/PomodoroSession');
const Event = require('../models/Event');
const authenticateJWT = require('../middleware/authenticateJWT');

const debugLog = (...messages) => {
  console.log(new Date().toISOString(), ...messages);
};

const getCurrentDate = (req) => {
  if (req.body.timeMachineDate) {
    debugLog('Using Time Machine date:', req.body.timeMachineDate);
    return new Date(req.body.timeMachineDate);
  }
  debugLog('Using current date');
  return new Date();
};

router.post('/start', authenticateJWT, async (req, res) => {
  try {
    const now = getCurrentDate(req);
    debugLog('Starting new session at:', now);

    const lastCompletedSession = await PomodoroSession.findOne({
      userId: req.user.id,
      completed: true,
      endTime: { $ne: null },
      intervalTime: { $ne: null },
      checked: false,
      $expr: {
        $ne: [{ $subtract: ["$totalCycles", "$cycle"] }, 0]
      }
    }).sort({ endTime: -1 });

    if (lastCompletedSession) {
      debugLog('Last completed session found:', lastCompletedSession);
      lastCompletedSession.checked = true;
      await lastCompletedSession.save();
    } else {
      debugLog('No completed session found');
    }

    const sessionData = {
      userId: req.user.id,
      startTime: now,
      pausedTime: null,
      totalPausedDuration: 0,
      endTime: null,
      intervalTime: null,
      completed: false,
      durationMinutes: req.body.durationMinutes || undefined,
      breakMinutes: req.body.breakMinutes || undefined,
      longBreakMinutes: req.body.longBreakMinutes || undefined,
      cyclesBeforeLongBreak: req.body.cyclesBeforeLongBreak || undefined,
      totalCycles: req.body.totalCycles || undefined
    };

    debugLog('Creating new session with data:', sessionData);

    const session = new PomodoroSession(sessionData);
    session.maxPausedDuration = session.cycle === session.cyclesBeforeLongBreak ? session.longBreakMinutes : session.breakMinutes;
    session.cycle = lastCompletedSession ? (lastCompletedSession.cycle % lastCompletedSession.totalCycles) + 1 : 1;

    await session.save();

    // Create an event for the Pomodoro session
    const eventData = {
      title: `Pomodoro Session ${session.cycle}/${session.totalCycles}`,
      start: now,
      end: now,
      isDeadline: true,
      description: `Pomodoro session for ${session.durationMinutes} minutes with ${session.breakMinutes} minutes break`,
      createdBy: req.user.id,
      invited: '', 
      color: '#FF6347', // Tomato color for Pomodoro
      repetition: 'no-repetition',
      status: 'active'
    };

    const newEvent = new Event(eventData);
    await newEvent.save();
    debugLog('New event created for Pomodoro session:', newEvent);

    res.status(201).json({
      session: session,
      // event: newEvent
    });
  } catch (error) {
    console.error('Error starting new session:', error);
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/:action', authenticateJWT, async (req, res) => {
  const { action } = req.params;
  const { state } = req.body;
  debugLog('Action:', action, 'State:', state, 'Session ID:', req.params.id);

  try {
    const session = await PomodoroSession.findById(req.params.id);
    if (!session) {
      debugLog('Session not found');
      return res.status(404).json({ message: 'Session not found' });
    }

    const now = getCurrentDate(req);
    debugLog('Current date for action:', now);

    switch (action) {
      case 'pause':
        if (!session.pausedTime) {
          session.pausedTime = now;
          debugLog('Session paused at:', now);
        }
        break;
      case 'resume':
        if (session.pausedTime) {
          const pausedDuration = (now - session.pausedTime) / 1000;
          session.totalPausedDuration += pausedDuration;
          session.pausedTime = null;
          debugLog('Session resumed. Total paused duration:', session.totalPausedDuration);
        }
        break;
      case 'stop':
        switch (state) {
          case 'aborted':
            session.completed = true;
            // session.endTime = now;
            debugLog('Session aborted at:', now);
            await updatePomodoroEvent(session, now);
            break;
          case 'completed':
            session.completed = true;
            session.endTime = now;
            debugLog('Session completed at:', now);
            await updatePomodoroEvent(session, now);
            break;
          case 'interval':
            session.intervalTime = now;
            debugLog('Session entered interval at:', now);
            break;
        }
        break;
      default:
        debugLog('Invalid action:', action);
        return res.status(400).json({ message: 'Invalid action' });
    }

    await session.save();
    debugLog('Session updated:', session);
    res.json(session);
  } catch (error) {
    console.error('Error handling session action:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/last/:date?/:cheated?', authenticateJWT, async (req, res) => {
  debugLog('Inizio ricerca ultima sessione per l\'utente:', req.user.id);
  debugLog('Data attuale:', new Date());
  debugLog('Parametri ricevuti:', req.params);

  const date = req.params.date ? new Date(req.params.date) : new Date();
  const cheated = req.params.cheated === 'true';

  debugLog('Parametri elaborati:', { date, cheated });

  try {
    debugLog('Ricerca sessione attiva per data:', date);
    let specificLastSession = await PomodoroSession.findOne({
      userId: req.user.id,
      completed: false,
    }).sort({ startTime: -1 });

    if (specificLastSession) {
      debugLog('Sessione trovata:', JSON.stringify(specificLastSession, null, 2));
      
      if (cheated) {
        debugLog('Sessione contrassegnata come cheated per data:', date);
        specificLastSession.cheated = true;
        await specificLastSession.save();
        debugLog('Sessione salvata dopo essere stata contrassegnata come cheated');

        const elapsedTime = (date - specificLastSession.startTime) / 1000 / 60; // in minutes
        const totalSessionTime = specificLastSession.durationMinutes + specificLastSession.maxPausedDuration;

        debugLog('Calcoli temporali:', { 
          elapsedTime, 
          totalSessionTime, 
          durationMinutes: specificLastSession.durationMinutes,
          maxPausedDuration: specificLastSession.maxPausedDuration
        });

        if (elapsedTime < 0) {
          debugLog('Data richiesta anteriore alla startTime della sessione');
          return res.status(400).json({ message: 'La data richiesta è anteriore all\'inizio della sessione' });
        } else if (elapsedTime >= specificLastSession.durationMinutes && elapsedTime < totalSessionTime) {
          debugLog('Sessione in intervallo, impostazione intervalTime');
          specificLastSession.intervalTime = new Date(specificLastSession.startTime.getTime() + specificLastSession.durationMinutes * 60000);
          await specificLastSession.save();
          debugLog('Sessione salvata dopo impostazione intervalTime:', specificLastSession.intervalTime);
        } else if (elapsedTime >= totalSessionTime) {
          debugLog('Sessione completata, chiamata a completeSession');
          await completeSession(specificLastSession, date);
          await updatePomodoroEvent(specificLastSession, date);
          debugLog('Creazione della prossima sessione');
          specificLastSession = await createNextSession(specificLastSession, date);
          if (specificLastSession) {
            await createPomodoroEvent(specificLastSession);
          }
          debugLog('Nuova sessione creata:', JSON.stringify(specificLastSession, null, 2));
        }
      }

      debugLog('Invio risposta con sessione:', JSON.stringify(specificLastSession, null, 2));
      return res.json(specificLastSession);
    } else {
      debugLog('Nessuna sessione attiva trovata');
      return res.status(404).json({ message: 'Nessuna sessione attiva per la data specificata' });
    }
  } catch (error) {
    console.error('Errore durante il recupero dell\'ultima sessione:', error);
    debugLog('Errore catturato:', error.message);
    res.status(500).json({ error: error.message });
  }
});

async function completeSession(session, date) {
  debugLog('Entering completeSession', { sessionId: session._id, date });
  
  session.completed = true;
  session.intervalTime = new Date(session.startTime.getTime() + session.durationMinutes * 60000);
  session.endTime = new Date(session.startTime.getTime() + (session.durationMinutes + session.maxPausedDuration) * 60000);
  
  debugLog('Session details before save:', {
    completed: session.completed,
    intervalTime: session.intervalTime,
    endTime: session.endTime,
    startTime: session.startTime,
    durationMinutes: session.durationMinutes,
    maxPausedDuration: session.maxPausedDuration
  });

  try {
    await session.save();
    debugLog('Session saved successfully');
  } catch (error) {
    debugLog('Error saving session:', error);
    throw error;
  }
}

async function createNextSession(completedSession, date) {
  debugLog('Entering createNextSession', { 
    completedSessionId: completedSession._id, 
    completedSessionCycle: completedSession.cycle,
    totalCycles: completedSession.totalCycles,
    date 
  });

  if (completedSession.cycle === completedSession.totalCycles) {
    debugLog('All cycles completed, returning null');
    return null;
  }

  const newCycle = completedSession.cycle + 1;
  const isLongBreak = newCycle % completedSession.cyclesBeforeLongBreak === 0;
  const maxPausedDuration = isLongBreak ? completedSession.longBreakMinutes : completedSession.breakMinutes;

  debugLog('Creating new session', {
    newCycle,
    isLongBreak,
    maxPausedDuration
  });

  const newSession = new PomodoroSession({
    userId: completedSession.userId,
    startTime: completedSession.endTime,
    durationMinutes: completedSession.durationMinutes,
    breakMinutes: completedSession.breakMinutes,
    longBreakMinutes: completedSession.longBreakMinutes,
    cyclesBeforeLongBreak: completedSession.cyclesBeforeLongBreak,
    totalCycles: completedSession.totalCycles,
    cycle: newCycle,
    maxPausedDuration: maxPausedDuration
  });

  debugLog('New session details:', {
    userId: newSession.userId,
    startTime: newSession.startTime,
    durationMinutes: newSession.durationMinutes,
    cycle: newSession.cycle,
    maxPausedDuration: newSession.maxPausedDuration
  });

  try {
    await newSession.save();
    debugLog('New session saved successfully');
  } catch (error) {
    debugLog('Error saving new session:', error);
    throw error;
  }

  const elapsedTime = (date - newSession.startTime) / 1000 / 60; // in minutes
  const totalSessionTime = newSession.durationMinutes + newSession.maxPausedDuration;

  debugLog('Checking if new session is already completed', {
    elapsedTime,
    totalSessionTime,
    date,
    sessionStartTime: newSession.startTime
  });

  if (elapsedTime >= totalSessionTime) {
    debugLog('New session is already completed, recursively completing and creating next');
    await completeSession(newSession, date);
    await updatePomodoroEvent(newSession, date);
    return await createNextSession(newSession, date);
  }

  debugLog('Returning new active session');
  return newSession;
}

async function updatePomodoroEvent(session, endTime) {
  debugLog('Updating Pomodoro event for session:', session._id);
  const event = await Event.findOne({
    title: `Pomodoro Session ${session.cycle}/${session.totalCycles}`,
    createdBy: session.userId,
    start: session.startTime
  });

  if (event) {
    event.end = endTime;
    event.isDeadline = false;
    await event.save();
    debugLog('Associated event updated:', event);
  } else {
    debugLog('No associated event found for the session');
  }
}

async function createPomodoroEvent(session) {
  debugLog('Creating new Pomodoro event for session:', session._id);
  const eventData = {
    title: `Pomodoro Session ${session.cycle}/${session.totalCycles}`,
    start: session.startTime,
    end: session.startTime,
    isDeadline: true,
    description: `Pomodoro session for ${session.durationMinutes} minutes with ${session.maxPausedDuration} minutes break`,
    createdBy: session.userId,
    invited: null, 
    color: '#FF6347', // Tomato color for Pomodoro
    repetition: 'no-repetition',
    status: 'active'
  };

  const newEvent = new Event(eventData);
  await newEvent.save();
  debugLog('New event created for Pomodoro session:', newEvent);
}

module.exports = router;