import { motion, AnimatePresence } from 'framer-motion';

const ScoreLeaderboard = ({ teams }) => {
  const rankedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="h-full p-6 flex flex-col overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border border-gray-700 flex-1 flex flex-col overflow-hidden shadow-lg rounded-xl"
      >
        <div className="bg-gray-700 border-b border-gray-700 px-6 py-4">
          <h2 className="text-lg font-bold text-primary uppercase tracking-wider">Overall Leaderboard</h2>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-700">
              <tr className="border-b border-gray-700">
                <th className="text-center py-3 px-4 text-primary font-semibold text-xs uppercase tracking-wider w-16">#</th>
                <th className="text-left py-3 px-4 text-primary font-semibold text-xs uppercase tracking-wider">Team</th>
                <th className="text-center py-3 px-4 text-primary font-semibold text-xs uppercase tracking-wider w-24">R1</th>
                <th className="text-center py-3 px-4 text-primary font-semibold text-xs uppercase tracking-wider w-24">R2</th>
                <th className="text-center py-3 px-4 text-primary font-semibold text-xs uppercase tracking-wider w-24">R3</th>
                <th className="text-center py-3 px-4 text-primary font-semibold text-xs uppercase tracking-wider w-24">R4</th>
                <th className="text-center py-3 px-4 text-primary font-semibold text-xs uppercase tracking-wider w-24">Penalty</th>
                <th className="text-right py-3 px-6 text-primary font-semibold text-xs uppercase tracking-wider w-32">Total</th>
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
                    <td className="py-4 px-4 text-center">
                      <motion.span
                        key={`rank-${team.id}-${index}`}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        className={`inline-block text-xl font-bold font-mono ${
                          index === 0 ? 'text-accent-gold' :
                          index === 1 ? 'text-accent-silver' :
                          index === 2 ? 'text-accent-bronze' :
                          'text-gray-500'
                        }`}
                      >
                        {index + 1}
                      </motion.span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-100 uppercase text-sm tracking-wide">{team.name}</td>
                    <td className="py-4 px-4 text-center">
                      <motion.span
                        key={`r1-${team.id}-${team.rounds[1].bonusPoints}`}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        className={`inline-block font-mono font-semibold text-sm ${
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
                        className={`inline-block font-mono font-semibold text-sm ${
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
                        className={`inline-block font-mono font-semibold text-sm ${
                          team.rounds[3].bonusPoints > 0 ? 'text-accent-success' : 'text-gray-600'
                        }`}
                      >
                        {team.rounds[3].bonusPoints ? `+${team.rounds[3].bonusPoints}` : '--'}
                      </motion.span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <motion.span
                        key={`r4-${team.id}-${team.rounds[4].ownPoints}`}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        className={`inline-block font-mono font-semibold text-sm ${
                          team.rounds[4].ownPoints > 0 ? 'text-accent-success' :
                          team.rounds[4].ownPoints < 0 ? 'text-accent-danger' : 'text-gray-600'
                        }`}
                      >
                        {team.rounds[4].ownPoints !== 0 ? (team.rounds[4].ownPoints > 0 ? `+${team.rounds[4].ownPoints}` : team.rounds[4].ownPoints) : '--'}
                      </motion.span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <motion.span
                        key={`penalty-${team.id}-${team.rounds[4].penaltyPoints}`}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        className={`inline-block font-mono font-semibold text-sm ${
                          team.rounds[4].penaltyPoints > 0 ? 'text-accent-success' :
                          team.rounds[4].penaltyPoints < 0 ? 'text-accent-danger' : 'text-gray-600'
                        }`}
                      >
                        {team.rounds[4].penaltyPoints !== 0 ? (team.rounds[4].penaltyPoints > 0 ? `+${team.rounds[4].penaltyPoints}` : team.rounds[4].penaltyPoints) : '--'}
                      </motion.span>
                    </td>
                    <td className="py-4 px-6 text-right">
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
    </div>
  );
};

export default ScoreLeaderboard;
