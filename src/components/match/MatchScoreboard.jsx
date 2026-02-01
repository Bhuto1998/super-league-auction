import React from 'react';
import { useMatch } from '../../context/MatchContext';

/**
 * Match scoreboard showing score, time, and key stats
 */
export default function MatchScoreboard() {
  const { matchState } = useMatch();

  if (!matchState) return null;

  const { homeTeam, awayTeam, homeScore, awayScore, minute, phase } = matchState;

  const getPhaseDisplay = () => {
    switch (phase) {
      case 'pre-match': return 'PRE-MATCH';
      case 'first-half': return '1ST HALF';
      case 'half-time': return 'HALF TIME';
      case 'second-half': return '2ND HALF';
      case 'full-time': return 'FULL TIME';
      default: return '';
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden shadow-xl">
      {/* Main scoreboard */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Home team */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: homeTeam?.color + '40', border: `2px solid ${homeTeam?.color}` }}
          >
            {homeTeam?.logoEmoji || '?'}
          </div>
          <div>
            <div className="text-white font-bold text-lg">{homeTeam?.name || 'Home'}</div>
            <div className="text-slate-400 text-sm">{homeTeam?.shortName || 'HOM'}</div>
          </div>
        </div>

        {/* Score and time */}
        <div className="text-center">
          <div className="flex items-center gap-4">
            <span className="text-5xl font-bold text-white">{homeScore}</span>
            <span className="text-3xl text-slate-500">-</span>
            <span className="text-5xl font-bold text-white">{awayScore}</span>
          </div>
          <div className="mt-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              phase === 'full-time' ? 'bg-green-900 text-green-300' :
              phase === 'half-time' ? 'bg-yellow-900 text-yellow-300' :
              'bg-red-900 text-red-300'
            }`}>
              {getPhaseDisplay()}
            </span>
            {(phase === 'first-half' || phase === 'second-half') && (
              <span className="ml-2 text-white text-lg font-mono">{minute}'</span>
            )}
          </div>
        </div>

        {/* Away team */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-white font-bold text-lg">{awayTeam?.name || 'Away'}</div>
            <div className="text-slate-400 text-sm">{awayTeam?.shortName || 'AWY'}</div>
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: awayTeam?.color + '40', border: `2px solid ${awayTeam?.color}` }}
          >
            {awayTeam?.logoEmoji || '?'}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-slate-800/50 px-6 py-3 border-t border-slate-700">
        <div className="grid grid-cols-5 gap-4 text-center text-sm">
          <StatItem
            label="Possession"
            home={`${Math.round(matchState.possession.home)}%`}
            away={`${Math.round(matchState.possession.away)}%`}
          />
          <StatItem
            label="Shots"
            home={matchState.shots.home}
            away={matchState.shots.away}
          />
          <StatItem
            label="On Target"
            home={matchState.shotsOnTarget.home}
            away={matchState.shotsOnTarget.away}
          />
          <StatItem
            label="Fouls"
            home={matchState.fouls.home}
            away={matchState.fouls.away}
          />
          <StatItem
            label="Subs"
            home={`${matchState.homeSubstitutions}/${matchState.maxSubstitutions}`}
            away={`${matchState.awaySubstitutions}/${matchState.maxSubstitutions}`}
          />
        </div>
      </div>

      {/* Team strength (shows attack/defense impact, especially after red cards) */}
      <TeamStrengthBar matchState={matchState} />

      {/* Goal scorers */}
      <GoalScorers matchState={matchState} />
    </div>
  );
}

function StatItem({ label, home, away }) {
  return (
    <div>
      <div className="text-slate-400 text-xs mb-1">{label}</div>
      <div className="flex justify-center items-center gap-2">
        <span className="text-white font-semibold">{home}</span>
        <span className="text-slate-600">|</span>
        <span className="text-white font-semibold">{away}</span>
      </div>
    </div>
  );
}

function TeamStrengthBar({ matchState }) {
  const { homeStrength, awayStrength, dominance } = matchState;

  if (!homeStrength || !awayStrength) return null;

  const homePlayersOnPitch = homeStrength.playersOnPitch || 11;
  const awayPlayersOnPitch = awayStrength.playersOnPitch || 11;
  const hasRedCard = homePlayersOnPitch < 11 || awayPlayersOnPitch < 11;

  // Dominance indicator
  const getDominanceLabel = () => {
    if (!dominance || dominance.level === 'normal') return null;
    const team = dominance.dominant === 'home' ? matchState.homeTeam?.shortName : matchState.awayTeam?.shortName;
    switch (dominance.level) {
      case 'overwhelming': return `${team} DOMINANT`;
      case 'strong': return `${team} Control`;
      case 'dominant': return `${team} Edge`;
      default: return null;
    }
  };

  const dominanceLabel = getDominanceLabel();

  return (
    <div className={`px-6 py-2 border-t border-slate-700 ${hasRedCard ? 'bg-red-900/20' : 'bg-slate-800/30'}`}>
      {/* Dominance indicator */}
      {dominanceLabel && (
        <div className={`text-center text-xs font-bold mb-2 ${
          dominance.level === 'overwhelming' ? 'text-yellow-400' :
          dominance.level === 'strong' ? 'text-orange-400' : 'text-slate-400'
        }`}>
          {dominanceLabel} (+{dominance.diff?.toFixed(0)} rating)
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 text-xs">
        {/* Home team */}
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${homePlayersOnPitch < 11 ? 'text-red-400' : 'text-slate-300'}`}>
              {homePlayersOnPitch} players
            </span>
            {homePlayersOnPitch < 11 && <span className="text-red-500">-{11 - homePlayersOnPitch}</span>}
          </div>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className="text-green-400">ATK:{homeStrength.attack?.toFixed(0) || '-'}</span>
            <span className="text-yellow-400">MID:{homeStrength.midfield?.toFixed(0) || '-'}</span>
            <span className="text-blue-400">DEF:{homeStrength.defense?.toFixed(0) || '-'}</span>
          </div>
        </div>

        {/* Label */}
        <div className="text-center text-slate-500">
          {hasRedCard ? 'REDUCED STRENGTH' : 'Team Strength'}
        </div>

        {/* Away team */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            {awayPlayersOnPitch < 11 && <span className="text-red-500">-{11 - awayPlayersOnPitch}</span>}
            <span className={`font-semibold ${awayPlayersOnPitch < 11 ? 'text-red-400' : 'text-slate-300'}`}>
              {awayPlayersOnPitch} players
            </span>
          </div>
          <div className="flex gap-2 mt-1 justify-end flex-wrap">
            <span className="text-green-400">ATK:{awayStrength.attack?.toFixed(0) || '-'}</span>
            <span className="text-yellow-400">MID:{awayStrength.midfield?.toFixed(0) || '-'}</span>
            <span className="text-blue-400">DEF:{awayStrength.defense?.toFixed(0) || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalScorers({ matchState }) {
  const homeGoals = matchState.events.filter(e => e.goal && e.team === 'home');
  const awayGoals = matchState.events.filter(e => e.goal && e.team === 'away');

  if (homeGoals.length === 0 && awayGoals.length === 0) return null;

  return (
    <div className="bg-slate-800/30 px-6 py-2 border-t border-slate-700">
      <div className="flex justify-between text-xs">
        <div className="space-x-2">
          {homeGoals.map((g, i) => (
            <span key={i} className="text-green-400">
              {g.player?.name?.split(' ').pop()} {g.minute}'
            </span>
          ))}
        </div>
        <div className="space-x-2 text-right">
          {awayGoals.map((g, i) => (
            <span key={i} className="text-green-400">
              {g.player?.name?.split(' ').pop()} {g.minute}'
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
