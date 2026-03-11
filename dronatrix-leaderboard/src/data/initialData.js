export const INITIAL_TEAMS = [
  { id: 1, name: 'SMEKBA', members: ['Ivan Keith Wilfred Mojuli', 'Mikael Rafi\' bin Suro Ahmadi'] },
  { id: 2, name: 'Dona', members: ['Nur Fatihah Najwa binti Mohd. Radzi', 'Fennie anak Brandah'] },
  { id: 3, name: 'Olympus', members: ['Rosalle Jane Jailee', 'Veloria Maidin'] },
  { id: 4, name: 'Aurora', members: ['Veronica Majalap Chong Zi Yuung', 'Nur Ain Umairah binti Abdullah'] },
  { id: 5, name: 'DTI', members: ['Recca Raflesia Rogerius Gregory', 'Faizatul Nurul Iman'] },
  { id: 6, name: 'Double AA', members: ['Mohammad Azmin bin Mohd Lamsing', 'Mohd Nur Aieman bin Matlin'] },
  { id: 7, name: 'Dronify', members: ['Mohamad Aidil Fahmi bin Sahimat', 'Shahfareeze bin Ramlee'] },
  { id: 8, name: 'Cacip C02', members: ['Dorothy Dores Markus', 'Azza Damia binti Khairul Zaman'] },
];

export const ROUND_MODES = {
  ROUND_2: {
    SAFE: { label: 'Safe', successPoints: 10, failPoints: 0, color: 'text-accent-success' },
    RISKY: { label: 'Risky', successPoints: 20, failPoints: -10, color: 'text-accent-warning' },
    ALL_IN: { label: 'All In', successPoints: 30, failPoints: -20, color: 'text-accent-danger' },
  },
  ROUND_4: {
    SAFE: { label: 'Safe', successPoints: 15, failPoints: -10, rivalPenalty: 0, color: 'text-accent-success' },
    CHALLENGE: { label: 'Challenge', successPoints: 30, failPoints: -15, rivalPenalty: -10, color: 'text-accent-warning' },
    BLOOD_MATCH: { label: 'Blood Match', successPoints: 50, failPoints: -30, rivalPenalty: -20, color: 'text-accent-danger' },
  },
};

export const INITIAL_COMPETITION_STATE = {
  currentRound: 1,
  currentTeamIndex: 0,
  teams: INITIAL_TEAMS.map(team => ({
    ...team,
    rounds: {
      1: { pilot: null, time: null, bonusPoints: 0 },
      2: { pilot: null, time: null, mode: null, success: null, points: 0 },
      3: { pilot: null, time: null, bonusPoints: 0 },
      4: { pilot: null, time: null, mode: null, rival: null, success: null, points: 0, ownPoints: 0, penaltyPoints: 0 },
    },
    totalPoints: 0,
  })),
};
