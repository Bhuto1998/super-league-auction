import React from 'react';
import { useAuction } from '../context/AuctionContext';

const formatBudget = (amount) => {
  if (amount >= 1000000000) {
    return `€${(amount / 1000000000).toFixed(2)}B`;
  }
  return `€${(amount / 1000000).toFixed(0)}M`;
};

export default function TeamSelector({ onSelectTeam, selectedTeamId }) {
  const { state, getTeamSquadCount } = useAuction();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {state.teams.map((team) => {
        const squadCount = getTeamSquadCount(team.id);
        const isCurrentTurn = state.phase === 'auction' &&
          state.turnOrder[state.currentTurnIndex] === team.id &&
          !state.currentAuction;
        const isSelected = selectedTeamId === team.id;
        const canNominate = isCurrentTurn && squadCount < 15;

        return (
          <div
            key={team.id}
            onClick={() => onSelectTeam?.(team.id)}
            className={`
              relative p-4 rounded-xl cursor-pointer transition-all duration-300
              ${isSelected ? 'ring-2 ring-white scale-105' : ''}
              ${isCurrentTurn ? 'pulse-glow' : ''}
              ${canNominate ? 'bg-gradient-to-br from-green-900 to-green-800' : 'bg-slate-800/80'}
              hover:bg-slate-700/80
            `}
            style={{ borderLeft: `4px solid ${team.color}` }}
          >
            {/* Current turn indicator */}
            {isCurrentTurn && !state.currentAuction && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                TURN
              </div>
            )}

            {/* Big 3 badge */}
            {team.isBigThree && (
              <div className="absolute top-2 right-2 text-xs bg-purple-600 px-1.5 py-0.5 rounded text-white">
                Big 3
              </div>
            )}

            {/* Team info */}
            <div className="text-2xl mb-2">{team.logoEmoji}</div>
            <h3 className="text-white font-bold text-sm">{team.name}</h3>
            <p className="text-slate-400 text-xs mb-3">{team.manager}</p>

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Budget</span>
                <span className={`font-bold text-sm ${
                  team.remainingBudget < 100000000 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {formatBudget(team.remainingBudget)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Squad</span>
                <span className={`font-bold text-sm ${
                  squadCount >= 15 ? 'text-green-400' : 'text-blue-400'
                }`}>
                  {squadCount}/15
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                  style={{ width: `${(squadCount / 15) * 100}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
