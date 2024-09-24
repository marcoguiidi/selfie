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
  const [isTimeMachineActive, setIsTimeMachineActive] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentCycle, setCurrentCycle] = useState(1);
  
  // State variables for parametric settings
  const [studyDuration, setStudyDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState(4);
  const [totalCycles, setTotalCycles] = useState(5);

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
  });

  const debugLog = (...messages) => {
    console.log(...messages);
  };

  const initializeTimer = useCallback((data) => {
    debugLog('Initializing timer with data:', data);
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
      const intervalMinutes = data.cycle % data.cyclesBeforeLongBreak === 0 ? data.longBreakMinutes : data.breakMinutes;
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
    setStudyDuration(data.durationMinutes);
    setBreakDuration(data.breakMinutes);
    setLongBreakDuration(data.longBreakMinutes);
    setCyclesBeforeLongBreak(data.cyclesBeforeLongBreak);
    setTotalCycles(data.totalCycles);
    debugLog('Timer initialized:', { sessionState, newDuration, cycle: data.cycle });
  }, []);

  const fetchSessionData = useCallback(async () => {
    setTimerStatus('LOADING');
    try {
      let url = '/api/pomodoro/last';
      if (isTimeMachineActive) {
        url += `/${encodeURIComponent(currentDate.toISOString())}`;
      }
      const response = await axios.get(url, getAuthConfig());
      debugLog('Session data received:', response.data);
      if (response.data && !response.data.completed) {
        setCurrentSession(response.data);
        initializeTimer(response.data);
      } else {
        resetTimer();
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      resetTimer();
    }
  }, [currentDate, isTimeMachineActive, initializeTimer]);

  const resetTimer = () => {
    setCurrentSession(null);
    setDuration(studyDuration * 60);
    setTimerStatus('READY');
    setCurrentCycle(1);
    setIsRunning(false);
    updateTimerDisplay(studyDuration * 60);
    debugLog('Timer reset');
  };

  const startNewSession = async () => {
    debugLog('Starting a new session...');
    try {
      const response = await axios.post('/api/pomodoro/start', {
        durationMinutes: studyDuration,
        breakMinutes: breakDuration,
        longBreakMinutes: longBreakDuration,
        cyclesBeforeLongBreak: cyclesBeforeLongBreak,
        totalCycles: totalCycles
      }, getAuthConfig());
      setCurrentSession(response.data);
      setDuration(response.data.durationMinutes * 60);
      setTimerStatus('ACTIVE');
      setIsRunning(true);
      setCurrentCycle(response.data.cycle);
      updateTimerDisplay(response.data.durationMinutes * 60);
      debugLog('New session started:', response.data);
    } catch (error) {
      console.error('Error starting new session:', error);
      setError('Failed to start new session.');
    }
  };

  const pauseSession = async () => {
    if (!currentSession) return;
    debugLog('Pausing session...');
    try {
      const response = await axios.patch(`/api/pomodoro/${currentSession._id}/pause`, { action: 'pause' }, getAuthConfig());
      setCurrentSession(response.data);
      setTimerStatus('PAUSED');
      setIsRunning(false);
      debugLog('Session paused:', response.data);
    } catch (error) {
      console.error('Error pausing session:', error);
      setError('Failed to pause session.');
    }
  };

  const resumeSession = async () => {
    if (!currentSession) return;
    debugLog('Resuming session...');
    try {
      const response = await axios.patch(`/api/pomodoro/${currentSession._id}/resume`, { action: 'resume' }, getAuthConfig());
      setCurrentSession(response.data);
      setTimerStatus('ACTIVE');
      setIsRunning(true);
      debugLog('Session resumed:', response.data);
    } catch (error) {
      console.error('Error resuming session:', error);
      setError('Failed to resume session.');
    }
  };

  const completeSession = async (state) => {
    if (!currentSession) return;
    debugLog(`Completing session: ${state}`);
    try {
      const response = await axios.patch(`/api/pomodoro/${currentSession._id}/stop`, { action: 'stop', state }, getAuthConfig());
      if (state === 'interval') {
        setCurrentSession(response.data);
        initializeTimer(response.data);
      } else {
        resetTimer();
      }
      debugLog(`Session completed with state: ${state}`, response.data);
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
    setIsTimeMachineActive(true);
    fetchSessionData();
  };

  const handleResetDate = () => {
    setCurrentDate(new Date());
    setIsTimeMachineOpen(false);
    setIsTimeMachineActive(false);
    fetchSessionData();
  };

  const handleAbort = async () => {
    await completeSession('aborted');
    resetTimer();
  };

  return (
    <div className="pomodoro-container">
      <h1>Advanced Pomodoro Timer</h1>
      {error && <div className="error-message">{error}</div>}
      {!currentSession && timerStatus === 'READY' && (
        <div className="timer-settings">
          <label>
            Study Duration (minutes):
            <input type="number" value={studyDuration} onChange={(e) => setStudyDuration(parseInt(e.target.value))} />
          </label>
          <label>
            Break Duration (minutes):
            <input type="number" value={breakDuration} onChange={(e) => setBreakDuration(parseInt(e.target.value))} />
          </label>
          <label>
            Long Break Duration (minutes):
            <input type="number" value={longBreakDuration} onChange={(e) => setLongBreakDuration(parseInt(e.target.value))} />
          </label>
          <label>
            Cycles before Long Break:
            <input type="number" value={cyclesBeforeLongBreak} onChange={(e) => setCyclesBeforeLongBreak(parseInt(e.target.value))} />
          </label>
          <label>
            Total Cycles:
            <input type="number" value={totalCycles} onChange={(e) => setTotalCycles(parseInt(e.target.value))} />
          </label>
        </div>
      )}
      <div className="timer-display">{timerDisplay}</div>
      <div className="timer-status">{timerStatus}</div>
      <div className="cycle-display">Cycle: {currentCycle}/{totalCycles}</div>
      <button onClick={handleStartResume} disabled={isRunning || timerStatus === 'LOADING'}>
        {timerStatus === 'PAUSED' ? 'Resume' : 'Start'}
      </button>
      <button onClick={pauseSession} disabled={!isRunning}>Pause</button>
      <button onClick={handleAbort} disabled={!currentSession}>Stop</button>
      <button onClick={() => setIsTimeMachineOpen(true)}>Time Machine</button>
      {isTimeMachineActive && (
        <div className="time-machine-active">Time Machine Active: {currentDate.toLocaleString()}</div>
      )}
      <TimeMachineModal
        isOpen={isTimeMachineOpen}
        onRequestClose={() => setIsTimeMachineOpen(false)}
        onSetDate={handleSetDate}
        onResetDate={handleResetDate}
      />
    </div>
  );
};

export default AdvancedPomodoroTimer;