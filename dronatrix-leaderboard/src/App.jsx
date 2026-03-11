import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLeaderboard } from './hooks/useLeaderboard';
import TimeLeaderboard from './components/TimeLeaderboard';
import ScoreLeaderboard from './components/ScoreLeaderboard';
import ModeLeaderboard from './components/ModeLeaderboard';
import LiveAction from './components/LiveAction';

function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const leaderboard = useLeaderboard();

  const tabs = [
    { id: 'live', label: 'LIVE ACTION' },
    { id: 'time', label: 'TIME' },
    { id: 'score', label: 'SCORE' },
    { id: 'mode', label: 'MODE' },
  ];

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-dark-950 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute w-96 h-96 bg-primary/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-accent-purple/20 rounded-full blur-3xl top-1/2 right-0 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute w-96 h-96 bg-primary/20 rounded-full blur-3xl bottom-0 left-1/3 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header */}
      <header className="bg-dark-900/90 backdrop-blur-lg border-b-2 border-primary/30 relative z-10">
        <div className="h-full px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <div className="relative">
                <h1 className="text-4xl font-black text-primary tracking-tight">
                  DRONATRIX
                </h1>
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"></div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-primary">2026</span>
                <div className="h-8 w-px bg-primary/30"></div>
                <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                  8 TEAMS • 4 ROUNDS • TOP 3 WIN
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={toggleFullscreen}
                className="px-5 py-2.5 bg-dark-800 border border-primary/40 text-primary hover:bg-primary/10 hover:border-primary text-xs font-black uppercase tracking-widest transition-all"
              >
                {isFullscreen ? '[ EXIT ]' : '[ FULLSCREEN ]'}
              </button>
              <button
                onClick={() => {
                  if (confirm('Reset entire competition? This cannot be undone.')) {
                    leaderboard.resetCompetition();
                  }
                }}
                className="px-5 py-2.5 bg-dark-800 border border-accent-danger/40 text-accent-danger hover:bg-accent-danger/10 hover:border-accent-danger text-xs font-black uppercase tracking-widest transition-all"
              >
                RESET
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-8 py-3 text-xs font-black tracking-widest transition-all overflow-hidden group ${
                  activeTab === tab.id
                    ? 'text-dark-950 bg-primary'
                    : 'text-gray-400 bg-dark-800/50 border border-dark-700 hover:text-primary hover:border-primary/50'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative z-10">
        <div className="h-full">
          <div style={{ display: activeTab === 'live' ? 'block' : 'none' }} className="h-full">
            <LiveAction
              state={leaderboard.state}
              updateTeamRound={leaderboard.updateTeamRound}
              setCurrentTeamIndex={leaderboard.setCurrentTeamIndex}
              setCurrentRound={leaderboard.setCurrentRound}
            />
          </div>
          {activeTab === 'time' && <TimeLeaderboard teams={leaderboard.state.teams} />}
          {activeTab === 'score' && <ScoreLeaderboard teams={leaderboard.state.teams} />}
          {activeTab === 'mode' && <ModeLeaderboard teams={leaderboard.state.teams} />}
        </div>
      </main>
    </div>
  );
}

export default App;
