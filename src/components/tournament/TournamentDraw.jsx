import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';

const BIG_THREE = ['real-madrid', 'barcelona', 'bayern'];

export default function TournamentDraw() {
  const { state, startDraw, skipDraw } = useTournament();
  const { drawAnimation, groups, teams } = state;
  const [hasStarted, setHasStarted] = useState(false);

  // Defensive check - if teams is not available, show loading
  if (!teams || teams.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">&#9917;</div>
          <p className="text-white text-xl">Loading teams...</p>
          <p className="text-slate-400 text-sm mt-2">If this persists, there may be an issue with the auction data.</p>
        </div>
      </div>
    );
  }

  // Start draw animation when component mounts and user clicks start
  const handleStartDraw = () => {
    setHasStarted(true);
    startDraw();
  };

  const isComplete = drawAnimation.currentStep >= 10;

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">&#127942;</div>
          <h1 className="text-4xl font-bold text-white mb-2">Super League Draw</h1>
          <p className="text-slate-400">10 teams will be divided into 2 groups of 5</p>
        </div>

        {/* Pre-draw view - show all teams */}
        {!hasStarted && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 text-center">
              Participating Teams
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {teams.map(team => (
                <div
                  key={team.id}
                  className={`bg-slate-800 rounded-xl p-4 text-center border-2 ${
                    BIG_THREE.includes(team.id)
                      ? 'border-yellow-500 bg-yellow-900/20'
                      : 'border-slate-700'
                  }`}
                >
                  <span className="text-3xl block mb-2">{team.logoEmoji}</span>
                  <span className={`text-sm font-medium ${
                    BIG_THREE.includes(team.id) ? 'text-yellow-400' : 'text-white'
                  }`}>
                    {team.shortName || team.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleStartDraw}
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
              >
                &#127922; Start Draw
              </button>
              <button
                onClick={skipDraw}
                className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-4 rounded-xl font-medium transition-all"
              >
                Skip Animation
              </button>
            </div>
          </div>
        )}

        {/* Draw animation view */}
        {hasStarted && (
          <>
            {/* Groups display */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Group A */}
              <div className="bg-slate-800 rounded-xl border-2 border-blue-600 overflow-hidden">
                <div className="bg-blue-600 px-4 py-3">
                  <h2 className="text-xl font-bold text-white text-center">Group A</h2>
                </div>
                <div className="p-4 min-h-[300px]">
                  <div className="space-y-3">
                    {groups.A.map((team, idx) => (
                      <TeamSlot
                        key={team.id}
                        team={team}
                        index={idx}
                        isNew={drawAnimation.revealed.slice(-1)[0]?.team?.id === team.id}
                      />
                    ))}
                    {/* Empty slots */}
                    {Array.from({ length: 5 - groups.A.length }).map((_, idx) => (
                      <EmptySlot key={`empty-a-${idx}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Group B */}
              <div className="bg-slate-800 rounded-xl border-2 border-red-600 overflow-hidden">
                <div className="bg-red-600 px-4 py-3">
                  <h2 className="text-xl font-bold text-white text-center">Group B</h2>
                </div>
                <div className="p-4 min-h-[300px]">
                  <div className="space-y-3">
                    {groups.B.map((team, idx) => (
                      <TeamSlot
                        key={team.id}
                        team={team}
                        index={idx}
                        isNew={drawAnimation.revealed.slice(-1)[0]?.team?.id === team.id}
                      />
                    ))}
                    {/* Empty slots */}
                    {Array.from({ length: 5 - groups.B.length }).map((_, idx) => (
                      <EmptySlot key={`empty-b-${idx}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            {!isComplete && (
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 bg-slate-800 px-6 py-3 rounded-full">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400" />
                  <span className="text-white font-medium">
                    Drawing teams... {drawAnimation.currentStep}/10
                  </span>
                </div>
              </div>
            )}

            {/* Skip button during animation */}
            {!isComplete && (
              <div className="text-center">
                <button
                  onClick={skipDraw}
                  className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded-lg font-medium transition-all"
                >
                  Skip Animation
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TeamSlot({ team, index, isNew }) {
  const isBig3 = BIG_THREE.includes(team.id);

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
        isNew ? 'animate-pulse bg-yellow-900/50 scale-105' : 'bg-slate-700/50'
      } ${isBig3 ? 'ring-2 ring-yellow-500' : ''}`}
    >
      <span className="text-lg font-bold text-slate-400 w-6">{index + 1}.</span>
      <span className="text-2xl">{team.logoEmoji}</span>
      <div className="flex-1">
        <span className={`font-semibold ${isBig3 ? 'text-yellow-400' : 'text-white'}`}>
          {team.name}
        </span>
        {isBig3 && (
          <span className="ml-2 text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">
            Featured
          </span>
        )}
      </div>
    </div>
  );
}

function EmptySlot() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/20 border-2 border-dashed border-slate-600">
      <span className="text-lg font-bold text-slate-500 w-6">?</span>
      <div className="w-8 h-8 rounded-full bg-slate-600/50" />
      <div className="flex-1">
        <div className="h-4 w-24 bg-slate-600/50 rounded" />
      </div>
    </div>
  );
}
