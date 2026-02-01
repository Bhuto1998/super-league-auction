'use client';

import React from 'react';

interface MatchControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export default function MatchControls({
  isRunning,
  isPaused,
  isComplete,
  onStart,
  onPause,
  onResume,
  onReset,
}: MatchControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {!isRunning && !isComplete && (
        <button
          onClick={onStart}
          className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400
                     rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-green-500/30 transition-all
                     flex items-center gap-2"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          Start Match
        </button>
      )}

      {isRunning && !isComplete && !isPaused && (
        <button
          onClick={onPause}
          className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-xl text-white font-bold
                     shadow-lg transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Pause
        </button>
      )}

      {isRunning && !isComplete && isPaused && (
        <button
          onClick={onResume}
          className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold
                     shadow-lg transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          Resume
        </button>
      )}

      {(isRunning || isComplete) && (
        <button
          onClick={onReset}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold
                     shadow-lg transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
          Reset
        </button>
      )}

      {isComplete && (
        <div className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl text-white font-bold">
          🏆 Match Complete!
        </div>
      )}
    </div>
  );
}
