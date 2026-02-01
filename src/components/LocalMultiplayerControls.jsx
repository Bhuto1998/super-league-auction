import React from 'react';
import { useAuction } from '../context/AuctionContext';
import { getNextBidAmount } from '../utils/auctionHelpers';

// Keyboard shortcuts for each team
const TEAM_SHORTCUTS = {
  'real-madrid': { bid: '1', pass: 'q' },
  'barcelona': { bid: '2', pass: 'w' },
  'bayern': { bid: '3', pass: 'e' },
};

export default function LocalMultiplayerControls() {
  const { state, dispatch, canTeamBid, formatCurrency } = useAuction();
  const { currentAuction, passedTeams, teams } = state;

  // Get the 3 user-controlled teams
  const userTeams = teams.filter(t => t.isUserControlled);

  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (!currentAuction) return;

      // Check for bid shortcuts (1, 2, 3)
      for (const team of userTeams) {
        const shortcuts = TEAM_SHORTCUTS[team.id];
        if (!shortcuts) continue;

        const nextBid = getNextBidAmount(currentAuction.currentBid);
        const hasPassed = passedTeams.includes(team.id);
        const isHighestBidder = currentAuction.highestBidder === team.id;

        if (e.key === shortcuts.bid && !hasPassed && !isHighestBidder) {
          if (canTeamBid(team.id, nextBid)) {
            dispatch({ type: 'PLACE_BID', payload: { teamId: team.id, amount: nextBid } });
          }
        }

        if (e.key === shortcuts.pass && !hasPassed && !isHighestBidder) {
          dispatch({ type: 'PASS', payload: { teamId: team.id } });
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentAuction, passedTeams, userTeams, canTeamBid, dispatch]);

  if (!currentAuction) return null;

  const currentBid = currentAuction.currentBid;
  const nextMinBid = getNextBidAmount(currentBid);

  return (
    <div className="space-y-4">
      {/* Current Bid Display */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
        <div className="text-sm text-slate-400 mb-1">Current Bid</div>
        <div className="text-4xl font-bold text-green-400">{formatCurrency(currentBid)}</div>
        {currentAuction.highestBidder && (
          <div className="text-lg text-white mt-2">
            Leading: <span className="font-bold">{teams.find(t => t.id === currentAuction.highestBidder)?.name}</span>
          </div>
        )}
        <div className="text-sm text-yellow-400 mt-2">
          Next bid: {formatCurrency(nextMinBid)}
        </div>
      </div>

      {/* Team Bidding Cards - 3 columns */}
      <div className="grid grid-cols-3 gap-3">
        {userTeams.map((team) => (
          <TeamBidCard
            key={team.id}
            team={team}
            currentAuction={currentAuction}
            passedTeams={passedTeams}
            dispatch={dispatch}
            canTeamBid={canTeamBid}
            formatCurrency={formatCurrency}
            nextMinBid={nextMinBid}
          />
        ))}
      </div>

      {/* Keyboard Shortcuts Legend */}
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
        <div className="text-xs text-slate-400 text-center">
          Keyboard Shortcuts:
          <span className="text-white ml-2">Real Madrid [1/Q]</span>
          <span className="text-white ml-2">Barcelona [2/W]</span>
          <span className="text-white ml-2">Bayern [3/E]</span>
        </div>
      </div>
    </div>
  );
}

function TeamBidCard({ team, currentAuction, passedTeams, dispatch, canTeamBid, formatCurrency, nextMinBid }) {
  const hasPassed = passedTeams.includes(team.id);
  const isHighestBidder = currentAuction.highestBidder === team.id;
  const canAffordNextBid = canTeamBid(team.id, nextMinBid);
  const canMakeBid = !hasPassed && canAffordNextBid && !isHighestBidder;

  const handleBid = () => {
    if (canMakeBid) {
      dispatch({ type: 'PLACE_BID', payload: { teamId: team.id, amount: nextMinBid } });
    }
  };

  const handlePass = () => {
    if (!hasPassed && !isHighestBidder) {
      dispatch({ type: 'PASS', payload: { teamId: team.id } });
    }
  };

  // Determine card state styling
  let cardStyle = 'border-slate-600';
  let headerBg = 'bg-slate-700';

  if (isHighestBidder) {
    cardStyle = 'border-green-500 ring-2 ring-green-500/50';
    headerBg = 'bg-green-900';
  } else if (hasPassed) {
    cardStyle = 'border-red-500/50 opacity-60';
    headerBg = 'bg-red-900/50';
  }

  return (
    <div className={`bg-slate-800 rounded-lg border-2 ${cardStyle} overflow-hidden`}>
      {/* Team Header */}
      <div
        className={`${headerBg} py-3 px-3`}
        style={{
          borderBottom: `3px solid ${team.color}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full border-2 border-white/30"
              style={{ backgroundColor: team.color }}
            />
            <span className="text-white font-bold text-sm truncate">{team.shortName}</span>
          </div>
          {isHighestBidder && (
            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
              LEADING
            </span>
          )}
          {hasPassed && (
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
              PASSED
            </span>
          )}
        </div>
        <div className="text-xs text-slate-300 mt-1">
          Budget: {formatCurrency(team.remainingBudget)}
        </div>
      </div>

      {/* Bid Controls */}
      <div className="p-3">
        {isHighestBidder ? (
          <div className="text-center py-4">
            <div className="text-green-400 font-semibold text-sm">Highest Bidder!</div>
            <div className="text-xs text-slate-400 mt-1">Waiting for others...</div>
          </div>
        ) : hasPassed ? (
          <div className="text-center py-4">
            <div className="text-red-400 font-semibold text-sm">Passed</div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleBid}
              disabled={!canMakeBid}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                canMakeBid
                  ? 'bg-green-600 hover:bg-green-500 text-white active:scale-95'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              BID
            </button>
            <button
              onClick={handlePass}
              className="w-full py-2 rounded-lg font-semibold text-sm bg-red-600/80 hover:bg-red-500 text-white transition-all active:scale-95"
            >
              Pass
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
