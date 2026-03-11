import { ROUND_MODES } from '../data/initialData';

/**
 * Calculate Round 1 fastest bonus
 */
export const calculateRound1Bonus = (teams) => {
  const validTimes = teams
    .filter(t => t.rounds[1].time !== null)
    .map(t => ({ id: t.id, time: t.rounds[1].time }));

  if (validTimes.length === 0) return [];

  const fastest = validTimes.reduce((min, t) => (t.time < min.time ? t : min));
  return [{ teamId: fastest.id, bonusPoints: 20 }];
};

/**
 * Calculate Round 2 points for a team
 */
export const calculateRound2Points = (team, allTeams) => {
  const round1Time = team.rounds[1].time;
  const round2Time = team.rounds[2].time;
  const mode = team.rounds[2].mode;

  if (!round1Time || !round2Time || !mode) return null;

  let success = false;
  const modeConfig = ROUND_MODES.ROUND_2[mode];

  if (mode === 'SAFE') {
    success = round2Time < round1Time;
  } else if (mode === 'RISKY') {
    success = round2Time <= round1Time - 10;
  } else if (mode === 'ALL_IN') {
    const fastestRound1 = Math.min(...allTeams.map(t => t.rounds[1].time || Infinity));
    success = round2Time < fastestRound1;
  }

  return {
    success,
    points: success ? modeConfig.successPoints : modeConfig.failPoints,
  };
};

/**
 * Calculate Round 3 fastest bonus
 */
export const calculateRound3Bonus = (teams) => {
  const validTimes = teams
    .filter(t => t.rounds[3].time !== null)
    .map(t => ({ id: t.id, time: t.rounds[3].time }));

  if (validTimes.length === 0) return [];

  const fastest = validTimes.reduce((min, t) => (t.time < min.time ? t : min));
  return [{ teamId: fastest.id, bonusPoints: 30 }];
};

/**
 * Calculate Round 4 points for a team (and rival penalties)
 */
export const calculateRound4Points = (team, allTeams) => {
  const round3Time = team.rounds[3].time;
  const round4Time = team.rounds[4].time;
  const mode = team.rounds[4].mode;
  const rivalId = team.rounds[4].rival;

  if (!round3Time || !round4Time || !mode) return null;

  let success = false;
  const modeConfig = ROUND_MODES.ROUND_4[mode];
  let rivalPenalty = 0;

  if (mode === 'SAFE') {
    success = round4Time <= round3Time - 5;
  } else if (mode === 'CHALLENGE' && rivalId) {
    const rival = allTeams.find(t => t.id === rivalId);
    const rivalTime = rival?.rounds[3].time;
    if (rivalTime) {
      success = round4Time < rivalTime;
      if (success) rivalPenalty = modeConfig.rivalPenalty;
    }
  } else if (mode === 'BLOOD_MATCH' && rivalId) {
    const rival = allTeams.find(t => t.id === rivalId);
    const rivalTime = rival?.rounds[3].time;
    if (rivalTime) {
      success = round4Time < rivalTime;
      if (success) rivalPenalty = modeConfig.rivalPenalty;
    }
  }

  return {
    success,
    points: success ? modeConfig.successPoints : modeConfig.failPoints,
    rivalPenalty,
    rivalId: success && rivalId ? rivalId : null,
  };
};

/**
 * Recalculate all team scores
 */
export const recalculateAllScores = (teams) => {
  const updatedTeams = [...teams];

  // Round 1 bonuses
  const round1Bonuses = calculateRound1Bonus(updatedTeams);
  updatedTeams.forEach(team => {
    const bonus = round1Bonuses.find(b => b.teamId === team.id);
    team.rounds[1].bonusPoints = bonus ? bonus.bonusPoints : 0;
  });

  // Round 2 points
  updatedTeams.forEach(team => {
    const result = calculateRound2Points(team, updatedTeams);
    if (result) {
      team.rounds[2].success = result.success;
      team.rounds[2].points = result.points;
    }
  });

  // Round 3 bonuses
  const round3Bonuses = calculateRound3Bonus(updatedTeams);
  updatedTeams.forEach(team => {
    const bonus = round3Bonuses.find(b => b.teamId === team.id);
    team.rounds[3].bonusPoints = bonus ? bonus.bonusPoints : 0;
  });

  // Reset all Round 4 penalty tracking first
  updatedTeams.forEach(team => {
    team.rounds[4].ownPoints = 0;
    team.rounds[4].penaltyPoints = 0;
  });

  // Round 4 points and rival penalties
  let round4RivalPenalties = [];
  updatedTeams.forEach(team => {
    const result = calculateRound4Points(team, updatedTeams);
    if (result) {
      team.rounds[4].success = result.success;
      team.rounds[4].ownPoints = result.points;
      team.rounds[4].points = result.points; // Keep for backward compatibility
      if (result.rivalId) {
        round4RivalPenalties.push({
          rivalId: result.rivalId,
          penalty: result.rivalPenalty,
          fromTeamId: team.id,
        });
      }
    }
  });

  // Apply rival penalties separately
  round4RivalPenalties.forEach(({ rivalId, penalty, fromTeamId }) => {
    const rival = updatedTeams.find(t => t.id === rivalId);
    if (rival) {
      // Add to penalty points (penalties are negative)
      rival.rounds[4].penaltyPoints += penalty;
    }
  });

  // Calculate Round 4 total points (own + penalties)
  updatedTeams.forEach(team => {
    team.rounds[4].points = (team.rounds[4].ownPoints || 0) + (team.rounds[4].penaltyPoints || 0);
  });

  // Calculate totals
  updatedTeams.forEach(team => {
    team.totalPoints =
      (team.rounds[1].bonusPoints || 0) +
      (team.rounds[2].points || 0) +
      (team.rounds[3].bonusPoints || 0) +
      (team.rounds[4].points || 0);
  });

  return updatedTeams;
};

/**
 * Get available pilots for a round
 */
export const getAvailablePilots = (team, round) => {
  const { members } = team;
  if (round === 1 || round === 3) {
    return members;
  }

  if (round === 2) {
    const round1Pilot = team.rounds[1].pilot;
    return members.filter(m => m !== round1Pilot);
  }

  if (round === 4) {
    const round3Pilot = team.rounds[3].pilot;
    return members.filter(m => m !== round3Pilot);
  }

  return members;
};

/**
 * Validate mode declaration
 */
export const validateModeDeclaration = (team, mode, round, allTeams) => {
  if (round === 2) {
    if (mode === 'ALL_IN') {
      const round1Bonuses = calculateRound1Bonus(allTeams);
      const isFastest = round1Bonuses.some(b => b.teamId === team.id);
      if (isFastest) {
        return { valid: false, error: 'Round 1 fastest team cannot declare All In' };
      }
    }
  }

  if (round === 4) {
    if (mode === 'BLOOD_MATCH') {
      const round3Bonuses = calculateRound3Bonus(allTeams);
      const isFastest = round3Bonuses.some(b => b.teamId === team.id);
      if (isFastest) {
        return { valid: false, error: 'Round 3 fastest team cannot declare Blood Match' };
      }
    }
  }

  return { valid: true };
};
