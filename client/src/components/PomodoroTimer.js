import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../css/PomodoroTimer.css';
import TimeMachineModal from './TimeMachineModal';

const AdvancedPomodoroTimer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(25 * 60);
  const [currentSession, setCurrentSession] = useState(null);
  const [timerDisplay, setTimerDisplay] = useState('25:00');
  const [timerStatus, setTimerStatus] = useState('LOADING');
  const [error, setError] = useState(null);
  const [isTimeMachineOpen, setIsTimeMachineOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentCycle, setCurrentCycle] = useState(1);

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
  });

  const debugLog = (...messages) => {
    //if (process.env.NODE_ENV === 'development') {
      console.log(...messages);
    //}
  };

  const fetchSessionData = useCallback(async () => {
    setTimerStatus('LOADING');
    try {
      const response = await axios.get(`/api/pomodoro/last?date=${currentDate.toISOString()}`, getAuthConfig());
      debugLog('Dati sessione ricevuti:', response.data);
      if (response.data && !response.data.completed) {
        setCurrentSession(response.data);
        initializeTimer(response.data);
      } else {
        resetTimer();
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      // setError('Failed to fetch session data.');
      resetTimer();
    }
  }, [currentDate]);

  const initializeTimer = useCallback((data) => {
    debugLog('Inizializzazione timer con dati:', data);
    const now = new Date();
    const startTime = new Date(data.startTime);
    const elapsed = (now.getTime() - startTime.getTime()) / 1000;

    let sessionState;
    let newDuration;

    if (data.pausedTime) {
      sessionState = 'PAUSED';
      const pausedDuration = (now.getTime() - new Date(data.pausedTime).getTime()) / 1000;
      newDuration = data.durationMinutes * 60 - (elapsed - pausedDuration - data.totalPausedDuration);
    } else if (data.intervalTime) {
      sessionState = 'INTERVAL';
      const intervalTime = new Date(data.intervalTime);
      const intervalElapsed = (now.getTime() - intervalTime.getTime()) / 1000;
      const intervalMinutes = data.cycle % 4 === 0 ? data.longBreakMinutes : data.breakMinutes;
      newDuration = intervalMinutes * 60 - intervalElapsed;
    } else {
      sessionState = 'ACTIVE';
      newDuration = data.durationMinutes * 60 - (elapsed - data.totalPausedDuration);
    }

    setDuration(Math.max(0, Math.round(newDuration)));
    updateTimerDisplay(Math.max(0, Math.round(newDuration)));
    setTimerStatus(sessionState);
    setIsRunning(sessionState === 'ACTIVE' || sessionState === 'INTERVAL');
    setCurrentCycle(data.cycle);
    debugLog('Timer inizializzato:', { sessionState, newDuration, cycle: data.cycle });
  }, []);

  const resetTimer = () => {
    setCurrentSession(null);
    setDuration(25 * 60);
    setTimerStatus('READY');
    setCurrentCycle(1);
    setIsRunning(false);
    updateTimerDisplay(25 * 60);
    debugLog('Timer resettato');
  };

  const startNewSession = async () => {
    debugLog('Avvio di una nuova sessione...');
    try {
      const response = await axios.post('/api/pomodoro/start', {}, getAuthConfig());
      setCurrentSession(response.data);
      setDuration(response.data.durationMinutes * 60);
      setTimerStatus('ACTIVE');
      setIsRunning(true);
      setCurrentCycle(response.data.cycle);
      updateTimerDisplay(response.data.durationMinutes * 60);
      debugLog('Nuova sessione avviata:', response.data);
    } catch (error) {
      console.error('Error starting new session:', error);
      setError('Failed to start new session.');
    }
  };

  const pauseSession = async () => {
    if (!currentSession) return;
    debugLog('Messa in pausa della sessione...');
    try {
      const response = await axios.patch(`/api/pomodoro/${currentSession._id}/pause`, { action: 'pause' }, getAuthConfig());
      setCurrentSession(response.data);
      setTimerStatus('PAUSED');
      setIsRunning(false);
      debugLog('Sessione messa in pausa:', response.data);
    } catch (error) {
      console.error('Error pausing session:', error);
      setError('Failed to pause session.');
    }
  };

  const resumeSession = async () => {
    if (!currentSession) return;
    debugLog('Ripresa della sessione...');
    try {
      const response = await axios.patch(`/api/pomodoro/${currentSession._id}/resume`, { action: 'resume' }, getAuthConfig());
      setCurrentSession(response.data);
      setTimerStatus('ACTIVE');
      setIsRunning(true);
      debugLog('Sessione ripresa:', response.data);
    } catch (error) {
      console.error('Error resuming session:', error);
      setError('Failed to resume session.');
    }
  };

  const completeSession = async (state) => {
    if (!currentSession) return;
    debugLog(`Completamento della sessione: ${state}`);
    try {
      const response = await axios.patch(`/api/pomodoro/${currentSession._id}/stop`, { action: 'stop', state }, getAuthConfig());
      if (state === 'interval') {
        setCurrentSession(response.data);
        initializeTimer(response.data);
      } else {
        resetTimer();
      }
      debugLog(`Sessione completata con stato: ${state}`, response.data);
    } catch (error) {
      console.error('Error completing session:', error);
      setError('Failed to complete session.');
    }
  };

  const updateTimerDisplay = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    setTimerDisplay(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  };

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  useEffect(() => {
    let timer;
    if (isRunning && duration > 0) {
      timer = setInterval(() => {
        setDuration((prevDuration) => {
          const newDuration = prevDuration - 1;
          updateTimerDisplay(newDuration);
          if (newDuration <= 0) {
            clearInterval(timer);
            completeSession(currentSession.intervalTime ? 'completed' : 'interval');
            return 0;
          }
          return newDuration;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, duration, currentSession]);

  const handleStartResume = () => {
    if (timerStatus === 'READY') {
      startNewSession();
    } else if (timerStatus === 'PAUSED') {
      resumeSession();
    }
  };

  const handleSetDate = (newDate) => {
    setCurrentDate(newDate);
    setIsTimeMachineOpen(false);
    fetchSessionData();
  };

  return (
    <div className="pomodoro-container">
      <h1>Advanced Pomodoro Timer</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="timer-display">{timerDisplay}</div>
      <div className="timer-status">{timerStatus}</div>
      <div className="cycle-display">Cycle: {currentCycle}</div>
      <button onClick={handleStartResume} disabled={isRunning || timerStatus === 'LOADING'}>
        {timerStatus === 'PAUSED' ? 'Resume' : 'Start'}
      </button>
      <button onClick={pauseSession} disabled={!isRunning}>Pause</button>
      <button onClick={() => completeSession('aborted')} disabled={!currentSession}>Stop</button>
      <button onClick={() => setIsTimeMachineOpen(true)}>Time Machine</button>
      <TimeMachineModal
        isOpen={isTimeMachineOpen}
        onRequestClose={() => setIsTimeMachineOpen(false)}
        onSetDate={handleSetDate}
        onResetDate={() => handleSetDate(new Date())}
      />
    </div>
  );
};

export default AdvancedPomodoroTimer;