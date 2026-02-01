import React from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import teamsData from '../../data/teams.json';

export default function TeamSelector() {
  const {
    PLAYABLE_TEAMS,
    localTeamId,
    claimTeam,
    releaseTeam,
    getPlayerForTeam,
    loading,
  } = useMultiplayer();

  const playableTeams = teamsData.filter(t => PLAYABLE_TEAMS.includes(t.id));

  const handleTeamClick = async (teamId) => {
    if (localTeamId === teamId) {
      // Release the team
      await releaseTeam();
    } else if (!getPlayerForTeam(teamId)) {
      // Claim the team
      await claimTeam(teamId);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {playableTeams.map((team) => {
        const claimedBy = getPlayerForTeam(team.id);
        const isOwnTeam = localTeamId === team.id;
        const isClaimed = claimedBy !== undefined;
        const canClaim = !isClaimed || isOwnTeam;

        return (
          <button
            key={team.id}
            onClick={() => handleTeamClick(team.id)}
            disabled={loading || (!canClaim)}
            className={`relative p-4 rounded-xl border-2 transition-all ${
              isOwnTeam
                ? 'border-green-500 bg-green-900/30'
                : isClaimed
                ? 'border-slate-600 bg-slate-800/50 opacity-60 cursor-not-allowed'
                : 'border-slate-600 bg-slate-800 hover:border-slate-500 hover:bg-slate-700'
            }`}
          >
            {/* Team Badge */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto"
              style={{ backgroundColor: team.color + '40', border: `2px solid ${team.color}` }}
            >
              <span className="text-2xl">{team.logoEmoji}</span>
            </div>

            {/* Team Name */}
            <h3 className="text-white font-bold text-center mb-1">{team.name}</h3>
            <p className="text-slate-400 text-sm text-center">{team.country}</p>

            {/* Status Badge */}
            {isOwnTeam ? (
              <div className="mt-3 bg-green-600 text-white text-xs font-semibold py-1 px-3 rounded-full text-center">
                Your Team
              </div>
            ) : claimedBy ? (
              <div className="mt-3 bg-slate-700 text-slate-300 text-xs py-1 px-3 rounded-full text-center">
                {claimedBy.display_name}
              </div>
            ) : (
              <div className="mt-3 bg-slate-700/50 text-slate-500 text-xs py-1 px-3 rounded-full text-center">
                Available
              </div>
            )}

            {/* Selection indicator */}
            {isOwnTeam && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
