import React, { useState } from 'react';
import { useAuction } from '../context/AuctionContext';

const formatPrice = (price) => {
  if (price >= 1000000000) {
    return `€${(price / 1000000000).toFixed(2)}B`;
  }
  return `€${(price / 1000000).toFixed(0)}M`;
};

const BID_INCREMENTS = [
  { label: '+€5M', value: 5000000 },
  { label: '+€10M', value: 10000000 },
  { label: '+€25M', value: 25000000 },
  { label: '+€50M', value: 50000000 },
];

export default function BiddingPanel() {
  const { state, dispatch, canTeamBid, getTeamSquadCount } = useAuction();
  const [customBid, setCustomBid] = useState('');

  if (!state.currentAuction) {
    return (
      <div className="bg-slate-900/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Bidding Controls</h2>
        <p className="text-slate-400 text-center py-8">
          Click "Reveal Next Player" to start bidding
        </p>
      </div>
    );
  }

  const { currentBid, highestBidder } = state.currentAuction;

  const handleBid = (teamId, amount) => {
    if (!canTeamBid(teamId, amount)) {
      alert('This team cannot place this bid!');
      return;
    }
    if (highestBidder && amount <= currentBid) {
      alert('Bid must be higher than current bid!');
      return;
    }
    dispatch({ type: 'PLACE_BID', payload: { teamId, amount } });
  };

  const handlePass = (teamId) => {
    if (state.passedTeams.includes(teamId)) return;
    dispatch({ type: 'PASS', payload: { teamId } });
  };

  const handleCustomBid = (teamId) => {
    const amount = parseInt(customBid) * 1000000;
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount in millions');
      return;
    }
    handleBid(teamId, amount);
    setCustomBid('');
  };


  return (
    <div className="bg-slate-900/50 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-2">Bidding Controls</h2>
      <p className="text-slate-400 text-sm mb-4">
        Base price: <span className="text-green-400 font-bold">€5M</span>
        {highestBidder && (
          <> | Current bid: <span className="text-green-400 font-bold">{formatPrice(currentBid)}</span></>
        )}
      </p>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {state.teams.map(team => {
          const isPassed = state.passedTeams.includes(team.id);
          const isHighest = highestBidder === team.id;
          const squadCount = getTeamSquadCount(team.id);
          const squadFull = squadCount >= 15;
          const minBid = highestBidder ? currentBid + 5000000 : currentBid;
          const canAfford = team.remainingBudget >= minBid;

          return (
            <div
              key={team.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                isPassed
                  ? 'bg-slate-800/50 border-slate-700 opacity-50'
                  : isHighest
                  ? 'bg-green-900/30 border-green-600'
                  : 'bg-slate-800/50 border-slate-700'
              }`}
              style={{ borderLeftColor: team.color, borderLeftWidth: '4px' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{team.logoEmoji}</span>
                  <span className="font-bold text-white">{team.shortName}</span>
                  {isHighest && (
                    <span className="bg-green-600 text-xs px-2 py-0.5 rounded-full text-white">
                      LEADING
                    </span>
                  )}
                  {isPassed && (
                    <span className="bg-red-600 text-xs px-2 py-0.5 rounded-full text-white">
                      PASSED
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">
                    Budget: <span className="text-green-400">{formatPrice(team.remainingBudget)}</span>
                  </p>
                  <p className="text-xs text-slate-500">Squad: {squadCount}/15</p>
                </div>
              </div>

              {!isPassed && !squadFull && (
                <div className="flex flex-wrap gap-2">
                  {/* Quick bid buttons */}
                  {!highestBidder && canAfford ? (
                    // First bid - just take at base price
                    <button
                      onClick={() => handleBid(team.id, currentBid)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium"
                    >
                      Take @ €5M
                    </button>
                  ) : highestBidder && canAfford && !isHighest ? (
                    // Outbid buttons
                    <>
                      {BID_INCREMENTS.map(increment => {
                        const newBid = currentBid + increment.value;
                        const canAffordBid = canTeamBid(team.id, newBid);
                        return (
                          <button
                            key={increment.label}
                            onClick={() => handleBid(team.id, newBid)}
                            disabled={!canAffordBid}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                              canAffordBid
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {increment.label}
                          </button>
                        );
                      })}
                      {/* Custom bid */}
                      <div className="flex gap-1">
                        <input
                          type="number"
                          placeholder="€M"
                          value={customBid}
                          onChange={(e) => setCustomBid(e.target.value)}
                          className="w-16 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        />
                        <button
                          onClick={() => handleCustomBid(team.id)}
                          className="px-2 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-sm text-white"
                        >
                          Bid
                        </button>
                      </div>
                    </>
                  ) : !canAfford && !isHighest ? (
                    <span className="text-red-400 text-sm">Cannot afford to bid</span>
                  ) : null}

                  {/* Pass button - always show for non-highest bidder */}
                  {!isHighest && (
                    <button
                      onClick={() => handlePass(team.id)}
                      className="px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded text-sm font-medium text-white ml-auto"
                    >
                      Pass
                    </button>
                  )}
                </div>
              )}

              {squadFull && (
                <p className="text-yellow-400 text-sm">Squad full (15/15)</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Skip player if no one wants */}
      {!highestBidder && state.passedTeams.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
          <p className="text-yellow-400 text-sm text-center">
            {state.passedTeams.length} team(s) passed.
            {state.passedTeams.length === 6 && ' Player goes unsold!'}
          </p>
        </div>
      )}
    </div>
  );
}
