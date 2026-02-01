import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase, getOrCreateUserId, isSupabaseConfigured, getStoredDisplayName, setStoredDisplayName } from '../lib/supabase';
import { useRoom } from '../hooks/useRoom';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

const MultiplayerContext = createContext(null);

const PLAYABLE_TEAMS = ['real-madrid', 'barcelona', 'bayern'];

export function MultiplayerProvider({ children }) {
  // Connection state
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected'

  // Room state
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [localTeamId, setLocalTeamId] = useState(null);
  const [displayName, setDisplayName] = useState(getStoredDisplayName());

  // Action queue for clients
  const auctionDispatchRef = useRef(null);
  const auctionStateRef = useRef(null);

  const roomHook = useRoom();
  const userId = getOrCreateUserId();

  // Fetch players from database
  const fetchPlayers = useCallback(async () => {
    if (!room?.id || !isSupabaseConfigured()) return;

    const { data } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true });

    if (data) {
      setPlayers(data);
      // Update local team ID
      const localPlayer = data.find(p => p.user_id === userId);
      if (localPlayer) {
        setLocalTeamId(localPlayer.team_id);
        setIsHost(localPlayer.is_host);
      }
    }
  }, [room?.id, userId]);

  // Handle player changes
  const handlePlayersChange = useCallback(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Handle room changes
  const handleRoomChange = useCallback((newRoom) => {
    setRoom(prev => ({ ...prev, ...newRoom }));
  }, []);

  // Handle incoming auction actions (for clients)
  const handleAuctionAction = useCallback((action) => {
    if (action.type === 'SYNC_STATE' && !isHost) {
      // Client receives full state from host
      if (auctionDispatchRef.current) {
        auctionDispatchRef.current({ type: 'LOAD_STATE', payload: action.payload });
      }
    } else if (!isHost && auctionDispatchRef.current) {
      // Client receives action from host
      auctionDispatchRef.current(action);
    }
  }, [isHost]);

  // Handle presence sync
  const handlePresenceSync = useCallback((state) => {
    // Update connection status for players
    const onlineUsers = new Set();
    Object.values(state).flat().forEach(presence => {
      onlineUsers.add(presence.user_id);
    });

    setPlayers(prev => prev.map(player => ({
      ...player,
      is_connected: onlineUsers.has(player.user_id),
    })));
  }, []);

  // Set up real-time sync
  const { broadcastAction, broadcastState } = useRealtimeSync(room?.id, {
    onPlayersChange: handlePlayersChange,
    onRoomChange: handleRoomChange,
    onAuctionAction: handleAuctionAction,
    onPresenceSync: handlePresenceSync,
  });

  // Fetch players when room changes
  useEffect(() => {
    if (room?.id) {
      fetchPlayers();
    }
  }, [room?.id, fetchPlayers]);

  // Create a new room
  const createRoom = useCallback(async (name) => {
    setConnectionStatus('connecting');
    const result = await roomHook.createRoom(name);

    if (result) {
      setRoom(result.room);
      setIsHost(true);
      setIsMultiplayer(true);
      setDisplayName(name);
      setStoredDisplayName(name);
      setConnectionStatus('connected');
      return result.room.code;
    }

    setConnectionStatus('disconnected');
    return null;
  }, [roomHook]);

  // Join an existing room
  const joinRoom = useCallback(async (code, name) => {
    setConnectionStatus('connecting');
    const result = await roomHook.joinRoom(code, name);

    if (result) {
      setRoom(result.room);
      setIsHost(false);
      setIsMultiplayer(true);
      setDisplayName(name);
      setStoredDisplayName(name);
      setConnectionStatus('connected');
      return true;
    }

    setConnectionStatus('disconnected');
    return false;
  }, [roomHook]);

  // Leave the room
  const leaveRoom = useCallback(async () => {
    if (room?.id) {
      await roomHook.leaveRoom(room.id);
    }
    setRoom(null);
    setPlayers([]);
    setIsHost(false);
    setIsMultiplayer(false);
    setLocalTeamId(null);
    setConnectionStatus('disconnected');
  }, [room?.id, roomHook]);

  // Claim a team
  const claimTeam = useCallback(async (teamId) => {
    if (!room?.id) return false;
    const success = await roomHook.claimTeam(room.id, teamId);
    if (success) {
      setLocalTeamId(teamId);
      fetchPlayers();
    }
    return success;
  }, [room?.id, roomHook, fetchPlayers]);

  // Release team
  const releaseTeam = useCallback(async () => {
    if (!room?.id) return false;
    const success = await roomHook.releaseTeam(room.id);
    if (success) {
      setLocalTeamId(null);
      fetchPlayers();
    }
    return success;
  }, [room?.id, roomHook, fetchPlayers]);

  // Set ready status
  const setReady = useCallback(async (ready) => {
    if (!room?.id) return false;
    const success = await roomHook.setReady(room.id, ready);
    if (success) {
      fetchPlayers();
    }
    return success;
  }, [room?.id, roomHook, fetchPlayers]);

  // Start the game (host only)
  const startGame = useCallback(async () => {
    if (!room?.id || !isHost) return false;
    return await roomHook.startGame(room.id);
  }, [room?.id, isHost, roomHook]);

  // Send action (for multiplayer bidding)
  const sendAction = useCallback((action) => {
    if (!isMultiplayer) return;

    // Add sender info to action
    const enrichedAction = {
      ...action,
      _sender: userId,
      _timestamp: Date.now(),
    };

    // Broadcast to all players
    broadcastAction(enrichedAction);
  }, [isMultiplayer, userId, broadcastAction]);

  // Sync state (host broadcasts to clients)
  const syncState = useCallback((state) => {
    if (!isMultiplayer || !isHost) return;

    broadcastState(state);

    // Also persist to database periodically
    if (room?.id) {
      roomHook.updateAuctionState(room.id, state);
    }
  }, [isMultiplayer, isHost, room?.id, broadcastState, roomHook]);

  // Register auction dispatch for receiving synced actions
  const registerAuctionDispatch = useCallback((dispatch) => {
    auctionDispatchRef.current = dispatch;
  }, []);

  // Register auction state for syncing
  const registerAuctionState = useCallback((state) => {
    auctionStateRef.current = state;
  }, []);

  // Check if all players are ready
  const allPlayersReady = players.length >= 2 &&
    players.every(p => p.is_ready) &&
    players.every(p => p.team_id !== null);

  // Get player info for a team
  const getPlayerForTeam = useCallback((teamId) => {
    return players.find(p => p.team_id === teamId);
  }, [players]);

  // Check if team is playable
  const isTeamPlayable = useCallback((teamId) => {
    return PLAYABLE_TEAMS.includes(teamId);
  }, []);

  // Check if team is claimed
  const isTeamClaimed = useCallback((teamId) => {
    return players.some(p => p.team_id === teamId);
  }, [players]);

  // Get local player
  const localPlayer = players.find(p => p.user_id === userId);

  const value = {
    // State
    isMultiplayer,
    isSupabaseConfigured: isSupabaseConfigured(),
    connectionStatus,
    room,
    roomCode: room?.code,
    players,
    isHost,
    localTeamId,
    localPlayer,
    displayName,
    allPlayersReady,

    // Room actions
    createRoom,
    joinRoom,
    leaveRoom,
    claimTeam,
    releaseTeam,
    setReady,
    startGame,

    // Multiplayer sync
    sendAction,
    syncState,
    registerAuctionDispatch,
    registerAuctionState,

    // Helpers
    getPlayerForTeam,
    isTeamPlayable,
    isTeamClaimed,
    PLAYABLE_TEAMS,

    // Error handling
    error: roomHook.error,
    clearError: roomHook.clearError,
    loading: roomHook.loading,
  };

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
}

export function useMultiplayer() {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error('useMultiplayer must be used within MultiplayerProvider');
  }
  return context;
}
