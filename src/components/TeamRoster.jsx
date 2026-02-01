import React, { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import PlayerCard from './PlayerCard';

const formatPrice = (price) => {
  if (price >= 1000000000) {
    return `€${(price / 1000000000).toFixed(2)}B`;
  }
  return `€${(price / 1000000).toFixed(0)}M`;
};

export default function TeamRoster({ teamId }) {
  const { getTeamById } = useAuction();
  const [isExpanded, setIsExpanded] = useState(true);

  const team = getTeamById(teamId);
  if (!team) return null;

  const retainedPlayers = team.retainedPlayers || [];
  const auctionedPlayers = team.auctionedPlayers || [];
  const retentionSpent = retainedPlayers.reduce((sum, p) => sum + (p.retentionPrice || p.season2Price || 0), 0);
  const auctionSpent = auctionedPlayers.reduce((sum, p) => sum + (p.purchasePrice || 0), 0);
  const totalSpent = retentionSpent + auctionSpent;

  return (
    <div
      className="bg-slate-900/50 rounded-xl overflow-hidden"
      style={{ borderTop: `4px solid ${team.color}` }}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{team.logoEmoji}</span>
          <div>
            <h3 className="text-lg font-bold text-white">{team.name}</h3>
            <p className="text-sm text-slate-400">{team.manager}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">
            Squad: <span className="text-blue-400 font-bold">
              {retainedPlayers.length + auctionedPlayers.length}/15
            </span>
          </p>
          <p className="text-sm text-slate-400">
            Spent: <span className="text-yellow-400 font-bold">{formatPrice(totalSpent)}</span>
          </p>
        </div>
      </div>

      {/* Roster */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Retained Players */}
          {retainedPlayers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                <span>Retained Players</span>
                <span className="bg-purple-600/30 px-2 py-0.5 rounded text-xs">
                  {retainedPlayers.length}
                </span>
              </h4>
              <div className="space-y-1">
                {retainedPlayers.map(player => (
                  <PlayerCard key={player.id} player={player} compact showRetentionPrice />
                ))}
              </div>
            </div>
          )}

          {/* Auctioned Players */}
          {auctionedPlayers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                <span>Auctioned Players</span>
                <span className="bg-green-600/30 px-2 py-0.5 rounded text-xs">
                  {auctionedPlayers.length}
                </span>
              </h4>
              <div className="space-y-1">
                {auctionedPlayers.map(player => (
                  <PlayerCard key={player.id} player={player} compact showPurchasePrice />
                ))}
              </div>
            </div>
          )}

          {retainedPlayers.length === 0 && auctionedPlayers.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No players yet</p>
          )}
        </div>
      )}
    </div>
  );
}
