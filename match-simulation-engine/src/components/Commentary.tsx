'use client';

import React, { useRef, useEffect } from 'react';
import { Commentary as CommentaryType, MatchEvent } from '@/lib/types';

interface CommentaryProps {
  commentaries: CommentaryType[];
  events: MatchEvent[];
}

const getEventIcon = (type: string): string => {
  switch (type) {
    case 'goal':
      return '⚽';
    case 'yellow_card':
      return '🟨';
    case 'red_card':
      return '🟥';
    case 'substitution':
      return '🔄';
    case 'injury':
      return '🏥';
    case 'shot_saved':
      return '🧤';
    case 'shot_missed':
      return '❌';
    case 'corner':
      return '📐';
    case 'foul':
      return '⚠️';
    case 'half_time':
      return '⏸️';
    case 'full_time':
      return '🏁';
    case 'kick_off':
      return '▶️';
    case 'tackle':
      return '💪';
    default:
      return '📝';
  }
};

export default function Commentary({ commentaries, events }: CommentaryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commentaries]);

  // Combine and sort by minute
  const allItems = [
    ...commentaries.map((c) => ({ ...c, isEvent: false })),
  ].sort((a, b) => b.minute - a.minute);

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-700 overflow-hidden h-full flex flex-col">
      <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span className="text-xl">📺</span>
          Live Commentary
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px]"
      >
        {allItems.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            Match commentary will appear here...
          </p>
        ) : (
          allItems.map((item, index) => {
            const event = events.find(
              (e) => e.minute === item.minute && e.description === item.text
            );
            const icon = event ? getEventIcon(event.type) : '💬';

            return (
              <div
                key={index}
                className={`
                  flex gap-3 p-3 rounded-lg transition-all
                  ${
                    item.isHighlight
                      ? 'bg-gradient-to-r from-yellow-900/40 to-transparent border-l-4 border-yellow-500'
                      : 'bg-slate-800/50 border-l-4 border-slate-600'
                  }
                `}
              >
                <div className="flex-shrink-0 w-12 text-center">
                  <span className="text-2xl">{icon}</span>
                  <p className="text-xs text-slate-500 mt-1">{item.minute}&apos;</p>
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm ${
                      item.isHighlight ? 'text-yellow-100 font-medium' : 'text-slate-300'
                    }`}
                  >
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
