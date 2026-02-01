import React from 'react';
import { useMatch } from '../../context/MatchContext';

/**
 * Carrom-board style visual soccer pitch
 * Shows player positions, ball position, and match action
 */
export default function MatchPitch() {
  const { matchState, homePositions, awayPositions, ballPosition } = useMatch();

  if (!matchState) return null;

  return (
    <div className="relative w-full aspect-[16/10] bg-gradient-to-b from-green-600 to-green-700 rounded-xl overflow-hidden border-4 border-amber-800 shadow-2xl">
      {/* Pitch markings */}
      <PitchMarkings />

      {/* Home team players */}
      {homePositions.map((pos, idx) => (
        <PlayerToken
          key={`home-${idx}`}
          player={pos.player}
          x={pos.x}
          y={pos.y}
          isHome={true}
          teamColor={matchState.homeTeam?.color || '#FFFFFF'}
        />
      ))}

      {/* Away team players */}
      {awayPositions.map((pos, idx) => (
        <PlayerToken
          key={`away-${idx}`}
          player={pos.player}
          x={pos.x}
          y={pos.y}
          isHome={false}
          teamColor={matchState.awayTeam?.color || '#000000'}
        />
      ))}

      {/* Ball */}
      <Ball x={ballPosition.x} y={ballPosition.y} />

      {/* Team labels */}
      <div className="absolute top-2 left-4 text-white font-bold text-sm bg-black/50 px-2 py-1 rounded">
        {matchState.homeTeam?.shortName || 'HOME'}
      </div>
      <div className="absolute top-2 right-4 text-white font-bold text-sm bg-black/50 px-2 py-1 rounded">
        {matchState.awayTeam?.shortName || 'AWAY'}
      </div>
    </div>
  );
}

/**
 * Pitch markings component
 */
function PitchMarkings() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62.5" preserveAspectRatio="none">
      {/* Outer boundary */}
      <rect x="2" y="2" width="96" height="58.5" fill="none" stroke="white" strokeWidth="0.3" />

      {/* Center line */}
      <line x1="50" y1="2" x2="50" y2="60.5" stroke="white" strokeWidth="0.2" />

      {/* Center circle */}
      <circle cx="50" cy="31.25" r="9.15" fill="none" stroke="white" strokeWidth="0.2" />

      {/* Center spot */}
      <circle cx="50" cy="31.25" r="0.5" fill="white" />

      {/* Left penalty area */}
      <rect x="2" y="14" width="16.5" height="34.5" fill="none" stroke="white" strokeWidth="0.2" />

      {/* Left goal area */}
      <rect x="2" y="22" width="5.5" height="18.5" fill="none" stroke="white" strokeWidth="0.2" />

      {/* Left penalty spot */}
      <circle cx="13" cy="31.25" r="0.5" fill="white" />

      {/* Left penalty arc */}
      <path d="M 18.5 24 A 9.15 9.15 0 0 1 18.5 38.5" fill="none" stroke="white" strokeWidth="0.2" />

      {/* Right penalty area */}
      <rect x="81.5" y="14" width="16.5" height="34.5" fill="none" stroke="white" strokeWidth="0.2" />

      {/* Right goal area */}
      <rect x="92.5" y="22" width="5.5" height="18.5" fill="none" stroke="white" strokeWidth="0.2" />

      {/* Right penalty spot */}
      <circle cx="87" cy="31.25" r="0.5" fill="white" />

      {/* Right penalty arc */}
      <path d="M 81.5 24 A 9.15 9.15 0 0 0 81.5 38.5" fill="none" stroke="white" strokeWidth="0.2" />

      {/* Goals */}
      <rect x="0" y="26" width="2" height="10.5" fill="none" stroke="white" strokeWidth="0.3" />
      <rect x="98" y="26" width="2" height="10.5" fill="none" stroke="white" strokeWidth="0.3" />

      {/* Corner arcs */}
      <path d="M 2 4 A 2 2 0 0 0 4 2" fill="none" stroke="white" strokeWidth="0.2" />
      <path d="M 96 2 A 2 2 0 0 0 98 4" fill="none" stroke="white" strokeWidth="0.2" />
      <path d="M 2 58.5 A 2 2 0 0 1 4 60.5" fill="none" stroke="white" strokeWidth="0.2" />
      <path d="M 96 60.5 A 2 2 0 0 1 98 58.5" fill="none" stroke="white" strokeWidth="0.2" />
    </svg>
  );
}

/**
 * Player token - carrom piece style
 */
function PlayerToken({ player, x, y, isHome, teamColor }) {
  if (!player) return null;

  const isInjured = player.injured;
  const hasRedCard = player.redCard;
  const hasYellowCard = player.yellowCards > 0;

  // Don't show red-carded players
  if (hasRedCard) return null;

  // Adjust color for visibility
  const displayColor = teamColor === '#FFFFFF' || teamColor === '#FDE100'
    ? (isHome ? '#E5E5E5' : teamColor)
    : teamColor;

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {/* Outer ring (carrom piece style) */}
      <div
        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-lg
          ${isInjured ? 'opacity-50' : ''}`}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${displayColor}, ${displayColor}99)`,
          border: `3px solid ${isHome ? '#FFD700' : '#333'}`,
          boxShadow: `0 4px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3)`,
        }}
      >
        {/* Jersey number */}
        <span className={`text-xs md:text-sm font-bold ${
          displayColor === '#FFFFFF' || displayColor === '#FDE100' || displayColor === '#E5E5E5'
            ? 'text-black'
            : 'text-white'
        }`}>
          {player.jerseyNumber || (player.name?.charAt(0) || '?')}
        </span>
      </div>

      {/* Card indicator */}
      {hasYellowCard && (
        <div className="absolute -top-1 -right-1 w-3 h-4 bg-yellow-400 rounded-sm shadow" />
      )}

      {/* Injury indicator */}
      {isInjured && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-red-500 text-xs">
          +
        </div>
      )}

      {/* Player name tooltip */}
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <span className="text-[8px] md:text-[10px] text-white bg-black/60 px-1 rounded">
          {player.name?.split(' ').pop() || ''}
        </span>
      </div>
    </div>
  );
}

/**
 * Ball component
 */
function Ball({ x, y }) {
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div
        className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-white shadow-lg"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #fff, #ccc)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        {/* Pentagon pattern suggestion */}
        <div className="w-full h-full rounded-full border border-gray-300" />
      </div>
    </div>
  );
}
