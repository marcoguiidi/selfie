import React, { useState, useEffect } from 'react';

const PomodoroSetup = ({ onSetupComplete }) => {
  const [totalHours, setTotalHours] = useState(4);
  const [combinations, setCombinations] = useState([]);
  const [selectedCombination, setSelectedCombination] = useState(null);
  const [manualSetup, setManualSetup] = useState(false);

  const [studyDuration, setStudyDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState(4);
  const [totalCycles, setTotalCycles] = useState(5);

  useEffect(() => {
    generateCombinations();
  }, [totalHours]);

  const generateCombinations = () => {
    const totalMinutes = totalHours * 60;
    const combinations = [];

    for (let studyTime = 20; studyTime <= 50; studyTime += 5) {
      for (let breakTime = 5; breakTime <= 15; breakTime += 5) {
        for (let longBreakTime = breakTime * 2; longBreakTime <= breakTime * 3; longBreakTime += 5) {
          for (let cyclesBeforeLongBreak = 2; cyclesBeforeLongBreak <= 5; cyclesBeforeLongBreak++) {
            const cycleTime = studyTime + breakTime;
            const longBreakCycleTime = studyTime + longBreakTime;
            
            let cycles = cyclesBeforeLongBreak;
            while (true) {
              const totalTime = (cycleTime * (cycles - 1)) + longBreakCycleTime * Math.floor((cycles - 1) / cyclesBeforeLongBreak);
              if (totalTime > totalMinutes) break;
              if (Math.abs(totalTime - totalMinutes) <= 30) {
                combinations.push({
                  studyDuration: studyTime,
                  breakDuration: breakTime,
                  longBreakDuration: longBreakTime,
                  cyclesBeforeLongBreak,
                  totalCycles: cycles,
                  totalTime
                });
              }
              cycles++;
            }
          }
        }
      }
    }

    setCombinations(combinations.sort((a, b) => Math.abs(a.totalTime - totalMinutes) - Math.abs(b.totalTime - totalMinutes)));
  };

  const handleCombinationSelect = (event) => {
    const selected = combinations[event.target.value];
    setSelectedCombination(selected);
    setStudyDuration(selected.studyDuration);
    setBreakDuration(selected.breakDuration);
    setLongBreakDuration(selected.longBreakDuration);
    setCyclesBeforeLongBreak(selected.cyclesBeforeLongBreak);
    setTotalCycles(selected.totalCycles);
  };

  const handleSubmit = () => {
    onSetupComplete({
      studyDuration,
      breakDuration,
      longBreakDuration,
      cyclesBeforeLongBreak,
      totalCycles
    });
  };

  return (
    <div className="pomodoro-setup">
      <h2>Pomodoro Timer Setup</h2>
      <div>
        <label htmlFor="totalHours">Total Study Hours: </label>
        <input
          id="totalHours"
          type="number"
          value={totalHours}
          onChange={(e) => setTotalHours(Number(e.target.value))}
        />
      </div>
      {!manualSetup && (
        <div>
          <label htmlFor="combinationSelect">Select a Combination: </label>
          <select
            id="combinationSelect"
            value={selectedCombination ? combinations.indexOf(selectedCombination) : ''}
            onChange={handleCombinationSelect}
          >
            <option value="">Choose a combination</option>
            {combinations.map((combo, index) => (
              <option key={index} value={index}>
                {`${combo.studyDuration}m study + ${combo.breakDuration}m break, ${combo.longBreakDuration}m long break every ${combo.cyclesBeforeLongBreak} cycles (${combo.totalCycles} total cycles, ${Math.round(combo.totalTime / 60 * 10) / 10}h total)`}
              </option>
            ))}
          </select>
        </div>
      )}
      {manualSetup && (
        <>
          <div>
            <label htmlFor="studyDuration">Study Duration (minutes): </label>
            <input
              id="studyDuration"
              type="number"
              value={studyDuration}
              onChange={(e) => setStudyDuration(Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="breakDuration">Break Duration (minutes): </label>
            <input
              id="breakDuration"
              type="number"
              value={breakDuration}
              onChange={(e) => setBreakDuration(Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="longBreakDuration">Long Break Duration (minutes): </label>
            <input
              id="longBreakDuration"
              type="number"
              value={longBreakDuration}
              onChange={(e) => setLongBreakDuration(Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="cyclesBeforeLongBreak">Cycles before Long Break: </label>
            <input
              id="cyclesBeforeLongBreak"
              type="number"
              value={cyclesBeforeLongBreak}
              onChange={(e) => setCyclesBeforeLongBreak(Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="totalCycles">Total Cycles: </label>
            <input
              id="totalCycles"
              type="number"
              value={totalCycles}
              onChange={(e) => setTotalCycles(Number(e.target.value))}
            />
          </div>
        </>
      )}
      <button onClick={() => setManualSetup(!manualSetup)}>
        {manualSetup ? "Use Preset Combinations" : "Manual Setup"}
      </button>
      <button onClick={handleSubmit}>Start Pomodoro</button>
    </div>
  );
};

export default PomodoroSetup;