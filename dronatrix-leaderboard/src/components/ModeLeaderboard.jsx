import { motion } from 'framer-motion';
import { ROUND_MODES } from '../data/initialData';

const ModeLeaderboard = ({ teams }) => {
  const getModeLabel = (round, mode) => {
    if (!mode) return '--';
    if (round === 2) return ROUND_MODES.ROUND_2[mode]?.label || mode;
    if (round === 4) return ROUND_MODES.ROUND_4[mode]?.label || mode;
    return mode;
  };

  const getModeColor = (round, mode) => {
    if (!mode) return 'text-gray-600';
    if (round === 2) return ROUND_MODES.ROUND_2[mode]?.color || 'text-gray-400';
    if (round === 4) return ROUND_MODES.ROUND_4[mode]?.color || 'text-gray-400';
    return 'text-gray-400';
  };

  const getSuccessIndicator = (success) => {
    if (success === null) return <div className="w-3 h-3 bg-gray-700 rounded"></div>;
    return success ? (
      <div className="w-3 h-3 bg-accent-success rounded"></div>
    ) : (
      <div className="w-3 h-3 bg-accent-danger rounded"></div>
    );
  };

  return (
    <div className="h-full p-6 flex flex-col gap-4">
      {/* Round 2 Declarations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800 border border-dark-600 flex-1 flex flex-col overflow-hidden"
      >
        <div className="bg-dark-700 border-b border-dark-600 px-6 py-3">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Round 2 — Declarations</h2>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-dark-700">
              <tr className="border-b border-dark-600">
                <th className="text-left py-2 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Team</th>
                <th className="text-left py-2 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Pilot</th>
                <th className="text-left py-2 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Mode</th>
                <th className="text-left py-2 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Condition</th>
                <th className="text-center py-2 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="text-right py-2 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Points</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const mode = team.rounds[2].mode;
                const success = team.rounds[2].success;
                const points = team.rounds[2].points;

                return (
                  <tr key={team.id} className="border-b border-dark-700 hover:bg-dark-700/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-100 uppercase text-xs tracking-wide">{team.name}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{team.rounds[2].pilot || '--'}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold text-xs uppercase ${getModeColor(2, mode)}`}>
                        {getModeLabel(2, mode)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {mode === 'SAFE' && 'Beat R1 time'}
                      {mode === 'RISKY' && 'Beat R1 by 10s'}
                      {mode === 'ALL_IN' && 'Beat fastest R1'}
                      {!mode && '--'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center">
                        {getSuccessIndicator(success)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono font-bold text-sm ${
                        points > 0 ? 'text-accent-success' :
                        points < 0 ? 'text-accent-danger' : 'text-gray-600'
                      }`}>
                        {points !== 0 ? (points > 0 ? `+${points}` : points) : '--'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Round 4 Declarations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-dark-800 border border-dark-600 flex-1 flex flex-col overflow-hidden"
      >
        <div className="bg-dark-700 border-b border-dark-600 px-6 py-3">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Round 4 — Rival Declarations</h2>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-dark-700">
              <tr className="border-b border-dark-600">
                <th className="text-left py-2 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Team</th>
                <th className="text-left py-2 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Pilot</th>
                <th className="text-left py-2 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Mode</th>
                <th className="text-left py-2 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Rival</th>
                <th className="text-left py-2 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Condition</th>
                <th className="text-center py-2 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="text-right py-2 px-4 text-gray-600 font-semibold text-xs uppercase tracking-wider">Points</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const mode = team.rounds[4].mode;
                const rival = team.rounds[4].rival;
                const rivalTeam = teams.find(t => t.id === rival);
                const success = team.rounds[4].success;
                const points = team.rounds[4].points;

                return (
                  <tr key={team.id} className="border-b border-dark-700 hover:bg-dark-700/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-100 uppercase text-xs tracking-wide">{team.name}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{team.rounds[4].pilot || '--'}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold text-xs uppercase ${getModeColor(4, mode)}`}>
                        {getModeLabel(4, mode)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs uppercase">
                      {rivalTeam ? rivalTeam.name : '--'}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {mode === 'SAFE' && 'Beat R3 by 5s'}
                      {mode === 'CHALLENGE' && 'Beat rival R3'}
                      {mode === 'BLOOD_MATCH' && 'Beat R3 #1'}
                      {!mode && '--'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center">
                        {getSuccessIndicator(success)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono font-bold text-sm ${
                        points > 0 ? 'text-accent-success' :
                        points < 0 ? 'text-accent-danger' : 'text-gray-600'
                      }`}>
                        {points !== 0 ? (points > 0 ? `+${points}` : points) : '--'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default ModeLeaderboard;
