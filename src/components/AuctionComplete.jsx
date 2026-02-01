import React from 'react';
import { useAuction } from '../context/AuctionContext';
import PlayerCard from './PlayerCard';

const formatPrice = (price) => {
  if (price >= 1000000000) {
    return `€${(price / 1000000000).toFixed(2)}B`;
  }
  return `€${(price / 1000000).toFixed(0)}M`;
};

export default function AuctionComplete() {
  const { state } = useAuction();

  const exportData = () => {
    const data = state.teams.map(team => ({
      team: team.name,
      manager: team.manager,
      remainingBudget: team.remainingBudget,
      totalSpent: team.budget - team.remainingBudget,
      retainedPlayers: team.retainedPlayers?.map(p => ({
        name: p.name,
        position: p.position,
        rating: p.rating,
        retentionPrice: p.retentionPrice || p.season2Price,
      })) || [],
      auctionedPlayers: team.auctionedPlayers.map(p => ({
        name: p.name,
        position: p.position,
        rating: p.rating,
        purchasePrice: p.purchasePrice,
      })),
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'super-league-s3-squads.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows = ['Team,Manager,Player,Position,Rating,Type,Price'];
    state.teams.forEach(team => {
      (team.retainedPlayers || []).forEach(p => {
        const price = p.retentionPrice || p.season2Price || 0;
        rows.push(`"${team.name}","${team.manager}","${p.name}",${p.position},${p.rating},Retained,${price}`);
      });
      team.auctionedPlayers.forEach(p => {
        rows.push(`"${team.name}","${team.manager}","${p.name}",${p.position},${p.rating},Auctioned,${p.purchasePrice}`);
      });
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'super-league-s3-squads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          🏆 Auction Complete!
        </h1>
        <p className="text-xl text-slate-400">Super League Season 3 - Final Squads</p>
      </div>

      {/* Export Buttons */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={exportData}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export JSON
        </button>
        <button
          onClick={exportCSV}
          className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Team Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.teams.map(team => {
          const retainedPlayers = team.retainedPlayers || [];
          const auctionedPlayers = team.auctionedPlayers || [];
          const retentionSpent = retainedPlayers.reduce((sum, p) => sum + (p.retentionPrice || p.season2Price || 0), 0);
          const auctionSpent = auctionedPlayers.reduce((sum, p) => sum + (p.purchasePrice || 0), 0);
          const totalSpent = retentionSpent + auctionSpent;
          const avgRating = [...retainedPlayers, ...auctionedPlayers].reduce((sum, p) => sum + p.rating, 0) /
            (retainedPlayers.length + auctionedPlayers.length) || 0;

          return (
            <div
              key={team.id}
              className="bg-slate-900/80 rounded-xl overflow-hidden"
              style={{ borderTop: `4px solid ${team.color}` }}
            >
              {/* Team Header */}
              <div className="p-4 bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{team.logoEmoji}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{team.name}</h3>
                    <p className="text-sm text-slate-400">{team.manager}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 p-4 bg-slate-800/30">
                <div className="text-center">
                  <p className="text-xs text-slate-400">Spent</p>
                  <p className="text-lg font-bold text-yellow-400">{formatPrice(totalSpent)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">Remaining</p>
                  <p className="text-lg font-bold text-green-400">{formatPrice(team.remainingBudget)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">Avg Rating</p>
                  <p className="text-lg font-bold text-blue-400">{avgRating.toFixed(1)}</p>
                </div>
              </div>

              {/* Players */}
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                {retainedPlayers.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-purple-400 mb-2">RETAINED ({retainedPlayers.length})</h4>
                    <div className="space-y-1">
                      {retainedPlayers.map(player => (
                        <PlayerCard key={player.id} player={player} compact showRetentionPrice />
                      ))}
                    </div>
                  </div>
                )}
                {auctionedPlayers.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-green-400 mb-2">AUCTIONED ({auctionedPlayers.length})</h4>
                    <div className="space-y-1">
                      {auctionedPlayers.map(player => (
                        <PlayerCard key={player.id} player={player} compact showPurchasePrice />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 bg-slate-900/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Auction Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-400">Players Sold</p>
            <p className="text-2xl font-bold text-blue-400">{state.soldPlayers.length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-400">Total Volume</p>
            <p className="text-2xl font-bold text-yellow-400">
              {formatPrice(state.soldPlayers.reduce((sum, p) => sum + p.soldFor, 0))}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-400">Highest Sale</p>
            <p className="text-2xl font-bold text-green-400">
              {formatPrice(Math.max(...state.soldPlayers.map(p => p.soldFor), 0))}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-400">Average Price</p>
            <p className="text-2xl font-bold text-purple-400">
              {formatPrice(state.soldPlayers.length > 0
                ? state.soldPlayers.reduce((sum, p) => sum + p.soldFor, 0) / state.soldPlayers.length
                : 0
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
