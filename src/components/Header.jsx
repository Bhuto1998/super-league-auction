import React from 'react';
import { useAuction } from '../context/AuctionContext';

export default function Header() {
  const { state, dispatch, getTotalRounds, getCurrentRound, exportToCSV } = useAuction();

  const getPhaseText = () => {
    switch (state.phase) {
      case 'retention':
        return 'Retention Phase - Big 3 Select Their Keepers';
      case 'auction':
        return 'Auction Phase - Live Bidding';
      case 'complete':
        return 'Auction Complete - Final Squads';
      default:
        return 'Super League Season 3';
    }
  };

  const getRetentionStatus = () => {
    if (state.phase !== 'retention') return null;
    const completed = Object.entries(state.retentionComplete)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    return `${completed.length}/3 Teams Completed`;
  };

  return (
    <header className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white py-6 px-8 shadow-2xl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Super League <span className="text-yellow-400">Season 3</span>
            </h1>
            <p className="text-lg text-blue-200 mt-1">{getPhaseText()}</p>
          </div>

          <div className="flex items-center gap-6">
            {state.phase === 'retention' && (
              <div className="text-right">
                <span className="text-sm text-blue-300">Retention Progress</span>
                <p className="text-xl font-semibold text-yellow-400">{getRetentionStatus()}</p>
              </div>
            )}

            {state.phase === 'auction' && (
              <>
                <div className="text-right">
                  <span className="text-sm text-blue-300">Round</span>
                  <p className="text-xl font-semibold text-yellow-400">
                    {getCurrentRound()} / {getTotalRounds()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-blue-300">Players Sold</span>
                  <p className="text-xl font-semibold text-green-400">
                    {state.soldPlayers.length}
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-2">
              {state.phase === 'retention' && (
                <button
                  onClick={() => dispatch({ type: 'SKIP_TO_AUCTION' })}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-sm font-medium transition-colors"
                >
                  Skip to Auction
                </button>
              )}
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset the entire auction?')) {
                    dispatch({ type: 'RESET_AUCTION' });
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
