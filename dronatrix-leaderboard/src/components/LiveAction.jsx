import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUND_MODES } from '../data/initialData';
import { getAvailablePilots, validateModeDeclaration } from '../utils/scoring';

const LiveAction = ({ state, updateTeamRound, setCurrentTeamIndex, setCurrentRound }) => {
  const { currentRound, currentTeamIndex, teams } = state;
  const currentTeam = teams[currentTeamIndex];

  const [showModeReveal, setShowModeReveal] = useState(true);
  const [showSuccessFail, setShowSuccessFail] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [pilot, setPilot] = useState('');
  const [mode, setMode] = useState('');
  const [rival, setRival] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [manualTime, setManualTime] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [milliseconds, setMilliseconds] = useState('');
  const [useTimer, setUseTimer] = useState(true); // For R2/R4: choose timer or manual
  const [error, setError] = useState('');

  const availablePilots = getAvailablePilots(currentTeam, currentRound);
  const isDeclarationRound = currentRound === 2 || currentRound === 4;
  const isTimeTrialRound = currentRound === 1 || currentRound === 3;
  const roundModes = currentRound === 2 ? ROUND_MODES.ROUND_2 : ROUND_MODES.ROUND_4;

  // Timer effect
  useEffect(() => {
    let interval;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 0.01);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Reset mode reveal when round changes
  useEffect(() => {
    if (isDeclarationRound && currentTeamIndex === 0) {
      setShowModeReveal(true);
    }
  }, [currentRound, currentTeamIndex, isDeclarationRound]);

  // Auto-select pilot for R2 and R4
  useEffect(() => {
    if (isDeclarationRound && availablePilots.length === 1) {
      setPilot(availablePilots[0]);
    } else {
      setPilot('');
    }
  }, [currentTeam, currentRound, isDeclarationRound, availablePilots]);

  const getReferenceTime = () => {
    if (currentRound === 2) return currentTeam.rounds[1].time;
    if (currentRound === 4) return currentTeam.rounds[3].time;
    return null;
  };

  const refTime = getReferenceTime();

  const getFastestRound1 = () => {
    const times = teams.filter(t => t.rounds[1].time !== null).map(t => t.rounds[1].time);
    return times.length > 0 ? Math.min(...times) : null;
  };

  const getFastestRound3Team = () => {
    const validTeams = teams.filter(t => t.rounds[3].time !== null);
    if (validTeams.length === 0) return null;
    return validTeams.reduce((min, t) => (t.rounds[3].time < min.rounds[3].time ? t : min));
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--.--';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  const startTimer = () => {
    setElapsedTime(0);
    setTimerRunning(true);
  };

  const stopTimer = () => {
    setTimerRunning(false);
  };

  const calculateResult = (finalTime, teamData) => {
    if (!isDeclarationRound) return null;

    const modeConfig = roundModes[mode];
    let success = false;
    let targetTime = null;
    let targetDescription = null;

    if (currentRound === 2) {
      const r1Time = teamData.rounds[1].time;
      if (mode === 'SAFE') {
        targetTime = r1Time;
        targetDescription = 'Beat R1';
        success = finalTime < r1Time;
      } else if (mode === 'RISKY') {
        targetTime = r1Time;
        targetDescription = 'Beat R1 by 10s';
        success = finalTime <= r1Time - 10;
      } else if (mode === 'ALL_IN') {
        targetTime = getFastestRound1();
        targetDescription = 'Beat fastest R1';
        success = finalTime < targetTime;
      }
    } else if (currentRound === 4) {
      const r3Time = teamData.rounds[3].time;
      if (mode === 'SAFE') {
        targetTime = r3Time;
        targetDescription = 'Beat R3 by 5s';
        success = finalTime <= r3Time - 5;
      } else if (mode === 'CHALLENGE' && rival) {
        const rivalTeam = teams.find(t => t.id === parseInt(rival));
        targetTime = rivalTeam?.rounds[3].time;
        targetDescription = `Beat ${rivalTeam?.name} R3`;
        success = finalTime < targetTime;
      } else if (mode === 'BLOOD_MATCH') {
        const fastestTeam = getFastestRound3Team();
        targetTime = fastestTeam?.rounds[3].time;
        targetDescription = `Beat ${fastestTeam?.name} R3`;
        success = finalTime < targetTime;
      }
    }

    return {
      success,
      points: success ? modeConfig.successPoints : modeConfig.failPoints,
      targetTime,
      targetDescription,
      actualTime: finalTime,
      mode: modeConfig.label,
    };
  };

  const handleSubmit = () => {
    setError('');

    if (!pilot) {
      setError('Please select a pilot');
      return;
    }

    let finalTime;
    if (isTimeTrialRound) {
      // Time trial rounds always use manual entry
      const mins = parseInt(minutes) || 0;
      const secs = parseInt(seconds) || 0;
      const ms = parseInt(milliseconds) || 0;

      if (mins === 0 && secs === 0 && ms === 0) {
        setError('Please enter a valid time');
        return;
      }

      finalTime = mins * 60 + secs + ms / 100;
    } else {
      // Declaration rounds can use timer OR manual entry
      if (useTimer) {
        if (elapsedTime === 0) {
          setError('Please record a time using the timer');
          return;
        }
        finalTime = elapsedTime;
      } else {
        const mins = parseInt(minutes) || 0;
        const secs = parseInt(seconds) || 0;
        const ms = parseInt(milliseconds) || 0;

        if (mins === 0 && secs === 0 && ms === 0) {
          setError('Please enter a valid time');
          return;
        }

        finalTime = mins * 60 + secs + ms / 100;
      }
    }

    if (isDeclarationRound && !mode) {
      setError('Please select a mode');
      return;
    }

    if (mode === 'CHALLENGE' || mode === 'BLOOD_MATCH') {
      if (!rival) {
        setError('Please select a rival');
        return;
      }
    }

    if (isDeclarationRound) {
      const validation = validateModeDeclaration(currentTeam, mode, currentRound, teams);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
    }

    const data = {
      pilot,
      time: finalTime,
    };

    if (isDeclarationRound) {
      data.mode = mode;
      if (rival) data.rival = parseInt(rival);
    }

    updateTeamRound(currentTeam.id, currentRound, data);

    // For declaration rounds, show success/fail screen first
    if (isDeclarationRound) {
      const result = calculateResult(finalTime, currentTeam);
      setResultData({
        ...result,
        teamName: currentTeam.name,
        pilot,
      });
      setShowSuccessFail(true);
    } else {
      // For time trial rounds, auto-advance to next team
      handleNextTeam();
    }
  };

  const handleNextTeam = () => {
    setShowSuccessFail(false);
    setShowResult(false);
    setResultData(null);
    setPilot('');
    setMode('');
    setRival('');
    setElapsedTime(0);
    setManualTime('');
    setMinutes('');
    setSeconds('');
    setMilliseconds('');
    setTimerRunning(false);

    if (currentTeamIndex < teams.length - 1) {
      setCurrentTeamIndex(currentTeamIndex + 1);
    } else {
      if (currentRound < 4) {
        setCurrentRound(currentRound + 1);
        setCurrentTeamIndex(0);
      }
    }
  };

  const getTargetDisplay = () => {
    if (currentRound === 2) {
      if (mode === 'SAFE') return 'Beat your Round 1 time';
      if (mode === 'RISKY') return 'Beat your Round 1 by 10 seconds';
      if (mode === 'ALL_IN') return 'Beat the fastest Round 1 time';
    }
    if (currentRound === 4) {
      if (mode === 'SAFE') return 'Beat your Round 3 time by 5 seconds';
      if (mode === 'CHALLENGE') {
        const rivalTeam = teams.find(t => t.id === parseInt(rival));
        return rivalTeam ? `Beat ${rivalTeam.name}'s Round 3 time` : 'Select a rival to challenge';
      }
      if (mode === 'BLOOD_MATCH') {
        const fastestTeam = getFastestRound3Team();
        return fastestTeam ? `Beat ${fastestTeam.name}'s Round 3 time (#1)` : 'Beat the fastest Round 3 time';
      }
    }
    return null;
  };

  const getTargetMessage = () => {
    if (currentRound === 1 || currentRound === 3) {
      return 'Complete the course as fast as possible';
    }

    if (currentRound === 2) {
      if (mode === 'SAFE') return `Beat ${formatTime(refTime)}`;
      if (mode === 'RISKY') return `Beat ${formatTime(refTime - 10)} (10s faster)`;
      if (mode === 'ALL_IN') return `Beat ${formatTime(getFastestRound1())} (Fastest R1)`;
    }

    if (currentRound === 4) {
      if (mode === 'SAFE') return `Beat ${formatTime(refTime - 5)} (5s faster)`;
      if (mode === 'CHALLENGE' && rival) {
        const rivalTeam = teams.find(t => t.id === parseInt(rival));
        return `Beat ${formatTime(rivalTeam?.rounds[3].time)} (${rivalTeam?.name})`;
      }
      if (mode === 'BLOOD_MATCH') {
        const fastestTeam = getFastestRound3Team();
        return `Beat ${formatTime(fastestTeam?.rounds[3].time)} (${fastestTeam?.name})`;
      }
    }

    return null;
  };

  const isRoundComplete = teams.every(t => t.rounds[currentRound].time !== null);

  // SUCCESS/FAIL SCREEN (first screen after submit in declaration rounds)
  if (showSuccessFail && resultData) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-dark-950">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-5xl"
        >
          {/* Split Screen Layout */}
          <div className="grid grid-cols-2 gap-1 h-[600px]">
            {/* Left Side - Result Status */}
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className={`flex flex-col justify-center items-center relative overflow-hidden ${
                resultData.success ? 'bg-dark-900' : 'bg-dark-900'
              }`}
            >
              <div className={`absolute inset-0 opacity-5 ${
                resultData.success ? 'bg-accent-success' : 'bg-accent-danger'
              }`}></div>

              <div className="relative z-10 text-center">
                <div className={`text-9xl font-black font-mono mb-6 ${
                  resultData.success ? 'text-accent-success' : 'text-accent-danger'
                }`}>
                  {resultData.points > 0 ? '+' : ''}{resultData.points}
                </div>
                <div className={`text-2xl font-bold uppercase tracking-[0.3em] ${
                  resultData.success ? 'text-accent-success' : 'text-accent-danger'
                }`}>
                  {resultData.success ? 'OBJECTIVE COMPLETE' : 'OBJECTIVE FAILED'}
                </div>
              </div>
            </motion.div>

            {/* Right Side - Details */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-dark-800 flex flex-col justify-center p-12"
            >
              <div className="space-y-8">
                <div>
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Team</div>
                  <div className="text-4xl font-black text-gray-100 uppercase tracking-tight">{resultData.teamName}</div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Mode</div>
                    <div className="text-xl font-bold text-primary uppercase">{resultData.mode}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Time</div>
                    <div className="text-xl font-bold text-gray-100 font-mono">{formatTime(resultData.actualTime)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Target</div>
                  <div className="text-lg text-gray-400">{resultData.targetDescription}</div>
                  <div className="text-sm text-gray-600 font-mono mt-1">{formatTime(resultData.targetTime)}</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Continue Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ x: 4 }}
            onClick={() => {
              setShowSuccessFail(false);
              setShowResult(true);
            }}
            className="w-full mt-1 px-8 py-5 bg-primary text-dark-950 text-base font-black uppercase tracking-[0.3em] hover:bg-cyan-400 transition-colors"
          >
            VIEW STANDINGS →
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // RESULT SCREEN (leaderboard after success/fail screen)
  if (showResult && resultData) {
    const rankedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

    return (
      <div className="h-full p-6 flex flex-col gap-4 overflow-hidden">
        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800 border border-dark-600 flex-1 flex flex-col overflow-hidden"
        >
          <div className="bg-dark-700 border-b border-dark-600 px-6 py-3">
            <h2 className="text-base font-bold text-gray-400 uppercase tracking-wider">Current Standings</h2>
          </div>
          <div className="flex-1">
            <table className="w-full">
              <thead className="bg-dark-700">
                <tr className="border-b border-dark-600">
                  <th className="text-center py-2.5 px-5 text-gray-600 font-semibold text-sm uppercase tracking-wider">#</th>
                  <th className="text-left py-2.5 px-5 text-gray-600 font-semibold text-sm uppercase tracking-wider">Team</th>
                  <th className="text-center py-2.5 px-3 text-gray-600 font-semibold text-sm uppercase tracking-wider">R1</th>
                  <th className="text-center py-2.5 px-3 text-gray-600 font-semibold text-sm uppercase tracking-wider">R2</th>
                  <th className="text-center py-2.5 px-3 text-gray-600 font-semibold text-sm uppercase tracking-wider">R3</th>
                  <th className="text-center py-2.5 px-3 text-gray-600 font-semibold text-sm uppercase tracking-wider">R4</th>
                  <th className="text-center py-2.5 px-3 text-gray-600 font-semibold text-sm uppercase tracking-wider">Penalty</th>
                  <th className="text-right py-2.5 px-5 text-gray-600 font-semibold text-sm uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <AnimatePresence mode="popLayout">
                <tbody>
                  {rankedTeams.map((team, index) => (
                    <motion.tr
                      key={team.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        layout: { type: "spring", bounce: 0.2, duration: 0.6 },
                        opacity: { duration: 0.2 }
                      }}
                      className={`border-b border-dark-700 hover:bg-dark-700/30 transition-colors ${
                        index === 0 ? 'bg-accent-gold/5' :
                        index === 1 ? 'bg-accent-silver/5' :
                        index === 2 ? 'bg-accent-bronze/5' : ''
                      }`}
                    >
                      <td className="py-4 px-5 text-center">
                        <motion.span
                          key={`rank-${team.id}-${index}`}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          className={`inline-block text-2xl font-bold font-mono ${
                            index === 0 ? 'text-accent-gold' :
                            index === 1 ? 'text-accent-silver' :
                            index === 2 ? 'text-accent-bronze' :
                            'text-gray-500'
                          }`}
                        >
                          {index + 1}
                        </motion.span>
                      </td>
                      <td className="py-4 px-5 font-bold text-gray-100 uppercase text-base tracking-wide">{team.name}</td>
                      <td className="py-4 px-4 text-center">
                        <motion.span
                          key={`r1-${team.id}-${team.rounds[1].bonusPoints}`}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          className={`inline-block font-mono font-bold text-base ${
                            team.rounds[1].bonusPoints > 0 ? 'text-accent-success' : 'text-gray-600'
                          }`}
                        >
                          {team.rounds[1].bonusPoints ? `+${team.rounds[1].bonusPoints}` : '--'}
                        </motion.span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <motion.span
                          key={`r2-${team.id}-${team.rounds[2].points}`}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          className={`inline-block font-mono font-bold text-base ${
                            team.rounds[2].points > 0 ? 'text-accent-success' :
                            team.rounds[2].points < 0 ? 'text-accent-danger' : 'text-gray-600'
                          }`}
                        >
                          {team.rounds[2].points !== 0 ? (team.rounds[2].points > 0 ? `+${team.rounds[2].points}` : team.rounds[2].points) : '--'}
                        </motion.span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <motion.span
                          key={`r3-${team.id}-${team.rounds[3].bonusPoints}`}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          className={`inline-block font-mono font-bold text-base ${
                            team.rounds[3].bonusPoints > 0 ? 'text-accent-success' : 'text-gray-600'
                          }`}
                        >
                          {team.rounds[3].bonusPoints ? `+${team.rounds[3].bonusPoints}` : '--'}
                        </motion.span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <motion.span
                          key={`r4-own-${team.id}-${team.rounds[4].ownPoints}`}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          className={`inline-block font-mono font-bold text-base ${
                            team.rounds[4].ownPoints > 0 ? 'text-accent-success' :
                            team.rounds[4].ownPoints < 0 ? 'text-accent-danger' : 'text-gray-600'
                          }`}
                        >
                          {team.rounds[4].ownPoints !== 0 ? (team.rounds[4].ownPoints > 0 ? `+${team.rounds[4].ownPoints}` : team.rounds[4].ownPoints) : '--'}
                        </motion.span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <motion.span
                          key={`r4-penalty-${team.id}-${team.rounds[4].penaltyPoints}`}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          className={`inline-block font-mono font-bold text-base ${
                            team.rounds[4].penaltyPoints < 0 ? 'text-accent-danger' : 'text-gray-600'
                          }`}
                        >
                          {team.rounds[4].penaltyPoints !== 0 ? team.rounds[4].penaltyPoints : '--'}
                        </motion.span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <motion.span
                          key={`total-${team.id}-${team.totalPoints}`}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          className={`inline-block font-mono font-bold text-xl ${
                            team.totalPoints > 0 ? 'text-accent-success' :
                            team.totalPoints < 0 ? 'text-accent-danger' : 'text-gray-500'
                          }`}
                        >
                          {team.totalPoints > 0 ? '+' : ''}{team.totalPoints}
                        </motion.span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </AnimatePresence>
            </table>
          </div>
        </motion.div>

        {/* Next Button */}
        <div className="text-center">
          <button
            onClick={handleNextTeam}
            className="px-16 py-4 bg-primary text-dark-950 text-xl font-bold uppercase tracking-wider hover:bg-primary-light transition-all"
          >
            {currentTeamIndex < teams.length - 1 ? 'NEXT TEAM' : 'FINISH ROUND'}
          </button>
        </div>
      </div>
    );
  }

  // MODE REVEAL SCREEN (R2/R4 only)
  if (isDeclarationRound && showModeReveal && currentTeamIndex === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 overflow-hidden">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-6xl w-full"
        >
          <div className="text-center mb-8">
            <h1 className="text-6xl font-black text-primary mb-4 tracking-tight">
              ROUND {currentRound}
            </h1>
            <h2 className="text-3xl font-bold text-gray-100 uppercase tracking-wider">
              {currentRound === 2 ? 'The Declaration' : 'Rival Declaration'}
            </h2>
          </div>

          {/* Stakes Section - Unified and Bigger */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-dark-900/50 backdrop-blur-xl border-2 border-primary/30 p-10 mb-8"
          >
            <h2 className="text-4xl font-black text-center text-primary uppercase tracking-widest mb-10">
              THE STAKES
            </h2>

            <div className="grid grid-cols-3 gap-8">
              {Object.entries(roundModes).map(([key, config], index) => {
                let description = '';
                if (currentRound === 2) {
                  if (key === 'SAFE') description = 'Beat your Round 1 time';
                  if (key === 'RISKY') description = 'Beat R1 by 10 seconds';
                  if (key === 'ALL_IN') description = 'Beat fastest Round 1';
                }
                if (currentRound === 4) {
                  if (key === 'SAFE') description = 'Beat R3 by 5 seconds';
                  if (key === 'CHALLENGE') description = 'Beat rival Round 3';
                  if (key === 'BLOOD_MATCH') description = 'Beat #1 Round 3';
                }

                return (
                  <motion.div
                    key={key}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + 0.1 * index }}
                    className="bg-dark-800 border-2 border-dark-700 p-8 text-center"
                  >
                    <div className={`text-4xl font-black mb-4 ${config.color}`}>
                      {config.label.toUpperCase()}
                    </div>
                    <div className="text-gray-400 text-base mb-6 min-h-[3rem] flex items-center justify-center">
                      {description}
                    </div>
                    <div className="space-y-3">
                      <div className="text-accent-success font-black text-2xl">
                        +{config.successPoints}
                      </div>
                      <div className="text-xs text-gray-600 uppercase tracking-wider">SUCCESS</div>
                      <div className="border-t border-dark-600 my-3"></div>
                      <div className="text-accent-danger font-black text-2xl">
                        {config.failPoints}
                      </div>
                      <div className="text-xs text-gray-600 uppercase tracking-wider">FAILURE</div>
                      {config.rivalPenalty && (
                        <>
                          <div className="border-t border-dark-600 my-3"></div>
                          <div className="text-accent-warning font-bold text-sm">
                            Rival Penalty: {config.rivalPenalty} pts
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => setShowModeReveal(false)}
                className="px-16 py-5 bg-primary text-dark-950 text-2xl font-black uppercase tracking-wider hover:bg-primary-light transition-all"
              >
                START ROUND {currentRound}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ROUND COMPLETE
  if (isRoundComplete) {
    const rankedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);
    const showLeaderboard = currentRound === 2 || currentRound === 4;

    return (
      <div className="h-full p-6 flex flex-col overflow-hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-6"
        >
          <div className="text-7xl mb-4 text-accent-success">✓</div>
          <h2 className="text-5xl font-black text-gray-100 mb-4 uppercase tracking-wide">
            Round {currentRound} Complete!
          </h2>
        </motion.div>

        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-dark-800 border border-dark-600 flex-1 flex flex-col overflow-hidden mb-6"
          >
            <div className="bg-dark-700 border-b border-dark-600 px-6 py-4">
              <h2 className="text-base font-bold text-gray-400 uppercase tracking-wider">Current Standings</h2>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 bg-dark-700">
                  <tr className="border-b border-dark-600">
                    <th className="text-center py-3 px-6 text-gray-600 font-semibold text-sm uppercase tracking-wider">#</th>
                    <th className="text-left py-3 px-6 text-gray-600 font-semibold text-sm uppercase tracking-wider">Team</th>
                    <th className="text-center py-3 px-5 text-gray-600 font-semibold text-sm uppercase tracking-wider">R1</th>
                    <th className="text-center py-3 px-5 text-gray-600 font-semibold text-sm uppercase tracking-wider">R2</th>
                    {currentRound === 4 && <th className="text-center py-3 px-5 text-gray-600 font-semibold text-sm uppercase tracking-wider">R3</th>}
                    {currentRound === 4 && <th className="text-center py-3 px-5 text-gray-600 font-semibold text-sm uppercase tracking-wider">R4</th>}
                    <th className="text-right py-3 px-6 text-gray-600 font-semibold text-sm uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedTeams.map((team, index) => (
                    <tr key={team.id} className={`border-b border-dark-700 ${
                      index === 0 ? 'bg-accent-gold/5' :
                      index === 1 ? 'bg-accent-silver/5' :
                      index === 2 ? 'bg-accent-bronze/5' : ''
                    }`}>
                      <td className="py-5 px-6 text-center">
                        <span className={`text-2xl font-bold font-mono ${
                          index === 0 ? 'text-accent-gold' :
                          index === 1 ? 'text-accent-silver' :
                          index === 2 ? 'text-accent-bronze' :
                          'text-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-5 px-6 font-bold text-gray-100 uppercase text-base tracking-wide">{team.name}</td>
                      <td className="py-5 px-5 text-center">
                        <span className={`font-mono font-bold text-base ${
                          team.rounds[1].bonusPoints > 0 ? 'text-accent-success' : 'text-gray-600'
                        }`}>
                          {team.rounds[1].bonusPoints ? `+${team.rounds[1].bonusPoints}` : '--'}
                        </span>
                      </td>
                      <td className="py-5 px-5 text-center">
                        <span className={`font-mono font-bold text-base ${
                          team.rounds[2].points > 0 ? 'text-accent-success' :
                          team.rounds[2].points < 0 ? 'text-accent-danger' : 'text-gray-600'
                        }`}>
                          {team.rounds[2].points !== 0 ? (team.rounds[2].points > 0 ? `+${team.rounds[2].points}` : team.rounds[2].points) : '--'}
                        </span>
                      </td>
                      {currentRound === 4 && (
                        <>
                          <td className="py-5 px-5 text-center">
                            <span className={`font-mono font-bold text-base ${
                              team.rounds[3].bonusPoints > 0 ? 'text-accent-success' : 'text-gray-600'
                            }`}>
                              {team.rounds[3].bonusPoints ? `+${team.rounds[3].bonusPoints}` : '--'}
                            </span>
                          </td>
                          <td className="py-5 px-5 text-center">
                            <span className={`font-mono font-bold text-base ${
                              team.rounds[4].points > 0 ? 'text-accent-success' :
                              team.rounds[4].points < 0 ? 'text-accent-danger' : 'text-gray-600'
                            }`}>
                              {team.rounds[4].points !== 0 ? (team.rounds[4].points > 0 ? `+${team.rounds[4].points}` : team.rounds[4].points) : '--'}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="py-5 px-6 text-right">
                        <span className={`font-mono font-bold text-xl ${
                          team.totalPoints > 0 ? 'text-accent-success' :
                          team.totalPoints < 0 ? 'text-accent-danger' : 'text-gray-500'
                        }`}>
                          {team.totalPoints > 0 ? '+' : ''}{team.totalPoints}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        <div className="text-center">
          {currentRound < 4 ? (
            <button
              onClick={() => {
                setCurrentRound(currentRound + 1);
                setCurrentTeamIndex(0);
                if (currentRound + 1 === 2 || currentRound + 1 === 4) {
                  setShowModeReveal(true);
                }
              }}
              className="px-16 py-5 bg-primary text-dark-950 text-2xl font-black uppercase tracking-wider hover:bg-primary-light transition-all"
            >
              Start Round {currentRound + 1}
            </button>
          ) : (
            <p className="text-gray-400 text-2xl uppercase tracking-wider">
              Competition Finished! Check SCORE tab
            </p>
          )}
        </div>
      </div>
    );
  }

  // MAIN INTERFACE
  return (
    <div className="h-full flex flex-col p-4 bg-dark-950">
      {/* Team Header - BIG */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="text-sm font-bold text-primary uppercase tracking-widest">ROUND {currentRound}</div>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent"></div>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-5xl font-black text-gray-100 uppercase tracking-tight">
            {currentTeam.name}
          </h1>
          <div className="text-sm text-gray-500 font-mono">
            {currentTeam.members.join(' • ')}
          </div>
        </div>
      </motion.div>

      {/* Main Content - STACKED LAYOUT */}
      <div className="flex-1 min-h-0 flex flex-col gap-3">
        {isDeclarationRound ? (
          <>
            {/* Row 1: Pilot + Mode Selection */}
            <div className="grid grid-cols-2 gap-3">
              {/* Pilot */}
              {availablePilots.length === 1 && (
                <div className="bg-dark-900/50 border-l-4 border-accent-success p-4">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Pilot</div>
                  <div className="text-2xl font-bold text-gray-100">{pilot}</div>
                </div>
              )}

              {/* Mode Selection - Horizontal */}
              <div className={`bg-dark-900/50 border-l-4 border-primary/30 p-4 ${availablePilots.length === 1 ? '' : 'col-span-2'}`}>
                <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider">Select Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(roundModes).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setMode(key)}
                      className={`p-3 text-center transition-all ${
                        mode === key
                          ? 'bg-dark-800 border-l-4 border-primary'
                          : 'bg-dark-800/50 border-l-4 border-transparent hover:border-dark-600'
                      }`}
                    >
                      <div className={`font-black text-lg uppercase tracking-tight mb-1 ${config.color}`}>
                        {config.label}
                      </div>
                      <div className="text-xs font-mono">
                        <span className="text-accent-success">+{config.successPoints}</span>
                        <span className="text-gray-700 mx-1">/</span>
                        <span className="text-accent-danger">{config.failPoints}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Challenge + Rival (if mode selected) */}
            {mode && (
              <div className={`grid ${(mode === 'CHALLENGE' || mode === 'BLOOD_MATCH') ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                <div className="bg-dark-900/50 border-l-4 border-accent-success p-4">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Your Challenge</div>
                  <div className="text-2xl font-bold text-gray-100 mb-3">
                    {getTargetDisplay()}
                  </div>
                  <div className="text-base text-gray-500 font-mono">
                    {currentRound === 2 && mode === 'SAFE' && `Your R1: ${formatTime(currentTeam.rounds[1].time)}`}
                    {currentRound === 2 && mode === 'RISKY' && `Your R1: ${formatTime(currentTeam.rounds[1].time)} — Beat by 10s`}
                    {currentRound === 2 && mode === 'ALL_IN' && `Fastest R1: ${formatTime(getFastestRound1())}`}
                    {currentRound === 4 && mode === 'SAFE' && `Your R3: ${formatTime(currentTeam.rounds[3].time)} — Beat by 5s`}
                    {currentRound === 4 && mode === 'CHALLENGE' && rival && (() => {
                      const rivalTeam = teams.find(t => t.id === parseInt(rival));
                      return `${rivalTeam?.name} R3: ${formatTime(rivalTeam?.rounds[3].time)}`;
                    })()}
                    {currentRound === 4 && mode === 'BLOOD_MATCH' && (() => {
                      const fastest = getFastestRound3Team();
                      return `${fastest?.name} R3: ${formatTime(fastest?.rounds[3].time)}`;
                    })()}
                  </div>
                </div>

                {/* Rival Selection */}
                {(mode === 'CHALLENGE' || mode === 'BLOOD_MATCH') && (
                  <div className="bg-dark-900/50 border-l-4 border-primary/30 p-4">
                    <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider">
                      {mode === 'BLOOD_MATCH' ? 'Target Team' : 'Select Rival'}
                    </label>
                    <select
                      value={rival}
                      onChange={(e) => setRival(e.target.value)}
                      className="w-full bg-dark-800 border-l-4 border-dark-700 px-4 py-3 text-gray-100 text-base font-bold focus:outline-none focus:border-primary disabled:opacity-50"
                      disabled={mode === 'BLOOD_MATCH'}
                    >
                      <option value="">Select Rival</option>
                      {teams
                        .filter(t => t.id !== currentTeam.id && t.rounds[3].time !== null)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} — {formatTime(t.rounds[3].time)}
                          </option>
                        ))}
                    </select>
                    {mode === 'BLOOD_MATCH' && (() => {
                      const fastest = getFastestRound3Team();
                      if (fastest) {
                        setTimeout(() => setRival(fastest.id.toString()), 0);
                      }
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Row 3: Timer or Manual Input - FULL WIDTH */}
            <div className="bg-dark-900/50 border-l-4 border-primary/30 p-6 flex-1 flex flex-col relative overflow-hidden min-h-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>

              {/* Toggle between Timer and Manual */}
              <div className="flex gap-2 mb-4 relative z-10 justify-center">
                <button
                  onClick={() => setUseTimer(true)}
                  className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
                    useTimer
                      ? 'bg-primary text-dark-950'
                      : 'bg-dark-800 text-gray-500 border border-dark-700'
                  }`}
                >
                  USE TIMER
                </button>
                <button
                  onClick={() => setUseTimer(false)}
                  className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
                    !useTimer
                      ? 'bg-primary text-dark-950'
                      : 'bg-dark-800 text-gray-500 border border-dark-700'
                  }`}
                >
                  ENTER MANUALLY
                </button>
              </div>

              {useTimer ? (
                // Timer Mode
                <>
                  <div className="flex-1 flex items-center justify-center relative z-10">
                    <div className="text-7xl font-black font-mono text-primary tracking-tight" style={{letterSpacing: '-0.08em'}}>
                      {formatTime(elapsedTime)}
                    </div>
                  </div>

                  <div className="flex gap-3 relative z-10">
                    <button
                      onClick={startTimer}
                      disabled={timerRunning}
                      className="flex-1 px-6 py-4 bg-accent-success text-dark-950 text-lg font-black uppercase tracking-wider hover:bg-green-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      START
                    </button>
                    <button
                      onClick={stopTimer}
                      disabled={!timerRunning}
                      className="flex-1 px-6 py-4 bg-accent-danger text-white text-lg font-black uppercase tracking-wider hover:bg-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      STOP
                    </button>
                  </div>
                </>
              ) : (
                // Manual Entry Mode
                <>
                  <label className="block text-xs font-bold text-gray-600 mb-4 uppercase tracking-wider text-center relative z-10">Enter Time</label>
                  <div className="flex items-center justify-center gap-3 mb-3 relative z-10">
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value.slice(0, 1))}
                  placeholder="0"
                  className="w-24 bg-dark-800 border-l-4 border-dark-700 px-4 py-4 text-5xl font-black font-mono text-primary text-center focus:outline-none focus:border-primary transition-all"
                />
                <span className="text-4xl font-bold text-gray-600">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value.slice(0, 2))}
                  placeholder="00"
                  className="w-32 bg-dark-800 border-l-4 border-dark-700 px-4 py-4 text-5xl font-black font-mono text-primary text-center focus:outline-none focus:border-primary transition-all"
                />
                <span className="text-4xl font-bold text-gray-600">.</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={milliseconds}
                  onChange={(e) => setMilliseconds(e.target.value.slice(0, 2))}
                  placeholder="00"
                  className="w-32 bg-dark-800 border-l-4 border-dark-700 px-4 py-4 text-5xl font-black font-mono text-primary text-center focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="text-center text-sm text-gray-500 uppercase tracking-wider relative z-10">
                MIN : SEC . MILLISEC
              </div>
                </>
              )}
            </div>
          </>
        ) : (
          // Time Trial Rounds (R1/R3) - Single Column
          <div className="flex flex-col gap-3">
            {/* Pilot Selection */}
            <div className="bg-dark-900 border border-dark-800 p-4">
              <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider">Select Pilot</label>
              <div className="flex gap-2">
                {availablePilots.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPilot(p)}
                    className={`flex-1 px-4 py-3 text-sm font-bold uppercase tracking-wide transition-all ${
                      pilot === p
                        ? 'bg-primary text-dark-950'
                        : 'bg-dark-800 text-gray-500 border border-dark-700 hover:border-primary/50 hover:text-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Input */}
            <div className="bg-dark-900 border border-dark-800 p-6 flex-1 flex flex-col justify-center">
              <label className="block text-xs font-bold text-gray-600 mb-4 uppercase tracking-wider text-center">Enter Time</label>
              <div className="flex items-center justify-center gap-3 mb-3">
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value.slice(0, 1))}
                  placeholder="0"
                  className="w-20 bg-dark-800 border border-dark-700 px-4 py-4 text-4xl font-black font-mono text-primary text-center focus:outline-none focus:border-primary transition-all"
                />
                <span className="text-3xl font-bold text-gray-600">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value.slice(0, 2))}
                  placeholder="00"
                  className="w-28 bg-dark-800 border border-dark-700 px-4 py-4 text-4xl font-black font-mono text-primary text-center focus:outline-none focus:border-primary transition-all"
                />
                <span className="text-3xl font-bold text-gray-600">.</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={milliseconds}
                  onChange={(e) => setMilliseconds(e.target.value.slice(0, 2))}
                  placeholder="00"
                  className="w-28 bg-dark-800 border border-dark-700 px-4 py-4 text-4xl font-black font-mono text-primary text-center focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="text-center text-xs text-gray-500 uppercase tracking-wider">
                MIN : SEC . MILLISEC
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-accent-danger/10 border-l-4 border-accent-danger text-accent-danger text-base font-bold">
            {error}
          </div>
        )}
      </div>

      {/* Fixed Submit Button at Bottom - BIG */}
      <div className="border-t-2 border-primary/20 pt-4">
        <button
          onClick={handleSubmit}
          className="w-full px-8 py-5 bg-primary text-dark-950 text-xl font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors"
        >
          {isDeclarationRound ? 'SUBMIT' : 'SUBMIT & NEXT TEAM'}
        </button>
      </div>
    </div>
  );
};

export default LiveAction;
