import React, { useState, useEffect } from 'react';
import { useCareer } from '../../context/CareerContext';

export default function DraftLottery({ onComplete }) {
  const { state, runDraftLottery } = useCareer();
  const { draftState } = state;

  const [phase, setPhase] = useState('intro'); // intro, rolling, revealing, complete
  const [currentReveal, setCurrentReveal] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const lotteryTeams = draftState?.lotteryTeams || [];
  const lotteryAnimations = draftState?.lotteryAnimations || [];

  // Start the lottery process
  const handleStartLottery = () => {
    setPhase('rolling');
    setIsAnimating(true);

    // Animate for 2 seconds then run actual lottery
    setTimeout(() => {
      runDraftLottery();
      setPhase('revealing');
      setIsAnimating(false);
      setCurrentReveal(0);
    }, 2000);
  };

  // Auto-reveal picks one by one
  useEffect(() => {
    if (phase === 'revealing' && currentReveal < 4) {
      const timer = setTimeout(() => {
        setCurrentReveal(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (phase === 'revealing' && currentReveal >= 4) {
      const timer = setTimeout(() => {
        setPhase('complete');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, currentReveal]);

  // Get team color style
  const getTeamStyle = (team) => ({
    backgroundColor: team.color + '20',
    borderColor: team.color,
  });

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Draft Lottery</h1>
        <p className="text-slate-400">
          Season {state.currentSeason} - Determining picks 1-4
        </p>
      </div>

      {/* Intro Phase */}
      {phase === 'intro' && (
        <div className="max-w-2xl w-full">
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6 text-center">
              Lottery Teams
            </h2>

            <div className="space-y-4 mb-8">
              {lotteryTeams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 rounded-lg border-2"
                  style={getTeamStyle(team)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{team.logoEmoji}</span>
                    <div>
                      <div className="text-white font-semibold">{team.name}</div>
                      <div className="text-slate-400 text-sm">
                        {team.previousPosition === 10 ? 'Last Place' : `${team.previousPosition}th Place`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">
                      {Math.round(team.lotteryOdds * 100)}%
                    </div>
                    <div className="text-slate-400 text-xs">Lottery Odds</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleStartLottery}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-4 rounded-lg font-bold text-lg transition-all"
            >
              Start Lottery
            </button>
          </div>
        </div>
      )}

      {/* Rolling Phase - Animation */}
      {phase === 'rolling' && (
        <div className="text-center">
          <div className="relative w-48 h-48 mx-auto mb-8">
            {/* Spinning lottery balls */}
            <div className="absolute inset-0 animate-spin">
              {lotteryTeams.map((team, index) => (
                <div
                  key={team.id}
                  className="absolute w-16 h-16 rounded-full flex items-center justify-center text-2xl animate-bounce"
                  style={{
                    backgroundColor: team.color,
                    top: `${50 + 40 * Math.sin(index * Math.PI / 2)}%`,
                    left: `${50 + 40 * Math.cos(index * Math.PI / 2)}%`,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${index * 0.2}s`,
                  }}
                >
                  {team.logoEmoji}
                </div>
              ))}
            </div>
          </div>
          <div className="text-2xl text-yellow-400 font-bold animate-pulse">
            Drawing lottery balls...
          </div>
        </div>
      )}

      {/* Revealing Phase */}
      {phase === 'revealing' && (
        <div className="max-w-2xl w-full">
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6 text-center">
              Lottery Results
            </h2>

            <div className="space-y-4">
              {[4, 3, 2, 1].map((pick, index) => {
                const revealIndex = 4 - pick; // 4th pick revealed first
                const isRevealed = currentReveal > revealIndex;
                const animation = lotteryAnimations[pick - 1];

                return (
                  <div
                    key={pick}
                    className={`p-4 rounded-lg border-2 transition-all duration-500 ${
                      isRevealed
                        ? 'opacity-100 transform-none'
                        : 'opacity-30 transform scale-95'
                    }`}
                    style={isRevealed && animation ? {
                      backgroundColor: state.teams.find(t => t.id === animation.teamId)?.color + '20',
                      borderColor: state.teams.find(t => t.id === animation.teamId)?.color,
                    } : {
                      backgroundColor: 'rgb(51 65 85 / 0.5)',
                      borderColor: 'rgb(71 85 105)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-yellow-600 flex items-center justify-center text-xl font-bold text-white">
                          {pick}
                        </div>
                        {isRevealed && animation ? (
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {state.teams.find(t => t.id === animation.teamId)?.logoEmoji}
                            </span>
                            <div>
                              <div className="text-white font-semibold">{animation.teamName}</div>
                              {animation.jumped && (
                                <div className="text-green-400 text-sm">
                                  Jumped up from #{animation.previousPosition}!
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-500 italic">Revealing...</div>
                        )}
                      </div>
                      <div className="text-slate-400 text-sm">
                        Pick #{pick}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Complete Phase */}
      {phase === 'complete' && (
        <div className="max-w-2xl w-full">
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6 text-center">
              Lottery Complete!
            </h2>

            <div className="space-y-3 mb-8">
              {lotteryAnimations.map((animation, index) => {
                const team = state.teams.find(t => t.id === animation.teamId);
                return (
                  <div
                    key={animation.teamId}
                    className="p-4 rounded-lg border-2 flex items-center justify-between"
                    style={getTeamStyle(team)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-yellow-600 flex items-center justify-center text-lg font-bold text-white">
                        {index + 1}
                      </div>
                      <span className="text-2xl">{team?.logoEmoji}</span>
                      <span className="text-white font-semibold">{animation.teamName}</span>
                    </div>
                    {animation.jumped && (
                      <span className="text-green-400 text-sm">
                        From #{animation.previousPosition}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={onComplete}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-lg font-bold text-lg transition-all"
            >
              Proceed to Draft
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
