import React, { useState, useMemo } from 'react';
import { useAuction } from '../context/AuctionContext';
import PlayerCard from './PlayerCard';

const positions = ['All', 'GK', 'DEF', 'MID', 'FWD'];
const positionMap = {
  DEF: ['CB', 'LB', 'RB'],
  MID: ['CDM', 'CM', 'CAM'],
  FWD: ['LW', 'RW', 'CF', 'ST'],
};

export default function PlayerPool() {
  const { state, dispatch, getCurrentTurnTeam, canTeamBid } = useAuction();
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [searchQuery, setSearchQuery] = useState('');

  const currentTeam = getCurrentTurnTeam();
  const canNominate = state.phase === 'auction' &&
    !state.currentAuction &&
    currentTeam &&
    canTeamBid(currentTeam.id, 0);

  const filteredPlayers = useMemo(() => {
    let players = [...state.playerPool];

    // Filter by position
    if (filter !== 'All') {
      if (filter === 'GK') {
        players = players.filter(p => p.position === 'GK');
      } else {
        players = players.filter(p => positionMap[filter]?.includes(p.position));
      }
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      players = players.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.club.toLowerCase().includes(query) ||
        p.nationality.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === 'rating') {
      players.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price') {
      players.sort((a, b) => b.basePrice - a.basePrice);
    } else if (sortBy === 'name') {
      players.sort((a, b) => a.name.localeCompare(b.name));
    }

    return players;
  }, [state.playerPool, filter, sortBy, searchQuery]);

  const handleNominate = (player) => {
    if (!canNominate) return;
    if (!canTeamBid(currentTeam.id, player.basePrice)) {
      alert(`${currentTeam.name} cannot afford this player's base price!`);
      return;
    }
    dispatch({ type: 'NOMINATE_PLAYER', payload: player });
  };

  return (
    <div className="bg-slate-900/50 rounded-xl p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Player Pool</h2>
          <p className="text-slate-400">{state.playerPool.length} players available</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          {/* Position Filter */}
          <div className="flex bg-slate-800 rounded-lg overflow-hidden">
            {positions.map(pos => (
              <button
                key={pos}
                onClick={() => setFilter(pos)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  filter === pos
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="rating">Sort by Rating</option>
            <option value="price">Sort by Price</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Nomination hint */}
      {canNominate && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg">
          <p className="text-green-300 text-sm">
            <span className="font-bold">{currentTeam.name}</span> - Click a player to nominate for auction
          </p>
        </div>
      )}

      {state.currentAuction && (
        <div className="mb-4 p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg">
          <p className="text-yellow-300 text-sm">
            Auction in progress - complete the current bid before nominating
          </p>
        </div>
      )}

      {/* Player Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[600px] overflow-y-auto pr-2">
        {filteredPlayers.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            onClick={() => handleNominate(player)}
            disabled={!canNominate}
          />
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">No players match your filters</p>
        </div>
      )}
    </div>
  );
}
