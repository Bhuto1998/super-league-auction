import React, { useState } from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { getStoredDisplayName } from '../../lib/supabase';

export default function LandingPage({ onStartSinglePlayer }) {
  const {
    createRoom,
    joinRoom,
    loading,
    error,
    clearError,
    isSupabaseConfigured,
  } = useMultiplayer();

  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [name, setName] = useState(getStoredDisplayName());
  const [roomCode, setRoomCode] = useState('');

  const handleCreateRoom = async () => {
    if (!name.trim()) return;
    await createRoom(name.trim());
    // Room creation handled by context, will redirect via parent
  };

  const handleJoinRoom = async () => {
    if (!name.trim() || !roomCode.trim()) return;
    await joinRoom(roomCode.trim(), name.trim());
    // Room join handled by context, will redirect via parent
  };

  const handleBack = () => {
    setMode(null);
    clearError();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">&#9917;</div>
          <h1 className="text-3xl font-bold text-white mb-2">Super League Auction</h1>
          <p className="text-slate-400">Season 4</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={clearError}
              className="text-red-300 hover:text-red-200 text-xs mt-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Menu */}
        {mode === null && (
          <div className="space-y-4">
            <button
              onClick={onStartSinglePlayer}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-lg"
            >
              Quick Play
              <span className="block text-sm font-normal opacity-75">Single auction + tournament</span>
            </button>

            {isSupabaseConfigured ? (
              <>
                <button
                  onClick={() => setMode('create')}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-lg"
                >
                  Create Room
                  <span className="block text-sm font-normal opacity-75">Host a multiplayer auction</span>
                </button>

                <button
                  onClick={() => setMode('join')}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-lg"
                >
                  Join Room
                  <span className="block text-sm font-normal opacity-75">Enter a room code</span>
                </button>
              </>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                <p className="text-slate-400 text-sm">
                  Multiplayer requires Supabase configuration.
                </p>
                <p className="text-slate-500 text-xs mt-2">
                  Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
                </p>
              </div>
            )}
          </div>
        )}

        {/* Create Room Form */}
        {mode === 'create' && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Create Room</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  maxLength={20}
                  autoFocus
                />
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={!name.trim() || loading}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-lg font-bold transition-all"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>

              <button
                onClick={handleBack}
                className="w-full bg-slate-600 hover:bg-slate-500 text-white py-2 rounded-lg text-sm transition-all"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Join Room Form */}
        {mode === 'join' && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Join Room</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={20}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ABCD12"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-widest text-center text-xl font-mono"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={!name.trim() || !roomCode.trim() || loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-lg font-bold transition-all"
              >
                {loading ? 'Joining...' : 'Join Room'}
              </button>

              <button
                onClick={handleBack}
                className="w-full bg-slate-600 hover:bg-slate-500 text-white py-2 rounded-lg text-sm transition-all"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          Control Real Madrid, Barcelona, or Bayern Munich
        </div>
      </div>
    </div>
  );
}
