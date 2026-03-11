import { motion } from 'framer-motion';

const TimeLeaderboard = ({ teams }) => {
  const formatTime = (seconds) => {
    if (seconds === null) return '--:--.--';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  const getRoundTimes = (round) => {
    return [...teams]
      .filter(t => t.rounds[round]?.time !== null)
      .sort((a, b) => (a.rounds[round].time || Infinity) - (b.rounds[round].time || Infinity))
      .map((team, index) => ({
        ...team,
        rank: index + 1,
        time: team.rounds[round].time,
        pilot: team.rounds[round].pilot,
      }));
  };

  const rounds = [
    { id: 1, label: 'ROUND 1 — THE OPENER' },
    { id: 2, label: 'ROUND 2 — THE DECLARATION' },
    { id: 3, label: 'ROUND 3 — PURE TIME' },
    { id: 4, label: 'ROUND 4 — RIVAL DECLARATION' },
  ];

  return (
    <div className="h-full p-6">
      <div className="grid grid-cols-2 gap-4 h-full">
        {rounds.map(round => {
          const rankedTeams = getRoundTimes(round.id);
          const fastestTime = rankedTeams[0]?.time;

          return (
            <motion.div
              key={round.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-800 border border-dark-600 flex flex-col overflow-hidden"
            >
              <div className="bg-dark-700 border-b border-dark-600 px-6 py-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  {round.label}
                </h2>
                {rankedTeams.length > 0 && (
                  <span className="text-xs text-primary font-mono font-bold">
                    FASTEST: {formatTime(fastestTime)}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-auto p-4">
                {rankedTeams.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-600 text-sm uppercase tracking-wider">
                    No times recorded
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rankedTeams.map((team) => (
                      <motion.div
                        key={team.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center justify-between p-3 transition-colors ${
                          team.time === fastestTime
                            ? 'bg-primary/10 border-l-4 border-l-primary'
                            : 'bg-dark-700 border-l-4 border-l-transparent hover:bg-dark-600'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <span className={`font-mono font-bold text-base w-6 text-right ${
                            team.rank === 1 ? 'text-accent-gold' :
                            team.rank === 2 ? 'text-accent-silver' :
                            team.rank === 3 ? 'text-accent-bronze' :
                            'text-gray-500'
                          }`}>
                            {team.rank}
                          </span>
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-gray-100 uppercase tracking-wide">{team.name}</div>
                            {team.pilot && (
                              <div className="text-xs text-gray-500 mt-0.5">{team.pilot}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono text-base font-bold ${
                            team.time === fastestTime ? 'text-primary' : 'text-gray-300'
                          }`}>
                            {formatTime(team.time)}
                          </div>
                          {team.time === fastestTime && (round.id === 1 || round.id === 3) && (
                            <div className="text-[10px] text-accent-gold uppercase tracking-wider mt-0.5">
                              +{round.id === 1 ? '20' : '30'} BONUS
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeLeaderboard;
