import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuction } from '../context/AuctionContext';
import {
  getFabrizioAuctionComment,
  getAllManagerAuctionTweets,
  getAllPresidentAuctionTweets,
} from '../engine/commentary';

// Milestone intervals
const FABRIZIO_INTERVAL = 10; // Every 10 players
const MANAGER_INTERVAL = 25; // Every 25 players

export default function AuctionMilestones() {
  const { state } = useAuction();
  const { soldPlayers, teams } = state;

  const [showMilestone, setShowMilestone] = useState(null);
  const [lastFabrizioMilestone, setLastFabrizioMilestone] = useState(0);
  const [lastManagerMilestone, setLastManagerMilestone] = useState(0);

  // Track recent sales for context
  const prevSoldCount = useRef(0);

  // Calculate total spent
  const totalSpent = teams.reduce((sum, team) => {
    const retentionCost = team.retainedPlayers?.reduce((s, p) => s + (p.retentionPrice || 0), 0) || 0;
    const auctionCost = team.auctionedPlayers?.reduce((s, p) => s + (p.purchasePrice || 0), 0) || 0;
    return sum + retentionCost + auctionCost;
  }, 0);

  // Check for milestones
  useEffect(() => {
    const soldCount = soldPlayers.length;

    // Get recent sales (last 10 players)
    const recentStartIdx = Math.max(0, soldCount - 10);
    const recentSales = soldPlayers.slice(recentStartIdx);

    // Build context for situational comments
    const context = {
      playerCount: soldCount,
      totalSpent,
      teams,
      recentSales,
    };

    // Check for manager/president milestone (every 25)
    const managerMilestone = Math.floor(soldCount / MANAGER_INTERVAL) * MANAGER_INTERVAL;
    if (managerMilestone > 0 && managerMilestone > lastManagerMilestone) {
      setLastManagerMilestone(managerMilestone);
      setShowMilestone({
        type: 'manager',
        count: managerMilestone,
        fabrizio: getFabrizioAuctionComment(context),
        managers: getAllManagerAuctionTweets(context),
        presidents: getAllPresidentAuctionTweets(context),
      });
      prevSoldCount.current = soldCount;
      return;
    }

    // Check for Fabrizio milestone (every 10, but not at 25, 50, etc which are manager milestones)
    const fabrizioMilestone = Math.floor(soldCount / FABRIZIO_INTERVAL) * FABRIZIO_INTERVAL;
    if (fabrizioMilestone > 0 && fabrizioMilestone > lastFabrizioMilestone && fabrizioMilestone % MANAGER_INTERVAL !== 0) {
      setLastFabrizioMilestone(fabrizioMilestone);
      setShowMilestone({
        type: 'fabrizio',
        count: fabrizioMilestone,
        fabrizio: getFabrizioAuctionComment(context),
      });
      prevSoldCount.current = soldCount;
    }
  }, [soldPlayers.length, totalSpent, lastFabrizioMilestone, lastManagerMilestone, soldPlayers, teams]);

  const dismissMilestone = useCallback(() => {
    setShowMilestone(null);
  }, []);

  if (!showMilestone) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-600 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-t-2xl">
          <div className="text-center">
            <div className="text-4xl mb-2">&#127881;</div>
            <h2 className="text-2xl font-bold text-white">
              {showMilestone.count} Players Sold!
            </h2>
            <p className="text-purple-200 text-sm">Auction Milestone Update</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Fabrizio Comment */}
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-4 border border-blue-500/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">F</div>
              <div>
                <span className="text-white font-semibold">Fabrizio Romano</span>
                <span className="text-blue-400 text-sm ml-2">@FabrizioRomano</span>
                <span className="text-blue-400 ml-1">&#10004;</span>
              </div>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">{showMilestone.fabrizio}</p>
            <div className="flex gap-6 mt-3 text-slate-500 text-xs">
              <span>&#128172; 1.2K</span>
              <span>&#128257; 4.5K</span>
              <span>&#10084; 23.1K</span>
            </div>
          </div>

          {/* Manager & President Tweets (only for 25-player milestones) */}
          {showMilestone.type === 'manager' && (
            <>
              {/* Manager Tweets */}
              <div className="space-y-3">
                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wide">Manager Reactions</h3>
                {showMilestone.managers.map((manager, idx) => (
                  <TweetCard
                    key={`manager-${idx}`}
                    name={manager.name}
                    handle={manager.handle}
                    team={manager.team}
                    tweet={manager.tweet}
                    isManager={true}
                  />
                ))}
              </div>

              {/* President Tweets */}
              <div className="space-y-3">
                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wide">Club President Reactions</h3>
                {showMilestone.presidents.map((president, idx) => (
                  <TweetCard
                    key={`president-${idx}`}
                    name={president.name}
                    handle={president.handle}
                    team={president.team}
                    tweet={president.tweet}
                    title={president.title}
                    isPresident={true}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Dismiss Button */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={dismissMilestone}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-3 rounded-xl font-bold text-lg transition-all"
          >
            Continue Auction
          </button>
        </div>
      </div>
    </div>
  );
}

// Tweet Card Component
function TweetCard({ name, handle, team, tweet, title, isPresident }) {
  const bgColor = isPresident
    ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-yellow-600/50'
    : 'bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-slate-600/50';

  const avatarBg = isPresident ? 'bg-yellow-600' : 'bg-slate-600';
  const initial = name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className={`${bgColor} rounded-xl p-3 border`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${avatarBg} flex items-center justify-center text-white font-bold text-sm`}>
          {initial}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-sm">{name}</span>
            <span className="text-slate-500 text-xs">{handle}</span>
          </div>
          <div className="text-slate-500 text-xs mb-1">
            {title || 'Head Coach'} - {team}
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">"{tweet}"</p>
          <div className="flex gap-4 mt-2 text-slate-600 text-xs">
            <span>&#128172; {Math.floor(Math.random() * 500 + 100)}</span>
            <span>&#128257; {Math.floor(Math.random() * 2000 + 500)}</span>
            <span>&#10084; {Math.floor(Math.random() * 10000 + 1000)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
