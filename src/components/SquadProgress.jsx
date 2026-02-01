import React from 'react';
import { useAuction } from '../context/AuctionContext';
import { POSITION_REQUIREMENTS, getTeamSquadSize, MAX_SQUAD_SIZE } from '../utils/auctionHelpers';

export default function SquadProgress({ teamId }) {
  const { getTeamById } = useAuction();
  const team = getTeamById(teamId);

  if (!team) return null;

  const categories = [
    { key: 'GK', label: 'GK', color: 'bg-amber-500' },
    { key: 'DEF', label: 'DEF', color: 'bg-blue-500' },
    { key: 'MID', label: 'MID', color: 'bg-green-500' },
    { key: 'FWD', label: 'FWD', color: 'bg-red-500' },
  ];

  const squadSize = getTeamSquadSize(team);

  return (
    <div className="bg-slate-700/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-300">Squad Progress</span>
        <span className={`text-sm font-semibold ${
          squadSize >= MAX_SQUAD_SIZE ? 'text-green-400' : 'text-slate-400'
        }`}>
          {squadSize}/{MAX_SQUAD_SIZE}
        </span>
      </div>

      <div className="space-y-2">
        {categories.map(({ key, label, color }) => {
          const required = POSITION_REQUIREMENTS[key];
          const current = team.positionCount[key] || 0;
          const percentage = (current / required) * 100;
          const isFull = current >= required;

          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-8">{label}</span>
              <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} transition-all duration-300`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <span className={`text-xs w-8 text-right ${
                isFull ? 'text-green-400' : 'text-slate-400'
              }`}>
                {current}/{required}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
