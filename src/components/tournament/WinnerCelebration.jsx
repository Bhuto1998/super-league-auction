import React, { useEffect, useState } from 'react';
import { useTournament } from '../../context/TournamentContext';

export default function WinnerCelebration({ onBackToAuction, onNewTournament, isCareerMode = false }) {
  const { state } = useTournament();
  const { champion } = state;

  const [confetti, setConfetti] = useState([]);
  const [showTrophy, setShowTrophy] = useState(false);

  useEffect(() => {
    // Generate confetti
    const colors = ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB', '#3CB371'];
    const newConfetti = [];

    for (let i = 0; i < 100; i++) {
      newConfetti.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
      });
    }

    setConfetti(newConfetti);

    // Show trophy with delay
    setTimeout(() => setShowTrophy(true), 500);
  }, []);

  if (!champion) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">No champion yet</p>
      </div>
    );
  }

  // Calculate team stats
  const players = champion.players || [];
  const avgRating = players.length > 0
    ? (players.reduce((sum, p) => sum + (p.rating || 70), 0) / players.length).toFixed(1)
    : 'N/A';

  const topPlayer = players.length > 0
    ? players.reduce((best, p) => (p.rating || 70) > (best.rating || 70) ? p : best, players[0])
    : null;

  return (
    <div className="min-h-screen bg-slate-900 relative flex items-center justify-center overflow-hidden">
      {/* Confetti */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .confetti {
          animation: confetti-fall linear infinite;
        }
        @keyframes trophy-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .trophy-bounce {
          animation: trophy-bounce 1s ease-in-out infinite;
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
          50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8); }
        }
        .glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>

      {confetti.map((c) => (
        <div
          key={c.id}
          className="confetti absolute top-0 pointer-events-none"
          style={{
            left: `${c.left}%`,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            width: c.size,
            height: c.size,
            backgroundColor: c.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}

      {/* Main Content */}
      <div className={`text-center transition-all duration-1000 z-10 px-4 ${showTrophy ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        {/* Trophy */}
        <div className="trophy-bounce text-9xl mb-8">&#127942;</div>

        {/* Champion Name */}
        <div className="glow inline-block bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 rounded-2xl p-1 mb-8">
          <div className="bg-slate-900 rounded-xl px-12 py-6">
            <p className="text-yellow-400 text-lg font-medium mb-2">CHAMPIONS</p>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
              {champion.name}
            </h1>
            <div className="text-6xl">{champion.logoEmoji}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="text-4xl font-bold text-yellow-400">{avgRating}</div>
            <div className="text-slate-400 text-sm">Avg Rating</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="text-4xl font-bold text-green-400">{players.length}</div>
            <div className="text-slate-400 text-sm">Squad Size</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="text-4xl font-bold text-blue-400">&#9917;</div>
            <div className="text-slate-400 text-sm">Super League</div>
          </div>
        </div>

        {/* Star Player */}
        {topPlayer && (
          <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-xl p-6 max-w-md mx-auto border border-yellow-600/30 mb-8">
            <div className="text-sm text-yellow-400 mb-2">Star Player</div>
            <div className="text-2xl font-bold text-white">{topPlayer.name}</div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <span className="text-slate-400">{topPlayer.position}</span>
              <span className="text-yellow-400 font-bold">{topPlayer.rating} OVR</span>
            </div>
          </div>
        )}

        {/* Squad Details */}
        <details className="max-w-2xl mx-auto text-left mb-8">
          <summary className="cursor-pointer text-slate-400 hover:text-white transition-colors text-center">
            View Champion Squad
          </summary>
          <div className="mt-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2"
                >
                  <div>
                    <div className="text-white text-sm font-medium">{player.name}</div>
                    <div className="text-slate-400 text-xs">{player.position}</div>
                  </div>
                  <div className="text-yellow-400 font-bold">{player.rating}</div>
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {isCareerMode ? (
            <button
              onClick={onNewTournament}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold transition-all"
            >
              &#128196; View Season Recap
            </button>
          ) : (
            <>
              <button
                onClick={onNewTournament}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold transition-all"
              >
                &#128260; New Tournament
              </button>
              <button
                onClick={onBackToAuction}
                className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded-xl font-bold transition-all"
              >
                &#127968; Back to Auction
              </button>
            </>
          )}
        </div>

        {/* Celebration Message */}
        <div className="mt-12 text-2xl text-slate-400">
          &#127881; Congratulations to the champions! &#127881;
        </div>
      </div>

      {/* Background Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${champion.color || '#FFD700'}20 0%, transparent 50%)`,
        }}
      />
    </div>
  );
}
