import React from 'react';
import { useCareer } from '../../context/CareerContext';
import { getPhaseDisplayInfo, getSeasonProgress } from '../../engine/seasonEngine';
import { formatCurrency } from '../../utils/auctionHelpers';

export default function CareerHub({ onContinue, onViewTrophies }) {
  const { state, getTeamTrophies, getTeamBudget } = useCareer();
  const { currentSeason, seasonPhase, teams, trophyCabinet, seasons } = state;

  const phaseInfo = getPhaseDisplayInfo(seasonPhase);
  const progress = getSeasonProgress(seasonPhase, currentSeason);

  // Get Big Three teams
  const bigThree = teams.filter(t => ['real-madrid', 'barcelona', 'bayern'].includes(t.id));

  // Get last season's champion
  const lastSeasonChampion = seasons.length > 0 ? seasons[seasons.length - 1]?.champion : null;

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Super League</h1>
          <div className="flex items-center justify-center gap-4">
            <span className="text-yellow-400 font-semibold">Season {currentSeason}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{phaseInfo.title}</span>
          </div>
        </div>

        {/* Season Progress */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{phaseInfo.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{phaseInfo.title}</h2>
                <p className="text-slate-400 text-sm">{phaseInfo.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">{progress}%</div>
              <div className="text-slate-400 text-sm">Season Progress</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            onClick={onContinue}
            className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-lg font-bold text-lg transition-all"
          >
            Continue Season
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
            <div className="text-3xl font-bold text-yellow-400">{currentSeason}</div>
            <div className="text-slate-400 text-sm">Current Season</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
            <div className="text-3xl font-bold text-green-400">
              {Object.values(trophyCabinet).reduce((sum, t) => sum + (t.leagues || 0), 0)}
            </div>
            <div className="text-slate-400 text-sm">Titles Awarded</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
            <div className="text-3xl font-bold text-blue-400">
              {state.players.length}
            </div>
            <div className="text-slate-400 text-sm">Active Players</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
            <div className="text-3xl font-bold text-purple-400">
              {seasons.reduce((sum, s) => sum + (s.retirements?.length || 0), 0)}
            </div>
            <div className="text-slate-400 text-sm">Retirements</div>
          </div>
        </div>

        {/* Defending Champion */}
        {lastSeasonChampion && (
          <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 border border-yellow-600 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">&#127942;</span>
                <div>
                  <div className="text-yellow-400 text-sm font-semibold">
                    Defending Champion
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {lastSeasonChampion.name}
                  </div>
                </div>
              </div>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2"
                style={{
                  backgroundColor: lastSeasonChampion.color + '30',
                  borderColor: lastSeasonChampion.color,
                }}
              >
                {lastSeasonChampion.logoEmoji}
              </div>
            </div>
          </div>
        )}

        {/* Big Three Status */}
        <h2 className="text-xl font-bold text-white mb-4">Your Teams</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {bigThree.map(team => {
            const trophies = getTeamTrophies(team.id);
            const budget = getTeamBudget(team.id);

            return (
              <div
                key={team.id}
                className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
              >
                <div
                  className="p-4 flex items-center gap-4"
                  style={{
                    backgroundColor: team.color + '20',
                    borderBottom: `2px solid ${team.color}`,
                  }}
                >
                  <span className="text-3xl">{team.logoEmoji}</span>
                  <div>
                    <div className="text-white font-bold">{team.name}</div>
                    <div className="text-slate-400 text-sm">{team.manager}</div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Trophies */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Trophies</span>
                    <div className="flex items-center gap-2">
                      {trophies.leagues > 0 && (
                        <span className="text-yellow-400" title="League Titles">
                          &#127942; {trophies.leagues}
                        </span>
                      )}
                      {trophies.cups > 0 && (
                        <span className="text-blue-400" title="Cup Wins">
                          &#127942; {trophies.cups}
                        </span>
                      )}
                      {trophies.leagues === 0 && trophies.cups === 0 && (
                        <span className="text-slate-500">-</span>
                      )}
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Season Budget</span>
                    <span className="text-green-400 font-semibold">
                      {formatCurrency(budget.totalBudget)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Season History */}
        {seasons.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Season History</h2>
              {onViewTrophies && (
                <button
                  onClick={onViewTrophies}
                  className="text-yellow-400 hover:text-yellow-300 text-sm"
                >
                  View Trophy Cabinet
                </button>
              )}
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="text-left p-3 text-slate-300 text-sm">Season</th>
                    <th className="text-left p-3 text-slate-300 text-sm">Champion</th>
                    <th className="text-left p-3 text-slate-300 text-sm">Golden Boot</th>
                    <th className="text-left p-3 text-slate-300 text-sm">MVP</th>
                  </tr>
                </thead>
                <tbody>
                  {seasons.map((season, index) => (
                    <tr key={index} className="border-t border-slate-700">
                      <td className="p-3 text-white font-semibold">
                        Season {season.season}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span>{season.champion?.logoEmoji}</span>
                          <span className="text-white">{season.champion?.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {season.goldenBoot ? (
                          <div>
                            <div className="text-white">{season.goldenBoot.playerName}</div>
                            <div className="text-yellow-400 text-sm">
                              {season.goldenBoot.goals} goals
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {season.mvp ? (
                          <div>
                            <div className="text-white">{season.mvp.playerName}</div>
                            <div className="text-blue-400 text-sm">
                              {season.mvp.avgRating.toFixed(1)} avg
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
