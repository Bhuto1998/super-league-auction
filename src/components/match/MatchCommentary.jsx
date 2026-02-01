import React, { useEffect, useRef } from 'react';
import { useMatch } from '../../context/MatchContext';

/**
 * Live commentary panel with scrolling updates
 */
export default function MatchCommentary() {
  const { commentary, matchState } = useMatch();
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new commentary
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commentary]);

  if (!matchState) return null;

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
      {/* Header */}
      <div className="bg-slate-700 px-4 py-2 flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Live Commentary
        </h3>
        <span className="text-slate-400 text-sm">{commentary.length} updates</span>
      </div>

      {/* Commentary list */}
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto p-4 space-y-3"
      >
        {commentary.length === 0 ? (
          <div className="text-slate-500 text-center py-8">
            Waiting for match to start...
          </div>
        ) : (
          commentary.map((entry, idx) => (
            <CommentaryEntry key={idx} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}

function CommentaryEntry({ entry }) {
  const getEntryStyle = () => {
    if (entry.isGoal) {
      return 'bg-green-900/50 border-l-4 border-green-500';
    }
    if (entry.isCard) {
      return 'bg-yellow-900/30 border-l-4 border-yellow-500';
    }
    if (entry.type === 'phase') {
      return 'bg-blue-900/30 border-l-4 border-blue-500';
    }
    if (entry.type === 'substitution') {
      return 'bg-purple-900/30 border-l-4 border-purple-500';
    }
    if (entry.type === 'shot') {
      return 'bg-slate-700/50 border-l-4 border-slate-500';
    }
    return 'bg-slate-700/30';
  };

  const getIcon = () => {
    if (entry.isGoal) return '⚽';
    if (entry.isCard) return '🟨';
    if (entry.type === 'phase') return '📢';
    if (entry.type === 'substitution') return '🔄';
    if (entry.type === 'shot') return '🎯';
    if (entry.type === 'foul') return '⚠️';
    if (entry.type === 'injury') return '🏥';
    return '📝';
  };

  return (
    <div className={`rounded-lg p-3 ${getEntryStyle()}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{getIcon()}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {entry.minute}'
            </span>
            {entry.isGoal && (
              <span className="text-xs font-bold text-green-400 uppercase">GOAL!</span>
            )}
          </div>
          <p className={`text-sm ${entry.isGoal ? 'text-green-300 font-semibold' : 'text-slate-300'}`}>
            {entry.text}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Manager notes panel
 */
export function ManagerNotes({ team = 'home' }) {
  const { managerNotes, matchState } = useMatch();
  const scrollRef = useRef(null);

  const notes = team === 'home' ? managerNotes.home : managerNotes.away;
  const teamData = team === 'home' ? matchState?.homeTeam : matchState?.awayTeam;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  if (!matchState) return null;

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
      {/* Header */}
      <div
        className="px-4 py-2 flex items-center gap-2"
        style={{ backgroundColor: teamData?.color + '30' }}
      >
        <span className="text-lg">📋</span>
        <h3 className="text-white font-semibold">Manager Notes</h3>
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: teamData?.color }}
        />
        <span className="text-slate-300 text-sm">{teamData?.name}</span>
      </div>

      {/* Notes list */}
      <div
        ref={scrollRef}
        className="h-48 overflow-y-auto p-4 space-y-2"
      >
        {notes.length === 0 ? (
          <div className="text-slate-500 text-center py-4 text-sm">
            Tactical notes will appear here...
          </div>
        ) : (
          notes.slice(-10).map((note, idx) => (
            <div
              key={idx}
              className="bg-slate-700/50 rounded-lg p-2 text-sm"
            >
              <span className="text-xs text-slate-500 font-mono mr-2">{note.minute}'</span>
              <span className="text-slate-300">{note.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
