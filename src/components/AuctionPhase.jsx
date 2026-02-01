import React, { useEffect, useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import BiddingControls from './BiddingControls';
import LocalMultiplayerControls from './LocalMultiplayerControls';
import TeamStrip from './TeamStrip';
import BidHistory from './BidHistory';
import SquadProgress from './SquadProgress';
import SquadTab from './SquadTab';
import RTMModal from './RTMModal';
import AuctionMilestones from './AuctionMilestones';
import ConnectionStatus from './multiplayer/ConnectionStatus';
import { getPositionColor, getNextBidAmount } from '../utils/auctionHelpers';

export default function AuctionPhase() {
  const {
    state,
    dispatch,
    processAIBids,
    processAIRTM,
    checkAuctionEnd,
    formatCurrency,
    getUserTeams,
    exportToCSV,
    exportToJSON,
    autoCompleteAuction,
  } = useAuction();

  const { currentAuction, phase, passedTeams, selectedUserTeam, isMultiplayer, isHost, soldPlayers, unsoldPlayers, auctionPool, currentPlayerIndex } = state;
  const userTeams = getUserTeams();
  const [activeTab, setActiveTab] = useState('auction'); // 'auction' | 'squads'

  // Process AI actions when auction state changes (only host in multiplayer)
  useEffect(() => {
    if (phase === 'auction' && currentAuction) {
      if (isMultiplayer && !isHost) return;

      // Short delay before AI processing
      const timer = setTimeout(() => {
        processAIBids();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [phase, currentAuction, passedTeams, processAIBids, isMultiplayer, isHost]);

  // Process AI RTM decisions (only host in multiplayer)
  useEffect(() => {
    if (phase === 'rtm') {
      if (isMultiplayer && !isHost) return;
      processAIRTM();
    }
  }, [phase, processAIRTM, isMultiplayer, isHost]);

  // Check auction end after bid/pass changes (only host in multiplayer)
  useEffect(() => {
    if (currentAuction && passedTeams.length > 0) {
      if (isMultiplayer && !isHost) return;
      checkAuctionEnd();
    }
  }, [passedTeams, currentAuction, checkAuctionEnd, isMultiplayer, isHost]);

  // Auto-start next auction when no current auction
  useEffect(() => {
    if (phase === 'auction' && !currentAuction) {
      if (isMultiplayer && !isHost) return;
      // Quick delay before starting next auction
      const timer = setTimeout(() => {
        dispatch({ type: 'START_NEXT_AUCTION' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [phase, currentAuction, dispatch, isMultiplayer, isHost]);

  if (phase !== 'auction' && phase !== 'rtm') return null;

  const selectedTeam = state.teams.find(t => t.id === selectedUserTeam);

  return (
    <div className="min-h-screen bg-slate-900 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white py-4 px-4 shadow-lg mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Super League Auction</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-green-400 text-sm">
                  Sold: {soldPlayers.length}
                </span>
                <span className="text-red-400 text-sm">
                  Unsold: {unsoldPlayers.length}
                </span>
                <span className="text-yellow-400 text-sm">
                  Remaining: {auctionPool.length - currentPlayerIndex}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Multiplayer indicator */}
              {isMultiplayer && (
                <div className="flex items-center gap-3">
                  <ConnectionStatus />
                  {isHost && (
                    <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded">
                      Host
                    </span>
                  )}
                </div>
              )}

              {/* Team Selector/Display */}
              {isMultiplayer ? (
                // In multiplayer, show fixed team
                <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-4 py-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedTeam?.color }}
                  />
                  <span className="text-white font-semibold">{selectedTeam?.name}</span>
                  <span className="text-slate-400 text-sm">
                    ({formatCurrency(selectedTeam?.remainingBudget)})
                  </span>
                </div>
              ) : (
                // In local mode, show all 3 teams
                <div className="flex items-center gap-3">
                  {userTeams.map((team) => (
                    <div key={team.id} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="text-white text-sm font-semibold">{team.shortName}</span>
                      <span className="text-slate-400 text-xs">
                        {formatCurrency(team.remainingBudget)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Team Strip */}
        <div className="mb-4">
          <TeamStrip />
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('auction')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'auction'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Auction
            </button>
            <button
              onClick={() => setActiveTab('squads')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'squads'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Squads
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={autoCompleteAuction}
              className="px-4 py-2 rounded-lg font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-all text-sm"
            >
              Auto Complete
            </button>
            <button
              onClick={exportToJSON}
              className="px-4 py-2 rounded-lg font-semibold bg-green-600 hover:bg-green-500 text-white transition-all text-sm"
            >
              Export JSON
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all text-sm"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'squads' ? (
          <SquadTab />
        ) : !currentAuction ? (
          <div className="text-center py-16">
            <div className="bg-slate-800 rounded-lg p-8 max-w-md mx-auto">
              <div className="text-slate-400 mb-4">Loading next player...</div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto" />
            </div>
          </div>
        ) : isMultiplayer ? (
          // Multiplayer layout - single team controls
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <PlayerCard player={currentAuction.player} />
              <div className="mt-4">
                <SquadProgress teamId={selectedUserTeam} />
              </div>
            </div>
            <div className="lg:col-span-1">
              <BiddingControls />
            </div>
            <div className="lg:col-span-1">
              <BidHistory />
            </div>
          </div>
        ) : (
          // Local mode - 3 team controls side by side
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Player Card */}
            <div className="lg:col-span-3">
              <PlayerCard player={currentAuction.player} />
            </div>

            {/* Middle Column - All Team Bidding Controls */}
            <div className="lg:col-span-6">
              <LocalMultiplayerControls />
            </div>

            {/* Right Column - Activity Log */}
            <div className="lg:col-span-3">
              <BidHistory />
            </div>
          </div>
        )}
      </div>

      {/* RTM Modal */}
      <RTMModal />

      {/* Auction Milestones (Fabrizio comments, Manager/President tweets) */}
      <AuctionMilestones />
    </div>
  );
}

// Player Card Component
function PlayerCard({ player }) {
  const { formatCurrency, state, getTeamById } = useAuction();
  const { currentAuction } = state;

  const positionColor = getPositionColor(player.positionCategory);
  const realClub = getTeamById(player.realClub);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Position Category Banner */}
      <div className={`${positionColor} py-2 px-4`}>
        <div className="text-white font-semibold text-center">
          {player.positionCategory}
        </div>
      </div>

      {/* Player Info */}
      <div className="p-4">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-white mb-1">{player.name}</div>
          <div className="text-slate-400">
            {player.position} | {player.nationality}
          </div>
          {realClub && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: realClub.color }}
              />
              <span className="text-sm text-slate-500">{realClub.name}</span>
            </div>
          )}
        </div>

        {/* Rating Badge */}
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
            player.rating >= 90 ? 'bg-yellow-500 text-yellow-900' :
            player.rating >= 85 ? 'bg-green-500 text-green-900' :
            player.rating >= 80 ? 'bg-blue-500 text-blue-900' :
            'bg-slate-600 text-white'
          }`}>
            {player.rating}
          </div>
        </div>

        {/* Player Details */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="bg-slate-700/50 rounded p-2 text-center">
            <div className="text-slate-400 text-xs">Age</div>
            <div className="text-white font-semibold">{player.age}</div>
          </div>
          <div className="bg-slate-700/50 rounded p-2 text-center">
            <div className="text-slate-400 text-xs">Base Price</div>
            <div className="text-white font-semibold">{formatCurrency(player.basePrice)}</div>
          </div>
        </div>

        {/* Current Auction Status */}
        {currentAuction && (
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400">Current Bid:</span>
              <span className="text-2xl font-bold text-green-400">
                {formatCurrency(currentAuction.currentBid)}
              </span>
            </div>
            {currentAuction.highestBidder && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Leading:</span>
                <span className="text-white font-semibold">
                  {state.teams.find(t => t.id === currentAuction.highestBidder)?.name}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-slate-400">Next Bid:</span>
              <span className="text-yellow-400 font-semibold">
                {formatCurrency(getNextBidAmount(currentAuction.currentBid))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
