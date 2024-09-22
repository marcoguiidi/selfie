import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../css/PomodoroTimer.css';
import TimeMachineModal from './TimeMachineModal';

const AdvancedPomodoroTimer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [timerDisplay, setTimerDisplay] = useState('25:00');
  const [timerStatus, setTimerStatus] = useState('READY');
  const [error, setError] = useState(null);
  const [isTimeMachineOpen, setIsTimeMachineOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const debugLog = (...messages) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...messages);
    }
  };

  const getAuthConfig = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  const fetchSessionData = useCallback(async () => {
    debugLog('Inizio recupero dati ultima sessione...');
    try {
      const config = getAuthConfig();
      const response = await axios.get('/api/pomodoro/last', config);
      debugLog('Dati sessione ricevuti:', response.data);
      if (response.data && !response.data.completed) {
        setCurrentSession(response.data);
        initializeTimer(response.data);
      } else {
        setCurrentSession(null);
        setDuration(null);
        updateTimerDisplay(25 * 60);
        updateSessionState('READY');
      }
    } catch (error) {
      console.error('Errore nel recupero dell\'ultima sessione:', error);
      setError('Errore nel recupero della sessione. Assicurati di essere autenticato.');
    }
  }, [currentDate]);

  const initializeTimer = useCallback((data) => {
    const now = currentDate;
    const startTime = new Date(data.startTime);
    const elapsed = (now.getTime() - startTime.getTime()) / 1000;

    let sessionState;
    if (data.pausedTime) {
      sessionState = 'PAUSED';
    } else if (!data.completed) {
      sessionState = data.intervalTime ? 'INTERVAL' : 'ACTIVE';
    } else {
      sessionState = 'COMPLETED';
    }

    let newDuration;
    switch (sessionState) {
      case 'PAUSED':
        newDuration = data.durationMinutes * 60 - (elapsed - data.totalPausedDuration);
        break;
      case 'INTERVAL':
        const intervalTime = new Date(data.intervalTime);
        const intervalElapsed = (now.getTime() - intervalTime.getTime()) / 1000;
        const intervalMinutes = data.cycle % 4 === 0 ? data.longBreakMinutes : data.breakMinutes;
        newDuration = intervalMinutes * 60 - intervalElapsed;
        break;
      case 'ACTIVE':
        newDuration = data.durationMinutes * 60 - (elapsed - data.totalPausedDuration);
        break;
      case 'COMPLETED':
        newDuration = 0;
        break;
      default:
        newDuration = data.durationMinutes * 60;
    }

    setDuration(Math.max(0, newDuration));
    updateTimerDisplay(Math.max(0, newDuration));
    updateSessionState(sessionState);
    setIsRunning(sessionState === 'ACTIVE' || sessionState === 'INTERVAL');
  }, [currentDate]);

  const updateSessionState = (state) => {
    setTimerStatus(state);
  };

  const startNewSession = async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.post('/api/pomodoro/start', {}, config);
      setCurrentSession(response.data);
      setDuration(response.data.durationMinutes * 60);
      updateTimerDisplay(response.data.durationMinutes * 60);
      updateSessionState('ACTIVE');
      setIsRunning(true);
    } catch (error) {
      console.error('Errore nell\'avvio della nuova sessione:', error);
      setError('Errore nell\'avvio della sessione. Assicurati di essere autenticato.');
    }
  };

  const pauseSession = async () => {
    if (!currentSession) {
      console.error('Nessuna sessione attiva da mettere in pausa.');
      return;
    }
    try {
      const response = await axios.patch(`/api/pomodoro/${currentSession._id}/pause`, { action: 'pause' }, getAuthConfig());
      setCurrentSession(response.data);
      updateSessionState('PAUSED');
      setIsRunning(false);
    } catch (error) {
      console.error('Errore nel mettere in pausa la sessione:', error);
    }
  };

  const resumeSession = async () => {
    if (!currentSession) {
      console.error('Nessuna sessione attiva da riprendere.');
      return;
    }
    try {
      const response = await axios.patch(`/api/pomodoro/${currentSession._id}/resume`, { action: 'resume' }, getAuthConfig());
      setCurrentSession(response.data);
      updateSessionState('ACTIVE');
      setIsRunning(true);
    } catch (error) {
      console.error('Errore nella ripresa della sessione:', error);
    }
  };

  const completeSession = async (state) => {
    if (!currentSession) {
      console.error('Nessuna sessione attiva da completare.');
      return;
    }
    try {
      await axios.patch(`/api/pomodoro/${currentSession._id}/stop`, { action: 'stop', state: state }, getAuthConfig());
      setIsRunning(false);
      setDuration(null);
      setCurrentSession(null);
      updateSessionState(state.toUpperCase());
    } catch (error) {
      console.error('Errore nel completamento della sessione:', error);
    }
  };

  const updateTimerDisplay = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    setTimerDisplay(`${minutes}:${seconds < 10 ? '0' + seconds : seconds}`);
  };

  useEffect(() => {
    fetchSessionData();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isRunning) {
        pauseSession();
      }
    };

    const handleBeforeUnload = (event) => {
      if (isRunning) {
        pauseSession();
        event.preventDefault();
        event.returnValue = '';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [fetchSessionData, isRunning]);

  useEffect(() => {
    let timer;
    if (isRunning && duration !== null) {
      timer = setInterval(() => {
        setDuration((prevDuration) => {
          if (prevDuration <= 0) {
            clearInterval(timer);
            if (currentSession.intervalTime) {
              completeSession('completed');
            } else {
              completeSession('interval');
            }
            return 0;
          }
          updateTimerDisplay(prevDuration - 1);
          return prevDuration - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, duration, currentSession]);

  const handleStartResume = () => {
    if (!isRunning && currentSession) {
      resumeSession();
    } else if (!currentSession) {
      startNewSession();
    }
  };

  const handleSetDate = (newDate) => {
    setCurrentDate(newDate);
    setIsTimeMachineOpen(false);
    fetchSessionData();
  };

  const resetToCurrentDate = () => {
    setCurrentDate(new Date());
    setIsTimeMachineOpen(false);
    fetchSessionData();
  };

  return (
    <div className="pomodoro-container">
      <h1>Advanced Pomodoro Timer</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="timer-display">{timerDisplay}</div>
      <div className="timer-status">{timerStatus}</div>
      <button onClick={handleStartResume} disabled={isRunning}>
        {currentSession && !isRunning ? 'Resume' : 'Start'}
      </button>
      <button onClick={pauseSession} disabled={!isRunning}>Pause</button>
      <button onClick={() => completeSession('aborted')} disabled={!currentSession}>Stop</button>
      <button onClick={() => setIsTimeMachineOpen(true)}>Time Machine</button>
      <TimeMachineModal
        isOpen={isTimeMachineOpen}
        onRequestClose={() => setIsTimeMachineOpen(false)}
        onSetDate={handleSetDate}
        onResetDate={resetToCurrentDate}
      />
    </div>
  );
};

export default AdvancedPomodoroTimer;