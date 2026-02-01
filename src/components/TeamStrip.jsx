import React from 'react';
import { useAuction } from '../context/AuctionContext';
import { getTeamSquadSize, MAX_SQUAD_SIZE } from '../utils/auctionHelpers';

export default function TeamStrip() {
  const { state, formatCurrency } = useAuction();
  const { teams, currentAuction, passedTeams } = state;

  return (
    <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
      <div className="flex flex-wrap gap-2 justify-center">
        {teams.map((team) => {
          const squadSize = getTeamSquadSize(team);
          const isHighestBidder = currentAuction?.highestBidder === team.id;
          const hasPassed = passedTeams.includes(team.id);
          const isFull = squadSize >= MAX_SQUAD_SIZE;

          let statusColor = 'border-slate-600';
          let bgColor = 'bg-slate-700';

          if (isHighestBidder) {
            statusColor = 'border-green-500';
            bgColor = 'bg-green-900/30';
          } else if (hasPassed) {
            statusColor = 'border-red-500/50';
            bgColor = 'bg-red-900/20';
          } else if (isFull) {
            statusColor = 'border-slate-500';
            bgColor = 'bg-slate-800';
          }

          return (
            <div
              key={team.id}
              className={`${bgColor} border-2 ${statusColor} rounded-lg px-3 py-2 min-w-[120px] transition-all ${
                team.isUserControlled ? 'ring-1 ring-purple-500/50' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: team.color }}
                />
                <span className="font-semibold text-sm text-white truncate">
                  {team.shortName}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className={`${team.remainingBudget < 100000000 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatCurrency(team.remainingBudget)}
                </span>
                <span className={`${isFull ? 'text-green-400' : 'text-slate-400'}`}>
                  {squadSize}/{MAX_SQUAD_SIZE}
                </span>
              </div>
              {/* Status indicators */}
              <div className="mt-1 flex gap-1">
                {isHighestBidder && (
                  <span className="text-[10px] bg-green-600 px-1 rounded">Leading</span>
                )}
                {hasPassed && (
                  <span className="text-[10px] bg-red-600/50 px-1 rounded">Passed</span>
                )}
                {team.isUserControlled && (
                  <span className="text-[10px] bg-purple-600/50 px-1 rounded">You</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
