import React, { useState } from 'react';
import { useMatch } from '../../context/MatchContext';
import { useAuction } from '../../context/AuctionContext';
import MatchPitch from './MatchPitch';
import MatchScoreboard from './MatchScoreboard';
import MatchCommentary, { ManagerNotes } from './MatchCommentary';
import MatchControls, { SubstitutionPanel, FormationSelector } from './MatchControls';
import EventPopup from './EventPopup';

/**
 * Main Match Page - Team selection or live match view
 */
export default function MatchPage({ onBack }) {
  const { isActive, matchState, startMatch } = useMatch();

  if (!isActive && !matchState) {
    return <TeamSelection onStartMatch={startMatch} onBack={onBack} />;
  }

  return <LiveMatch onBack={onBack} />;
}

/**
 * Team selection screen before match starts
 */
function TeamSelection({ onStartMatch, onBack }) {
  const { state } = useAuction();
  const [homeTeamId, setHomeTeamId] = useState(null);
  const [awayTeamId, setAwayTeamId] = useState(null);

  // Get teams with their squads
  const teamsWithSquads = state.teams.map(team => ({
    ...team,
    squad: [...(team.retainedPlayers || []), ...(team.auctionedPlayers || [])],
  })).filter(t => t.squad.length >= 11);

  const handleStartMatch = () => {
    if (!homeTeamId || !awayTeamId) return;

    const homeTeam = teamsWithSquads.find(t => t.id === homeTeamId);
    const awayTeam = teamsWithSquads.find(t => t.id === awayTeamId);

    if (!homeTeam || !awayTeam) return;

    // Select starting 11 (top 11 by rating) and bench
    const getSquadSplit = (squad) => {
      const sorted = [...squad].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      const starting11 = sorted.slice(0, 11).map((p, idx) => ({ ...p, jerseyNumber: idx + 1 }));
      const bench = sorted.slice(11).map((p, idx) => ({ ...p, jerseyNumber: idx + 12 }));
      return { starting11, bench };
    };

    const homeSplit = getSquadSplit(homeTeam.squad);
    const awaySplit = getSquadSplit(awayTeam.squad);

    onStartMatch(
      homeTeam,
      awayTeam,
      homeSplit.starting11,
      awaySplit.starting11,
      homeSplit.bench,
      awaySplit.bench
    );
  };

  const selectedHomeTeam = teamsWithSquads.find(t => t.id === homeTeamId);
  const selectedAwayTeam = teamsWithSquads.find(t => t.id === awayTeamId);

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Match Simulation</h1>
          <p className="text-slate-400">Select two teams to simulate a match</p>
        </div>

        {teamsWithSquads.length < 2 ? (
          <div className="bg-yellow-900/30 border border-yellow-500 rounded-xl p-8 text-center">
            <h2 className="text-yellow-400 text-xl font-semibold mb-2">Not Enough Teams</h2>
            <p className="text-slate-300 mb-4">
              Complete the auction first to build team squads (minimum 11 players each).
            </p>
            {onBack && (
              <button
                onClick={onBack}
                className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-2 rounded-lg"
              >
                Back to Auction
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Team selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Home team */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full" />
                  Home Team
                </h2>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {teamsWithSquads.map(team => (
                    <button
                      key={team.id}
                      onClick={() => setHomeTeamId(team.id)}
                      disabled={team.id === awayTeamId}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                        homeTeamId === team.id
                          ? 'bg-blue-600 text-white'
                          : team.id === awayTeamId
                          ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <span className="text-xl">{team.logoEmoji}</span>
                      <div className="text-left">
                        <div className="font-semibold">{team.name}</div>
                        <div className="text-xs opacity-75">
                          Squad: {team.squad.length} | Avg: {(team.squad.reduce((s, p) => s + p.rating, 0) / team.squad.length).toFixed(1)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Away team */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full" />
                  Away Team
                </h2>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {teamsWithSquads.map(team => (
                    <button
                      key={team.id}
                      onClick={() => setAwayTeamId(team.id)}
                      disabled={team.id === homeTeamId}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                        awayTeamId === team.id
                          ? 'bg-red-600 text-white'
                          : team.id === homeTeamId
                          ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <span className="text-xl">{team.logoEmoji}</span>
                      <div className="text-left">
                        <div className="font-semibold">{team.name}</div>
                        <div className="text-xs opacity-75">
                          Squad: {team.squad.length} | Avg: {(team.squad.reduce((s, p) => s + p.rating, 0) / team.squad.length).toFixed(1)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Match preview */}
            {selectedHomeTeam && selectedAwayTeam && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
                <h3 className="text-white font-semibold text-center mb-4">Match Preview</h3>
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-2 mx-auto"
                      style={{ backgroundColor: selectedHomeTeam.color + '40', border: `2px solid ${selectedHomeTeam.color}` }}
                    >
                      {selectedHomeTeam.logoEmoji}
                    </div>
                    <div className="text-white font-bold">{selectedHomeTeam.name}</div>
                  </div>
                  <div className="text-3xl text-slate-500 font-bold">VS</div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-2 mx-auto"
                      style={{ backgroundColor: selectedAwayTeam.color + '40', border: `2px solid ${selectedAwayTeam.color}` }}
                    >
                      {selectedAwayTeam.logoEmoji}
                    </div>
                    <div className="text-white font-bold">{selectedAwayTeam.name}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Start button */}
            <div className="flex justify-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="bg-slate-600 hover:bg-slate-500 text-white px-8 py-3 rounded-lg font-semibold"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={handleStartMatch}
                disabled={!homeTeamId || !awayTeamId}
                className="bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all"
              >
                ⚽ Start Match
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Live match view with all panels
 */
function LiveMatch({ onBack }) {
  const { matchState, resetMatch } = useMatch();
  const [managerView, setManagerView] = useState('home');

  const handleBack = () => {
    resetMatch();
    if (onBack) onBack();
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      {/* Event Popup for goals and red cards */}
      <EventPopup />

      <div className="max-w-7xl mx-auto space-y-4">
        {/* Controls */}
        <MatchControls onBack={handleBack} />

        {/* Scoreboard */}
        <MatchScoreboard />

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left panel - Commentary */}
          <div className="lg:col-span-1 space-y-4">
            <MatchCommentary />
          </div>

          {/* Center panel - Pitch */}
          <div className="lg:col-span-1">
            <MatchPitch />
          </div>

          {/* Right panel - Manager notes and controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Manager view toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setManagerView('home')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  managerView === 'home'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {matchState?.homeTeam?.shortName || 'Home'} Manager
              </button>
              <button
                onClick={() => setManagerView('away')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  managerView === 'away'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {matchState?.awayTeam?.shortName || 'Away'} Manager
              </button>
            </div>

            <ManagerNotes team={managerView} />
            <FormationSelector team={managerView} />
            <SubstitutionPanel team={managerView} />
          </div>
        </div>

        {/* Full-time summary */}
        {matchState?.phase === 'full-time' && (
          <MatchSummary />
        )}
      </div>
    </div>
  );
}

/**
 * Post-match summary
 */
function MatchSummary() {
  const { matchState } = useMatch();

  if (!matchState || matchState.phase !== 'full-time') return null;

  const homeGoals = matchState.events.filter(e => e.goal && e.team === 'home');
  const awayGoals = matchState.events.filter(e => e.goal && e.team === 'away');

  const winner = matchState.homeScore > matchState.awayScore
    ? matchState.homeTeam
    : matchState.awayScore > matchState.homeScore
    ? matchState.awayTeam
    : null;

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700">
      <h2 className="text-2xl font-bold text-white text-center mb-6">
        {winner ? `${winner.name} Win!` : 'Match Drawn!'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Home team summary */}
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-2 mx-auto"
            style={{ backgroundColor: matchState.homeTeam?.color + '40' }}
          >
            {matchState.homeTeam?.logoEmoji}
          </div>
          <h3 className="text-white font-bold text-lg mb-2">{matchState.homeTeam?.name}</h3>
          <div className="text-4xl font-bold text-white mb-4">{matchState.homeScore}</div>
          <div className="space-y-1">
            {homeGoals.map((g, i) => (
              <div key={i} className="text-green-400 text-sm">
                ⚽ {g.player?.name} {g.minute}'
              </div>
            ))}
          </div>
        </div>

        {/* Away team summary */}
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-2 mx-auto"
            style={{ backgroundColor: matchState.awayTeam?.color + '40' }}
          >
            {matchState.awayTeam?.logoEmoji}
          </div>
          <h3 className="text-white font-bold text-lg mb-2">{matchState.awayTeam?.name}</h3>
          <div className="text-4xl font-bold text-white mb-4">{matchState.awayScore}</div>
          <div className="space-y-1">
            {awayGoals.map((g, i) => (
              <div key={i} className="text-green-400 text-sm">
                ⚽ {g.player?.name} {g.minute}'
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Match stats */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-white font-bold">{matchState.shots.home}</div>
          <div className="text-slate-400 text-xs">Shots</div>
          <div className="text-white font-bold">{matchState.shots.away}</div>
        </div>
        <div>
          <div className="text-white font-bold">{Math.round(matchState.possession.home)}%</div>
          <div className="text-slate-400 text-xs">Possession</div>
          <div className="text-white font-bold">{Math.round(matchState.possession.away)}%</div>
        </div>
        <div>
          <div className="text-white font-bold">{matchState.fouls.home}</div>
          <div className="text-slate-400 text-xs">Fouls</div>
          <div className="text-white font-bold">{matchState.fouls.away}</div>
        </div>
      </div>
    </div>
  );
}
