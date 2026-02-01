import React from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import teamsData from '../../data/teams.json';

export default function PlayerList() {
  const { players, localPlayer } = useMultiplayer();

  if (players.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
        <p className="text-slate-400">No players yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {players.map((player) => {
        const team = teamsData.find(t => t.id === player.team_id);
        const isLocal = player.user_id === localPlayer?.user_id;

        return (
          <div
            key={player.id}
            className={`flex items-center justify-between p-4 rounded-lg ${
              isLocal
                ? 'bg-slate-700 border border-slate-600'
                : 'bg-slate-800 border border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Connection Status Dot */}
              <div
                className={`w-2 h-2 rounded-full ${
                  player.is_connected ? 'bg-green-500' : 'bg-slate-500'
                }`}
              />

              {/* Player Info */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">
                    {player.display_name}
                  </span>
                  {isLocal && (
                    <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded">
                      You
                    </span>
                  )}
                  {player.is_host && (
                    <span className="text-xs bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded">
                      Host
                    </span>
                  )}
                </div>
                {team ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="text-sm text-slate-400">{team.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">Choosing team...</span>
                )}
              </div>
            </div>

            {/* Ready Status */}
            <div>
              {player.team_id ? (
                player.is_ready ? (
                  <span className="text-green-400 text-sm font-semibold">Ready</span>
                ) : (
                  <span className="text-yellow-400 text-sm">Not Ready</span>
                )
              ) : (
                <span className="text-slate-500 text-sm">-</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Empty Slots */}
      {Array.from({ length: 3 - players.length }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="flex items-center justify-center p-4 rounded-lg bg-slate-800/30 border border-dashed border-slate-700"
        >
          <span className="text-slate-500 text-sm">Waiting for player...</span>
        </div>
      ))}
    </div>
  );
}
