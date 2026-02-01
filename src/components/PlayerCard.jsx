import React from 'react';

const positionColors = {
  GK: 'bg-amber-500',
  CB: 'bg-blue-500',
  LB: 'bg-blue-400',
  RB: 'bg-blue-400',
  CDM: 'bg-green-600',
  CM: 'bg-green-500',
  CAM: 'bg-green-400',
  LW: 'bg-red-400',
  RW: 'bg-red-400',
  CF: 'bg-red-500',
  ST: 'bg-red-600',
};

const formatPrice = (price) => {
  if (price >= 1000000000) {
    return `€${(price / 1000000000).toFixed(1)}B`;
  }
  return `€${(price / 1000000).toFixed(0)}M`;
};

export default function PlayerCard({ player, onClick, disabled, compact = false, showPurchasePrice = false, showRetentionPrice = false }) {
  const positionColor = positionColors[player.position] || 'bg-gray-500';

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg">
        <span className={`${positionColor} text-xs font-bold px-2 py-0.5 rounded`}>
          {player.position}
        </span>
        <span className="text-white text-sm font-medium flex-1">{player.name}</span>
        <span className="text-yellow-400 text-xs font-bold">{player.rating}</span>
        {showPurchasePrice && player.purchasePrice && (
          <span className="text-green-400 text-xs">{formatPrice(player.purchasePrice)}</span>
        )}
        {showRetentionPrice && (player.retentionPrice || player.season2Price) && (
          <span className="text-purple-400 text-xs">{formatPrice(player.retentionPrice || player.season2Price)}</span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4
        border-2 border-slate-700 shadow-lg transition-all duration-200
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-blue-500 hover:shadow-blue-500/20 hover:shadow-xl cursor-pointer hover:-translate-y-1'
        }
      `}
    >
      {/* Rating Badge */}
      <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
        <span className="text-black font-bold text-sm">{player.rating}</span>
      </div>

      {/* Position */}
      <span className={`${positionColor} text-xs font-bold px-2 py-1 rounded inline-block mb-2`}>
        {player.position}
      </span>

      {/* Name */}
      <h3 className="text-white font-bold text-lg leading-tight mb-1">{player.name}</h3>

      {/* Details */}
      <div className="text-slate-400 text-sm space-y-0.5">
        <p>{player.club}</p>
        <p className="text-xs">{player.nationality}</p>
      </div>

      {/* Price */}
      <div className="mt-3 pt-3 border-t border-slate-700">
        <span className="text-green-400 font-bold text-lg">{formatPrice(player.basePrice)}</span>
        <span className="text-slate-500 text-xs ml-1">base</span>
      </div>
    </div>
  );
}
