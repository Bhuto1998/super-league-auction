import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { quickSimulate } from '../../engine/matchEngine';

const BIG_THREE = ['real-madrid', 'barcelona', 'bayern'];

export default function KnockoutStage({ onStartLiveMatch }) {
  const {
    state,
    completeKnockoutMatch,
    skipKnockoutRound,
    advanceToSF,
    advanceToFinal,
    setChampion,
  } = useTournament();

  const { phase, knockout, teamsMap } = state;
  const [isSimulating, setIsSimulating] = useState(false);

  // Get current round data
  const getCurrentRoundData = () => {
    if (phase === 'qf') {
      return {
        ties: knockout.qf.ties,
        currentTieIndex: knockout.qf.currentTieIndex,
        currentLeg: knockout.qf.currentLeg,
        name: 'Quarter Finals',
        emoji: '&#127967;',
        isTwoLegged: true,
      };
    }
    if (phase === 'sf') {
      return {
        ties: knockout.sf.ties,
        currentTieIndex: knockout.sf.currentTieIndex,
        currentLeg: knockout.sf.currentLeg,
        name: 'Semi Finals',
        emoji: '&#128293;',
        isTwoLegged: true,
      };
    }
    if (phase === 'final') {
      return {
        ties: knockout.final.fixture ? [{
          home: knockout.final.fixture.home,
          away: knockout.final.fixture.away,
          leg1Result: knockout.final.result,
          winner: knockout.final.result?.winner,
          isNeutral: true,
        }] : [],
        currentTieIndex: 0,
        currentLeg: 1,
        name: 'THE FINAL',
        emoji: '&#127942;',
        isTwoLegged: false,
        isNeutral: true,
      };
    }
    return { ties: [], currentTieIndex: 0, currentLeg: 1, name: '', emoji: '', isTwoLegged: false };
  };

  const roundData = getCurrentRoundData();

  // Check if all ties in round are complete
  const isRoundComplete = () => {
    if (phase === 'final') {
      return knockout.final.result !== null;
    }
    return roundData.ties.every(tie => tie.winner !== null);
  };

  // Get current match to play
  // All Leg 1 matches first, then all Leg 2 matches
  const getCurrentMatch = () => {
    if (phase === 'final') {
      if (knockout.final.result) return null;
      return {
        tie: roundData.ties[0],
        tieIndex: 0,
        leg: 1,
        isNeutral: true,
      };
    }

    // First: Find any tie missing leg 1 result
    for (let i = 0; i < roundData.ties.length; i++) {
      const tie = roundData.ties[i];
      if (!tie.leg1Result) {
        return { tie, tieIndex: i, leg: 1 };
      }
    }

    // Second: All leg 1 done, find any tie missing leg 2 result
    for (let i = 0; i < roundData.ties.length; i++) {
      const tie = roundData.ties[i];
      if (!tie.leg2Result) {
        return { tie, tieIndex: i, leg: 2 };
      }
    }

    return null;
  };

  const currentMatch = getCurrentMatch();

  // Check if match involves Big 3
  const isBig3Match = (tie) => {
    if (!tie) return false;
    return BIG_THREE.includes(tie.home?.id) || BIG_THREE.includes(tie.away?.id);
  };

  // Build players array from retainedPlayers + auctionedPlayers if not present
  const buildPlayersArray = (team) => {
    if (team.players && team.players.length > 0) {
      return team.players;
    }
    return [...(team.retainedPlayers || []), ...(team.auctionedPlayers || [])];
  };

  // Simulate next match (leg)
  const simulateNextMatch = () => {
    if (!currentMatch) return;

    const { tie, tieIndex, leg, isNeutral } = currentMatch;

    // In leg 2, home and away are swapped
    let homeTeamBase, awayTeamBase;
    if (leg === 1 || isNeutral) {
      homeTeamBase = teamsMap[tie.home?.id] || tie.home;
      awayTeamBase = teamsMap[tie.away?.id] || tie.away;
    } else {
      // Leg 2: swap home/away
      homeTeamBase = teamsMap[tie.away?.id] || tie.away;
      awayTeamBase = teamsMap[tie.home?.id] || tie.home;
    }

    // Ensure teams have players
    const homeTeam = { ...homeTeamBase, players: buildPlayersArray(homeTeamBase) };
    const awayTeam = { ...awayTeamBase, players: buildPlayersArray(awayTeamBase) };

    if (isBig3Match(tie)) {
      // Start live match for Big 3
      onStartLiveMatch({
        homeTeam,
        awayTeam,
        isKnockout: true,
        isTwoLegged: phase !== 'final',
        leg,
        tieIndex,
        tie,
        round: phase,
        isNeutral: isNeutral || false,
        // Pass leg 1 result for display during leg 2
        leg1Result: leg === 2 ? tie.leg1Result : null,
      });
    } else {
      // Quick simulate
      setIsSimulating(true);
      setTimeout(() => {
        const result = quickSimulate(homeTeam, awayTeam);

        // For final (single leg), determine winner immediately
        let winner = null;
        let decidedIn = 'regularTime';

        if (phase === 'final') {
          if (result.homeGoals > result.awayGoals) {
            winner = homeTeam;
          } else if (result.awayGoals > result.homeGoals) {
            winner = awayTeam;
          } else {
            // Penalties for tied final
            winner = Math.random() < 0.5 ? homeTeam : awayTeam;
            decidedIn = 'penalties';
            result.penaltyWinner = winner.shortName || winner.name;
          }
        }

        const fullResult = {
          ...result,
          homeTeam,
          awayTeam,
          winner,
          decidedIn,
        };

        completeKnockoutMatch(fullResult, phase, tieIndex, leg, winner);
        setIsSimulating(false);
      }, 1500);
    }
  };

  // Handle progressing to next stage
  const handleProgressStage = () => {
    if (phase === 'qf') {
      advanceToSF();
    } else if (phase === 'sf') {
      advanceToFinal();
    } else if (phase === 'final' && knockout.final.result) {
      setChampion(knockout.final.result.winner);
    }
  };

  // Get stage progress indicator
  const getStageProgress = () => {
    const stages = ['qf', 'sf', 'final'];
    return stages.map(stage => ({
      name: stage === 'qf' ? 'Quarter Finals' : stage === 'sf' ? 'Semi Finals' : 'Final',
      active: phase === stage,
      complete: (stage === 'qf' && knockout.qf.ties.every(t => t.winner)) ||
                (stage === 'sf' && knockout.sf.ties.every(t => t.winner)) ||
                (stage === 'final' && knockout.final.result),
    }));
  };

  // Render a single tie (two legs or single match for final)
  const renderTie = (tie, tieIndex) => {
    const homeTeam = teamsMap[tie.home?.id] || tie.home;
    const awayTeam = teamsMap[tie.away?.id] || tie.away;
    const isFinal = phase === 'final';
    const isCurrent = currentMatch && currentMatch.tieIndex === tieIndex;

    return (
      <div
        key={tieIndex}
        className={`bg-slate-800 rounded-xl border-2 overflow-hidden transition-all ${
          isCurrent ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' :
          tie.winner ? 'border-green-600' : 'border-slate-700'
        } ${isFinal ? 'max-w-2xl mx-auto' : ''}`}
      >
        {/* Tie Header */}
        <div className={`px-4 py-2 text-center text-sm font-medium ${
          isFinal ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300'
        }`}>
          {isFinal ? 'GRAND FINAL - Neutral Venue' : `Tie ${tieIndex + 1}`}
        </div>

        {/* Teams */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            {/* Home Team */}
            <div className={`flex-1 text-center p-3 rounded-lg ${
              tie.winner?.id === homeTeam?.id ? 'bg-green-900/30 border border-green-600' : 'bg-slate-700/50'
            }`}>
              <span className="text-3xl block mb-2">{homeTeam?.logoEmoji}</span>
              <span className={`font-bold text-lg ${
                BIG_THREE.includes(homeTeam?.id) ? 'text-yellow-400' : 'text-white'
              }`}>
                {homeTeam?.shortName || homeTeam?.name}
              </span>
            </div>

            {/* VS / Aggregate */}
            <div className="px-6 text-center">
              {tie.winner ? (
                <div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {tie.aggregate?.home ?? 0} - {tie.aggregate?.away ?? 0}
                  </div>
                  <div className="text-xs text-slate-400">
                    {isFinal ? 'FULL TIME' : 'AGGREGATE'}
                  </div>
                </div>
              ) : (
                <span className="text-slate-500 font-bold text-xl">VS</span>
              )}
            </div>

            {/* Away Team */}
            <div className={`flex-1 text-center p-3 rounded-lg ${
              tie.winner?.id === awayTeam?.id ? 'bg-green-900/30 border border-green-600' : 'bg-slate-700/50'
            }`}>
              <span className="text-3xl block mb-2">{awayTeam?.logoEmoji}</span>
              <span className={`font-bold text-lg ${
                BIG_THREE.includes(awayTeam?.id) ? 'text-yellow-400' : 'text-white'
              }`}>
                {awayTeam?.shortName || awayTeam?.name}
              </span>
            </div>
          </div>

          {/* Leg Results (for two-legged ties) */}
          {!isFinal && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Leg 1 */}
              <div className={`p-3 rounded-lg ${
                tie.leg1Result ? 'bg-slate-700' : 'bg-slate-700/30'
              }`}>
                <div className="text-xs text-slate-400 mb-1 text-center">
                  LEG 1 - {homeTeam?.shortName} home
                </div>
                {tie.leg1Result ? (
                  <div className="text-center text-white font-bold">
                    {homeTeam?.shortName} {tie.leg1Result.homeGoals} - {tie.leg1Result.awayGoals} {awayTeam?.shortName}
                  </div>
                ) : (
                  <div className="text-center text-slate-500">-</div>
                )}
              </div>

              {/* Leg 2 */}
              <div className={`p-3 rounded-lg ${
                tie.leg2Result ? 'bg-slate-700' : 'bg-slate-700/30'
              }`}>
                <div className="text-xs text-slate-400 mb-1 text-center">
                  LEG 2 - {awayTeam?.shortName} home
                </div>
                {tie.leg2Result ? (
                  <div className="text-center text-white font-bold">
                    {awayTeam?.shortName} {tie.leg2Result.homeGoals} - {tie.leg2Result.awayGoals} {homeTeam?.shortName}
                  </div>
                ) : (
                  <div className="text-center text-slate-500">-</div>
                )}
              </div>
            </div>
          )}

          {/* Final single match result */}
          {isFinal && tie.leg1Result && (
            <div className="p-3 rounded-lg bg-slate-700 mb-4">
              <div className="text-center text-white font-bold text-xl">
                {homeTeam?.shortName} {tie.leg1Result.homeGoals} - {tie.leg1Result.awayGoals} {awayTeam?.shortName}
              </div>
            </div>
          )}

          {/* Winner announcement */}
          {tie.winner && (
            <div className="text-center py-2 border-t border-slate-700">
              {tie.decidedBy === 'penalties' ? (
                <span className="text-yellow-400">
                  {tie.winner.shortName || tie.winner.name} wins on penalties ({tie.penaltyScore?.home}-{tie.penaltyScore?.away})!
                </span>
              ) : tie.decidedBy === 'extraTime' ? (
                <span className="text-purple-400">
                  {tie.winner.shortName || tie.winner.name} advances after extra time!
                </span>
              ) : tie.decidedBy === 'awayGoals' ? (
                <span className="text-orange-400">
                  {tie.winner.shortName || tie.winner.name} advances on away goals!
                </span>
              ) : (
                <span className="text-green-400">
                  {tie.winner.shortName || tie.winner.name} advances!
                </span>
              )}
            </div>
          )}

          {/* Play button */}
          {isCurrent && !tie.winner && (
            <div className="text-center pt-2">
              {isSimulating ? (
                <div className="flex items-center justify-center gap-2 text-yellow-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400" />
                  <span>Match in progress...</span>
                </div>
              ) : (
                <button
                  onClick={simulateNextMatch}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded-lg font-bold transition-all animate-pulse"
                >
                  {isBig3Match(tie) ? '\u25b6 Play ' : '\u26a1 Simulate '}
                  {isFinal ? 'Final' : `Leg ${currentMatch.leg}`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Stage Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4" dangerouslySetInnerHTML={{ __html: roundData.emoji }} />
          <h2 className="text-4xl font-bold text-white mb-2">{roundData.name}</h2>
          <p className="text-slate-400">
            {phase === 'final' ? 'Single match at neutral venue - Winner takes all!' : 'Two-legged ties - Home & Away'}
          </p>
          {/* Current Leg Indicator for QF/SF */}
          {phase !== 'final' && currentMatch && !isRoundComplete() && (
            <div className="mt-4">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                currentMatch.leg === 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-orange-600 text-white'
              }`}>
                {currentMatch.leg === 1 ? '1st Leg Matches' : '2nd Leg Matches'}
              </span>
            </div>
          )}
        </div>

        {/* Ties Display */}
        <div className={`grid ${phase === 'final' ? 'grid-cols-1' : 'grid-cols-2'} gap-6 mb-8`}>
          {roundData.ties.map((tie, idx) => renderTie(tie, idx))}
        </div>

        {/* Skip Round Button - only show if round not complete */}
        {!isRoundComplete() && (
          <div className="text-center mb-8">
            <button
              onClick={skipKnockoutRound}
              className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg font-bold transition-all"
            >
              &#9193; Skip {phase === 'qf' ? 'Quarter Finals' : phase === 'sf' ? 'Semi Finals' : 'Final'}
            </button>
            <p className="text-slate-500 text-sm mt-2">Simulate all remaining matches instantly</p>
          </div>
        )}

        {/* Stage Progress Button */}
        {isRoundComplete() && (
          <div className="text-center mb-8">
            <button
              onClick={handleProgressStage}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                phase === 'final'
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-white animate-bounce'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {phase === 'qf' && 'Continue to Semi Finals \u2192'}
              {phase === 'sf' && 'Continue to THE FINAL \u2192'}
              {phase === 'final' && '\ud83c\udfc6 Crown the Champion! \ud83c\udfc6'}
            </button>
          </div>
        )}

        {/* Stage Progress Indicator */}
        <div className="flex justify-center gap-4 pt-8">
          {getStageProgress().map((stage, idx) => (
            <React.Fragment key={stage.name}>
              {idx > 0 && <div className="text-slate-600">\u2192</div>}
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                stage.active ? 'bg-yellow-600 text-white' :
                stage.complete ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {stage.name}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
