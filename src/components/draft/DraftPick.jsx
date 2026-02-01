import React, { useState } from 'react';
import { getWonderkidCardData } from '../../engine/youthAcademy';

export default function DraftPick({ team, pickNumber, availableWonderkids, onSelect, onClose }) {
  const [selectedWonderkid, setSelectedWonderkid] = useState(null);
  const [sortBy, setSortBy] = useState('rating'); // rating, potential, age, position
  const [filterPosition, setFilterPosition] = useState('all');

  // Sort and filter wonderkids
  const getFilteredWonderkids = () => {
    let filtered = [...availableWonderkids];

    // Apply position filter
    if (filterPosition !== 'all') {
      filtered = filtered.filter(wk => wk.positionCategory === filterPosition);
    }

    // Apply sort
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'potential':
        filtered.sort((a, b) => b.potential - a.potential);
        break;
      case 'age':
        filtered.sort((a, b) => a.age - b.age);
        break;
      case 'position':
        filtered.sort((a, b) => a.positionCategory.localeCompare(b.positionCategory));
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredWonderkids = getFilteredWonderkids();

  const handleConfirmPick = () => {
    if (selectedWonderkid) {
      onSelect(selectedWonderkid);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className="p-6 border-b border-slate-700"
          style={{ backgroundColor: team.color + '20' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{team.logoEmoji}</span>
              <div>
                <h2 className="text-2xl font-bold text-white">{team.name}</h2>
                <p className="text-slate-300">
                  Pick #{pickNumber} - Select Your Wonderkid
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl"
            >
              &#x2715;
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-slate-700/50 border-b border-slate-700 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-600 text-white rounded px-3 py-1 text-sm"
            >
              <option value="rating">Rating</option>
              <option value="potential">Potential</option>
              <option value="age">Age</option>
              <option value="position">Position</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Position:</span>
            <div className="flex gap-1">
              {['all', 'GK', 'DEF', 'MID', 'FWD'].map(pos => (
                <button
                  key={pos}
                  onClick={() => setFilterPosition(pos)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    filterPosition === pos
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  {pos === 'all' ? 'All' : pos}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Wonderkid Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWonderkids.map((wk) => {
              const cardData = getWonderkidCardData(wk);
              const isSelected = selectedWonderkid?.id === wk.id;

              return (
                <div
                  key={wk.id}
                  onClick={() => setSelectedWonderkid(wk)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-green-900/30 border-green-500'
                      : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-lg font-bold text-white">{wk.name}</div>
                      <div className="text-slate-400 text-sm">
                        {wk.nationality} | Age {wk.age}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${cardData.ratingColor}`}>
                        {wk.rating}
                      </div>
                      <div className="text-xs text-slate-400">OVR</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        wk.positionCategory === 'GK' ? 'bg-amber-600' :
                        wk.positionCategory === 'DEF' ? 'bg-blue-600' :
                        wk.positionCategory === 'MID' ? 'bg-green-600' :
                        'bg-red-600'
                      } text-white`}>
                        {wk.position}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className={`text-lg font-bold ${cardData.potentialColor}`}>
                          {wk.potential}
                        </div>
                        <div className="text-xs text-slate-400">POT</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-purple-400">
                          {cardData.potentialLabel}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Growth potential indicator */}
                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Growth Potential</span>
                      <span className="text-green-400">+{wk.potential - wk.rating}</span>
                    </div>
                    <div className="mt-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-300"
                        style={{ width: `${((wk.potential - wk.rating) / 20) * 100}%` }}
                      />
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 text-center text-green-400 text-sm font-semibold">
                      &#10003; Selected
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredWonderkids.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No wonderkids match your filters
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-700/50 border-t border-slate-700 flex justify-between items-center">
          <div className="text-slate-400">
            {selectedWonderkid ? (
              <span>
                Selected: <span className="text-white font-semibold">{selectedWonderkid.name}</span>
                {' '}({selectedWonderkid.rating} OVR, {selectedWonderkid.potential} POT)
              </span>
            ) : (
              <span>Select a wonderkid to draft</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmPick}
              disabled={!selectedWonderkid}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-bold"
            >
              Confirm Pick
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
