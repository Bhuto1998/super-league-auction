'use client';

import React from 'react';
import { MatchState, Player, Team } from '@/lib/types';

interface MatchBoardProps {
  state: MatchState;
}

// Position coordinates on the pitch (percentage based)
const getPositionCoordinates = (
  position: string,
  index: number,
  isHome: boolean
): { x: number; y: number } => {
  // Flip x for away team
  const flipX = (x: number) => (isHome ? x : 100 - x);

  // Base positions for 4-3-3 formation
  const positions: Record<string, { x: number; y: number }[]> = {
    GK: [{ x: 8, y: 50 }],
    CB: [
      { x: 22, y: 35 },
      { x: 22, y: 65 },
    ],
    LB: [{ x: 22, y: 85 }],
    RB: [{ x: 22, y: 15 }],
    CDM: [{ x: 38, y: 50 }],
    CM: [
      { x: 42, y: 30 },
      { x: 42, y: 70 },
    ],
    CAM: [{ x: 55, y: 50 }],
    LW: [{ x: 70, y: 80 }],
    RW: [{ x: 70, y: 20 }],
    ST: [{ x: 78, y: 50 }],
    CF: [{ x: 75, y: 50 }],
  };

  const posArray = positions[position] || [{ x: 50, y: 50 }];
  const pos = posArray[index % posArray.length];

  return { x: flipX(pos.x), y: pos.y };
};

// Player marker component
const PlayerMarker: React.FC<{
  player: Player;
  position: { x: number; y: number };
  team: Team;
  isHome: boolean;
  hasBall: boolean;
}> = ({ player, position, team, isHome, hasBall }) => {
  const isInjured = player.isInjured;
  const hasRedCard = player.redCard;
  const hasYellowCard = player.yellowCards > 0;
  const lowStamina = player.stamina < 40;

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
    >
      {/* Player circle */}
      <div
        className={`
          relative w-10 h-10 rounded-full flex items-center justify-center
          text-white text-xs font-bold shadow-lg
          ${hasBall ? 'ring-4 ring-yellow-400 ring-opacity-75 animate-pulse' : ''}
          ${isInjured ? 'opacity-40' : ''}
          ${hasRedCard ? 'opacity-30' : ''}
        `}
        style={{
          backgroundColor: isHome ? team.color : team.color,
          border: `3px solid ${isHome ? '#ffffff' : '#000000'}`,
        }}
      >
        {/* Player initials */}
        <span className="text-[10px]">
          {player.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)}
        </span>

        {/* Rating badge */}
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900
                        flex items-center justify-center text-[8px] font-bold text-yellow-400 border border-yellow-500"
        >
          {player.rating}
        </div>

        {/* Status indicators */}
        {hasYellowCard && (
          <div className="absolute -top-1 -left-1 w-3 h-4 bg-yellow-400 rounded-sm" />
        )}
        {hasRedCard && (
          <div className="absolute -top-1 -left-1 w-3 h-4 bg-red-600 rounded-sm" />
        )}
        {isInjured && (
          <div className="absolute -top-1 -right-1 text-red-500 text-sm">+</div>
        )}
        {lowStamina && !isInjured && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500"
              style={{ width: `${player.stamina}%` }}
            />
          </div>
        )}
      </div>

      {/* Player name tooltip on hover */}
      <div
        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1
                      px-2 py-0.5 bg-black/80 text-white text-[9px] rounded whitespace-nowrap
                      opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
      >
        {player.name}
        {player.goals > 0 && <span className="ml-1 text-green-400">({player.goals})</span>}
      </div>
    </div>
  );
};

