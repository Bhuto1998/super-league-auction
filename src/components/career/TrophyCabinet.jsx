import React from 'react';
import { useCareer } from '../../context/CareerContext';

export default function TrophyCabinet({ onBack }) {
  const { state, getTeamTrophies } = useCareer();
  const { teams, seasons, trophyCabinet } = state;

  // Sort teams by total trophies
  const sortedTeams = [...teams].sort((a, b) => {
    const aTrophies = getTeamTrophies(a.id);
    const bTrophies = getTeamTrophies(b.id);
    const aTotal = aTrophies.leagues + aTrophies.cups + aTrophies.superCups;
    const bTotal = bTrophies.leagues + bTrophies.cups + bTrophies.superCups;
    return bTotal - aTotal;
  });

  // Calculate total trophies
  const totalLeagues = Object.values(trophyCabinet).reduce((sum, t) => sum + (t.leagues || 0), 0);
  const totalCups = Object.values(trophyCabinet).reduce((sum, t) => sum + (t.cups || 0), 0);

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white flex items-center gap-2"
          >
            <span>&#8592;</span> Back
          </button>
          <h1 className="text-3xl font-bold text-white">Trophy Cabinet</h1>
          <div className="w-20" /> {/* Spacer for alignment */}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border border-yellow-600 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">&#127942;</div>
            <div className="text-4xl font-bold text-yellow-400">{totalLeagues}</div>
            <div className="text-slate-300">League Titles</div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-600 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">&#127941;</div>
            <div className="text-4xl font-bold text-blue-400">{totalCups}</div>
            <div className="text-slate-300">Cup Wins</div>
          </div>
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-600 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">&#128197;</div>
            <div className="text-4xl font-bold text-purple-400">{seasons.length}</div>
            <div className="text-slate-300">Seasons Played</div>
          </div>
        </div>

        {/* Team Trophy Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-8">
          <div className="p-4 bg-slate-700 border-b border-slate-600">
            <h2 className="text-lg font-bold text-white">Trophies by Team</h2>
          </div>
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left p-3 text-slate-300 text-sm">Rank</th>
                <th className="text-left p-3 text-slate-300 text-sm">Team</th>
                <th className="text-center p-3 text-slate-300 text-sm">&#127942; Leagues</th>
                <th className="text-center p-3 text-slate-300 text-sm">&#127941; Cups</th>
                <th className="text-center p-3 text-slate-300 text-sm">Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team, index) => {
                const trophies = getTeamTrophies(team.id);
                const total = trophies.leagues + trophies.cups + trophies.superCups;

                return (
                  <tr
                    key={team.id}
                    className={`border-t border-slate-700 ${
                      total > 0 ? 'bg-yellow-900/10' : ''
                    }`}
                  >
                    <td className="p-3">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-sm font-bold ${
                        index === 0 && total > 0 ? 'bg-yellow-500 text-black' :
                        index === 1 && total > 0 ? 'bg-slate-400 text-black' :
                        index === 2 && total > 0 ? 'bg-amber-700 text-white' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{team.logoEmoji}</span>
                        <span className="text-white font-semibold">{team.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {trophies.leagues > 0 ? (
                        <span className="text-yellow-400 font-bold">{trophies.leagues}</span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {trophies.cups > 0 ? (
                        <span className="text-blue-400 font-bold">{trophies.cups}</span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {total > 0 ? (
                        <span className="text-white font-bold text-lg">{total}</span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Season Winners Timeline */}
        {seasons.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 bg-slate-700 border-b border-slate-600">
              <h2 className="text-lg font-bold text-white">Champions Timeline</h2>
            </div>
            <div className="p-4">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-yellow-600" />

                {/* Season entries */}
                <div className="space-y-6">
                  {[...seasons].reverse().map((season, index) => (
                    <div key={season.season} className="flex items-start gap-4">
                      {/* Timeline dot */}
                      <div className="w-16 flex-shrink-0 flex justify-center">
                        <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-slate-800 z-10" />
                      </div>

                      {/* Season card */}
                      <div
                        className="flex-1 p-4 rounded-lg border"
                        style={{
                          backgroundColor: season.champion?.color + '15',
                          borderColor: season.champion?.color,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{season.champion?.logoEmoji}</span>
                            <div>
                              <div className="text-white font-bold">{season.champion?.name}</div>
                              <div className="text-slate-400 text-sm">Season {season.season} Champion</div>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            {season.goldenBoot && (
                              <div className="text-yellow-400">
                                &#9917; {season.goldenBoot.playerName} ({season.goldenBoot.goals} goals)
                              </div>
                            )}
                            {season.mvp && (
                              <div className="text-blue-400">
                                &#11088; {season.mvp.playerName} (MVP)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No seasons yet */}
        {seasons.length === 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <div className="text-4xl mb-4">&#127942;</div>
            <h3 className="text-xl font-bold text-white mb-2">No Champions Yet</h3>
            <p className="text-slate-400">
              Complete your first season to see champions appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
