import React from 'react';
import { useMatch } from '../../context/MatchContext';

export default function EventPopup() {
  const { eventPopup, dismissPopup, matchState } = useMatch();

  if (!eventPopup) return null;

  const isGoal = eventPopup.type === 'goal';
  const isRedCard = eventPopup.type === 'redCard';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
      <div
        className={`relative max-w-md w-full mx-4 rounded-2xl overflow-hidden shadow-2xl transform animate-popup ${
          isGoal ? 'bg-gradient-to-br from-green-600 to-green-800' : 'bg-gradient-to-br from-red-600 to-red-900'
        }`}
      >
        {/* Animated background effect */}
        <div className="absolute inset-0 overflow-hidden">
          {isGoal && (
            <>
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full animate-pulse" />
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full animate-pulse delay-300" />
            </>
          )}
        </div>

        {/* Content */}
        <div className="relative p-8 text-center">
          {/* Icon */}
          <div className="text-7xl mb-4 animate-bounce">
            {isGoal ? '⚽' : '🟥'}
          </div>

          {/* Title */}
          <h2 className="text-4xl font-black text-white mb-2 tracking-wider">
            {isGoal ? 'GOAL!' : 'RED CARD!'}
          </h2>

          {/* Minute */}
          <div className="text-white/80 text-lg mb-4">
            {eventPopup.minute}'
          </div>

          {/* Team & Player Info */}
          <div
            className="inline-block px-6 py-3 rounded-xl mb-4"
            style={{ backgroundColor: eventPopup.teamColor || '#333' }}
          >
            <div className="text-white font-bold text-xl">
              {eventPopup.teamName}
            </div>
          </div>

          {/* Scorer / Player */}
          <div className="text-white text-2xl font-semibold mb-2">
            {isGoal ? eventPopup.scorer : eventPopup.player}
          </div>

          {/* Additional info */}
          {isGoal && (
            <div className="text-white/90 text-3xl font-bold mt-4">
              {matchState?.homeTeam?.name} {eventPopup.newScore?.home} - {eventPopup.newScore?.away} {matchState?.awayTeam?.name}
            </div>
          )}

          {isRedCard && (
            <div className="text-white/80 text-sm mt-2">
              {eventPopup.isSecondYellow ? 'Second Yellow Card' : 'Straight Red Card'}
              <br />
              <span className="italic">{eventPopup.reason}</span>
              <div className="mt-3 text-white/70 text-xs">
                Team now playing with reduced strength
              </div>
            </div>
          )}

          {/* OK Button */}
          <button
            onClick={dismissPopup}
            className={`mt-8 px-12 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
              isGoal
                ? 'bg-white text-green-700 hover:bg-green-100'
                : 'bg-white text-red-700 hover:bg-red-100'
            }`}
          >
            Continue Match
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popup {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-popup {
          animation: popup 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
