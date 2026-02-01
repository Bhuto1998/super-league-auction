import { useEffect, useRef, useCallback } from 'react';
import { supabase, getOrCreateUserId, isSupabaseConfigured } from '../lib/supabase';

export function useRealtimeSync(roomId, {
  onPlayersChange,
  onRoomChange,
  onAuctionAction,
  onPresenceSync,
}) {
  const channelRef = useRef(null);
  const presenceChannelRef = useRef(null);

  // Subscribe to room changes
  useEffect(() => {
    if (!roomId || !isSupabaseConfigured()) return;

    // Subscribe to room_players table changes
    const playersChannel = supabase
      .channel(`room_players:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (onPlayersChange) {
            onPlayersChange(payload);
          }
        }
      )
      .subscribe();

    // Subscribe to rooms table changes
    const roomChannel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          if (onRoomChange) {
            onRoomChange(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, onPlayersChange, onRoomChange]);

  // Set up broadcast channel for real-time actions
  useEffect(() => {
    if (!roomId || !isSupabaseConfigured()) return;

    const channel = supabase.channel(`auction:${roomId}`, {
      config: {
        broadcast: { self: true },
      },
    });

    channel
      .on('broadcast', { event: 'action' }, ({ payload }) => {
        if (onAuctionAction) {
          onAuctionAction(payload);
        }
      })
      .on('broadcast', { event: 'state_sync' }, ({ payload }) => {
        if (onAuctionAction) {
          onAuctionAction({ type: 'SYNC_STATE', payload });
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, onAuctionAction]);

  // Set up presence channel
  useEffect(() => {
    if (!roomId || !isSupabaseConfigured()) return;

    const userId = getOrCreateUserId();
    const presenceChannel = supabase.channel(`presence:${roomId}`);

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        if (onPresenceSync) {
          onPresenceSync(state);
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Player joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Player left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    presenceChannelRef.current = presenceChannel;

    // Heartbeat to keep presence alive
    const heartbeat = setInterval(() => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.track({
          user_id: userId,
          online_at: new Date().toISOString(),
        });
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(presenceChannel);
      presenceChannelRef.current = null;
    };
  }, [roomId, onPresenceSync]);

  // Broadcast an action to all clients
  const broadcastAction = useCallback((action) => {
    if (!channelRef.current) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'action',
      payload: action,
    });
  }, []);

  // Broadcast full state sync (host only)
  const broadcastState = useCallback((state) => {
    if (!channelRef.current) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'state_sync',
      payload: state,
    });
  }, []);

  return {
    broadcastAction,
    broadcastState,
  };
}
