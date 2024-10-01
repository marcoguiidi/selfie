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

  const [isAllCompleted, setIsAllCompleted] = useState(false);
  const [maxCompletedCycles, setMaxCompletedCycles] = useState(0);

  const getAuthConfig = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
  }), []);

  const debugLog = useCallback((...messages) => {
    console.log(new Date().toISOString(), ...messages);
  }, []);

  const updateTimerDisplay = useCallback((time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    setTimerDisplay(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }, []);

  const resetTimer = useCallback(() => {
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
  }, [debugLog, studyDuration, isTimeMachineActive, updateTimerDisplay]);

  const initializeTimer = useCallback((data, timeMachineDate = null) => {
    debugLog('Initializing timer with data:', JSON.stringify(data, null, 2));
    
    if (!data.startTime || !data.durationMinutes) {
      debugLog('Invalid session data, resetting timer');
      resetTimer();
      return;
    }

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
  }, [debugLog, resetTimer, updateTimerDisplay]);

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
      
      if (response.data && response.data.status === 'completed') {
        debugLog('All cycles completed, showing completion screen');
        setIsAllCompleted(true);
        setMaxCompletedCycles(response.data.cycle || totalCycles);
        setTimerStatus('COMPLETED');
        setShowSetup(false);
      } else if (response.data && !response.data.completed) {
        setCurrentSession(response.data);
        initializeTimer(response.data, date);
      } else {
        debugLog('No active session found, resetting timer');
        resetTimer();
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      debugLog('Error details:', error.response?.data || error.message);
      resetTimer();
    }
  }, [debugLog, getAuthConfig, initializeTimer, resetTimer, totalCycles]);

  const startNewSession = useCallback(async (setupData = null) => {
    debugLog('Starting a new session...', setupData);
    try {
      const sessionData = {
        durationMinutes: setupData ? setupData.studyDuration : studyDuration,
        breakMinutes: setupData ? setupData.breakDuration : breakDuration,
        longBreakMinutes: setupData ? setupData.longBreakDuration : longBreakDuration,
        cyclesBeforeLongBreak: setupData ? setupData.cyclesBeforeLongBreak : cyclesBeforeLongBreak,
        totalCycles: setupData ? setupData.totalCycles : totalCycles,
        timeMachineDate: isTimeMachineActive ? currentDate.toISOString() : undefined
      };
  
      debugLog('Sending session data:', sessionData);
  
      const response = await axios.post('/api/pomodoro/start', sessionData, getAuthConfig());
      debugLog('New session started:', JSON.stringify(response.data, null, 2));
      
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
  }, [breakDuration, currentDate, cyclesBeforeLongBreak, debugLog, getAuthConfig, isTimeMachineActive, longBreakDuration, studyDuration, totalCycles, updateTimerDisplay]);

  const completeSession = useCallback(async (state) => {
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
      
      if (state === 'aborted') {
        debugLog('Session aborted, resetting timer');
        resetTimer();
      } else if (state === 'completed' && response.data.cycle === totalCycles) {
        debugLog('All cycles completed');
        setIsAllCompleted(true);
        setMaxCompletedCycles(response.data.cycle);
        setTimerStatus('COMPLETED');
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
  }, [currentDate, currentSession, debugLog, getAuthConfig, initializeTimer, isTimeMachineActive, resetTimer, startNewSession, timeMachineStartTime, totalCycles]);

  const performSessionAction = useCallback(async (action, state = null) => {
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
  }, [currentDate, currentSession, debugLog, getAuthConfig, isTimeMachineActive, timeMachineStartTime]);

  const pauseSession = useCallback(() => performSessionAction('pause'), [performSessionAction]);
  const resumeSession = useCallback(() => performSessionAction('resume'), [performSessionAction]);

  const getPomodoroState = useCallback(() => {
    if (timerStatus === 'ACTIVE') return 'study';
    if (timerStatus === 'INTERVAL' || timerStatus === 'PAUSED') return 'sleep';
    if (timerStatus === 'COMPLETED') return 'completed';
    return '';
  }, [timerStatus]);

  useEffect(() => {
    debugLog('Initial useEffect running, fetching session data');
    fetchSessionData();
  }, [fetchSessionData, debugLog]);

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
  }, [isRunning, duration, timerStatus, currentSession, currentCycle, totalCycles, debugLog, updateTimerDisplay, completeSession]);

  useEffect(() => {
    const pomodoroState = isAllCompleted ? 'completed' : getPomodoroState();
    const svg = document.querySelector('.pomodoro-animation svg');
    if (svg) {
      svg.querySelectorAll('.study, .sleep, .completed').forEach(el => {
        el.classList.add('hidden');
      });
      if (pomodoroState) {
        svg.querySelectorAll(`.${pomodoroState}`).forEach(el => {
          el.classList.remove('hidden');
        });
        const pomodoroGroup = svg.querySelector('#pomodoro-group');
        if (pomodoroGroup) {
          pomodoroGroup.setAttribute('class', pomodoroState);
        }
      }
    }
  }, [timerStatus, isAllCompleted, getPomodoroState]);

  const renderCompletionScreen = useCallback(() => {
    const handleStartNewSession = () => {
      resetTimer();
      window.location.reload();
    };
  
    return (
      <div className="completion-screen">
        {renderPomodoroSVG()}
        <h2>Congratulations!</h2>
        <p>{maxCompletedCycles}/{totalCycles} COMPLETED</p>
        <button onClick={handleStartNewSession}>Start New Session</button>
      </div>
    );
  }, [maxCompletedCycles, totalCycles, resetTimer]);

  const handleStartResume = useCallback(() => {
    debugLog('handleStartResume called. Current status:', timerStatus);
    if (timerStatus === 'READY') {
      startNewSession();
    } else if (timerStatus === 'PAUSED') {
      resumeSession();
    }
  }, [debugLog, timerStatus, startNewSession, resumeSession]);
  
  const handleSetDate = useCallback((newDate) => {
    debugLog('handleSetDate called with:', newDate);
    setCurrentDate(newDate);
    setIsTimeMachineOpen(false);
    setIsTimeMachineActive(true);
    setTimeMachineStartTime(Date.now());
    fetchSessionData(newDate, true);
  }, [debugLog, fetchSessionData]);
  
  const handleResetDate = useCallback(() => {
    debugLog('handleResetDate called');
    const now = new Date();
    setCurrentDate(now);
    setIsTimeMachineOpen(false);
    setIsTimeMachineActive(false);
    setTimeMachineStartTime(null);
    setTimeMachineInitialDate(now);
    fetchSessionData(now, false);
  }, [debugLog, fetchSessionData]);

  const handleAbort = useCallback(async () => {
    debugLog('handleAbort called');
    await completeSession('aborted');
  }, [debugLog, completeSession]);

  const handleSetupComplete = useCallback((setupData) => {
    debugLog('Setup completed with data:', setupData);
    setStudyDuration(setupData.studyDuration);
    setBreakDuration(setupData.breakDuration);
    setLongBreakDuration(setupData.longBreakDuration);
    setCyclesBeforeLongBreak(setupData.cyclesBeforeLongBreak);
    setTotalCycles(setupData.totalCycles);
    setShowSetup(false);
    setTimerStatus('READY');
    updateTimerDisplay(setupData.studyDuration * 60);
    
    // Avvia immediatamente una nuova sessione dopo il setup
    startNewSession(setupData);
  }, [debugLog, updateTimerDisplay, startNewSession]);

  const openTimeMachine = useCallback(() => {
    let initialDate;
    if (isTimeMachineActive) {
      const elapsedTime = Date.now() - timeMachineStartTime;
      initialDate = new Date(currentDate.getTime() + elapsedTime);
    } else {
      initialDate = new Date();
    }
    setTimeMachineInitialDate(initialDate);
    setIsTimeMachineOpen(true);
  }, [isTimeMachineActive, timeMachineStartTime, currentDate]);

  const renderPomodoroSVG = useCallback(() => (
    <div className={`pomodoro-animation ${timerStatus === 'COMPLETED' ? 'completed' : ''}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <g id="pomodoro-group">
          <circle id="pomodoro" cx="100" cy="100" r="70" fill="#ff6347" />
          
          <g id="open-eyes" className="study">
            <circle cx="85" cy="90" r="8" fill="#ffffff" />
            <circle cx="115" cy="90" r="8" fill="#ffffff" />
          </g>
          
          <g id="closed-eyes" className="sleep">
            <path d="M75 90 Q85 95 95 90" stroke="#ffffff" strokeWidth="3" fill="none" />
            <path d="M105 90 Q115 95 125 90" stroke="#ffffff" strokeWidth="3" fill="none" />
          </g>
          
          <path id="mouth" d="M80 115 Q100 130 120 115" className="study sleep" stroke="#ffffff" strokeWidth="3" fill="none" />
          <path id="smile" d="M80 115 Q100 140 120 115" className="completed" stroke="#ffffff" strokeWidth="3" fill="none" />
          
          <g id="glasses" className="study">
            <path d="M70 90 Q85 85 100 90 Q115 95 130 90" stroke="#333" strokeWidth="2" fill="none" />
            <circle cx="85" cy="90" r="12" stroke="#333" strokeWidth="2" fill="none" />
            <circle cx="115" cy="90" r="12" stroke="#333" strokeWidth="2" fill="none" />
          </g>
  
          <g id="sunglasses" className="completed">
            <path d="M70 90 Q100 80 130 90" stroke="#333" strokeWidth="3" fill="none" />
            <rect x="75" y="80" width="20" height="18" rx="5" fill="#333" />
            <rect x="105" y="80" width="20" height="18" rx="5" fill="#333" />
          </g>
  
          <g id="hat" className="completed">
            <path d="M65 60 Q100 25 135 60" fill="#4CAF50" stroke="#388E3C" strokeWidth="2" />
            <path id="hat-brim" d="M55 60 H145" fill="#388E3C" stroke="#2E7D32" strokeWidth="2" />
          </g>
        </g>
  
        <g id="study-elements" className="study">
          <rect id="book" x="60" y="150" width="80" height="15" fill="#4a4a4a" />
        </g>
  
        <g id="sleep-elements" className="sleep">
          <text id="z" x="140" y="60" fontSize="24" fontWeight="bold" fill="#4a4a4a">Z</text>
          <text id="z" x="160" y="40" fontSize="24" fontWeight="bold" fill="#4a4a4a">Z</text>
        </g>
      </svg>
    </div>
  ), [timerStatus]);

  return (
    <div className="pomodoro-container">
      <h1>Advanced Pomodoro Timer</h1>
      {error && <div className="error-message">{error}</div>}
      {showSetup ? (
        <PomodoroSetup onSetupComplete={handleSetupComplete} />
      ) : isAllCompleted ? (
        renderCompletionScreen()
      ) : (
        <>
          {renderPomodoroSVG()}
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