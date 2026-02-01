import { useState, useCallback } from 'react';
import { supabase, generateRoomCode, getOrCreateUserId, isSupabaseConfigured } from '../lib/supabase';

const PLAYABLE_TEAMS = ['real-madrid', 'barcelona', 'bayern'];

export function useRoom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createRoom = useCallback(async (displayName) => {
    if (!isSupabaseConfigured()) {
      setError('Multiplayer not configured. Please set up Supabase credentials.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = getOrCreateUserId();
      const roomCode = generateRoomCode();

      // Create room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          code: roomCode,
          host_id: userId,
          status: 'waiting',
          auction_state: null,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Join room as host
      const { error: playerError } = await supabase
        .from('room_players')
        .insert({
          room_id: room.id,
          user_id: userId,
          display_name: displayName,
          team_id: null,
          is_host: true,
          is_ready: false,
          is_connected: true,
        });

      if (playerError) throw playerError;

      setLoading(false);
      return { room, userId };
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);

  const joinRoom = useCallback(async (code, displayName) => {
    if (!isSupabaseConfigured()) {
      setError('Multiplayer not configured. Please set up Supabase credentials.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = getOrCreateUserId();

      // Find room by code
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (roomError) {
        if (roomError.code === 'PGRST116') {
          throw new Error('Room not found. Check the code and try again.');
        }
        throw roomError;
      }

      if (room.status !== 'waiting') {
        throw new Error('This room has already started the auction.');
      }

      // Check if already in room
      const { data: existingPlayer } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', room.id)
        .eq('user_id', userId)
        .single();

      if (existingPlayer) {
        // Reconnect existing player
        await supabase
          .from('room_players')
          .update({
            is_connected: true,
            display_name: displayName,
            last_seen: new Date().toISOString(),
          })
          .eq('id', existingPlayer.id);
      } else {
        // Check room capacity (max 3 players)
        const { data: players } = await supabase
          .from('room_players')
          .select('*')
          .eq('room_id', room.id);

        if (players && players.length >= 3) {
          throw new Error('Room is full (max 3 players).');
        }

        // Join as new player
        const { error: playerError } = await supabase
          .from('room_players')
          .insert({
            room_id: room.id,
            user_id: userId,
            display_name: displayName,
            team_id: null,
            is_host: false,
            is_ready: false,
            is_connected: true,
          });

        if (playerError) throw playerError;
      }

      setLoading(false);
      return { room, userId };
    } catch (err) {
      console.error('Error joining room:', err);
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);

  const leaveRoom = useCallback(async (roomId) => {
    if (!isSupabaseConfigured()) return;

    try {
      const userId = getOrCreateUserId();

      await supabase
        .from('room_players')
        .update({ is_connected: false })
        .eq('room_id', roomId)
        .eq('user_id', userId);
    } catch (err) {
      console.error('Error leaving room:', err);
    }
  }, []);

  const claimTeam = useCallback(async (roomId, teamId) => {
    if (!isSupabaseConfigured()) return false;

    try {
      const userId = getOrCreateUserId();

      // Check if team is already claimed
      const { data: existing } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', roomId)
        .eq('team_id', teamId)
        .single();

      if (existing && existing.user_id !== userId) {
        setError('Team already claimed by another player.');
        return false;
      }

      // Update player's team
      const { error } = await supabase
        .from('room_players')
        .update({ team_id: teamId })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error claiming team:', err);
      setError(err.message);
      return false;
    }
  }, []);

  const releaseTeam = useCallback(async (roomId) => {
    if (!isSupabaseConfigured()) return false;

    try {
      const userId = getOrCreateUserId();

      const { error } = await supabase
        .from('room_players')
        .update({ team_id: null })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error releasing team:', err);
      setError(err.message);
      return false;
    }
  }, []);

  const setReady = useCallback(async (roomId, ready) => {
    if (!isSupabaseConfigured()) return false;

    try {
      const userId = getOrCreateUserId();

      const { error } = await supabase
        .from('room_players')
        .update({ is_ready: ready })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error setting ready:', err);
      setError(err.message);
      return false;
    }
  }, []);

  const startGame = useCallback(async (roomId) => {
    if (!isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status: 'retention' })
        .eq('id', roomId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error starting game:', err);
      setError(err.message);
      return false;
    }
  }, []);

  const updateAuctionState = useCallback(async (roomId, auctionState) => {
    if (!isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          auction_state: auctionState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating auction state:', err);
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    clearError,
    createRoom,
    joinRoom,
    leaveRoom,
    claimTeam,
    releaseTeam,
    setReady,
    startGame,
    updateAuctionState,
    PLAYABLE_TEAMS,
  };
}