// Ball component
const Ball: React.FC<{ position: { x: number; y: number } }> = ({ position }) => (
  <div
    className="absolute w-4 h-4 rounded-full bg-white shadow-lg transform -translate-x-1/2 -translate-y-1/2
               transition-all duration-300 z-20"
    style={{
      left: `${position.x}%`,
      top: `${position.y}%`,
      background: 'radial-gradient(circle at 30% 30%, #ffffff, #cccccc)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    }}
  >
    {/* Pentagon pattern */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-2 h-2 border border-gray-400 rounded-sm transform rotate-45" />
    </div>
  </div>
);

export default function MatchBoard({ state }: MatchBoardProps) {
  const positionCounts = { home: {} as Record<string, number>, away: {} as Record<string, number> };

  // Show half-time overlay based on state.isHalfTime flag (set at min 45, cleared at min 46)
  const showHalfTime = state.isHalfTime && !state.isFullTime;

  return (
    <div className="relative w-full aspect-[16/10] bg-gradient-to-b from-green-700 via-green-600 to-green-700 rounded-xl overflow-hidden shadow-2xl border-4 border-amber-900">
      {/* Carrom board style border decorations */}
      <div className="absolute inset-0 border-8 border-amber-800 rounded-lg pointer-events-none" />
      <div className="absolute top-2 left-2 right-2 bottom-2 border-2 border-amber-600/30 rounded pointer-events-none" />

      {/* Corner pockets (carrom style) */}
      {[
        { top: 0, left: 0 },
        { top: 0, right: 0 },
        { bottom: 0, left: 0 },
        { bottom: 0, right: 0 },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-8 h-8 bg-amber-950 rounded-full"
          style={{ ...pos, transform: 'translate(-50%, -50%)' } as React.CSSProperties}
        />
      ))}

      {/* Pitch markings */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Outer boundary */}
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
          opacity="0.8"
        />

        {/* Center line */}
        <line x1="50" y1="5" x2="50" y2="95" stroke="white" strokeWidth="0.3" opacity="0.8" />

        {/* Center circle */}
        <circle cx="50" cy="50" r="12" fill="none" stroke="white" strokeWidth="0.3" opacity="0.8" />
        <circle cx="50" cy="50" r="0.5" fill="white" opacity="0.8" />

        {/* Left penalty area */}
        <rect
          x="5"
          y="25"
          width="15"
          height="50"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
          opacity="0.8"
        />
        {/* Left goal area */}
        <rect
          x="5"
          y="35"
          width="6"
          height="30"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
          opacity="0.8"
        />
        {/* Left penalty spot */}
        <circle cx="15" cy="50" r="0.5" fill="white" opacity="0.8" />
        {/* Left penalty arc */}
        <path
          d="M 20 38 A 12 12 0 0 1 20 62"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
          opacity="0.8"
        />

        {/* Right penalty area */}
        <rect
          x="80"
          y="25"
          width="15"
          height="50"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
          opacity="0.8"
        />
        {/* Right goal area */}
        <rect
          x="89"
          y="35"
          width="6"
          height="30"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
          opacity="0.8"
        />
        {/* Right penalty spot */}
        <circle cx="85" cy="50" r="0.5" fill="white" opacity="0.8" />
        {/* Right penalty arc */}
        <path
          d="M 80 38 A 12 12 0 0 0 80 62"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
          opacity="0.8"
        />

        {/* Goals */}
        <rect x="2" y="42" width="3" height="16" fill="none" stroke="white" strokeWidth="0.5" />
        <rect x="95" y="42" width="3" height="16" fill="none" stroke="white" strokeWidth="0.5" />

        {/* Corner arcs */}
        <path d="M 5 8 A 3 3 0 0 1 8 5" fill="none" stroke="white" strokeWidth="0.3" opacity="0.8" />
        <path d="M 92 5 A 3 3 0 0 1 95 8" fill="none" stroke="white" strokeWidth="0.3" opacity="0.8" />
        <path d="M 5 92 A 3 3 0 0 0 8 95" fill="none" stroke="white" strokeWidth="0.3" opacity="0.8" />
        <path d="M 92 95 A 3 3 0 0 0 95 92" fill="none" stroke="white" strokeWidth="0.3" opacity="0.8" />

        {/* Grass pattern */}
        {[...Array(10)].map((_, i) => (
          <rect
            key={i}
            x={5 + i * 9}
            y="5"
            width="9"
            height="90"
            fill={i % 2 === 0 ? 'rgba(0,100,0,0.1)' : 'transparent'}
          />
        ))}
      </svg>

      {/* Players */}
      {state.homeTeam.lineup
        .filter((p) => !p.redCard)
        .map((player) => {
          const posCount = positionCounts.home[player.position] || 0;
          positionCounts.home[player.position] = posCount + 1;
          const pos = getPositionCoordinates(
            player.position,
            posCount,
            true
          );
          const hasBall =
            state.playerWithBall?.team === 'home' &&
            state.playerWithBall?.player.id === player.id;
          return (
            <PlayerMarker
              key={player.id}
              player={player}
              position={pos}
              team={state.homeTeam}
              isHome={true}
              hasBall={hasBall}
            />
          );
        })}

      {state.awayTeam.lineup
        .filter((p) => !p.redCard)
        .map((player) => {
          const posCount = positionCounts.away[player.position] || 0;
          positionCounts.away[player.position] = posCount + 1;
          const pos = getPositionCoordinates(
            player.position,
            posCount,
            false
          );
          const hasBall =
            state.playerWithBall?.team === 'away' &&
            state.playerWithBall?.player.id === player.id;
          return (
            <PlayerMarker
              key={player.id}
              player={player}
              position={pos}
              team={state.awayTeam}
              isHome={false}
              hasBall={hasBall}
            />
          );
        })}

      {/* Ball */}
      <Ball position={state.ballPosition} />

      {/* Team names on sides */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
        <span
          className="text-white/80 font-bold text-sm tracking-widest"
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
        >
          {state.homeTeam.shortName}
        </span>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 origin-center">
        <span
          className="text-white/80 font-bold text-sm tracking-widest"
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
        >
          {state.awayTeam.shortName}
        </span>
      </div>

      {/* Half time overlay - auto-hides after 2 seconds */}
      {showHalfTime && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
          <div className="bg-slate-900/90 px-8 py-6 rounded-xl border border-slate-700 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Half Time</h2>
            <div className="flex items-center justify-center gap-6 text-4xl font-bold">
              <span style={{ color: state.homeTeam.color }}>{state.homeTeam.shortName}</span>
              <span className="text-white">
                {state.homeScore} - {state.awayScore}
              </span>
              <span style={{ color: state.awayTeam.color }}>{state.awayTeam.shortName}</span>
            </div>
          </div>
        </div>
      )}

      {/* Full time overlay - stays visible */}
      {state.isFullTime && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
          <div className="bg-slate-900/90 px-8 py-6 rounded-xl border border-slate-700 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Full Time</h2>
            <div className="flex items-center justify-center gap-6 text-4xl font-bold">
              <span style={{ color: state.homeTeam.color }}>{state.homeTeam.shortName}</span>
              <span className="text-white">
                {state.homeScore} - {state.awayScore}
              </span>
              <span style={{ color: state.awayTeam.color }}>{state.awayTeam.shortName}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
