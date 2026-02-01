import React, { useState, useMemo } from 'react';
import { useAuction } from '../context/AuctionContext';

const formatPrice = (price) => {
  if (price >= 1000000000) {
    return `€${(price / 1000000000).toFixed(2)}B`;
  }
  return `€${(price / 1000000).toFixed(0)}M`;
};

export default function RetentionModal({ teamId, onClose }) {
  const { getTeamById, getAvailableRetentionPlayers, dispatch } = useAuction();
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  const team = getTeamById(teamId);
  const availablePlayers = getAvailableRetentionPlayers(teamId);

  const totalRetentionCost = useMemo(() => {
    return selectedPlayers.reduce((sum, p) => sum + (p.season2Price || 0), 0);
  }, [selectedPlayers]);

  if (!team || !team.isBigThree) return null;

  const togglePlayer = (player) => {
    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else if (selectedPlayers.length < 5) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleConfirm = () => {
    if (selectedPlayers.length !== 5) {
      alert('Please select exactly 5 players to retain');
      return;
    }
    // Convert season2Price to basePrice for consistency in the system
    const playersWithPrice = selectedPlayers.map(p => ({
      ...p,
      basePrice: p.season2Price,
      retentionPrice: p.season2Price,
    }));
    dispatch({
      type: 'COMPLETE_RETENTION',
      payload: { teamId, players: playersWithPrice },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div
        className="bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        style={{ borderTop: `4px solid ${team.color}` }}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{team.logoEmoji}</span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{team.name}</h2>
              <p className="text-slate-400">Select 5 players to retain from Season 2 squad</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Total Retention Cost</p>
              <p className="text-xl font-bold text-yellow-400">{formatPrice(totalRetentionCost)}</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-3 bg-blue-900/30 border-b border-blue-800">
          <p className="text-blue-300 text-sm">
            Players are retained at their <span className="font-bold">Season 2 purchase price</span>.
            Choose wisely - these 5 players will form the core of your Season 3 squad!
          </p>
        </div>

        {/* Player Selection */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          <div className="grid gap-3">
            {availablePlayers.map(player => {
              const isSelected = selectedPlayers.find(p => p.id === player.id);
              const selectionIndex = selectedPlayers.findIndex(p => p.id === player.id);

              return (
                <div
                  key={player.id}
                  onClick={() => togglePlayer(player)}
                  className={`
                    flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all
                    ${isSelected
                      ? 'bg-green-900/50 border-2 border-green-500'
                      : 'bg-slate-800 border-2 border-transparent hover:border-slate-600'
                    }
                  `}
                >
                  {/* Selection indicator */}
                  <div className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold
                    ${isSelected ? 'bg-green-500 border-green-500 text-white' : 'border-slate-500 text-slate-500'}
                  `}>
                    {isSelected ? selectionIndex + 1 : ''}
                  </div>

                  {/* Position Badge */}
                  <span className={`
                    text-xs font-bold px-2 py-1 rounded min-w-[40px] text-center
                    ${player.position === 'GK' ? 'bg-amber-500' :
                      ['CB', 'LB', 'RB'].includes(player.position) ? 'bg-blue-500' :
                      ['CDM', 'CM', 'CAM'].includes(player.position) ? 'bg-green-500' :
                      'bg-red-500'}
                  `}>
                    {player.position}
                  </span>

                  {/* Player Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{player.name}</span>
                    </div>
                    <p className="text-sm text-slate-400">{player.nationality}</p>
                  </div>

                  {/* Season 2 Price */}
                  <div className="text-right">
                    <p className="text-xs text-slate-500">S2 Price</p>
                    <p className={`font-bold ${isSelected ? 'text-green-400' : 'text-yellow-400'}`}>
                      {formatPrice(player.season2Price)}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                    <span className="text-lg font-black text-black">{player.rating}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Players Summary */}
        {selectedPlayers.length > 0 && (
          <div className="px-6 py-3 bg-slate-800/50 border-t border-slate-700">
            <p className="text-sm text-slate-400 mb-2">Selected Players:</p>
            <div className="flex flex-wrap gap-2">
              {selectedPlayers.map((player, idx) => (
                <span
                  key={player.id}
                  className="px-3 py-1 bg-green-900/50 border border-green-700 rounded-full text-sm text-green-300"
                >
                  {idx + 1}. {player.name} ({formatPrice(player.season2Price)})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400">
                Selected: <span className={`font-bold ${selectedPlayers.length === 5 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {selectedPlayers.length}/5
                </span>
              </p>
              <p className="text-sm text-slate-500">
                Remaining budget after retention: <span className="text-green-400 font-bold">
                  {formatPrice(team.budget - totalRetentionCost)}
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedPlayers.length !== 5}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-colors
                  ${selectedPlayers.length === 5
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }
                `}
              >
                Confirm Retention ({formatPrice(totalRetentionCost)})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
