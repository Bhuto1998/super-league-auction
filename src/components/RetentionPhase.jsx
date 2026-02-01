import React, { useState, useEffect } from 'react';
import { useAuction } from '../context/AuctionContext';
import { RETENTION_PRICES, getTotalRetentionCost, STARTING_BUDGET, calculateRetentionCost, getRetentionPrice } from '../utils/auctionHelpers';

export default function RetentionPhase() {
  const {
    state,
    dispatch,
    getAvailableRetentionPlayers,
    formatCurrency,
    getUserTeams,
    isAllUserRetentionComplete,
    getMaxRetentionsForTeam,
    getRetentionPriceForSlot,
    validateRetention,
  } = useAuction();

  const { isMultiplayer, localTeamId, isHost, isCareerMode, careerSeasonNumber } = state;

  // In multiplayer, only show the local team
  const userTeams = getUserTeams();
  const [selectedTeam, setSelectedTeam] = useState(isMultiplayer ? localTeamId : state.selectedUserTeam);
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  // Update selected team when localTeamId changes (multiplayer)
  useEffect(() => {
    if (isMultiplayer && localTeamId) {
      setSelectedTeam(localTeamId);
    }
  }, [isMultiplayer, localTeamId]);

  const availablePlayers = getAvailableRetentionPlayers(selectedTeam);
  const currentTeam = state.teams.find(t => t.id === selectedTeam);
  const isTeamComplete = state.retentionComplete[selectedTeam];

  // Get max retentions for this team (3 for Season 1, 5 for Season 2+ for human teams)
  const maxRetentions = getMaxRetentionsForTeam ? getMaxRetentionsForTeam(selectedTeam) : 3;

  // Get team's budget
  const teamBudget = currentTeam?.budget || STARTING_BUDGET;

  // Sort players by rating
  const sortedPlayers = [...availablePlayers].sort((a, b) => b.rating - a.rating);

  const handlePlayerToggle = (player) => {
    if (isTeamComplete) return;

    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else if (selectedPlayers.length < maxRetentions) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleConfirmRetention = () => {
    if (selectedPlayers.length > 0 && selectedPlayers.length <= maxRetentions) {
      dispatch({
        type: 'COMPLETE_RETENTION',
        payload: { teamId: selectedTeam, players: selectedPlayers },
      });
      setSelectedPlayers([]);
    }
  };

  const handleSkipRetention = () => {
    dispatch({
      type: 'COMPLETE_RETENTION',
      payload: { teamId: selectedTeam, players: [] },
    });
    setSelectedPlayers([]);
  };

  const handleStartAuction = () => {
    // Auto-retain for AI teams
    dispatch({ type: 'AUTO_RETAIN_AI_TEAMS' });
    // Start auction phase
    dispatch({ type: 'START_AUCTION_PHASE' });
  };

  // Calculate retention cost (supports star player override in career mode)
  const { totalCost } = calculateRetentionCost(selectedPlayers);
  const remainingBudget = teamBudget - totalCost;

  // Count completed user teams
  const completedCount = userTeams.filter(t => state.retentionComplete[t.id]).length;

  // In multiplayer, check if we're waiting for others
  const isWaitingForOthers = isMultiplayer && isTeamComplete;

  // Check if this player (in multiplayer) can start the auction
  // Only host can start, and only when their retention is complete
  const canStartAuction = isMultiplayer
    ? isHost && isAllUserRetentionComplete()
    : isAllUserRetentionComplete();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Retention Phase</h1>
        <p className="text-slate-400">
          {isMultiplayer
            ? `Select up to ${maxRetentions} players to retain for ${currentTeam?.name}`
            : `Select up to ${maxRetentions} players to retain for each of your teams`}
        </p>
        {isCareerMode && careerSeasonNumber > 1 && (
          <p className="text-yellow-400 text-sm mt-2">
            Season {careerSeasonNumber} - Enhanced retention available
          </p>
        )}
        {!isMultiplayer && (
          <div className="mt-4 text-sm text-slate-300">
            Progress: {completedCount}/{userTeams.length} teams complete
          </div>
        )}
      </div>

      {/* Team Tabs - Only show in single-player mode */}
      {!isMultiplayer && (
        <div className="flex justify-center gap-2 mb-6">
          {userTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => {
                setSelectedTeam(team.id);
                setSelectedPlayers([]);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                selectedTeam === team.id
                  ? 'bg-purple-600 text-white'
                  : state.retentionComplete[team.id]
                  ? 'bg-green-900/50 text-green-400 border border-green-500'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: team.color }}
              />
              {team.shortName}
              {state.retentionComplete[team.id] && (
                <span className="text-green-400">&#10003;</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Multiplayer Team Header */}
      {isMultiplayer && currentTeam && (
        <div className="flex justify-center mb-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-6 py-3 flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: currentTeam.color }}
            />
            <span className="text-white font-semibold">{currentTeam.name}</span>
            {isTeamComplete && (
              <span className="text-green-400">&#10003;</span>
            )}
          </div>
        </div>
      )}

      {/* Waiting for Others (Multiplayer) */}
      {isWaitingForOthers && !canStartAuction && (
        <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-8 text-center mb-6">
          <div className="text-blue-400 text-xl font-semibold mb-2">
            Waiting for Other Players
          </div>
          <div className="text-slate-300">
            You've completed your retention. Waiting for other players to finish...
          </div>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        </div>
      )}

      {isTeamComplete && !isWaitingForOthers ? (
        <div className="bg-green-900/30 border border-green-500 rounded-lg p-8 text-center mb-6">
          <div className="text-green-400 text-xl font-semibold mb-2">
            {currentTeam?.name} Retention Complete!
          </div>
          <div className="text-slate-300">
            Retained {currentTeam?.retainedPlayers?.length || 0} players
          </div>
        </div>
      ) : !isWaitingForOthers && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player Selection */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <h2 className="text-lg font-semibold text-white mb-4">
                Available Players ({sortedPlayers.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                {sortedPlayers.map((player) => {
                  const isSelected = selectedPlayers.find(p => p.id === player.id);
                  const canSelect = selectedPlayers.length < maxRetentions;

                  return (
                    <div
                      key={player.id}
                      onClick={() => handlePlayerToggle(player)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-900/50 border-2 border-purple-500'
                          : canSelect
                          ? 'bg-slate-700 border-2 border-transparent hover:border-slate-500'
                          : 'bg-slate-700/50 border-2 border-transparent opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">{player.name}</div>
                          <div className="text-sm text-slate-400">
                            {player.position} | {player.nationality}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            player.rating >= 85 ? 'text-green-400' :
                            player.rating >= 80 ? 'text-yellow-400' : 'text-slate-300'
                          }`}>
                            {player.rating}
                          </div>
                          {isSelected && (
                            <div className="text-xs text-purple-400">
                              Slot {selectedPlayers.findIndex(p => p.id === player.id) + 1}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selection Summary */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 sticky top-4">
              <h2 className="text-lg font-semibold text-white mb-4">
                Retention Summary
              </h2>

              {/* Retention Pricing */}
              <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                <div className="text-sm text-slate-400 mb-2">Retention Pricing</div>
                {Array.from({ length: maxRetentions }, (_, i) => i + 1).map((slot) => {
                  const player = selectedPlayers[slot - 1];
                  const price = player ? getRetentionPrice(slot, player.rating) : RETENTION_PRICES[slot];
                  const isStarOverride = player && (player.rating >= 92 || (player.rating >= 90 && slot >= 4));

                  return (
                    <div key={slot} className="flex justify-between text-sm py-1">
                      <span className="text-slate-300">Slot {slot}:</span>
                      <span className={`${
                        selectedPlayers.length >= slot ? 'text-purple-400' : 'text-slate-500'
                      } ${isStarOverride ? 'text-yellow-400' : ''}`}>
                        {formatCurrency(price)}
                        {isStarOverride && ' *'}
                      </span>
                    </div>
                  );
                })}
                {maxRetentions === 5 && (
                  <div className="text-xs text-yellow-400/70 mt-2">
                    * Star player override (90+ rating)
                  </div>
                )}
              </div>

              {/* Selected Players */}
              <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                {Array.from({ length: maxRetentions }, (_, i) => i + 1).map((slot) => {
                  const player = selectedPlayers[slot - 1];
                  const price = player ? getRetentionPrice(slot, player.rating) : RETENTION_PRICES[slot];
                  const isStarOverride = player && player.rating >= 90 && price > RETENTION_PRICES[slot];

                  return (
                    <div
                      key={slot}
                      className={`p-3 rounded-lg border-2 ${
                        player
                          ? isStarOverride
                            ? 'bg-yellow-900/30 border-yellow-500'
                            : 'bg-purple-900/30 border-purple-500'
                          : 'bg-slate-700/30 border-slate-600 border-dashed'
                      }`}
                    >
                      {player ? (
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {player.name}
                              {isStarOverride && <span className="text-yellow-400 text-xs">&#9733;</span>}
                            </div>
                            <div className="text-xs text-slate-400">
                              {player.position} | {player.rating} OVR
                            </div>
                          </div>
                          <div className={`font-semibold ${isStarOverride ? 'text-yellow-400' : 'text-purple-400'}`}>
                            {formatCurrency(price)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-500 text-sm py-1">
                          Slot {slot} - {formatCurrency(RETENTION_PRICES[slot] || 0)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="border-t border-slate-700 pt-4 space-y-2">
                {isCareerMode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Season Budget:</span>
                    <span className="text-white font-semibold">{formatCurrency(teamBudget)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Retention Cost:</span>
                  <span className="text-purple-400 font-semibold">{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Auction Budget:</span>
                  <span className={`font-semibold ${
                    remainingBudget >= 500000000 ? 'text-green-400' :
                    remainingBudget >= 100000000 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(remainingBudget)}
                  </span>
                </div>
                {remainingBudget < 100000000 && (
                  <div className="text-xs text-red-400 mt-2">
                    Warning: Low auction budget!
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-2">
                <button
                  onClick={handleConfirmRetention}
                  disabled={selectedPlayers.length === 0}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-lg font-bold transition-all"
                >
                  Confirm Retention ({selectedPlayers.length})
                </button>
                <button
                  onClick={handleSkipRetention}
                  className="w-full bg-slate-600 hover:bg-slate-500 text-white py-2 rounded-lg text-sm transition-all"
                >
                  Skip (Retain 0 Players)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Auction Button */}
      {canStartAuction && (
        <div className="mt-8 text-center">
          <button
            onClick={handleStartAuction}
            className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all"
          >
            Start Auction Phase
          </button>
          {isMultiplayer && (
            <p className="text-slate-400 text-sm mt-2">
              You are the host. Click to start the auction for all players.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
