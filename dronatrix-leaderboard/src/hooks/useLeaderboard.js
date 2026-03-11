import { useState, useEffect } from 'react';
import { INITIAL_COMPETITION_STATE } from '../data/initialData';
import { recalculateAllScores } from '../utils/scoring';

const STORAGE_VERSION = '2.0'; // Increment this to force data reset

export const useLeaderboard = () => {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('dronatrix-state');
    const version = localStorage.getItem('dronatrix-version');

    // Force reset if version changed or no version
    if (version !== STORAGE_VERSION || !saved) {
      localStorage.setItem('dronatrix-version', STORAGE_VERSION);
      return INITIAL_COMPETITION_STATE;
    }

    return saved ? JSON.parse(saved) : INITIAL_COMPETITION_STATE;
  });

  useEffect(() => {
    localStorage.setItem('dronatrix-state', JSON.stringify(state));
  }, [state]);

  const updateTeamRound = (teamId, round, data) => {
    setState(prev => {
      const updatedTeams = prev.teams.map(team =>
        team.id === teamId
          ? {
              ...team,
              rounds: {
                ...team.rounds,
                [round]: { ...team.rounds[round], ...data },
              },
            }
          : team
      );

      const recalculated = recalculateAllScores(updatedTeams);

      return {
        ...prev,
        teams: recalculated,
      };
    });
  };

  const setCurrentRound = (round) => {
    setState(prev => ({ ...prev, currentRound: round }));
  };

  const setCurrentTeamIndex = (index) => {
    setState(prev => ({ ...prev, currentTeamIndex: index }));
  };

  const resetCompetition = () => {
    localStorage.removeItem('dronatrix-state');
    localStorage.setItem('dronatrix-version', STORAGE_VERSION);
    setState(INITIAL_COMPETITION_STATE);
  };

  const getCurrentTeam = () => {
    return state.teams[state.currentTeamIndex];
  };

  const getLeaderboardByTime = (round) => {
    return [...state.teams]
      .filter(t => t.rounds[round]?.time !== null)
      .sort((a, b) => (a.rounds[round].time || Infinity) - (b.rounds[round].time || Infinity));
  };

  const getLeaderboardByScore = () => {
    return [...state.teams].sort((a, b) => b.totalPoints - a.totalPoints);
  };

  return {
    state,
    updateTeamRound,
    setCurrentRound,
    setCurrentTeamIndex,
    resetCompetition,
    getCurrentTeam,
    getLeaderboardByTime,
    getLeaderboardByScore,
  };
};
