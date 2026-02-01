import React, { useEffect, useRef } from 'react';
import { useAuction } from '../context/AuctionContext';

export default function BidHistory() {
  const { state, formatCurrency, getTeamById } = useAuction();
  const { bidHistory } = state;
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new bids come in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [bidHistory]);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-700">
        <h3 className="font-semibold text-slate-300">Activity Log</h3>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[300px]"
      >
        {bidHistory.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <div className="text-sm">No bids yet</div>
            <div className="text-xs mt-1">Waiting for teams to bid...</div>
          </div>
        ) : (
          bidHistory.map((entry, index) => {
            const team = getTeamById(entry.teamId);

            if (entry.type === 'bid') {
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm bg-slate-700/50 rounded px-3 py-2"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: team?.color }}
                  />
                  <span className="font-medium text-white">{team?.shortName || entry.teamName}</span>
                  <span className="text-slate-400">bid</span>
                  <span className="text-green-400 font-semibold ml-auto">
                    {formatCurrency(entry.amount)}
                  </span>
                </div>
              );
            }

            if (entry.type === 'pass') {
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm bg-red-900/20 rounded px-3 py-2"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: team?.color }}
                  />
                  <span className="font-medium text-white">{team?.shortName || entry.teamName}</span>
                  <span className="text-red-400">passed</span>
                </div>
              );
            }

            if (entry.type === 'sold') {
              return (
                <div
                  key={index}
                  className="flex items-center justify-center text-sm bg-green-900/30 rounded px-3 py-2 border border-green-500/30"
                >
                  <span className="text-green-400 font-semibold">SOLD!</span>
                </div>
              );
            }

            if (entry.type === 'rtm') {
              return (
                <div
                  key={index}
                  className="flex items-center justify-center text-sm bg-purple-900/30 rounded px-3 py-2 border border-purple-500/30"
                >
                  <span className="text-purple-400 font-semibold">RTM USED!</span>
                </div>
              );
            }

            return null;
          })
        )}
      </div>
    </div>
  );
}
