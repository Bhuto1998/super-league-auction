import React, { useState } from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import TeamSelector from './TeamSelector';
import PlayerList from './PlayerList';
import ConnectionStatus from './ConnectionStatus';

export default function RoomLobby({ onGameStart }) {
  const {
    roomCode,
    players,
    isHost,
    localTeamId,
    localPlayer,
    allPlayersReady,
    leaveRoom,
    setReady,
    startGame,
    loading,
    error,
  } = useMultiplayer();

  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleToggleReady = async () => {
    await setReady(!localPlayer?.is_ready);
  };

  const handleStartGame = async () => {
    const success = await startGame();
    if (success && onGameStart) {
      onGameStart();
    }
  };

  const canBeReady = localTeamId !== null;
  const isReady = localPlayer?.is_ready || false;

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={leaveRoom}
            className="text-slate-400 hover:text-white transition-colors"
          >
            &#8592; Leave Room
          </button>
          <ConnectionStatus />
        </div>

        {/* Room Code Display */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6 text-center">
          <p className="text-slate-400 text-sm mb-2">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-mono font-bold text-white tracking-widest">
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm transition-all"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-slate-500 text-sm mt-3">
            Share this code with your friends to join
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Team Selector */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Choose Your Team</h2>
          <TeamSelector />
        </div>

        {/* Player List */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Players ({players.length}/3)
          </h2>
          <PlayerList />
        </div>

        {/* Ready/Start Controls */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          {!canBeReady ? (
            <div className="text-center text-slate-400">
              Select a team to continue
            </div>
          ) : isHost ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Your Status:</span>
                <button
                  onClick={handleToggleReady}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    isReady
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-600 hover:bg-slate-500 text-white'
                  }`}
                >
                  {isReady ? 'Ready' : 'Not Ready'}
                </button>
              </div>

              <button
                onClick={handleStartGame}
                disabled={!allPlayersReady || loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white py-4 rounded-lg font-bold text-lg transition-all"
              >
                {loading ? 'Starting...' : 'Start Auction'}
              </button>

              {!allPlayersReady && (
                <p className="text-center text-slate-500 text-sm">
                  {players.length < 2
                    ? 'Waiting for more players to join...'
                    : 'Waiting for all players to select a team and ready up...'}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Your Status:</span>
                <button
                  onClick={handleToggleReady}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    isReady
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-600 hover:bg-slate-500 text-white'
                  }`}
                >
                  {isReady ? 'Ready' : 'Click when Ready'}
                </button>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-slate-400">
                  Waiting for host to start the auction...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-2">How it works</h3>
          <ul className="text-slate-400 text-sm space-y-1">
            <li>&#8226; Each player controls one team (Real Madrid, Barcelona, or Bayern)</li>
            <li>&#8226; The remaining 7 teams are AI-controlled</li>
            <li>&#8226; The host's device runs the auction and AI logic</li>
            <li>&#8226; Actions are synced in real-time to all players</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
