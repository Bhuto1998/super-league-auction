import React from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';

export default function ConnectionStatus({ compact = false }) {
  const { connectionStatus, isMultiplayer } = useMultiplayer();

  if (!isMultiplayer) return null;

  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      text: 'Connected',
      pulse: false,
    },
    connecting: {
      color: 'bg-yellow-500',
      text: 'Connecting...',
      pulse: true,
    },
    disconnected: {
      color: 'bg-red-500',
      text: 'Disconnected',
      pulse: false,
    },
  };

  const config = statusConfig[connectionStatus] || statusConfig.disconnected;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${config.color} ${
            config.pulse ? 'animate-pulse' : ''
          }`}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1">
      <div
        className={`w-2 h-2 rounded-full ${config.color} ${
          config.pulse ? 'animate-pulse' : ''
        }`}
      />
      <span className="text-slate-300 text-sm">{config.text}</span>
    </div>
  );
}
