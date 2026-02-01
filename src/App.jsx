import React, { useEffect, useState } from 'react';
import { useAuction } from './context/AuctionContext';
import { useMultiplayer } from './context/MultiplayerContext';
import { useTournament } from './context/TournamentContext';
import RetentionPhase from './components/RetentionPhase';
import AuctionPhase from './components/AuctionPhase';
import LandingPage from './components/multiplayer/LandingPage';
import RoomLobby from './components/multiplayer/RoomLobby';
import ConnectionStatus from './components/multiplayer/ConnectionStatus';
import TournamentDraw from './components/tournament/TournamentDraw';
import GroupStage from './components/tournament/GroupStage';
import KnockoutStage from './components/tournament/KnockoutStage';
import LiveMatchSimulator from './components/tournament/LiveMatchSimulator';
import WinnerCelebration from './components/tournament/WinnerCelebration';

export default function App() {
  const { state, dispatch, registerSyncCallback } = useAuction();
  const {
    isMultiplayer,
    room,
    isHost,
    localTeamId,
    syncState,
    leaveRoom,
  } = useMultiplayer();
  const {
    state: tournamentState,
    startTournament,
    completeLiveMatch,
    completeKnockoutMatch,
    resetTournament,
  } = useTournament();

  const [singlePlayerStarted, setSinglePlayerStarted] = useState(false);
  const [liveMatch, setLiveMatch] = useState(null);
  const [standaloneMatchSetup, setStandaloneMatchSetup] = useState(false);

  // Register sync callback for multiplayer (host broadcasts state changes)
  useEffect(() => {
    if (isMultiplayer && isHost) {
      registerSyncCallback(syncState);
    }
  }, [isMultiplayer, isHost, registerSyncCallback, syncState]);

  // Handle pending live match from tournament
  useEffect(() => {
    if (tournamentState.phase === 'groups' && tournamentState.currentMatch && !liveMatch) {
      setLiveMatch({
        homeTeam: tournamentState.currentMatch.homeTeam,
        awayTeam: tournamentState.currentMatch.awayTeam,
        isKnockout: false,
      });
    }
  }, [tournamentState.phase, tournamentState.currentMatch, liveMatch]);

  // Handle starting single-player mode (quick play)
  const handleStartSinglePlayer = () => {
    setSinglePlayerStarted(true);
    dispatch({ type: 'RESET_AUCTION' });
  };

  // Handle game start from lobby
  const handleGameStart = () => {
    dispatch({
      type: 'SET_MULTIPLAYER_MODE',
      payload: {
        isMultiplayer: true,
        isHost,
        localTeamId,
        roomCode: room?.code,
      },
    });
  };

  // If not in multiplayer mode and no saved state and single player not started, show landing page
  const showLandingPage = !singlePlayerStarted && !isMultiplayer && !state.isMultiplayer && state.phase === 'retention' &&
    Object.keys(state.retentionComplete).length === 0;

  // If in multiplayer but in waiting room
  const showLobby = isMultiplayer && room?.status === 'waiting';

  // Header component for all phases
  const Header = () => (
    <div className="bg-slate-900 border-b border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">&#9917;</span>
          <div>
            <h1 className="text-lg font-bold text-white">Super League</h1>
            <span className="text-xs text-slate-400">Season 4 Auction</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Multiplayer indicator */}
          {(isMultiplayer || state.isMultiplayer) && (
            <ConnectionStatus />
          )}

          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            state.phase === 'retention' ? 'bg-purple-900 text-purple-300' :
            state.phase === 'auction' || state.phase === 'rtm' ? 'bg-blue-900 text-blue-300' :
            'bg-green-900 text-green-300'
          }`}>
            {state.phase === 'retention' && 'Retention Phase'}
            {state.phase === 'auction' && 'Auction Phase'}
            {state.phase === 'rtm' && 'RTM Decision'}
            {state.phase === 'complete' && 'Complete'}
          </span>

          {/* Leave multiplayer button */}
          {(isMultiplayer || state.isMultiplayer) && (
            <button
              onClick={() => {
                leaveRoom();
                dispatch({ type: 'RESET_AUCTION' });
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
            >
              Leave Game
            </button>
          )}

          {/* Single-player controls */}
          {!isMultiplayer && !state.isMultiplayer && (
            <>
              {state.phase !== 'retention' && (
                <button
                  onClick={() => dispatch({ type: 'RESET_AUCTION' })}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                >
                  Reset
                </button>
              )}
              {state.phase === 'retention' && (
                <button
                  onClick={() => dispatch({ type: 'SKIP_TO_AUCTION' })}
                  className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded transition-colors"
                >
                  Skip to Auction
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Show landing page
  if (showLandingPage) {
    return <LandingPage onStartSinglePlayer={handleStartSinglePlayer} />;
  }

  // Show live match simulator - must be before tournament phase checks
  if (liveMatch) {
    return (
      <LiveMatchSimulator
        homeTeam={liveMatch.homeTeam}
        awayTeam={liveMatch.awayTeam}
        isKnockout={liveMatch.isKnockout}
        firstLegResult={liveMatch.firstLegResult}
        leg1Result={liveMatch.leg1Result}
        isNeutral={liveMatch.isNeutral || false}
        leg={liveMatch.leg || 1}
        isTwoLegged={liveMatch.isTwoLegged || false}
        onComplete={handleLiveMatchComplete}
      />
    );
  }

  // Tournament phases
  if (tournamentState.phase === 'draw') {
    return <TournamentDraw />;
  }

  if (tournamentState.phase === 'groups' || tournamentState.phase === 'groups_complete') {
    return <GroupStage />;
  }

  if (tournamentState.phase === 'qf' || tournamentState.phase === 'sf' || tournamentState.phase === 'final') {
    return (
      <KnockoutStage
        onStartLiveMatch={(match) => setLiveMatch(match)}
      />
    );
  }

  if (tournamentState.phase === 'winner') {
    return (
      <WinnerCelebration
        onNewTournament={() => {
          resetTournament();
          startTournament(state.teams);
        }}
        onBackToAuction={() => {
          resetTournament();
        }}
      />
    );
  }

  // Show multiplayer lobby
  if (showLobby) {
    return <RoomLobby onGameStart={handleGameStart} />;
  }

  // Show standalone match team selection
  if (standaloneMatchSetup) {
    return (
      <StandaloneMatchSetup
        teams={state.teams}
        onStartMatch={(homeTeam, awayTeam) => {
          setLiveMatch({
            homeTeam,
            awayTeam,
            isKnockout: false,
            isStandalone: true,
          });
          setStandaloneMatchSetup(false);
        }}
        onBack={() => setStandaloneMatchSetup(false)}
      />
    );
  }

  // Handle live match completion
  const handleLiveMatchComplete = (result) => {
    if (liveMatch?.isStandalone) {
      setLiveMatch(null);
      return;
    }

    if (liveMatch?.round) {
      // Knockout match - handles two-legged ties
      let winner = null;

      // For final (single leg), determine winner immediately
      if (liveMatch.round === 'final') {
        const finalHomeGoals = result.homeGoalsAET ?? result.homeGoals;
        const finalAwayGoals = result.awayGoalsAET ?? result.awayGoals;

        if (result.penalties) {
          winner = result.penalties.winner === liveMatch.homeTeam.id
            ? liveMatch.homeTeam
            : liveMatch.awayTeam;
          result.penaltyWinner = winner.shortName || winner.name;
        } else if (finalHomeGoals > finalAwayGoals) {
          winner = liveMatch.homeTeam;
        } else if (finalAwayGoals > finalHomeGoals) {
          winner = liveMatch.awayTeam;
        } else {
          winner = Math.random() < 0.5 ? liveMatch.homeTeam : liveMatch.awayTeam;
        }
        result.winner = winner;
      }

      completeKnockoutMatch(
        result,
        liveMatch.round,
        liveMatch.tieIndex ?? liveMatch.index ?? 0,
        liveMatch.leg ?? 1,
        winner
      );
    } else {
      // Group stage match
      completeLiveMatch(result);
    }
    setLiveMatch(null);
  };

  // Render based on phase
  if (state.phase === 'complete') {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <CompletePhase
          onSimulateMatch={() => setStandaloneMatchSetup(true)}
          onStartTournament={() => {
            startTournament(state.teams);
          }}
        />
      </div>
    );
  }

  if (state.phase === 'retention') {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <RetentionPhase />
      </div>
    );
  }

  // Auction or RTM phase
  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <AuctionPhase />
    </div>
  );
}

// Standalone Match Team Selection Component
function StandaloneMatchSetup({ teams, onStartMatch, onBack }) {
  const [homeTeamId, setHomeTeamId] = useState(null);
  const [awayTeamId, setAwayTeamId] = useState(null);

  // Get teams with their squads (need at least 11 players)
  const teamsWithSquads = teams.map(team => ({
    ...team,
    players: [...(team.retainedPlayers || []), ...(team.auctionedPlayers || [])],
  })).filter(t => t.players.length >= 11);

  const handleStartMatch = () => {
    if (!homeTeamId || !awayTeamId) return;

    const homeTeam = teamsWithSquads.find(t => t.id === homeTeamId);
    const awayTeam = teamsWithSquads.find(t => t.id === awayTeamId);

    if (!homeTeam || !awayTeam) return;

    onStartMatch(homeTeam, awayTeam);
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
            <button
              onClick={onBack}
              className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-2 rounded-lg"
            >
              Back to Auction
            </button>
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
                          Squad: {team.players.length} | Avg: {(team.players.reduce((s, p) => s + p.rating, 0) / team.players.length).toFixed(1)}
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
                          Squad: {team.players.length} | Avg: {(team.players.reduce((s, p) => s + p.rating, 0) / team.players.length).toFixed(1)}
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
              <button
                onClick={onBack}
                className="bg-slate-600 hover:bg-slate-500 text-white px-8 py-3 rounded-lg font-semibold"
              >
                &#8592; Back
              </button>
              <button
                onClick={handleStartMatch}
                disabled={!homeTeamId || !awayTeamId}
                className="bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all"
              >
                &#9917; Start Match
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Complete Phase Component
function CompletePhase({ onSimulateMatch, onStartTournament }) {
  const { state, exportToCSV, exportToJSON, formatCurrency } = useAuction();
  const { teams, soldPlayers, unsoldPlayers } = state;

  // Calculate stats
  const totalVolume = soldPlayers.reduce((sum, p) => sum + (p.soldFor || 0), 0);
  const highestSale = soldPlayers.length > 0
    ? soldPlayers.reduce((max, p) => p.soldFor > max.soldFor ? p : max, soldPlayers[0])
    : null;
  const avgPrice = soldPlayers.length > 0 ? totalVolume / soldPlayers.length : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Auction Complete!</h1>
        <p className="text-slate-400">All teams have completed their squads</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{soldPlayers.length}</div>
          <div className="text-sm text-slate-400">Players Sold</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{formatCurrency(totalVolume)}</div>
          <div className="text-sm text-slate-400">Total Volume</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">
            {highestSale ? formatCurrency(highestSale.soldFor) : '-'}
          </div>
          <div className="text-sm text-slate-400">Highest Sale</div>
          {highestSale && (
            <div className="text-xs text-slate-500 mt-1">{highestSale.name}</div>
          )}
        </div>
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{formatCurrency(avgPrice)}</div>
          <div className="text-sm text-slate-400">Average Price</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        <button
          onClick={onStartTournament}
          className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          &#127942; Start Super League Draw
        </button>
        <button
          onClick={onSimulateMatch}
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Simulate Match
        </button>
        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Export CSV
        </button>
        <button
          onClick={exportToJSON}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Export JSON
        </button>
      </div>

      {/* Team Cards */}
      <h2 className="text-2xl font-bold text-white mb-4">Final Squads</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => {
          const totalSpent = (team.budget || 1000000000) - team.remainingBudget;
          const allPlayers = [
            ...(team.retainedPlayers || []),
            ...(team.auctionedPlayers || []),
          ];
          const avgRating = allPlayers.length > 0
            ? (allPlayers.reduce((sum, p) => sum + p.rating, 0) / allPlayers.length).toFixed(1)
            : '-';

          return (
            <div
              key={team.id}
              className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700"
            >
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: team.color + '20', borderBottom: `2px solid ${team.color}` }}
              >
                <span className="text-2xl">{team.logoEmoji}</span>
                <div>
                  <h3 className="font-bold text-white">{team.name}</h3>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>Squad: {allPlayers.length}/18</span>
                    <span>Avg: {avgRating}</span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-slate-400">Spent:</span>
                  <span className="text-white font-semibold">{formatCurrency(totalSpent)}</span>
                </div>
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-slate-400">Remaining:</span>
                  <span className="text-green-400 font-semibold">{formatCurrency(team.remainingBudget)}</span>
                </div>

                {/* Player List */}
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {team.retainedPlayers?.map((player, i) => (
                    <div key={player.id} className="flex justify-between text-xs bg-purple-900/30 rounded px-2 py-1">
                      <span className="text-white truncate flex items-center gap-1">
                        <span className="text-purple-300 font-medium w-8">{player.position}</span>
                        {player.name}
                      </span>
                      <span className="text-purple-400">{player.rating} (R{i + 1})</span>
                    </div>
                  ))}
                  {team.auctionedPlayers?.map((player) => (
                    <div key={player.id} className="flex justify-between text-xs bg-slate-700/50 rounded px-2 py-1">
                      <span className="text-white truncate flex items-center gap-1">
                        <span className="text-slate-400 font-medium w-8">{player.position}</span>
                        {player.name}
                      </span>
                      <span className="text-green-400">{player.rating} | {formatCurrency(player.purchasePrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unsold Players */}
      {unsoldPlayers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Unsold Players ({unsoldPlayers.length})</h2>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {unsoldPlayers.map((player) => (
                <span
                  key={player.id}
                  className="bg-slate-700 px-3 py-1 rounded text-sm text-slate-300"
                >
                  <span className="text-slate-500">{player.position}</span> {player.name} ({player.rating})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
