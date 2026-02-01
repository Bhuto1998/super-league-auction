'use client';

import React from 'react';
import { MatchState } from '@/lib/types';

interface ScoreboardProps {
  state: MatchState;
}

export default function Scoreboard({ state }: ScoreboardProps) {
  const formatMinute = (minute: number) => {
    if (minute <= 45) return `${minute}'`;
    if (minute <= 90) return `${minute}'`;
    return `90+${minute - 90}'`;
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-4 shadow-xl border border-slate-700">
      <div className="flex items-center justify-between">
        {/* Home Team */}
        <div className="flex items-center gap-4 flex-1">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: state.homeTeam.color }}
          >
            {state.homeTeam.shortName.slice(0, 2)}
          </div>
          <div className="text-left">
            <h3 className="text-white font-bold text-lg">{state.homeTeam.name}</h3>
            <p className="text-slate-400 text-sm">{state.homeTeam.manager}</p>
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center px-8">
          <div className="flex items-center gap-4">
            <span className="text-5xl font-bold text-white tabular-nums">
              {state.homeScore}
            </span>
            <span className="text-2xl text-slate-500">-</span>
            <span className="text-5xl font-bold text-white tabular-nums">
              {state.awayScore}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div
              className={`px-4 py-1 rounded-full text-sm font-bold ${
                state.isFullTime
                  ? 'bg-red-600 text-white'
                  : state.isHalfTime
                  ? 'bg-yellow-600 text-black'
                  : 'bg-green-600 text-white animate-pulse'
              }`}
            >
              {state.isFullTime
                ? 'FT'
                : state.isHalfTime
                ? 'HT'
                : formatMinute(state.currentMinute)}
            </div>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="text-right">
            <h3 className="text-white font-bold text-lg">{state.awayTeam.name}</h3>
            <p className="text-slate-400 text-sm">{state.awayTeam.manager}</p>
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: state.awayTeam.color }}
          >
            {state.awayTeam.shortName.slice(0, 2)}
          </div>
        </div>
      </div>

      {/* Match Stats */}
      <div className="mt-4 grid grid-cols-5 gap-2 text-center text-sm">
        <div className="text-slate-400">
          <span className="text-white font-bold">{state.possession.home.toFixed(0)}%</span>
          <p className="text-xs">Possession</p>
        </div>
        <div className="text-slate-400">
          <span className="text-white font-bold">{state.shots.home}</span>
          <p className="text-xs">Shots</p>
        </div>
        <div className="text-slate-400 border-x border-slate-700 px-2">
          <span className="text-yellow-400 font-bold">{state.corners.home}</span>
          <span className="mx-2 text-slate-600">|</span>
          <span className="text-yellow-400 font-bold">{state.corners.away}</span>
          <p className="text-xs">Corners</p>
        </div>
        <div className="text-slate-400">
          <span className="text-white font-bold">{state.shots.away}</span>
          <p className="text-xs">Shots</p>
        </div>
        <div className="text-slate-400">
          <span className="text-white font-bold">{state.possession.away.toFixed(0)}%</span>
          <p className="text-xs">Possession</p>
        </div>
      </div>

      {/* Shots on Target & Fouls */}
      <div className="mt-2 grid grid-cols-5 gap-2 text-center text-sm">
        <div className="text-slate-400">
          <span className="text-green-400 font-bold">{state.shotsOnTarget.home}</span>
          <p className="text-xs">On Target</p>
        </div>
        <div className="text-slate-400">
          <span className="text-orange-400 font-bold">{state.fouls.home}</span>
          <p className="text-xs">Fouls</p>
        </div>
        <div className="text-slate-400">
          <p className="text-xs text-slate-600">Stats</p>
        </div>
        <div className="text-slate-400">
          <span className="text-orange-400 font-bold">{state.fouls.away}</span>
          <p className="text-xs">Fouls</p>
        </div>
        <div className="text-slate-400">
          <span className="text-green-400 font-bold">{state.shotsOnTarget.away}</span>
          <p className="text-xs">On Target</p>
        </div>
      </div>
    </div>
  );
}
