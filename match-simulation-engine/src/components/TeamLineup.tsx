'use client';

import React from 'react';
import { Team, Player } from '@/lib/types';

interface TeamLineupProps {
  team: Team;
  isHome: boolean;
  onSubstitute?: (playerOutId: string, playerInId: string) => void;
}

const getStaminaColor = (stamina: number): string => {
  if (stamina >= 70) return 'bg-green-500';
  if (stamina >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

const PlayerRow: React.FC<{
  player: Player;
  isBench: boolean;
  teamColor: string;
}> = ({ player, isBench, teamColor }) => {
  return (
    <div
      className={`
        flex items-center gap-2 p-2 rounded-lg transition-all
        ${player.isInjured ? 'opacity-50 bg-red-900/20' : ''}
        ${player.redCard ? 'opacity-30 bg-red-900/30' : ''}
        ${isBench ? 'bg-slate-800/30' : 'bg-slate-800/50'}
      `}
    >
      {/* Position badge */}
      <div
        className="w-8 h-6 rounded text-xs font-bold flex items-center justify-center text-white"
        style={{ backgroundColor: teamColor }}
      >
        {player.position}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{player.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {/* Rating */}
          <span className="text-xs text-yellow-400 font-bold">{player.rating}</span>

          {/* Goals */}
          {player.goals > 0 && (
            <span className="text-xs text-green-400">⚽ {player.goals}</span>
          )}

          {/* Assists */}
          {player.assists > 0 && (
            <span className="text-xs text-blue-400">🅰️ {player.assists}</span>
          )}

          {/* Cards */}
          {player.yellowCards > 0 && (
            <span className="text-xs">🟨 {player.yellowCards}</span>
          )}
          {player.redCard && <span className="text-xs">🟥</span>}

          {/* Injured */}
          {player.isInjured && (
            <span className="text-xs text-red-400">🏥</span>
          )}
        </div>
      </div>

      {/* Stamina bar */}
      {!isBench && !player.redCard && (
        <div className="w-16 flex flex-col items-end">
          <span className="text-xs text-slate-400 mb-0.5">
            {Math.round(player.stamina)}%
          </span>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getStaminaColor(player.stamina)}`}
              style={{ width: `${player.stamina}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default function TeamLineup({ team }: TeamLineupProps) {
  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-slate-700 flex items-center justify-between"
        style={{ backgroundColor: `${team.color}20` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: team.color }}
          >
            {team.shortName.slice(0, 2)}
          </div>
          <div>
            <h3 className="text-white font-bold">{team.name}</h3>
            <p className="text-slate-400 text-xs">{team.formation}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs">Active Players</p>
          <p className="text-white font-bold">
            {team.lineup.filter((p) => !p.redCard && !p.isInjured).length}/11
          </p>
        </div>
      </div>

      {/* Starting XI */}
      <div className="p-3">
        <h4 className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider">
          Starting XI
        </h4>
        <div className="space-y-1">
          {team.lineup.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              isBench={false}
              teamColor={team.color}
            />
          ))}
        </div>
      </div>

      {/* Bench */}
      <div className="p-3 border-t border-slate-700 bg-slate-800/20">
        <h4 className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider">
          Substitutes ({team.maxSubstitutions - team.substitutionsMade} remaining)
        </h4>
        <div className="space-y-1">
          {team.bench.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              isBench={true}
              teamColor={team.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
