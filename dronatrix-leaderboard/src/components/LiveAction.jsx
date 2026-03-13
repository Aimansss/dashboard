import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUND_MODES } from '../data/initialData';
import { getAvailablePilots, validateModeDeclaration } from '../utils/scoring';

const LiveAction = ({ state, updateTeamRound, setCurrentTeamIndex, setCurrentRound }) => {
  const { currentRound, currentTeamIndex, teams } = state;
  const currentTeam = teams[currentTeamIndex];

  const [showWelcome, setShowWelcome] = useState(true);
  const [showModeReveal, setShowModeReveal] = useState(true);
  const [showModeExplanation, setShowModeExplanation] = useState(false);
  const [showDeclarationPhase, setShowDeclarationPhase] = useState(false);
  const [showSuccessFail, setShowSuccessFail] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false);
  const [showGrandFinale, setShowGrandFinale] = useState(false);
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
  const [teamDeclarations, setTeamDeclarations] = useState({});

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

  // Show mode explanation first, then declaration phase when entering R2 or R4
  useEffect(() => {
    if (isDeclarationRound && currentTeamIndex === 0) {
      // Check if all teams have declared
      const allDeclared = teams.every(team =>
        team.rounds[currentRound].mode &&
        (team.rounds[currentRound].mode === 'SAFE' || team.rounds[currentRound].rival)
      );

      if (!allDeclared && !showDeclarationPhase) {
        // Show explanation first before declaration ONLY if we haven't started declaring yet
        setShowModeExplanation(true);
        setShowDeclarationPhase(false);
        setShowModeReveal(false);
      } else if (allDeclared) {
        setShowModeExplanation(false);
        setShowDeclarationPhase(false);
        setShowModeReveal(true);
      }
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

  // Auto-fill mode and rival from declaration for R2 and R4
  useEffect(() => {
    if (isDeclarationRound) {
      const teamRound = currentTeam.rounds[currentRound];
      if (teamRound.mode) {
        setMode(teamRound.mode);
      }
      if (teamRound.rival) {
        setRival(teamRound.rival.toString());
      }
    } else {
      setMode('');
      setRival('');
    }
  }, [currentTeam, currentRound, isDeclarationRound]);

  // Check if competition is complete and show grand finale
  useEffect(() => {
    if (currentRound === 4 && currentTeamIndex >= teams.length - 1) {
      const allTeamsComplete = teams.every(team => team.rounds[4].time !== null);
      if (allTeamsComplete) {
        setShowGrandFinale(true);
      }
    }
  }, [currentRound, currentTeamIndex, teams]);

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
        targetDescription = 'Beat R3 by 20s';
        success = finalTime <= r3Time - 20;
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
      // All teams in this round are done
      if (currentRound < 4) {
        setCurrentRound(currentRound + 1);
        setCurrentTeamIndex(0);
      } else {
        // Competition complete! Show grand finale
        setShowGrandFinale(true);
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
      if (mode === 'SAFE') return 'Beat your Round 3 time by 20 seconds';
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
      if (mode === 'SAFE') return `Beat ${formatTime(refTime - 20)} (20s faster than R3)`;
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

  // WELCOME SCREEN - Backdrop for screen sharing
  if (showWelcome && currentRound === 1 && currentTeamIndex === 0) {
    return (
      <div
        className="h-full flex items-center justify-center bg-gray-800 cursor-pointer"
        onClick={() => setShowWelcome(false)}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-center"
        >
          {/* Main Logo/Title */}
          <div className="mb-16">
            <h1 className="text-9xl font-black text-primary uppercase tracking-tight mb-6">
              DRONATRIX
            </h1>
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="h-px w-32 bg-primary/50"></div>
              <span className="text-6xl font-black text-primary">2026</span>
              <div className="h-px w-32 bg-primary/50"></div>
            </div>
            <p className="text-3xl text-gray-400 uppercase tracking-[0.3em] font-bold">Drone Racing Championship</p>
          </div>

          {/* Competition Details */}
          <div className="flex items-center justify-center gap-16 text-gray-300">
            <div className="text-center">
              <div className="text-7xl font-black text-primary mb-3">8</div>
              <div className="text-base uppercase tracking-widest text-gray-400">Teams</div>
            </div>
            <div className="h-20 w-px bg-primary/30"></div>
            <div className="text-center">
              <div className="text-7xl font-black text-primary mb-3">4</div>
              <div className="text-base uppercase tracking-widest text-gray-400">Rounds</div>
            </div>
            <div className="h-20 w-px bg-primary/30"></div>
            <div className="text-center">
              <div className="text-7xl font-black text-accent-gold mb-3">3</div>
              <div className="text-base uppercase tracking-widest text-gray-400">Winners</div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // GRAND FINALE SCREEN - Top 3 Winners
  if (showGrandFinale) {
    const rankedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);
    const topThree = rankedTeams.slice(0, 3);

    return (
      <div className="h-full flex items-center justify-center p-8 bg-gray-900 relative overflow-hidden">
        {/* Professional Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-7xl"
        >
          {/* Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-4">
              <div className="h-1 w-20 bg-primary mx-auto mb-6"></div>
            </div>
            <h1 className="text-8xl font-black text-gray-100 uppercase tracking-tight mb-3">
              DRONATRIX 2026
            </h1>
            <p className="text-2xl text-primary uppercase tracking-[0.4em] font-bold">Final Standings</p>
          </motion.div>

          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-8 items-end mb-16">
            {/* 2nd Place */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-accent-silver text-gray-900 font-black text-sm uppercase tracking-wider rounded-lg">
                2nd Place
              </div>
              <div className="bg-gray-800 border-l-4 border-accent-silver p-10 text-center h-[280px] flex flex-col justify-center shadow-xl rounded-xl">
                <div className="text-8xl font-black text-accent-silver mb-4 font-mono">#2</div>
                <div className="text-3xl font-black text-gray-100 uppercase mb-4 tracking-wide">{topThree[1]?.name}</div>
                <div className="text-5xl font-black font-mono text-accent-silver">
                  {topThree[1]?.totalPoints > 0 ? '+' : ''}{topThree[1]?.totalPoints}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-2">Points</div>
              </div>
            </motion.div>

            {/* 1st Place - Tallest */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="relative"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-8 py-2 bg-accent-gold text-gray-900 font-black text-sm uppercase tracking-wider rounded-lg shadow-lg">
                Champion
              </div>
              <div className="bg-gray-800 border-l-4 border-accent-gold p-10 text-center h-[380px] flex flex-col justify-center shadow-2xl shadow-accent-gold/20 rounded-xl">
                <div className="text-9xl font-black text-accent-gold mb-4 font-mono">#1</div>
                <div className="text-4xl font-black text-gray-100 uppercase mb-6 tracking-wide">{topThree[0]?.name}</div>
                <div className="text-6xl font-black font-mono text-accent-gold">
                  {topThree[0]?.totalPoints > 0 ? '+' : ''}{topThree[0]?.totalPoints}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-3">Points</div>
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-accent-bronze text-gray-900 font-black text-sm uppercase tracking-wider rounded-lg">
                3rd Place
              </div>
              <div className="bg-gray-800 border-l-4 border-accent-bronze p-10 text-center h-[240px] flex flex-col justify-center shadow-xl rounded-xl">
                <div className="text-8xl font-black text-accent-bronze mb-4 font-mono">#3</div>
                <div className="text-3xl font-black text-gray-100 uppercase mb-4 tracking-wide">{topThree[2]?.name}</div>
                <div className="text-5xl font-black font-mono text-accent-bronze">
                  {topThree[2]?.totalPoints > 0 ? '+' : ''}{topThree[2]?.totalPoints}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-2">Points</div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center"
          >
            <div className="h-1 w-20 bg-primary mx-auto mb-4"></div>
            <p className="text-lg text-gray-400 uppercase tracking-[0.3em]">Competition Complete</p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // MODE EXPLANATION SCREEN - Show risks and rewards before declaration
  if (showModeExplanation && isDeclarationRound) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-gray-900 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute w-[500px] h-[500px] bg-primary/30 rounded-full blur-3xl top-1/4 left-1/4 animate-pulse"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-6xl"
        >
          {/* Title */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-6xl font-black text-primary uppercase tracking-tight mb-4" style={{textShadow: '0 0 30px rgba(0,255,255,0.5)'}}>
              ROUND {currentRound}
            </h1>
            <p className="text-3xl text-gray-300 uppercase tracking-wider font-bold">Know Your Risk</p>
            <p className="text-lg text-gray-400 uppercase tracking-widest mt-2">Choose Wisely</p>
          </motion.div>

          {/* Mode Cards */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            {Object.entries(roundModes).map(([key, config], index) => (
              <motion.div
                key={key}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                className={`bg-gray-700 border-2 p-8 relative overflow-hidden ${
                  key === 'SAFE' ? 'border-accent-success' :
                  key === 'RISKY' || key === 'CHALLENGE' ? 'border-accent-warning' :
                  'border-accent-danger'
                }`}
              >
                {/* Glow effect */}
                <div className={`absolute inset-0 opacity-5 ${
                  key === 'SAFE' ? 'bg-accent-success' :
                  key === 'RISKY' || key === 'CHALLENGE' ? 'bg-accent-warning' :
                  'bg-accent-danger'
                }`}></div>

                <div className="relative z-10">
                  <h2 className={`text-4xl font-black uppercase tracking-tight mb-4 ${config.color}`}>
                    {config.label}
                  </h2>

                  {/* Points Display */}
                  <div className="mb-6 pb-6 border-b-2 border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-400 uppercase tracking-wider">Success</span>
                      <span className="text-4xl font-black text-accent-success">+{config.successPoints}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-400 uppercase tracking-wider">Failure</span>
                      <span className="text-4xl font-black text-accent-danger">{config.failPoints}</span>
                    </div>
                    {config.rivalPenalty && config.rivalPenalty !== 0 && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                        <span className="text-sm text-accent-warning uppercase tracking-wider font-bold">Rival Gets</span>
                        <span className="text-3xl font-black text-accent-warning">{config.rivalPenalty}</span>
                      </div>
                    )}
                  </div>

                  {/* Challenge/Target */}
                  <div className="text-sm text-gray-400 space-y-2">
                    {currentRound === 2 && (
                      <>
                        {key === 'SAFE' && <p>• Beat your Round 1 time</p>}
                        {key === 'RISKY' && <p>• Beat your Round 1 time by <span className="text-accent-warning font-bold">10 seconds</span></p>}
                        {key === 'ALL_IN' && <p>• Beat the <span className="text-accent-danger font-bold">FASTEST Round 1 time</span></p>}
                      </>
                    )}
                    {currentRound === 4 && (
                      <>
                        {key === 'SAFE' && <p>• Beat your Round 3 time by <span className="text-accent-success font-bold">20 seconds</span></p>}
                        {key === 'CHALLENGE' && (
                          <>
                            <p>• Beat a rival's Round 3 time</p>
                            <p className="text-accent-warning font-bold">• Rival gets {config.rivalPenalty} penalty if you succeed</p>
                          </>
                        )}
                        {key === 'BLOOD_MATCH' && (
                          <>
                            <p>• Beat the <span className="text-accent-danger font-bold">FASTEST Round 3 time</span></p>
                            <p className="text-accent-danger font-bold">• They get {config.rivalPenalty} penalty if you succeed</p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Continue Button */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <button
              onClick={() => {
                setShowModeExplanation(false);
                setShowDeclarationPhase(true);
              }}
              className="px-20 py-5 bg-primary text-white text-2xl font-black uppercase tracking-wider hover:bg-primary-dark transition-all shadow-2xl shadow-primary/30 rounded-lg"
            >
              PROCEED TO DECLARATION →
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Handler for declaration - defined outside to avoid stale closure
  const handleSaveDeclaration = (teamId, declaration) => {
    console.log(`handleSaveDeclaration called: teamId=${teamId}, mode=${declaration.mode}, rival=${declaration.rival}`);

    setTeamDeclarations(prev => ({
      ...prev,
      [teamId]: declaration
    }));

    // Update the team's round data - updateTeamRound expects teamId, not teamIndex!
    const team = teams.find(t => t.id === teamId);
    const rivalValue = declaration.rival !== undefined ? declaration.rival : null;
    console.log(`Updating team ${teamId} with mode=${declaration.mode}, rival=${rivalValue}`);

    updateTeamRound(teamId, currentRound, {
      ...team.rounds[currentRound],
      mode: declaration.mode,
      rival: rivalValue
    });
  };

  // DECLARATION PHASE - All teams declare modes before R2/R4 starts
  if (showDeclarationPhase && isDeclarationRound) {

    const handleFinishDeclarations = () => {
      setShowDeclarationPhase(false);
      setShowModeReveal(true);
    };

    // Check declarations from local state, not from teams prop (which updates async)
    console.log('teamDeclarations:', teamDeclarations);
    const allDeclared = teams.every(team => {
      const declaration = teamDeclarations[team.id];
      console.log(`Checking team ${team.name} (id=${team.id}):`, declaration);

      if (!declaration) {
        console.log(`  -> FALSE: No declaration yet`);
        return false; // No declaration yet
      }

      if (currentRound === 2) {
        // Round 2: Just need a mode selected
        const result = !!declaration.mode;
        console.log(`  -> Round 2 result: ${result} (has mode: ${!!declaration.mode})`);
        return result;
      } else {
        // Round 4: Need mode AND (SAFE or rival selected)
        const hasRival = declaration.rival !== null && declaration.rival !== undefined;
        const result = !!declaration.mode && (declaration.mode === 'SAFE' || hasRival);
        console.log(`  -> Round 4 result: ${result} (mode=${declaration.mode}, isSafe=${declaration.mode === 'SAFE'}, hasRival=${hasRival}, rival=${declaration.rival})`);
        return result;
      }
    });
    console.log(`All declared: ${allDeclared}`);

    return (
      <div className="h-full flex flex-col p-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-center"
        >
          <h1 className="text-3xl font-black text-primary uppercase tracking-tight mb-1">
            ROUND {currentRound} - MODE DECLARATION
          </h1>
          <p className="text-sm text-gray-400 uppercase tracking-wider">All teams must declare their strategy</p>
        </motion.div>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-4 gap-3 h-full">
            {teams.map((team, idx) => {
              const teamDeclaration = team.rounds[currentRound];
              // Never mark as declared - allow changing until "START ROUND" button
              const hasDeclared = false;

              return (
                <motion.div
                  key={`${team.id}-${teamDeclaration.mode}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-gray-700 border-2 p-2.5 flex flex-col rounded-xl ${
                    hasDeclared ? 'border-accent-success' : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-base font-black text-gray-100 uppercase">{team.name}</h3>
                    {hasDeclared && <div className="text-accent-success text-lg">✓</div>}
                  </div>

                  {!hasDeclared ? (
                    <div className="space-y-1.5 flex-1 flex flex-col">
                      <div className="grid grid-cols-1 gap-1.5">
                        {Object.entries(roundModes).map(([key, config]) => (
                          <button
                            key={key}
                            onClick={() => {
                              // Auto-set rival for BLOOD_MATCH, null for CHALLENGE, N/A for SAFE
                              const fastestTeam = getFastestRound3Team();
                              console.log(`Mode button clicked: ${key}, fastestTeam=`, fastestTeam);
                              const rival = (key === 'BLOOD_MATCH' && currentRound === 4)
                                ? fastestTeam?.id || null
                                : null;
                              console.log(`Calculated rival for team ${team.id}, mode ${key}: ${rival}`);
                              handleSaveDeclaration(team.id, { mode: key, rival });
                            }}
                            className={`p-3 text-center border-2 transition-all rounded-lg ${
                              teamDeclaration.mode === key
                                ? 'bg-primary border-primary'
                                : 'bg-gray-800 border-gray-700 hover:border-primary/50'
                            }`}
                          >
                            <div className={`font-black text-base uppercase mb-0.5 ${teamDeclaration.mode === key ? 'text-white' : config.color}`}>
                              {config.label}
                            </div>
                            <div className={`text-xs font-mono ${teamDeclaration.mode === key ? 'text-white' : 'text-gray-400'}`}>
                              {config.successPoints > 0 ? `+${config.successPoints}` : config.successPoints} / {config.failPoints}
                              {config.rivalPenalty && config.rivalPenalty !== 0 && (
                                <span className="text-accent-warning font-bold"> ({config.rivalPenalty} rival)</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>

                      {teamDeclaration.mode && teamDeclaration.mode !== 'SAFE' && currentRound === 4 && (
                        <div className="flex-1 flex flex-col mt-2">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                            {teamDeclaration.mode === 'CHALLENGE' ? 'Select Rival' : 'Target (Auto)'}
                          </label>
                          {teamDeclaration.mode === 'CHALLENGE' ? (
                            <>
                              <select
                                value={teamDeclaration.rival || ''}
                                onChange={(e) => {
                                  // Auto-save rival selection for CHALLENGE mode
                                  const rivalId = e.target.value ? parseInt(e.target.value) : null;
                                  console.log(`Rival dropdown changed for team ${team.id}: ${rivalId}`);
                                  handleSaveDeclaration(team.id, {
                                    mode: teamDeclaration.mode,
                                    rival: rivalId
                                  });
                                }}
                                className="w-full bg-gray-800 border-2 border-gray-700 px-2 py-2 text-sm text-gray-100 focus:border-primary rounded-lg font-bold"
                              >
                                <option value="">-- Choose Rival --</option>
                                {teams.filter(t => t.id !== team.id && t.rounds[3].time).map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            </>
                          ) : (
                            <div className="bg-gray-800 border border-primary/30 px-2 py-2 text-primary text-center text-sm font-bold rounded-lg">
                              {getFastestRound3Team()?.name || 'TBD'}
                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="text-center py-2 flex-1 flex flex-col justify-center">
                      <div className="text-base font-bold text-primary uppercase mb-1">
                        {roundModes[teamDeclaration.mode].label}
                      </div>
                      {teamDeclaration.rival && (
                        <div className="text-xs text-gray-400">
                          vs {teams.find(t => t.id === parseInt(teamDeclaration.rival))?.name}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {allDeclared && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-3"
          >
            <button
              onClick={handleFinishDeclarations}
              className="px-16 py-3 bg-primary text-white text-xl font-black uppercase tracking-wider hover:bg-primary-dark transition-all rounded-lg shadow-lg"
            >
              START ROUND {currentRound} →
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  // SUCCESS/FAIL SCREEN (first screen after submit in declaration rounds)
  if (showSuccessFail && resultData) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-gray-900">
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
                resultData.success ? 'bg-gray-800' : 'bg-gray-800'
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
              className="bg-gray-700 flex flex-col justify-center p-12"
            >
              <div className="space-y-8">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Team</div>
                  <div className="text-4xl font-black text-gray-100 uppercase tracking-tight">{resultData.teamName}</div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Mode</div>
                    <div className="text-xl font-bold text-primary uppercase">{resultData.mode}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Time</div>
                    <div className="text-xl font-bold text-gray-100 font-mono">{formatTime(resultData.actualTime)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Target</div>
                  <div className="text-lg text-gray-400">{resultData.targetDescription}</div>
                  <div className="text-sm text-gray-400 font-mono mt-1">{formatTime(resultData.targetTime)}</div>
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
            className="w-full mt-1 px-8 py-5 bg-primary text-white text-base font-black uppercase tracking-[0.3em] hover:bg-cyan-400 transition-colors"
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
          className="bg-gray-800 border border-gray-700 flex-1 flex flex-col overflow-hidden shadow-lg rounded-xl"
        >
          <div className="bg-gray-700 border-b border-gray-700 px-6 py-3">
            <h2 className="text-base font-bold text-gray-400 uppercase tracking-wider">Current Standings</h2>
          </div>
          <div className="flex-1">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr className="border-b border-gray-700">
                  <th className="text-center py-2.5 px-5 text-primary font-semibold text-sm uppercase tracking-wider">#</th>
                  <th className="text-left py-2.5 px-5 text-primary font-semibold text-sm uppercase tracking-wider">Team</th>
                  <th className="text-center py-2.5 px-3 text-primary font-semibold text-sm uppercase tracking-wider">R1</th>
                  <th className="text-center py-2.5 px-3 text-primary font-semibold text-sm uppercase tracking-wider">R2</th>
                  <th className="text-center py-2.5 px-3 text-primary font-semibold text-sm uppercase tracking-wider">R3</th>
                  <th className="text-center py-2.5 px-3 text-primary font-semibold text-sm uppercase tracking-wider">R4</th>
                  <th className="text-center py-2.5 px-3 text-primary font-semibold text-sm uppercase tracking-wider">Penalty</th>
                  <th className="text-right py-2.5 px-5 text-primary font-semibold text-sm uppercase tracking-wider">Total</th>
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
                      className={`border-b border-gray-700 hover:bg-gray-700/30 transition-colors ${
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
                            'text-gray-400'
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
                            team.rounds[1].bonusPoints > 0 ? 'text-accent-success' : 'text-gray-400'
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
                            team.rounds[2].points < 0 ? 'text-accent-danger' : 'text-gray-400'
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
                            team.rounds[3].bonusPoints > 0 ? 'text-accent-success' : 'text-gray-400'
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
                            team.rounds[4].ownPoints < 0 ? 'text-accent-danger' : 'text-gray-400'
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
                            team.rounds[4].penaltyPoints < 0 ? 'text-accent-danger' : 'text-gray-400'
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
                            team.totalPoints < 0 ? 'text-accent-danger' : 'text-gray-400'
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
            className="px-16 py-4 bg-primary text-white text-xl font-bold uppercase tracking-wider hover:bg-primary-light transition-all rounded-lg"
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
            className="bg-gray-800/50 backdrop-blur-xl border-2 border-primary/30 p-10 mb-8"
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
                  if (key === 'SAFE') description = 'Beat R3 by 20 seconds';
                  if (key === 'CHALLENGE') description = 'Beat rival Round 3';
                  if (key === 'BLOOD_MATCH') description = 'Beat #1 Round 3';
                }

                return (
                  <motion.div
                    key={key}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + 0.1 * index }}
                    className="bg-gray-700 border-2 border-gray-700 p-8 text-center"
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
                      <div className="text-xs text-gray-400 uppercase tracking-wider">SUCCESS</div>
                      <div className="border-t border-gray-700 my-3"></div>
                      <div className="text-accent-danger font-black text-2xl">
                        {config.failPoints}
                      </div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider">FAILURE</div>
                      {config.rivalPenalty && (
                        <>
                          <div className="border-t border-gray-700 my-3"></div>
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
                className="px-16 py-5 bg-primary text-white text-2xl font-black uppercase tracking-wider hover:bg-primary-light transition-all rounded-lg"
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
            className="bg-gray-800 border border-gray-700 flex-1 flex flex-col overflow-hidden mb-6 shadow-lg rounded-xl"
          >
            <div className="bg-gray-700 border-b border-gray-700 px-6 py-4">
              <h2 className="text-base font-bold text-gray-400 uppercase tracking-wider">Current Standings</h2>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-700">
                  <tr className="border-b border-gray-700">
                    <th className="text-center py-3 px-6 text-primary font-semibold text-sm uppercase tracking-wider">#</th>
                    <th className="text-left py-3 px-6 text-primary font-semibold text-sm uppercase tracking-wider">Team</th>
                    <th className="text-center py-3 px-5 text-primary font-semibold text-sm uppercase tracking-wider">R1</th>
                    <th className="text-center py-3 px-5 text-primary font-semibold text-sm uppercase tracking-wider">R2</th>
                    {currentRound === 4 && <th className="text-center py-3 px-5 text-primary font-semibold text-sm uppercase tracking-wider">R3</th>}
                    {currentRound === 4 && <th className="text-center py-3 px-5 text-primary font-semibold text-sm uppercase tracking-wider">R4</th>}
                    <th className="text-right py-3 px-6 text-primary font-semibold text-sm uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedTeams.map((team, index) => (
                    <tr key={team.id} className={`border-b border-gray-700 ${
                      index === 0 ? 'bg-accent-gold/5' :
                      index === 1 ? 'bg-accent-silver/5' :
                      index === 2 ? 'bg-accent-bronze/5' : ''
                    }`}>
                      <td className="py-5 px-6 text-center">
                        <span className={`text-2xl font-bold font-mono ${
                          index === 0 ? 'text-accent-gold' :
                          index === 1 ? 'text-accent-silver' :
                          index === 2 ? 'text-accent-bronze' :
                          'text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-5 px-6 font-bold text-gray-100 uppercase text-base tracking-wide">{team.name}</td>
                      <td className="py-5 px-5 text-center">
                        <span className={`font-mono font-bold text-base ${
                          team.rounds[1].bonusPoints > 0 ? 'text-accent-success' : 'text-gray-400'
                        }`}>
                          {team.rounds[1].bonusPoints ? `+${team.rounds[1].bonusPoints}` : '--'}
                        </span>
                      </td>
                      <td className="py-5 px-5 text-center">
                        <span className={`font-mono font-bold text-base ${
                          team.rounds[2].points > 0 ? 'text-accent-success' :
                          team.rounds[2].points < 0 ? 'text-accent-danger' : 'text-gray-400'
                        }`}>
                          {team.rounds[2].points !== 0 ? (team.rounds[2].points > 0 ? `+${team.rounds[2].points}` : team.rounds[2].points) : '--'}
                        </span>
                      </td>
                      {currentRound === 4 && (
                        <>
                          <td className="py-5 px-5 text-center">
                            <span className={`font-mono font-bold text-base ${
                              team.rounds[3].bonusPoints > 0 ? 'text-accent-success' : 'text-gray-400'
                            }`}>
                              {team.rounds[3].bonusPoints ? `+${team.rounds[3].bonusPoints}` : '--'}
                            </span>
                          </td>
                          <td className="py-5 px-5 text-center">
                            <span className={`font-mono font-bold text-base ${
                              team.rounds[4].points > 0 ? 'text-accent-success' :
                              team.rounds[4].points < 0 ? 'text-accent-danger' : 'text-gray-400'
                            }`}>
                              {team.rounds[4].points !== 0 ? (team.rounds[4].points > 0 ? `+${team.rounds[4].points}` : team.rounds[4].points) : '--'}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="py-5 px-6 text-right">
                        <span className={`font-mono font-bold text-xl ${
                          team.totalPoints > 0 ? 'text-accent-success' :
                          team.totalPoints < 0 ? 'text-accent-danger' : 'text-gray-400'
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
              className="px-16 py-5 bg-primary text-white text-2xl font-black uppercase tracking-wider hover:bg-primary-light transition-all rounded-lg"
            >
              Start Round {currentRound + 1}
            </button>
          ) : (
            <button
              onClick={() => setShowGrandFinale(true)}
              className="px-16 py-5 bg-accent-gold text-gray-900 text-2xl font-black uppercase tracking-wider hover:bg-accent-gold/80 transition-all rounded-lg shadow-2xl"
            >
              VIEW FINAL STANDINGS
            </button>
          )}
        </div>
      </div>
    );
  }

  // MAIN INTERFACE
  return (
    <div className="h-full flex flex-col p-4 bg-gray-900">
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
          <div className="text-sm text-gray-400 font-mono">
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
                <div className="bg-gray-800/50 border-l-4 border-accent-success p-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pilot</div>
                  <div className="text-2xl font-bold text-gray-100">{pilot}</div>
                </div>
              )}

              {/* Mode Display - LOCKED (already declared) */}
              <div className={`bg-gray-800/50 border-l-4 border-accent-success p-4 ${availablePilots.length === 1 ? '' : 'col-span-2'}`}>
                <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Mode (Declared)</div>
                {mode && roundModes[mode] && (
                  <div className="text-2xl font-bold text-gray-100">
                    {roundModes[mode].label}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Challenge + Rival (if mode selected) */}
            {mode && (
              <div className={`grid ${(mode === 'CHALLENGE' || mode === 'BLOOD_MATCH') ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                <div className="bg-gray-800/50 border-l-4 border-accent-success p-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Your Challenge</div>
                  <div className="text-2xl font-bold text-gray-100 mb-3">
                    {getTargetDisplay()}
                  </div>
                  <div className="text-base text-gray-400 font-mono">
                    {currentRound === 2 && mode === 'SAFE' && `Your R1: ${formatTime(currentTeam.rounds[1].time)}`}
                    {currentRound === 2 && mode === 'RISKY' && `Your R1: ${formatTime(currentTeam.rounds[1].time)} — Beat by 10s`}
                    {currentRound === 2 && mode === 'ALL_IN' && `Fastest R1: ${formatTime(getFastestRound1())}`}
                    {currentRound === 4 && mode === 'SAFE' && `Your R3: ${formatTime(currentTeam.rounds[3].time)} — Beat by 20s`}
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

                {/* Rival Display - LOCKED (already declared) */}
                {(mode === 'CHALLENGE' || mode === 'BLOOD_MATCH') && rival && (
                  <div className="bg-gray-800/50 border-l-4 border-accent-success p-4">
                    <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                      {mode === 'BLOOD_MATCH' ? 'Target Team' : 'Rival'} (Declared)
                    </div>
                    <div className="text-2xl font-bold text-gray-100">
                      {teams.find(t => t.id === parseInt(rival))?.name}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Row 3: Timer or Manual Input - FULL WIDTH */}
            <div className="bg-gray-800/50 border-l-4 border-primary/30 p-6 flex-1 flex flex-col relative overflow-hidden min-h-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>

              {/* Toggle between Timer and Manual */}
              <div className="flex gap-2 mb-4 relative z-10 justify-center">
                <button
                  onClick={() => setUseTimer(true)}
                  className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
                    useTimer
                      ? 'bg-primary text-white'
                      : 'bg-gray-700 text-gray-400 border border-gray-700'
                  }`}
                >
                  USE TIMER
                </button>
                <button
                  onClick={() => setUseTimer(false)}
                  className={`px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
                    !useTimer
                      ? 'bg-primary text-white'
                      : 'bg-gray-700 text-gray-400 border border-gray-700'
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
                      className="flex-1 px-6 py-4 bg-accent-success text-white text-lg font-black uppercase tracking-wider hover:bg-green-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                  <label className="block text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider text-center relative z-10">Enter Time</label>
                  <div className="flex items-center justify-center gap-3 mb-3 relative z-10">
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value.slice(0, 2))}
                  placeholder="00"
                  className="w-32 bg-gray-700 border-l-4 border-gray-700 px-4 py-4 text-5xl font-black font-mono text-primary text-center focus:outline-none focus:border-primary transition-all rounded-lg"
                />
                <span className="text-4xl font-bold text-gray-400">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value.slice(0, 2))}
                  placeholder="00"
                  className="w-32 bg-gray-700 border-l-4 border-gray-700 px-4 py-4 text-5xl font-black font-mono text-primary text-center focus:outline-none focus:border-primary transition-all rounded-lg"
                />
                <span className="text-4xl font-bold text-gray-400">.</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={milliseconds}
                  onChange={(e) => setMilliseconds(e.target.value.slice(0, 2))}
                  placeholder="00"
                  className="w-32 bg-gray-700 border-l-4 border-gray-700 px-4 py-4 text-5xl font-black font-mono text-primary text-center focus:outline-none focus:border-primary transition-all rounded-lg"
                />
              </div>
              <div className="text-center text-sm text-gray-400 uppercase tracking-wider relative z-10">
                MIN : SEC . MILLISEC
              </div>
                </>
              )}
            </div>
          </>
        ) : (
          // Time Trial Rounds (R1/R3) - Grid Layout
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Left: Pilot Selection */}
            <div className="bg-gray-800 border border-gray-700 p-6 flex flex-col justify-center shadow-lg rounded-xl">
              <label className="block text-lg font-bold text-gray-400 mb-6 uppercase tracking-wider text-center">Select Pilot</label>
              <div className="flex flex-col gap-3">
                {availablePilots.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPilot(p)}
                    className={`px-8 py-6 text-2xl font-bold uppercase tracking-wide transition-all ${
                      pilot === p
                        ? 'bg-primary text-white'
                        : 'bg-gray-700 text-gray-400 border-2 border-gray-700 hover:border-primary/50 hover:text-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Time Input */}
            <div className="bg-gray-800 border border-gray-700 p-6 flex flex-col justify-center shadow-lg rounded-xl">
              <label className="block text-lg font-bold text-gray-400 mb-6 uppercase tracking-wider text-center">Enter Time</label>
              <div className="flex items-center justify-center gap-4 mb-4">
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value.slice(0, 2))}
                  placeholder="00"
                  className="w-36 bg-gray-700 border-2 border-gray-700 px-4 py-6 text-6xl font-black font-mono text-primary text-center focus:outline-none focus:border-primary transition-all rounded-lg"
                />
                <span className="text-5xl font-bold text-gray-400">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value.slice(0, 2))}
                  placeholder="00"
                  className="w-36 bg-gray-700 border-2 border-gray-700 px-4 py-6 text-6xl font-black font-mono text-primary text-center focus:outline-none focus:border-primary transition-all rounded-lg"
                />
                <span className="text-5xl font-bold text-gray-400">.</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={milliseconds}
                  onChange={(e) => setMilliseconds(e.target.value.slice(0, 2))}
                  placeholder="00"
                  className="w-36 bg-gray-700 border-2 border-gray-700 px-4 py-6 text-6xl font-black font-mono text-primary text-center focus:outline-none focus:border-primary transition-all rounded-lg"
                />
              </div>
              <div className="text-center text-base text-gray-400 uppercase tracking-widest font-bold">
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
          className="w-full px-8 py-5 bg-primary text-white text-xl font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors"
        >
          {isDeclarationRound ? 'SUBMIT' : 'SUBMIT & NEXT TEAM'}
        </button>
      </div>
    </div>
  );
};

export default LiveAction;
