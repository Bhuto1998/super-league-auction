import React, { useState } from 'react';
import { useMatch } from '../../context/MatchContext';
import { FORMATIONS } from '../../engine/matchEngine';

/**
 * Match control panel - pause, speed, substitutions
 */
export default function MatchControls({ onBack }) {
  const {
    isActive,
    isPaused,
    speed,
    matchState,
    pauseMatch,
    resumeMatch,
    setSpeed,
    resetMatch,
  } = useMatch();

  const isMatchOver = matchState?.phase === 'full-time';

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Playback controls */}
        <div className="flex items-center gap-2">
          {!isMatchOver && isActive && (
            <button
              onClick={isPaused ? resumeMatch : pauseMatch}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isPaused
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-500 text-white'
              }`}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}

          {isMatchOver && (
            <button
              onClick={resetMatch}
              className="px-4 py-2 rounded-lg font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all"
            >
              🔄 New Match
            </button>
          )}

          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg font-semibold bg-slate-600 hover:bg-slate-500 text-white transition-all"
            >
              ← Back
            </button>
          )}
        </div>

        {/* Speed controls */}
        {!isMatchOver && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Speed:</span>
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                  speed === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        )}

        {/* Match info */}
        <div className="text-slate-400 text-sm">
          {matchState?.phase === 'first-half' && `1st Half - ${matchState.minute}'`}
          {matchState?.phase === 'half-time' && 'Half Time'}
          {matchState?.phase === 'second-half' && `2nd Half - ${matchState.minute}'`}
          {matchState?.phase === 'full-time' && 'Full Time'}
        </div>
      </div>
    </div>
  );
}

/**
 * Substitution panel for making subs
 */
export function SubstitutionPanel({ team = 'home' }) {
  const { matchState, makeSubstitution, isPaused } = useMatch();
  const [selectedOut, setSelectedOut] = useState(null);
  const [selectedIn, setSelectedIn] = useState(null);

  if (!matchState || matchState.phase === 'full-time') return null;

  const isHome = team === 'home';
  const players = isHome ? matchState.homePlayers : matchState.awayPlayers;
  const benchPlayers = isHome ? (matchState.homeBench || []) : (matchState.awayBench || []);
  const subs = isHome ? matchState.homeSubstitutions : matchState.awaySubstitutions;
  const maxSubs = matchState.maxSubstitutions;
  const teamData = isHome ? matchState.homeTeam : matchState.awayTeam;

  // Get players on pitch (not red-carded)
  const onPitch = players.filter(p => !p.redCard);

  const handleSubstitute = () => {
    if (selectedOut && selectedIn) {
      makeSubstitution(team, selectedOut, selectedIn);
      setSelectedOut(null);
      setSelectedIn(null);
    }
  };

  const canSubstitute = subs < maxSubs && selectedOut && selectedIn && isPaused;

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ backgroundColor: teamData?.color + '30' }}
      >
        <h3 className="text-white font-semibold flex items-center gap-2">
          🔄 Substitutions
        </h3>
        <span className="text-slate-300 text-sm">
          {subs}/{maxSubs} used
        </span>
      </div>

      {subs >= maxSubs ? (
        <div className="p-4 text-center text-slate-500">
          No substitutions remaining
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Select player to remove */}
          <div>
            <label className="text-slate-400 text-sm block mb-2">Player Out:</label>
            <select
              value={selectedOut?.id || ''}
              onChange={(e) => {
                const player = onPitch.find(p => p.id === e.target.value);
                setSelectedOut(player);
              }}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Select player...</option>
              {onPitch.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.position}) {p.injured ? '🏥' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Select player to bring on */}
          <div>
            <label className="text-slate-400 text-sm block mb-2">Player In:</label>
            <select
              value={selectedIn?.id || ''}
              onChange={(e) => {
                const player = benchPlayers.find(p => p.id === e.target.value);
                setSelectedIn(player);
              }}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Select substitute...</option>
              {benchPlayers.length === 0 ? (
                <option value="" disabled>No bench players available</option>
              ) : (
                benchPlayers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.position}) - {p.rating}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Make substitution button */}
          <button
            onClick={handleSubstitute}
            disabled={!canSubstitute}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2 rounded-lg font-semibold transition-all"
          >
            Make Substitution
          </button>

          {!isPaused && (
            <p className="text-yellow-500 text-xs text-center">
              Pause the match to make substitutions
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Formation selector
 */
export function FormationSelector({ team = 'home' }) {
  const { matchState, homeFormation, awayFormation, setFormation, isPaused } = useMatch();

  if (!matchState) return null;

  const isHome = team === 'home';
  const currentFormation = isHome ? homeFormation : awayFormation;
  const teamData = isHome ? matchState.homeTeam : matchState.awayTeam;

  const formations = Object.keys(FORMATIONS);

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
      <div
        className="px-4 py-2"
        style={{ backgroundColor: teamData?.color + '30' }}
      >
        <h3 className="text-white font-semibold">Formation</h3>
      </div>

      <div className="p-4">
        <div className="flex gap-2 flex-wrap">
          {formations.map((f) => (
            <button
              key={f}
              onClick={() => setFormation(team, f)}
              disabled={!isPaused}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentFormation === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {!isPaused && (
          <p className="text-yellow-500 text-xs mt-2">
            Pause to change formation
          </p>
        )}
      </div>
    </div>
  );
}
