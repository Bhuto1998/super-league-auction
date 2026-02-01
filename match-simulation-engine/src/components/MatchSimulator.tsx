'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MatchState, Commentary as CommentaryType, ManagerNote, Team, MatchEvent } from '@/lib/types';
import { MatchSimulationEngine } from '@/lib/simulation-engine';
import { soundEffects } from '@/lib/sounds';
import MatchBoard from './MatchBoard';
import Scoreboard from './Scoreboard';
import Commentary from './Commentary';
import ManagerNotes from './ManagerNotes';
import TeamLineup from './TeamLineup';
import MatchControls from './MatchControls';

interface MatchSimulatorProps {
  homeTeam: Team;
  awayTeam: Team;
  onBackToSelection: () => void;
}

export default function MatchSimulator({ homeTeam, awayTeam, onBackToSelection }: MatchSimulatorProps) {
  const engineRef = useRef<MatchSimulationEngine | null>(null);
  const ambientRef = useRef<{ stop: () => void } | null>(null);
  const [commentaries, setCommentaries] = useState<CommentaryType[]>([]);
  const [homeNotes, setHomeNotes] = useState<ManagerNote[]>([]);
  const [awayNotes, setAwayNotes] = useState<ManagerNote[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showMatchEndModal, setShowMatchEndModal] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  // Used to force re-renders when state changes
  const [, setUpdateTrigger] = useState(0);

  // Play sound effects based on events
  const handleEvent = useCallback((event: MatchEvent) => {
    if (!soundEnabled) return;

    switch (event.type) {
      case 'goal':
        soundEffects.playGoal();
        break;
      case 'kick_off':
      case 'half_time':
      case 'full_time':
        soundEffects.playWhistle(event.type === 'full_time' ? 1.0 : 0.5);
        break;
      case 'yellow_card':
      case 'red_card':
        soundEffects.playCard();
        break;
      case 'foul':
        soundEffects.playFoul();
        break;
      case 'shot_saved':
      case 'shot_missed':
        soundEffects.playKick();
        break;
    }
  }, [soundEnabled]);

  // Create engine once on mount using useMemo to get initial state synchronously
  const initialEngine = useMemo(() => {
    const engine = new MatchSimulationEngine(homeTeam, awayTeam, {
      matchDurationMs: 60000, // 1 minute = 2X speed
    });
    return engine;
  }, [homeTeam, awayTeam]);

  // Get initial state synchronously
  const [matchState, setMatchState] = useState<MatchState>(() => initialEngine.getState());

  // Set up engine and callbacks
  useEffect(() => {
    engineRef.current = initialEngine;

    initialEngine.onStateChangeCallback((state) => {
      setMatchState(state);
      setUpdateTrigger((prev) => prev + 1);
    });

    initialEngine.onCommentaryCallback((commentary) => {
      setCommentaries((prev) => [...prev, commentary]);
    });

    initialEngine.onManagerNoteCallback((team, note) => {
      if (team === 'home') {
        setHomeNotes((prev) => [...prev, note]);
      } else {
        setAwayNotes((prev) => [...prev, note]);
      }
    });

    initialEngine.onEventCallback((event) => {
      handleEvent(event);
    });

    return () => {
      initialEngine.stop();
      ambientRef.current?.stop();
    };
  }, [initialEngine, handleEvent]);

  // Handle match end - show modal and countdown to redirect
  useEffect(() => {
    if (matchState.isFullTime && !showMatchEndModal) {
      setShowMatchEndModal(true);
      ambientRef.current?.stop();
      ambientRef.current = null;

      // Start countdown
      let count = 5;
      setRedirectCountdown(count);

      const countdownInterval = setInterval(() => {
        count--;
        setRedirectCountdown(count);

        if (count <= 0) {
          clearInterval(countdownInterval);
          onBackToSelection();
        }
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [matchState.isFullTime, showMatchEndModal, onBackToSelection]);

  const handleStart = () => {
    if (engineRef.current) {
      engineRef.current.start();
      setIsRunning(true);
      setIsPaused(false);
      // Force immediate state update
      setMatchState(engineRef.current.getState());
      // Start ambient crowd sound
      if (soundEnabled) {
        ambientRef.current = soundEffects.playAmbientCrowd();
      }
    }
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resume();
      setIsPaused(false);
    }
  };

  const handleReset = () => {
    engineRef.current?.stop();
    ambientRef.current?.stop();
    ambientRef.current = null;

    // Create a new engine
    const newEngine = new MatchSimulationEngine(homeTeam, awayTeam, {
      matchDurationMs: 60000, // 1 minute = 2X speed
    });

    newEngine.onStateChangeCallback((state) => {
      setMatchState(state);
      setUpdateTrigger((prev) => prev + 1);
    });

    newEngine.onCommentaryCallback((commentary) => {
      setCommentaries((prev) => [...prev, commentary]);
    });

    newEngine.onManagerNoteCallback((team, note) => {
      if (team === 'home') {
        setHomeNotes((prev) => [...prev, note]);
      } else {
        setAwayNotes((prev) => [...prev, note]);
      }
    });

    newEngine.onEventCallback((event) => {
      handleEvent(event);
    });

    engineRef.current = newEngine;
    setMatchState(newEngine.getState());
    setIsRunning(false);
    setIsPaused(false);
    setCommentaries([]);
    setHomeNotes([]);
    setAwayNotes([]);
  };

  const handleSubstitution = (
    teamKey: 'home' | 'away',
    playerOutId: string,
    playerInId: string
  ) => {
    if (engineRef.current) {
      const success = engineRef.current.makeSubstitution(teamKey, playerOutId, playerInId);
      if (success) {
        setMatchState(engineRef.current.getState());
      }
    }
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundEffects.setEnabled(newState);
    if (!newState) {
      ambientRef.current?.stop();
      ambientRef.current = null;
    } else if (isRunning && !isPaused) {
      ambientRef.current = soundEffects.playAmbientCrowd();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 py-4 px-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            Super League <span className="text-yellow-400">Match Simulator</span>
          </h1>
          <div className="flex items-center gap-4">
            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                soundEnabled
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
              title={soundEnabled ? 'Sound On' : 'Sound Off'}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <MatchControls
              isRunning={isRunning}
              isPaused={isPaused}
              isComplete={matchState.isFullTime}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onReset={handleReset}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Scoreboard */}
        <Scoreboard state={matchState} />

        {/* Main content grid */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left sidebar - Home team */}
          <div className="space-y-4">
            <ManagerNotes
              team={matchState.homeTeam}
              notes={homeNotes}
              isHome={true}
            />
            <TeamLineup
              team={matchState.homeTeam}
              isHome={true}
              onSubstitute={(outId, inId) => handleSubstitution('home', outId, inId)}
            />
          </div>

          {/* Center - Match board and commentary */}
          <div className="lg:col-span-2 space-y-4">
            <MatchBoard state={matchState} />
            <Commentary commentaries={commentaries} events={matchState.events} />
          </div>

          {/* Right sidebar - Away team */}
          <div className="space-y-4">
            <ManagerNotes
              team={matchState.awayTeam}
              notes={awayNotes}
              isHome={false}
            />
            <TeamLineup
              team={matchState.awayTeam}
              isHome={false}
              onSubstitute={(outId, inId) => handleSubstitution('away', outId, inId)}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-500 text-sm">
        Super League Season 3 - Match Simulation Engine | 2X Speed
      </footer>

      {/* Match End Modal */}
      {showMatchEndModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-8 max-w-lg w-full mx-4 border border-slate-600 shadow-2xl text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Match Finished!</h2>

            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-2"
                  style={{ backgroundColor: matchState.homeTeam.color }}
                >
                  {matchState.homeTeam.shortName.slice(0, 2)}
                </div>
                <p className="text-white font-medium">{matchState.homeTeam.name}</p>
              </div>

              <div className="text-5xl font-bold text-white">
                {matchState.homeScore} - {matchState.awayScore}
              </div>

              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-2"
                  style={{ backgroundColor: matchState.awayTeam.color }}
                >
                  {matchState.awayTeam.shortName.slice(0, 2)}
                </div>
                <p className="text-white font-medium">{matchState.awayTeam.name}</p>
              </div>
            </div>

            <p className="text-slate-400 mb-6">
              {matchState.homeScore > matchState.awayScore
                ? `${matchState.homeTeam.name} wins!`
                : matchState.awayScore > matchState.homeScore
                ? `${matchState.awayTeam.name} wins!`
                : "It's a draw!"}
            </p>

            <div className="text-slate-300">
              Returning to team selection in{' '}
              <span className="text-yellow-400 font-bold text-xl">{redirectCountdown}</span>
              {' '}seconds...
            </div>

            <button
              onClick={onBackToSelection}
              className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              Back to Team Selection Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
