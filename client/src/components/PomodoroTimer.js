import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../css/PomodoroTimer.css';
import TimeMachineModal from './TimeMachineModal';
import PomodoroSetup from './PomodoroSetup';

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
  const [timeMachineStartTime, setTimeMachineStartTime] = useState(null);
  const [timeMachineInitialDate, setTimeMachineInitialDate] = useState(new Date());
  
  const [studyDuration, setStudyDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState(4);
  const [totalCycles, setTotalCycles] = useState(5);

  const [showSetup, setShowSetup] = useState(true);

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
  });

  const debugLog = (...messages) => {
    console.log(new Date().toISOString(), ...messages);
  };

  const initializeTimer = useCallback((data, timeMachineDate = null) => {
    debugLog('Initializing timer with data:', JSON.stringify(data, null, 2));
    const now = timeMachineDate || new Date();
    const startTime = new Date(data.startTime);
    const elapsed = Math.max(0, (now.getTime() - startTime.getTime()) / 1000);

    let sessionState;
    let newDuration;

    const totalSessionDuration = data.durationMinutes * 60;

    if (data.pausedTime) {
      sessionState = 'PAUSED';
      const pausedDuration = Math.max(0, (now.getTime() - new Date(data.pausedTime).getTime()) / 1000);
      newDuration = Math.max(0, totalSessionDuration - (elapsed - pausedDuration - data.totalPausedDuration));
    } else if (data.intervalTime) {
      sessionState = 'INTERVAL';
      const intervalTime = new Date(data.intervalTime);
      const intervalElapsed = Math.max(0, (now.getTime() - intervalTime.getTime()) / 1000);
      const intervalMinutes = data.cycle % data.cyclesBeforeLongBreak === 0 ? data.longBreakMinutes : data.breakMinutes;
      newDuration = Math.max(0, (intervalMinutes * 60) - intervalElapsed);
    } else {
      sessionState = 'ACTIVE';
      newDuration = Math.max(0, totalSessionDuration - (elapsed - data.totalPausedDuration));
    }

    if (newDuration === 0 && !data.completed) {
      newDuration = totalSessionDuration;
      sessionState = 'ACTIVE';
      debugLog('Session not completed but duration is 0. Setting to full duration.');
    }

    debugLog('Timer calculation:', { elapsed, totalPausedDuration: data.totalPausedDuration, newDuration, sessionState });
    setDuration(Math.round(newDuration));
    updateTimerDisplay(Math.round(newDuration));
    setTimerStatus(sessionState);
    setIsRunning(sessionState === 'ACTIVE' || sessionState === 'INTERVAL');
    setCurrentCycle(data.cycle);
    setStudyDuration(data.durationMinutes);
    setBreakDuration(data.breakMinutes);
    setLongBreakDuration(data.longBreakMinutes);
    setCyclesBeforeLongBreak(data.cyclesBeforeLongBreak);
    setTotalCycles(data.totalCycles);
    setShowSetup(false);
    debugLog('Timer initialized:', { sessionState, newDuration, cycle: data.cycle });
  }, []);

  const fetchSessionData = useCallback(async (date = null, cheated = false) => {
    debugLog('fetchSessionData called with:', { date, cheated });
    setTimerStatus('LOADING');
    try {
      let url = '/api/pomodoro/last';
      if (date) {
        url += `/${encodeURIComponent(date.toISOString())}`;
        if (cheated) {
          url += '/true';
        }
      }
      debugLog('Fetching from URL:', url);
      const response = await axios.get(url, getAuthConfig());
      debugLog('Session data received:', JSON.stringify(response.data, null, 2));
      if (response.data && !response.data.completed) {
        setCurrentSession(response.data);
        initializeTimer(response.data, date);
      } else {
        debugLog('No active session found or session completed, resetting timer');
        resetTimer();
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      debugLog('Error details:', error.response?.data || error.message);
      resetTimer();
    }
  }, [initializeTimer]);

  const resetTimer = () => {
    debugLog('Resetting timer');
    setCurrentSession(null);
    setDuration(studyDuration * 60);
    setTimerStatus('READY');
    setCurrentCycle(1);
    setIsRunning(false);
    updateTimerDisplay(studyDuration * 60);
    setShowSetup(true);
    
    if (!isTimeMachineActive) {
      setCurrentDate(new Date());
      setTimeMachineStartTime(null);
    }
    
    debugLog('Timer reset complete');
  };  

  const startNewSession = async () => {
    debugLog('Starting a new session...');
    try {
      const response = await axios.post('/api/pomodoro/start', {
        durationMinutes: studyDuration,
        breakMinutes: breakDuration,
        longBreakMinutes: longBreakDuration,
        cyclesBeforeLongBreak: cyclesBeforeLongBreak,
        totalCycles: totalCycles,
        timeMachineDate: isTimeMachineActive ? currentDate.toISOString() : undefined
      }, getAuthConfig());
      debugLog('New session started:', JSON.stringify(response.data, null, 2));
      
      // Extract the session data from the response
      const newSession = response.data.session;
      
      setCurrentSession(newSession);
      setDuration(newSession.durationMinutes * 60);
      setTimerStatus('ACTIVE');
      setIsRunning(true);
      setCurrentCycle(newSession.cycle);
      updateTimerDisplay(newSession.durationMinutes * 60);
      setShowSetup(false);
      
      debugLog('Current session set to:', JSON.stringify(newSession, null, 2));
    } catch (error) {
      console.error('Error starting new session:', error);
      debugLog('Error details:', error.response?.data || error.message);
      setError('Failed to start new session.');
    }
  };

  const completeSession = async (state) => {
    debugLog(`Completing session: ${state}`);
    try {
      const timeMachineDate = isTimeMachineActive
        ? new Date(currentDate.getTime() + (Date.now() - timeMachineStartTime))
        : undefined;
      
      const response = await axios.patch(`/api/pomodoro/${currentSession._id}/stop`, {
        action: 'stop',
        state,
        timeMachineDate: timeMachineDate ? timeMachineDate.toISOString() : undefined
      }, getAuthConfig());
      debugLog(`Session completed response:`, JSON.stringify(response.data, null, 2));
      
      if (state === 'aborted' || (state === 'completed' && response.data.cycle === totalCycles)) {
        debugLog('Resetting timer due to abort or final cycle completion');
        resetTimer();
      } else if (state === 'interval') {
        debugLog('Initializing timer for interval');
        setCurrentSession(response.data);
        initializeTimer(response.data, timeMachineDate);
      } else {
        debugLog('Starting new session');
        startNewSession();
      }
    } catch (error) {
      console.error(`Error completing session:`, error);
      debugLog('Error details:', error.response?.data || error.message);
      setError(`Failed to complete session.`);
    }
  };

  const performSessionAction = async (action, state = null) => {
    if (!currentSession) {
      debugLog(`Attempt to ${action} with no current session`);
      return;
    }
    debugLog(`Performing session action: ${action}, state: ${state}`);
    try {
      const timeMachineDate = isTimeMachineActive
        ? new Date(currentDate.getTime() + (Date.now() - timeMachineStartTime))
        : undefined;
      
      const response = await axios.patch(`/api/pomodoro/${currentSession._id}/${action}`, {
        action,
        state,
        timeMachineDate: timeMachineDate ? timeMachineDate.toISOString() : undefined
      }, getAuthConfig());
      debugLog(`Session ${action} response:`, JSON.stringify(response.data, null, 2));
      setCurrentSession(response.data);
      setTimerStatus(action === 'pause' ? 'PAUSED' : 'ACTIVE');
      setIsRunning(action !== 'pause');
    } catch (error) {
      console.error(`Error ${action} session:`, error);
      debugLog('Error details:', error.response?.data || error.message);
      setError(`Failed to ${action} session.`);
    }
  };

  const pauseSession = () => performSessionAction('pause');
  const resumeSession = () => performSessionAction('resume');

  const updateTimerDisplay = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    setTimerDisplay(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  };

  useEffect(() => {
    debugLog('Initial useEffect running, fetching session data');
    fetchSessionData();
  }, [fetchSessionData]);

  // Update the useEffect for the timer to include more detailed logging
  useEffect(() => {
    debugLog('Timer effect running.', {
      isRunning,
      duration,
      timerStatus,
      currentSessionId: currentSession?._id,
      currentCycle,
      totalCycles
    });
    
    let timer;
    if (isRunning && duration > 0 && timerStatus !== 'READY' && currentSession) {
      timer = setInterval(() => {
        setDuration((prevDuration) => {
          const newDuration = prevDuration - 1;
          updateTimerDisplay(newDuration);
          if (newDuration <= 0) {
            debugLog('Timer reached 0, clearing interval and completing session');
            clearInterval(timer);
            completeSession(currentSession.intervalTime ? 'completed' : 'interval');
            return 0;
          }
          return newDuration;
        });
      }, 1000);
    }
    return () => {
      if (timer) {
        debugLog('Cleaning up timer interval');
        clearInterval(timer);
      }
    };
  }, [isRunning, duration, timerStatus, currentSession, currentCycle, totalCycles]);

  useEffect(() => {
    const pomodoroState = getPomodoroState();
    const svg = document.querySelector('.pomodoro-animation svg');
    if (svg) {
      svg.querySelectorAll('.study, .sleep, .completed').forEach(el => {
        el.classList.add('hidden');
      });
      svg.querySelectorAll(`.${pomodoroState}`).forEach(el => {
        el.classList.remove('hidden');
      });
      const pomodoroGroup = svg.querySelector('#pomodoro-group');
      if (pomodoroGroup) {
        pomodoroGroup.setAttribute('class', pomodoroState);
      }
    }
  }, [timerStatus]);

  const handleStartResume = () => {
    debugLog('handleStartResume called. Current status:', timerStatus);
    if (timerStatus === 'READY') {
      startNewSession();
    } else if (timerStatus === 'PAUSED') {
      resumeSession();
    }
  };

  const handleSetDate = (newDate) => {
    debugLog('handleSetDate called with:', newDate);
    setCurrentDate(newDate);
    setIsTimeMachineOpen(false);
    setIsTimeMachineActive(true);
    setTimeMachineStartTime(Date.now());
    fetchSessionData(newDate, true);
  };

  const handleResetDate = () => {
    debugLog('handleResetDate called');
    const now = new Date();
    setCurrentDate(now);
    setIsTimeMachineOpen(false);
    setIsTimeMachineActive(false);
    setTimeMachineStartTime(null);
    setTimeMachineInitialDate(now);
    fetchSessionData(now, false);
  };

  const handleAbort = async () => {
    debugLog('handleAbort called');
    await completeSession('aborted');
  };

  const handleSetupComplete = (setupData) => {
    debugLog('Setup completed with data:', setupData);
    setStudyDuration(setupData.studyDuration);
    setBreakDuration(setupData.breakDuration);
    setLongBreakDuration(setupData.longBreakDuration);
    setCyclesBeforeLongBreak(setupData.cyclesBeforeLongBreak);
    setTotalCycles(setupData.totalCycles);
    setShowSetup(false);
    setTimerStatus('READY');
    updateTimerDisplay(setupData.studyDuration * 60);
  };

  const openTimeMachine = () => {
    let initialDate;
    if (isTimeMachineActive) {
      const elapsedTime = Date.now() - timeMachineStartTime;
      initialDate = new Date(currentDate.getTime() + elapsedTime);
    } else {
      initialDate = new Date();
    }
    setTimeMachineInitialDate(initialDate);
    setIsTimeMachineOpen(true);
  };

  const getPomodoroState = () => {
    if (timerStatus === 'ACTIVE') return 'study';
    if (timerStatus === 'INTERVAL' || timerStatus === 'PAUSED') return 'sleep';
    if (timerStatus === 'COMPLETED') return 'completed';
    return '';
  };

  return (
    <div className="pomodoro-container">
      <h1>Advanced Pomodoro Timer</h1>
      {error && <div className="error-message">{error}</div>}
      {showSetup ? (
        <PomodoroSetup onSetupComplete={handleSetupComplete} />
      ) : (
        <>
          <div className="pomodoro-animation">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
            <g id="pomodoro-group">
              <circle id="pomodoro" cx="100" cy="100" r="80" />
              <circle id="eyes" cx="80" cy="90" r="10" />
              <circle id="eyes" cx="120" cy="90" r="10" />
              <path id="mouth" d="M70 120 Q100 150 130 120" className="study sleep" />
              <path id="smile" d="M70 120 Q100 150 130 120" className="completed hidden" />
            </g>
            
            <g id="study-elements" className="study">
              <rect id="book" x="50" y="160" width="100" height="20" />
            </g>
            
            <g id="sleep-elements" className="sleep hidden">
              <text id="z" x="150" y="50">Z</text>
              <text id="z" x="170" y="30">Z</text>
            </g>
          </svg>
          </div>
          <div className="timer-display">{timerDisplay}</div>
          <div className="timer-status">{timerStatus}</div>
          <div className="cycle-display">Cycle: {currentCycle}/{totalCycles}</div>
          <button onClick={handleStartResume} disabled={isRunning || timerStatus === 'LOADING'}>
            {timerStatus === 'PAUSED' ? 'Resume' : 'Start'}
          </button>
          <button onClick={pauseSession} disabled={!isRunning}>Pause</button>
          <button onClick={handleAbort} disabled={!currentSession}>Stop</button>
          <button onClick={openTimeMachine}>Time Machine</button>
          {isTimeMachineActive && (
            <div className="time-machine-active">Time Machine Active: {currentDate.toLocaleString()}</div>
          )}
          <TimeMachineModal
            isOpen={isTimeMachineOpen}
            onRequestClose={() => setIsTimeMachineOpen(false)}
            onSetDate={handleSetDate}
            onResetDate={handleResetDate}
            initialDate={timeMachineInitialDate}
          />
        </>
      )}
    </div>
  );
};

export default AdvancedPomodoroTimer;