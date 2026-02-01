import React from 'react';
import { useAuction } from '../context/AuctionContext';

const formatPrice = (price) => {
  if (price >= 1000000000) {
    return `€${(price / 1000000000).toFixed(2)}B`;
  }
  return `€${(price / 1000000).toFixed(0)}M`;
};

const positionColors = {
  GK: 'from-amber-500 to-amber-700',
  CB: 'from-blue-500 to-blue-700',
  LB: 'from-blue-400 to-blue-600',
  RB: 'from-blue-400 to-blue-600',
  CDM: 'from-green-600 to-green-800',
  CM: 'from-green-500 to-green-700',
  CAM: 'from-green-400 to-green-600',
  LW: 'from-red-400 to-red-600',
  RW: 'from-red-400 to-red-600',
  CF: 'from-red-500 to-red-700',
  ST: 'from-red-600 to-red-800',
};

export default function AuctionBlock() {
  const { state, dispatch, getTeamById, getTotalRounds, getCurrentRound } = useAuction();

  const handleNextPlayer = () => {
    dispatch({ type: 'START_NEXT_AUCTION' });
  };

  if (!state.currentAuction) {
    const totalRounds = getTotalRounds();
    const currentRound = getCurrentRound();
    const isComplete = currentRound > totalRounds;

    return (
      <div className="bg-slate-900/50 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">⚽</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {isComplete ? 'All Players Auctioned!' : 'Ready for Next Player'}
        </h2>
        <p className="text-slate-400 mb-6">
          {isComplete
            ? 'The auction is complete.'
            : `Round ${currentRound} of ${totalRounds}`
          }
        </p>
        {!isComplete && (
          <button
            onClick={handleNextPlayer}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-xl text-white text-xl font-bold transition-all shadow-lg hover:shadow-green-500/30"
          >
            Reveal Next Player
          </button>
        )}
      </div>
    );
  }

  const { player, currentBid, highestBidder } = state.currentAuction;
  const leadingTeam = highestBidder ? getTeamById(highestBidder) : null;
  const gradient = positionColors[player.position] || 'from-gray-500 to-gray-700';
  const totalRounds = getTotalRounds();
  const currentRound = state.currentPlayerIndex + 1;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradient} p-4`}>
        <div className="flex justify-between items-center">
          <span className="text-white/80 text-sm font-bold">
            Round {currentRound} / {totalRounds}
          </span>
          <span className="bg-black/30 px-3 py-1 rounded-full text-white font-bold">
            {player.position}
          </span>
        </div>
      </div>

      {/* Player Info */}
      <div className="p-6">
        <div className="flex items-start gap-6">
          {/* Rating Circle */}
          <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-3xl font-black text-black">{player.rating}</span>
          </div>

          {/* Details */}
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-1">{player.name}</h2>
            <p className="text-slate-300 text-lg">{player.club}</p>
            <p className="text-slate-400">{player.nationality}</p>
            {player.releasedFrom && (
              <p className="text-purple-400 text-sm mt-1">Released from {player.releasedFrom}</p>
            )}
          </div>
        </div>

        {/* Bid Info */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Base Price</p>
            <p className="text-xl font-bold text-slate-300">{formatPrice(player.basePrice)}</p>
          </div>
          <div className="bg-green-900/50 border border-green-700 rounded-lg p-4">
            <p className="text-green-400 text-sm mb-1">Current Bid</p>
            <p className="text-2xl font-bold text-green-400">{formatPrice(currentBid)}</p>
          </div>
        </div>

        {/* Leading Bidder */}
        <div className="mt-4 bg-blue-900/50 border border-blue-700 rounded-lg p-4">
          <p className="text-blue-400 text-sm mb-1">Leading Bidder</p>
          {leadingTeam ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{leadingTeam.logoEmoji}</span>
              <span className="text-xl font-bold text-white">{leadingTeam.name}</span>
            </div>
          ) : (
            <p className="text-slate-400 italic">No bids yet - waiting for teams...</p>
          )}
        </div>

        {/* Bid History */}
        {state.bidHistory.length > 0 && (
          <div className="mt-4">
            <p className="text-slate-400 text-sm mb-2">Bid History</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {[...state.bidHistory].reverse().map((bid, idx) => {
                const team = getTeamById(bid.teamId);
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded text-sm ${
                      bid.type === 'pass'
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    <span>{team?.shortName}</span>
                    <span>
                      {bid.type === 'pass' ? 'PASSED' : formatPrice(bid.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
