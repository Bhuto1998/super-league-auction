import React, { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { getBidIncrements, getNextBidAmount, canTeamBid as canBid } from '../utils/auctionHelpers';

export default function BiddingControls() {
  const { state, dispatch, canTeamBid, getSelectedUserTeam, formatCurrency: format } = useAuction();
  const [customBid, setCustomBid] = useState('');

  const selectedTeam = getSelectedUserTeam();
  const { currentAuction, passedTeams, isMultiplayer, localTeamId } = state;

  if (!currentAuction || !selectedTeam) return null;

  // In multiplayer, only allow bidding for your own team
  if (isMultiplayer && selectedTeam.id !== localTeamId) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="text-center text-slate-400">
          <p className="mb-2">Spectating: {selectedTeam.name}</p>
          <p className="text-sm">Switch to your team to bid</p>
        </div>
      </div>
    );
  }

  const currentBid = currentAuction.currentBid;
  const nextMinBid = getNextBidAmount(currentBid);
  const increments = getBidIncrements(currentBid);

  const hasPassed = passedTeams.includes(selectedTeam.id);
  const isHighestBidder = currentAuction.highestBidder === selectedTeam.id;

  const handleBid = (amount) => {
    if (canTeamBid(selectedTeam.id, amount)) {
      dispatch({ type: 'PLACE_BID', payload: { teamId: selectedTeam.id, amount } });
    }
  };

  const handleCustomBid = () => {
    const amount = parseInt(customBid) * 1000000; // Convert M to actual value
    if (amount >= nextMinBid && canTeamBid(selectedTeam.id, amount)) {
      dispatch({ type: 'PLACE_BID', payload: { teamId: selectedTeam.id, amount } });
      setCustomBid('');
    }
  };

  const handlePass = () => {
    if (!isHighestBidder && !hasPassed) {
      dispatch({ type: 'PASS', payload: { teamId: selectedTeam.id } });
    }
  };

  const canMakeBid = !hasPassed && canBid(selectedTeam, nextMinBid, currentAuction.player);

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      {/* Team indicator in multiplayer */}
      {isMultiplayer && (
        <div className="mb-4 pb-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedTeam.color }}
            />
            <span className="text-white font-semibold">{selectedTeam.name}</span>
            <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded">
              Your Team
            </span>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="text-sm text-slate-400 mb-1">Current Bid</div>
        <div className="text-3xl font-bold text-green-400">
          {format(currentBid)}
        </div>
        {currentAuction.highestBidder && (
          <div className="text-sm text-slate-300 mt-1">
            Leading: {state.teams.find(t => t.id === currentAuction.highestBidder)?.name}
          </div>
        )}
      </div>

      {isHighestBidder ? (
        <div className="bg-green-900/50 border border-green-500 rounded-lg p-4 text-center">
          <div className="text-green-400 font-semibold">You are the highest bidder!</div>
          <div className="text-sm text-slate-300 mt-1">Wait for other teams to bid or pass</div>
        </div>
      ) : hasPassed ? (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-center">
          <div className="text-red-400 font-semibold">You passed on this player</div>
        </div>
      ) : (
        <>
          {/* Quick Bid Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {increments.map((increment) => {
              const bidAmount = currentBid + increment;
              const canAfford = canTeamBid(selectedTeam.id, bidAmount);
              return (
                <button
                  key={increment}
                  onClick={() => handleBid(bidAmount)}
                  disabled={!canAfford}
                  className={`py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                    canAfford
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  +{format(increment)}
                </button>
              );
            })}
          </div>

          {/* Custom Bid Input */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <input
                type="number"
                value={customBid}
                onChange={(e) => setCustomBid(e.target.value)}
                placeholder={`Min: ${nextMinBid / 1000000}`}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">M</span>
            </div>
            <button
              onClick={handleCustomBid}
              disabled={!customBid || parseInt(customBid) * 1000000 < nextMinBid}
              className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Bid
            </button>
          </div>

          {/* Place Bid and Pass Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleBid(nextMinBid)}
              disabled={!canMakeBid}
              className={`py-4 rounded-lg font-bold text-lg transition-all ${
                canMakeBid
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Bid {format(nextMinBid)}
            </button>
            <button
              onClick={handlePass}
              disabled={isHighestBidder}
              className="bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-4 rounded-lg font-bold text-lg transition-all"
            >
              Pass
            </button>
          </div>
        </>
      )}

      {/* RTM Cards Indicator */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">RTM Cards Available</span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full ${
                  i < selectedTeam.rtmCardsRemaining
                    ? 'bg-purple-500'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
