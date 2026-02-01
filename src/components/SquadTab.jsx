import React from 'react';
import { useAuction } from '../context/AuctionContext';

export default function SquadTab() {
  const { state, formatCurrency } = useAuction();
  const { teams } = state;

  // Separate user teams and AI teams
  const userTeams = teams.filter(t => t.isUserControlled);
  const aiTeams = teams.filter(t => !t.isUserControlled);

  return (
    <div className="space-y-6">
      {/* User Teams */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">Your Teams</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {userTeams.map(team => (
            <TeamSquadCard key={team.id} team={team} formatCurrency={formatCurrency} />
          ))}
        </div>
      </div>

      {/* AI Teams */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">AI Teams</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {aiTeams.map(team => (
            <TeamSquadCardCompact key={team.id} team={team} formatCurrency={formatCurrency} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TeamSquadCard({ team, formatCurrency }) {
  const allPlayers = [
    ...(team.retainedPlayers || []),
    ...(team.auctionedPlayers || []),
  ];

  const totalSpent = (team.budget || 1000000000) - team.remainingBudget;
  const squadSize = allPlayers.length;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3"
        style={{
          backgroundColor: team.color + '20',
          borderBottom: `3px solid ${team.color}`
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{team.logoEmoji}</span>
            <span className="font-bold text-white">{team.name}</span>
          </div>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
            {squadSize}/18
          </span>
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-slate-400">Budget: {formatCurrency(team.remainingBudget)}</span>
          <span className="text-slate-400">Spent: {formatCurrency(totalSpent)}</span>
        </div>
      </div>

      {/* Players */}
      <div className="p-3 max-h-[300px] overflow-y-auto">
        {allPlayers.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-4">No players yet</div>
        ) : (
          <div className="space-y-1">
            {/* Retained Players */}
            {team.retainedPlayers?.map((player, i) => (
              <div
                key={player.id}
                className="flex justify-between items-center text-sm bg-purple-900/30 border border-purple-800/50 rounded px-2 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 text-xs font-bold">R{i + 1}</span>
                  <span className="text-white truncate">{player.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{player.position}</span>
                  <span className="text-purple-300 font-semibold">{player.rating}</span>
                </div>
              </div>
            ))}

            {/* Auctioned Players */}
            {team.auctionedPlayers?.map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center text-sm bg-slate-700/50 rounded px-2 py-1.5"
              >
                <div className="flex items-center gap-2">
                  {player.wasRTM && (
                    <span className="text-yellow-400 text-xs font-bold">RTM</span>
                  )}
                  <span className="text-white truncate">{player.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{player.position}</span>
                  <span className="text-green-400 text-xs">{formatCurrency(player.purchasePrice)}</span>
                  <span className="text-white font-semibold">{player.rating}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamSquadCardCompact({ team, formatCurrency }) {
  const allPlayers = [
    ...(team.retainedPlayers || []),
    ...(team.auctionedPlayers || []),
  ];

  const squadSize = allPlayers.length;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ borderLeft: `4px solid ${team.color}` }}
      >
        <div className="flex items-center gap-2">
          <span>{team.logoEmoji}</span>
          <span className="font-semibold text-white text-sm">{team.shortName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{squadSize}/18</span>
          <span className="text-xs text-green-400">{formatCurrency(team.remainingBudget)}</span>
        </div>
      </div>

      {/* Compact Player List */}
      <div className="p-2 max-h-[150px] overflow-y-auto">
        {allPlayers.length === 0 ? (
          <div className="text-slate-500 text-xs text-center py-2">No players</div>
        ) : (
          <div className="space-y-0.5">
            {allPlayers.slice(0, 8).map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center text-xs px-1"
              >
                <span className="text-slate-300 truncate">{player.name}</span>
                <span className="text-slate-400">{player.rating}</span>
              </div>
            ))}
            {allPlayers.length > 8 && (
              <div className="text-xs text-slate-500 text-center">
                +{allPlayers.length - 8} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
