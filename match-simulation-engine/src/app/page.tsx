'use client';

import { useState } from 'react';
import MatchSimulator from '@/components/MatchSimulator';
import { sampleTeams } from '@/lib/sample-teams';
import { Team } from '@/lib/types';

export default function Home() {
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [matchStarted, setMatchStarted] = useState(false);

  const handleTeamSelect = (team: Team, isHome: boolean) => {
    if (isHome) {
      setHomeTeam(team);
    } else {
      setAwayTeam(team);
    }
  };

  const handleStartMatch = () => {
    if (homeTeam && awayTeam && homeTeam.id !== awayTeam.id) {
      setMatchStarted(true);
    }
  };

  const handleBackToSelection = () => {
    setMatchStarted(false);
    setHomeTeam(null);
    setAwayTeam(null);
  };

  if (matchStarted && homeTeam && awayTeam) {
    return (
      <div>
        <button
          onClick={handleBackToSelection}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          ← Back to Team Selection
        </button>
        <MatchSimulator homeTeam={homeTeam} awayTeam={awayTeam} onBackToSelection={handleBackToSelection} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 py-8 px-6 shadow-xl">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Super League <span className="text-yellow-400">Match Simulator</span>
          </h1>
          <p className="text-blue-200">Select two teams to simulate a 90-minute match at 2X speed (1 minute)</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Home Team Selection */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Home Team</h2>
            </div>
            <div className="p-4 space-y-2">
              {sampleTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleTeamSelect(team, true)}
                  disabled={awayTeam?.id === team.id}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-lg transition-all
                    ${homeTeam?.id === team.id
                      ? 'bg-blue-600 ring-2 ring-blue-400'
                      : awayTeam?.id === team.id
                      ? 'bg-slate-800/30 opacity-50 cursor-not-allowed'
                      : 'bg-slate-800/50 hover:bg-slate-800'
                    }
                  `}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.shortName.slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold">{team.name}</p>
                    <p className="text-slate-400 text-sm">{team.manager}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-yellow-400 font-bold">
                      {(team.lineup.reduce((sum, p) => sum + p.rating, 0) / 11).toFixed(1)}
                    </p>
                    <p className="text-slate-500 text-xs">Avg Rating</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Away Team Selection */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-red-900 to-red-800 px-6 py-4 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Away Team</h2>
            </div>
            <div className="p-4 space-y-2">
              {sampleTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleTeamSelect(team, false)}
                  disabled={homeTeam?.id === team.id}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-lg transition-all
                    ${awayTeam?.id === team.id
                      ? 'bg-red-600 ring-2 ring-red-400'
                      : homeTeam?.id === team.id
                      ? 'bg-slate-800/30 opacity-50 cursor-not-allowed'
                      : 'bg-slate-800/50 hover:bg-slate-800'
                    }
                  `}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.shortName.slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold">{team.name}</p>
                    <p className="text-slate-400 text-sm">{team.manager}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-yellow-400 font-bold">
                      {(team.lineup.reduce((sum, p) => sum + p.rating, 0) / 11).toFixed(1)}
                    </p>
                    <p className="text-slate-500 text-xs">Avg Rating</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Match Preview */}
        {homeTeam && awayTeam && (
          <div className="mt-8 bg-slate-900/80 rounded-xl border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white text-center mb-6">Match Preview</h3>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2"
                  style={{ backgroundColor: homeTeam.color }}
                >
                  {homeTeam.shortName.slice(0, 2)}
                </div>
                <p className="text-white font-bold">{homeTeam.name}</p>
                <p className="text-slate-400 text-sm">{homeTeam.manager}</p>
              </div>

              <div className="text-center">
                <p className="text-4xl font-bold text-slate-500">VS</p>
              </div>

              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2"
                  style={{ backgroundColor: awayTeam.color }}
                >
                  {awayTeam.shortName.slice(0, 2)}
                </div>
                <p className="text-white font-bold">{awayTeam.name}</p>
                <p className="text-slate-400 text-sm">{awayTeam.manager}</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleStartMatch}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400
                           rounded-xl text-white text-xl font-bold shadow-lg hover:shadow-green-500/30 transition-all"
              >
                ⚽ Start Match Simulation
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-slate-900/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">How it works</h3>
          <ul className="space-y-2 text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Select a home and away team from the available options</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Watch the 90-minute match unfold in real-time at 2X speed (1 minute)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>See live commentary, player stats, and manager notes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Match simulation is based on player ratings, positions, and stamina</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Injuries and cards can affect the outcome!</span>
            </li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-500 text-sm">
        Super League Season 3 - Match Simulation Engine
      </footer>
    </div>
  );
}
