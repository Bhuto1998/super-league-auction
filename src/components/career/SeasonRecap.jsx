import React, { useState } from 'react';
import { useCareer } from '../../context/CareerContext';
import { formatCurrency } from '../../utils/auctionHelpers';

export default function SeasonRecap({ seasonSummary, onContinue }) {
  const { state } = useCareer();
  const [tab, setTab] = useState('overview'); // overview, stats, retirements, ratings

  console.log('=== SeasonRecap Render ===');
  console.log('seasonSummary:', seasonSummary);
  console.log('state.currentSeason:', state.currentSeason);
  console.log('state.teams:', state.teams);

  const retirements = state.retirements || [];

  // Defensive check
  if (!seasonSummary) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">&#128203;</div>
          <p className="text-white text-xl">Loading Season Report...</p>
          <button
            onClick={onContinue}
            className="mt-4 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg"
          >
            Continue to Off-Season
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Season {seasonSummary?.season || state.currentSeason} Complete
          </h1>
          <p className="text-slate-400">End of Season Report</p>
        </div>

        {/* Champion Banner */}
        {seasonSummary?.champion && (
          <div className="bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 border-2 border-yellow-500 rounded-xl p-8 mb-8 text-center">
            <div className="text-5xl mb-4">&#127942;</div>
            <h2 className="text-3xl font-bold text-yellow-400 mb-2">
              {seasonSummary.champion.name}
            </h2>
            <p className="text-white text-xl">Super League Champions</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['overview', 'stats', 'retirements', 'ratings'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${
                tab === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          {/* Overview Tab */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Awards */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Golden Boot */}
                {seasonSummary?.goldenBoot && (
                  <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">&#9917;</span>
                      <span className="text-yellow-400 font-semibold">Golden Boot</span>
                    </div>
                    <div className="text-white text-lg font-bold">
                      {seasonSummary.goldenBoot.playerName}
                    </div>
                    <div className="text-yellow-400">
                      {seasonSummary.goldenBoot.goals} goals
                    </div>
                  </div>
                )}

                {/* MVP */}
                {seasonSummary?.mvp && (
                  <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">&#11088;</span>
                      <span className="text-blue-400 font-semibold">Season MVP</span>
                    </div>
                    <div className="text-white text-lg font-bold">
                      {seasonSummary.mvp.playerName}
                    </div>
                    <div className="text-blue-400">
                      {seasonSummary.mvp.avgRating.toFixed(2)} avg rating
                    </div>
                  </div>
                )}
              </div>

              {/* Final Standings */}
              {seasonSummary?.finalPositions && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Final Standings</h3>
                  <div className="space-y-2">
                    {Object.entries(seasonSummary.finalPositions)
                      .sort((a, b) => a[1] - b[1])
                      .map(([teamId, position]) => {
                        const team = state.teams.find(t => t.id === teamId);
                        if (!team) return null;
                        return (
                          <div
                            key={teamId}
                            className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/50"
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                              position === 1 ? 'bg-yellow-500 text-black' :
                              position === 2 ? 'bg-slate-400 text-black' :
                              position === 3 ? 'bg-amber-700 text-white' :
                              'bg-slate-600 text-white'
                            }`}>
                              {position}
                            </span>
                            <span className="text-lg">{team.logoEmoji}</span>
                            <span className="text-white">{team.name}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {tab === 'stats' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Season Statistics</h3>
              <div className="space-y-3">
                {Object.entries(state.seasonPlayerStats || {})
                  .sort((a, b) => (b[1].goals + b[1].assists) - (a[1].goals + a[1].assists))
                  .slice(0, 20)
                  .map(([playerId, stats]) => {
                    const player = state.players.find(p => p.id === playerId);
                    if (!player) return null;
                    return (
                      <div
                        key={playerId}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50"
                      >
                        <div>
                          <div className="text-white font-semibold">{player.name}</div>
                          <div className="text-slate-400 text-sm">
                            {player.position} | {stats.appearances} apps
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-yellow-400">{stats.goals} G</span>
                          <span className="text-blue-400">{stats.assists} A</span>
                          <span className="text-green-400">{stats.avgRating?.toFixed(1)}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Retirements Tab */}
          {tab === 'retirements' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Retirements ({retirements.length})
              </h3>
              {retirements.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  No retirements this season
                </div>
              ) : (
                <div className="space-y-3">
                  {retirements.map(({ player, reason }) => (
                    <div
                      key={player.id}
                      className="p-4 rounded-lg bg-slate-700/50 border-l-4 border-red-500"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-semibold">{player.name}</div>
                          <div className="text-slate-400 text-sm">
                            {player.position} | Age {player.age} | {player.nationality}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-300">{player.rating}</div>
                          <div className="text-slate-500 text-xs">Final Rating</div>
                        </div>
                      </div>
                      <div className="mt-2 text-slate-400 text-sm italic">
                        {player.name} {reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rating Changes Tab */}
          {tab === 'ratings' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Rating Changes</h3>
              <p className="text-slate-400 text-sm mb-4">
                Player ratings have been updated based on age and performance.
              </p>

              {/* Show top improvers */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-green-400 font-semibold mb-3">Top Improvers</h4>
                  <div className="space-y-2">
                    {state.players
                      .filter(p => p.previousRating && p.rating > p.previousRating)
                      .sort((a, b) => (b.rating - b.previousRating) - (a.rating - a.previousRating))
                      .slice(0, 5)
                      .map(player => (
                        <div key={player.id} className="flex items-center justify-between p-2 rounded bg-green-900/20">
                          <span className="text-white">{player.name}</span>
                          <span className="text-green-400">
                            {player.previousRating} → {player.rating} (+{player.rating - player.previousRating})
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-red-400 font-semibold mb-3">Biggest Declines</h4>
                  <div className="space-y-2">
                    {state.players
                      .filter(p => p.previousRating && p.rating < p.previousRating)
                      .sort((a, b) => (a.rating - a.previousRating) - (b.rating - b.previousRating))
                      .slice(0, 5)
                      .map(player => (
                        <div key={player.id} className="flex items-center justify-between p-2 rounded bg-red-900/20">
                          <span className="text-white">{player.name}</span>
                          <span className="text-red-400">
                            {player.previousRating} → {player.rating} ({player.rating - player.previousRating})
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <div className="mt-8 text-center">
          <button
            onClick={onContinue}
            className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all"
          >
            Continue to Off-Season
          </button>
        </div>
      </div>
    </div>
  );
}
