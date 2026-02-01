'use client';

import React from 'react';
import { ManagerNote, Team } from '@/lib/types';

interface ManagerNotesProps {
  team: Team;
  notes: ManagerNote[];
  isHome: boolean;
}

const getNoteIcon = (type: ManagerNote['type']): string => {
  switch (type) {
    case 'tactical':
      return '📋';
    case 'injury':
      return '🏥';
    case 'performance':
      return '📊';
    case 'substitution':
      return '🔄';
    case 'warning':
      return '⚠️';
    default:
      return '📝';
  }
};

const getPriorityColor = (priority: ManagerNote['priority']): string => {
  switch (priority) {
    case 'high':
      return 'border-red-500 bg-red-900/30';
    case 'medium':
      return 'border-yellow-500 bg-yellow-900/30';
    case 'low':
      return 'border-green-500 bg-green-900/30';
    default:
      return 'border-slate-500 bg-slate-900/30';
  }
};

export default function ManagerNotes({ team, notes }: ManagerNotesProps) {
  const recentNotes = notes.slice(-5).reverse();

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-700 overflow-hidden h-full flex flex-col">
      <div
        className="px-4 py-3 border-b border-slate-700 flex items-center gap-3"
        style={{ backgroundColor: `${team.color}20` }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: team.color }}
        >
          {team.shortName.slice(0, 2)}
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">{team.manager}</h3>
          <p className="text-slate-400 text-xs">Manager Notes</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[250px]">
        {recentNotes.length === 0 ? (
          <p className="text-slate-500 text-center py-4 text-sm">
            No notes yet...
          </p>
        ) : (
          recentNotes.map((note, index) => (
            <div
              key={index}
              className={`
                p-3 rounded-lg border-l-4 transition-all
                ${getPriorityColor(note.priority)}
              `}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">{getNoteIcon(note.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200">{note.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{note.minute}&apos;</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        note.priority === 'high'
                          ? 'bg-red-600 text-white'
                          : note.priority === 'medium'
                          ? 'bg-yellow-600 text-black'
                          : 'bg-green-600 text-white'
                      }`}
                    >
                      {note.priority}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Substitutions remaining */}
      <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Substitutions</span>
          <span className="text-white font-bold">
            {team.substitutionsMade} / {team.maxSubstitutions}
          </span>
        </div>
        <div className="mt-2 flex gap-1">
          {[...Array(team.maxSubstitutions)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full ${
                i < team.substitutionsMade ? 'bg-orange-500' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
