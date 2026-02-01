import React from 'react';
import { useAuction } from '../context/AuctionContext';

export default function RTMModal() {
  const { state, dispatch, formatCurrency, getTeamById, isPlayableTeam } = useAuction();
  const { pendingRTM, phase, isMultiplayer, localTeamId } = state;

  if (phase !== 'rtm' || !pendingRTM) return null;

  const { player, winningTeam, winningBid, rtmTeam } = pendingRTM;
  const rtmTeamData = getTeamById(rtmTeam);
  const winningTeamData = getTeamById(winningTeam);

  // In single-player: show modal for user-controlled teams
  // In multiplayer: only show modal if this is the local player's team
  const isLocalRtmTeam = isMultiplayer
    ? rtmTeam === localTeamId
    : rtmTeamData?.isUserControlled;

  // If not the local RTM team, show a notification instead
  if (!isLocalRtmTeam) {
    // In multiplayer, show a waiting state for other players
    if (isMultiplayer && isPlayableTeam(rtmTeam)) {
      return (
        <div className="fixed bottom-4 right-4 bg-purple-900/90 border border-purple-500 rounded-lg p-4 max-w-sm z-50">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-300" />
            <div>
              <div className="text-purple-300 font-semibold text-sm">RTM Decision</div>
              <div className="text-slate-300 text-xs">
                Waiting for {rtmTeamData?.name} to decide...
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleUseRTM = () => {
    dispatch({ type: 'USE_RTM', payload: { teamId: rtmTeam } });
  };

  const handleDecline = () => {
    dispatch({ type: 'DECLINE_RTM' });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-purple-500 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-purple-900/50 px-6 py-4 border-b border-purple-500/50">
          <h2 className="text-xl font-bold text-purple-300 text-center">
            Right to Match
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Player Info */}
          <div className="bg-slate-700 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-white">{player.name}</div>
                <div className="text-sm text-slate-400">
                  {player.position} | {player.rating} OVR
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(winningBid)}
                </div>
                <div className="text-xs text-slate-400">Winning Bid</div>
              </div>
            </div>
          </div>

          {/* Sale Info */}
          <div className="text-center mb-6">
            <p className="text-slate-300">
              <span className="font-semibold text-white">{player.name}</span> was sold to{' '}
              <span className="font-semibold" style={{ color: winningTeamData?.color }}>
                {winningTeamData?.name}
              </span>{' '}
              for <span className="text-green-400 font-semibold">{formatCurrency(winningBid)}</span>
            </p>
            <p className="text-slate-400 mt-2 text-sm">
              As <span className="text-purple-400">{rtmTeamData?.name}</span>, you can match this price
              to acquire the player instead.
            </p>
          </div>

          {/* Team Stats */}
          <div className="bg-slate-700/50 rounded-lg p-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">RTM Cards Remaining:</span>
              <span className="text-purple-400 font-semibold">{rtmTeamData?.rtmCardsRemaining}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-slate-400">Your Budget:</span>
              <span className="text-green-400 font-semibold">
                {formatCurrency(rtmTeamData?.remainingBudget)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-slate-400">After RTM:</span>
              <span className={`font-semibold ${
                rtmTeamData?.remainingBudget - winningBid > 100000000
                  ? 'text-green-400'
                  : 'text-yellow-400'
              }`}>
                {formatCurrency(rtmTeamData?.remainingBudget - winningBid)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleUseRTM}
              className="bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-lg font-bold transition-all"
            >
              Use RTM
              <div className="text-xs font-normal opacity-75">
                Pay {formatCurrency(winningBid)}
              </div>
            </button>
            <button
              onClick={handleDecline}
              className="bg-slate-600 hover:bg-slate-500 text-white py-4 rounded-lg font-bold transition-all"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
