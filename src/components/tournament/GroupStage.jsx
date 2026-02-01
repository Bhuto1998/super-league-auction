import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';

const BIG_THREE = ['real-madrid', 'barcelona', 'bayern'];

export default function GroupStage() {
  const {
    state,
    simulateMatchDay,
    advanceMatchDay,
    skipToKnockout,
    startKnockoutStage,
    isMatchDayComplete,
    getPendingBigThreeCount,
  } = useTournament();

  const {
    phase,
    matchDay,
    totalMatchDays,
    matchDayFixtures,
    groupResults,
    standings,
    groups,
    matchQueue,
    currentMatch,
  } = state;

  const [showStandings, setShowStandings] = useState(true);
  const dayComplete = isMatchDayComplete();
  const pendingBigThree = getPendingBigThreeCount();

  // Check if this is the final results view (after skip to knockout)
  const isGroupsComplete = phase === 'groups_complete';

  // Check if CURRENT match day has been simulated (not just any previous day)
  const currentDayHasResults = matchDayFixtures.some(fixture => {
    // Check if this fixture has a result in groupResults
    const inA = groupResults.A.some(r =>
      r.homeTeam === fixture.home.id && r.awayTeam === fixture.away.id
    );
    const inB = groupResults.B.some(r =>
      r.homeTeam === fixture.home.id && r.awayTeam === fixture.away.id
    );
    return inA || inB;
  });
  const hasSimulated = currentDayHasResults || matchQueue.length > 0 || currentMatch;

  // Show final results view when groups are complete
  if (isGroupsComplete) {
    return (
      <div className="min-h-screen bg-slate-900 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">&#127942;</div>
            <h1 className="text-3xl font-bold text-white mb-2">Group Stage Complete!</h1>
            <p className="text-slate-400">Final Standings - Top 4 from each group qualify</p>
          </div>

          {/* Final Standings Tables */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <StandingsTable
              name="Group A - Final"
              teams={groups.A}
              standings={standings.A}
              results={groupResults.A}
              color="blue"
              showQualified={true}
            />
            <StandingsTable
              name="Group B - Final"
              teams={groups.B}
              standings={standings.B}
              results={groupResults.B}
              color="red"
              showQualified={true}
            />
          </div>

          {/* Qualified Teams Summary */}
          <div className="bg-slate-800 rounded-xl border border-green-600 p-6 mb-8">
            <h3 className="text-xl font-bold text-green-400 mb-4 text-center">Qualified for Knockout Stage</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...standings.A.slice(0, 4), ...standings.B.slice(0, 4)].map((row) => (
                <div key={row.team.id} className="flex items-center gap-2 bg-slate-700/50 p-3 rounded-lg">
                  <span className="text-2xl">{row.team.logoEmoji}</span>
                  <div>
                    <div className={`font-medium text-sm ${BIG_THREE.includes(row.team.id) ? 'text-yellow-400' : 'text-white'}`}>
                      {row.team.shortName || row.team.name}
                    </div>
                    <div className="text-xs text-slate-400">{row.points} pts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Start Knockout Button */}
          <div className="text-center">
            <button
              onClick={startKnockoutStage}
              className="bg-green-600 hover:bg-green-500 text-white px-10 py-5 rounded-xl font-bold text-xl transition-all shadow-xl hover:scale-105"
            >
              &#127942; Start Knockout Stage &#8594;
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Group Stage</h1>
          <p className="text-slate-400">Home & Away Round Robin</p>
        </div>

        {/* Match Day Indicator */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-slate-800 px-6 py-3 rounded-full border border-slate-700">
            <span className="text-slate-400">Match Day</span>
            <span className="text-2xl font-bold text-white">{matchDay}</span>
            <span className="text-slate-400">of {totalMatchDays}</span>
          </div>
        </div>

        {/* Toggle between Standings and Fixtures */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setShowStandings(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              showStandings
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Standings
          </button>
          <button
            onClick={() => setShowStandings(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              !showStandings
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Match Day {matchDay} Fixtures
          </button>
        </div>

        {showStandings ? (
          /* Standings Tables */
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <StandingsTable
              name="Group A"
              teams={groups.A}
              standings={standings.A}
              results={groupResults.A}
              color="blue"
            />
            <StandingsTable
              name="Group B"
              teams={groups.B}
              standings={standings.B}
              results={groupResults.B}
              color="red"
            />
          </div>
        ) : (
          /* Match Day Fixtures */
          <MatchDayView
            fixtures={matchDayFixtures}
            hasSimulated={hasSimulated}
          />
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 flex-wrap">
          {!hasSimulated && (
            <button
              onClick={simulateMatchDay}
              className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
            >
              &#9917; Simulate Match Day {matchDay}
            </button>
          )}

          {hasSimulated && pendingBigThree > 0 && (
            <div className="inline-flex items-center gap-3 bg-yellow-900/30 border border-yellow-600 px-6 py-4 rounded-xl">
              <span className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-yellow-400 font-medium">
                {pendingBigThree} featured match{pendingBigThree > 1 ? 'es' : ''} to watch
              </span>
            </div>
          )}

          {dayComplete && (
            <button
              onClick={advanceMatchDay}
              className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
            >
              {matchDay < totalMatchDays
                ? `Continue to Match Day ${matchDay + 1} \u2192`
                : 'Start Knockout Stage \u2192'}
            </button>
          )}

          {/* Skip to Knockouts button */}
          <button
            onClick={skipToKnockout}
            className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-4 rounded-xl font-bold transition-all"
          >
            &#9193; Skip to Knockouts
          </button>
        </div>
      </div>
    </div>
  );
}

function StandingsTable({ name, teams, standings, results, color, showQualified = false }) {
  const borderColor = color === 'blue' ? 'border-blue-600' : 'border-red-600';
  const bgColor = color === 'blue' ? 'bg-blue-600' : 'bg-red-600';

  // Use standings if available, otherwise show teams without stats
  const displayStandings = standings.length > 0
    ? standings
    : teams.map(team => ({
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    }));

  // Get big 3 matches from results
  const big3Matches = results.filter(r => r.showDetails);
  const otherMatches = results.filter(r => !r.showDetails);

  return (
    <div className={`bg-slate-800 rounded-xl border-2 ${borderColor} overflow-hidden`}>
      <div className={`${bgColor} px-4 py-3`}>
        <h3 className="text-xl font-bold text-white">{name}</h3>
      </div>

      {/* Standings Table */}
      <div className="p-4">
        {displayStandings.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2 w-8">#</th>
                <th className="text-left py-2">Team</th>
                <th className="text-center py-2 w-8">P</th>
                <th className="text-center py-2 w-8">W</th>
                <th className="text-center py-2 w-8">D</th>
                <th className="text-center py-2 w-8">L</th>
                <th className="text-center py-2 w-10">GD</th>
                <th className="text-center py-2 w-10">Pts</th>
              </tr>
            </thead>
            <tbody>
              {displayStandings.map((row, idx) => (
                <tr
                  key={row.team.id}
                  className={`border-b border-slate-700/50 ${
                    idx < 4 ? (showQualified ? 'bg-green-900/40 border-l-4 border-l-green-500' : 'bg-green-900/20') : (showQualified ? 'bg-red-900/20' : '')
                  } ${BIG_THREE.includes(row.team.id) ? 'bg-yellow-900/20' : ''}`}
                >
                  <td className="py-2 text-slate-400">{idx + 1}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span>{row.team.logoEmoji}</span>
                      <span className={`font-medium ${
                        BIG_THREE.includes(row.team.id) ? 'text-yellow-400' : 'text-white'
                      }`}>
                        {row.team.shortName || row.team.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-center text-slate-300">{row.played}</td>
                  <td className="text-center text-green-400">{row.won}</td>
                  <td className="text-center text-slate-400">{row.drawn}</td>
                  <td className="text-center text-red-400">{row.lost}</td>
                  <td className="text-center text-slate-300">
                    {row.goalDifference > 0 ? '+' : ''}{row.goalDifference}
                  </td>
                  <td className="text-center text-white font-bold">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2" />
            Waiting for matches...
          </div>
        )}
        <div className="text-xs text-slate-500 mt-2">* Top 4 qualify for knockouts</div>
      </div>

      {/* Featured Matches */}
      {big3Matches.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="text-sm font-semibold text-yellow-400 mb-2">Featured Matches</h4>
          <div className="space-y-2">
            {big3Matches.map((match, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 px-3 bg-slate-700/50 rounded-lg">
                <span className={BIG_THREE.includes(match.homeTeam) ? 'text-yellow-400' : 'text-slate-300'}>
                  {match.homeTeamName}
                </span>
                <span className="text-xl font-bold text-white">
                  {match.homeGoals} - {match.awayGoals}
                </span>
                <span className={BIG_THREE.includes(match.awayTeam) ? 'text-yellow-400' : 'text-slate-300'}>
                  {match.awayTeamName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Matches */}
      {otherMatches.length > 0 && (
        <details className="px-4 pb-4">
          <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300">
            Other Matches ({otherMatches.length})
          </summary>
          <div className="space-y-1 mt-2">
            {otherMatches.map((match, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 bg-slate-700/30 rounded">
                <span className="text-slate-300">{match.homeTeamName}</span>
                <span className="text-white font-mono">{match.homeGoals} - {match.awayGoals}</span>
                <span className="text-slate-300">{match.awayTeamName}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function MatchDayView({ fixtures, hasSimulated }) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-8">
      <div className="bg-slate-700 px-4 py-3">
        <h3 className="text-lg font-bold text-white">Today's Fixtures</h3>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {fixtures.map((fixture, idx) => {
            const isBig3 = BIG_THREE.includes(fixture.home.id) || BIG_THREE.includes(fixture.away.id);

            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isBig3
                    ? 'bg-yellow-900/30 border border-yellow-600'
                    : 'bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{fixture.home.logoEmoji}</span>
                  <span className={`font-semibold ${
                    BIG_THREE.includes(fixture.home.id) ? 'text-yellow-400' : 'text-white'
                  }`}>
                    {fixture.home.shortName || fixture.home.name}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {isBig3 && !hasSimulated && (
                    <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                      &#9654; LIVE
                    </span>
                  )}
                  {!isBig3 && !hasSimulated && (
                    <span className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">
                      Quick Sim
                    </span>
                  )}
                  <span className="text-lg font-bold text-white">VS</span>
                  <span className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">
                    Group {fixture.group}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-1 justify-end">
                  <span className={`font-semibold ${
                    BIG_THREE.includes(fixture.away.id) ? 'text-yellow-400' : 'text-white'
                  }`}>
                    {fixture.away.shortName || fixture.away.name}
                  </span>
                  <span className="text-2xl">{fixture.away.logoEmoji}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
