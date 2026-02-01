/**
 * Season Engine
 * Manages season flow, phase transitions, and off-season processing
 */

import { processEndOfSeason } from './playerProgression';
import { generateWonderkids } from './youthAcademy';
import { calculateSeasonBudget } from '../utils/budgetCalculator';

// Season phases in order
export const SEASON_PHASES = {
  PRE_SEASON: 'pre-season',
  SUPER_CUP: 'super-cup',       // Season 2+ only
  DRAFT: 'draft',               // Season 2+ only
  RETENTION: 'retention',
  AUCTION: 'auction',
  TOURNAMENT: 'tournament',
  LEAGUE_CUP: 'league-cup',     // Parallel to tournament
  END_OF_SEASON: 'end-of-season',
  OFF_SEASON: 'off-season',
};

// Phase order for Season 1
export const SEASON_1_FLOW = [
  SEASON_PHASES.PRE_SEASON,
  SEASON_PHASES.RETENTION,
  SEASON_PHASES.AUCTION,
  SEASON_PHASES.TOURNAMENT,
  SEASON_PHASES.END_OF_SEASON,
  SEASON_PHASES.OFF_SEASON,
];

// Phase order for Season 2+
export const SEASON_2_PLUS_FLOW = [
  SEASON_PHASES.PRE_SEASON,
  SEASON_PHASES.SUPER_CUP,
  SEASON_PHASES.DRAFT,
  SEASON_PHASES.RETENTION,
  SEASON_PHASES.AUCTION,
  SEASON_PHASES.TOURNAMENT,
  SEASON_PHASES.END_OF_SEASON,
  SEASON_PHASES.OFF_SEASON,
];

/**
 * Get season flow based on season number
 * @param {number} seasonNumber - Current season
 * @returns {Array} Phase order array
 */
export function getSeasonFlow(seasonNumber) {
  return seasonNumber === 1 ? SEASON_1_FLOW : SEASON_2_PLUS_FLOW;
}

/**
 * Get next phase in season flow
 * @param {string} currentPhase - Current phase
 * @param {number} seasonNumber - Current season number
 * @returns {string|null} Next phase or null if season complete
 */
export function getNextPhase(currentPhase, seasonNumber) {
  const flow = getSeasonFlow(seasonNumber);
  const currentIndex = flow.indexOf(currentPhase);

  if (currentIndex === -1) {
    console.warn(`Unknown phase: ${currentPhase}`);
    return flow[0];
  }

  if (currentIndex >= flow.length - 1) {
    return null; // Season complete
  }

  return flow[currentIndex + 1];
}

/**
 * Check if phase is valid for the current season
 * @param {string} phase - Phase to check
 * @param {number} seasonNumber - Current season
 * @returns {boolean} True if valid
 */
export function isPhaseValidForSeason(phase, seasonNumber) {
  const flow = getSeasonFlow(seasonNumber);
  return flow.includes(phase);
}

/**
 * Process off-season: age players, update ratings, check retirements
 * @param {Array} players - All players in the game
 * @param {Object} seasonStats - Map of playerId to season stats
 * @returns {Object} { updatedPlayers, retiredPlayers, ratingChanges }
 */
export function processOffSeason(players, seasonStats = {}) {
  const updatedPlayers = [];
  const retiredPlayers = [];
  const ratingChanges = [];

  players.forEach(player => {
    const stats = seasonStats[player.id] || {
      appearances: 0,
      avgRating: 7.0,
      goals: 0,
      assists: 0,
    };

    const result = processEndOfSeason(player, stats);

    if (result.retired) {
      retiredPlayers.push({
        player,
        reason: result.retirementReason,
      });
    } else {
      updatedPlayers.push(result.updatedPlayer);

      if (result.ratingChange && result.ratingChange.change !== 0) {
        ratingChanges.push({
          player: result.updatedPlayer,
          previousRating: player.rating,
          newRating: result.updatedPlayer.rating,
          change: result.ratingChange.change,
          reason: result.ratingChange.reason,
        });
      }
    }
  });

  return {
    updatedPlayers,
    retiredPlayers,
    ratingChanges,
    summary: {
      totalPlayers: players.length,
      retired: retiredPlayers.length,
      improved: ratingChanges.filter(r => r.change > 0).length,
      declined: ratingChanges.filter(r => r.change < 0).length,
      unchanged: ratingChanges.filter(r => r.change === 0).length,
    },
  };
}

/**
 * Prepare for new season after off-season processing
 * @param {Object} careerState - Current career state
 * @returns {Object} Updated career state for new season
 */
export function prepareNewSeason(careerState) {
  const newSeasonNumber = careerState.currentSeason + 1;

  // Generate new wonderkids for Season 2+
  const newWonderkids = newSeasonNumber >= 2
    ? generateWonderkids(newSeasonNumber)
    : [];

  // Calculate budgets for all teams
  const teamBudgets = {};
  careerState.teams.forEach(team => {
    const previousSeasonData = {
      finalPosition: careerState.previousSeasonPositions?.[team.id] || 5,
      unspentBudget: team.remainingBudget || 0,
      wasChampion: careerState.previousSeasonChampion === team.id,
    };

    teamBudgets[team.id] = calculateSeasonBudget(team, previousSeasonData, newSeasonNumber);
  });

  return {
    ...careerState,
    currentSeason: newSeasonNumber,
    seasonPhase: SEASON_PHASES.PRE_SEASON,
    youthAcademy: newWonderkids,
    teamBudgets,
    seasonPlayerStats: {}, // Reset season stats
    draftState: null,
    // Preserve historical data
    previousSeasonPositions: careerState.currentSeasonPositions || {},
    previousSeasonChampion: careerState.currentSeasonChampion || null,
    currentSeasonPositions: {},
    currentSeasonChampion: null,
  };
}

/**
 * Calculate final positions from tournament results
 * @param {Object} tournamentState - Tournament context state
 * @returns {Object} Map of teamId to final position (1-10)
 */
export function calculateFinalPositions(tournamentState) {
  const positions = {};

  // Champion gets 1st
  if (tournamentState.champion) {
    positions[tournamentState.champion.id] = 1;
  }

  // Final loser gets 2nd
  const finalResult = tournamentState.knockout?.final?.result;
  if (finalResult) {
    const finalLoser = finalResult.homeTeam === tournamentState.champion?.id
      ? finalResult.awayTeam
      : finalResult.homeTeam;
    if (finalLoser) positions[finalLoser] = 2;
  }

  // SF losers get 3rd-4th
  const sfTies = tournamentState.knockout?.sf?.ties || [];
  sfTies.forEach((tie, index) => {
    if (tie.winner) {
      const loser = tie.winner.id === tie.home.id ? tie.away : tie.home;
      positions[loser.id] = 3 + index;
    }
  });

  // QF losers get 5th-8th
  const qfTies = tournamentState.knockout?.qf?.ties || [];
  qfTies.forEach((tie, index) => {
    if (tie.winner) {
      const loser = tie.winner.id === tie.home.id ? tie.away : tie.home;
      if (!positions[loser.id]) {
        positions[loser.id] = 5 + index;
      }
    }
  });

  // Group stage exits get 9th-10th based on group standings
  const standingsA = tournamentState.standings?.A || [];
  const standingsB = tournamentState.standings?.B || [];

  // 5th in each group didn't advance
  if (standingsA.length >= 5 && !positions[standingsA[4].id]) {
    positions[standingsA[4].id] = 9;
  }
  if (standingsB.length >= 5 && !positions[standingsB[4].id]) {
    positions[standingsB[4].id] = 10;
  }

  return positions;
}

/**
 * Create end of season summary
 * @param {Object} careerState - Career state
 * @param {Object} tournamentState - Tournament state
 * @returns {Object} Season summary
 */
export function createSeasonSummary(careerState, tournamentState) {
  const positions = calculateFinalPositions(tournamentState);

  // Find golden boot (top scorer)
  let goldenBoot = null;
  let maxGoals = 0;
  Object.entries(careerState.seasonPlayerStats || {}).forEach(([playerId, stats]) => {
    if (stats.goals > maxGoals) {
      maxGoals = stats.goals;
      goldenBoot = {
        playerId,
        playerName: stats.playerName,
        goals: stats.goals,
        team: stats.team,
      };
    }
  });

  // Find MVP (best average rating with min appearances)
  let mvp = null;
  let maxAvgRating = 0;
  Object.entries(careerState.seasonPlayerStats || {}).forEach(([playerId, stats]) => {
    if (stats.appearances >= 5 && stats.avgRating > maxAvgRating) {
      maxAvgRating = stats.avgRating;
      mvp = {
        playerId,
        playerName: stats.playerName,
        avgRating: stats.avgRating,
        team: stats.team,
      };
    }
  });

  return {
    season: careerState.currentSeason,
    champion: tournamentState.champion,
    runnerUp: positions ? Object.entries(positions).find(([, pos]) => pos === 2)?.[0] : null,
    goldenBoot,
    mvp,
    finalPositions: positions,
    retirements: careerState.retirements || [],
    cupWinner: careerState.cupWinner || null, // League Cup winner
  };
}

/**
 * Update trophy cabinet with season results
 * @param {Object} trophyCabinet - Existing trophy cabinet
 * @param {Object} seasonSummary - Season summary
 * @returns {Object} Updated trophy cabinet
 */
export function updateTrophyCabinet(trophyCabinet, seasonSummary) {
  const newCabinet = { ...trophyCabinet };

  // League champion
  if (seasonSummary.champion) {
    const teamId = seasonSummary.champion.id;
    if (!newCabinet[teamId]) {
      newCabinet[teamId] = { leagues: 0, cups: 0, superCups: 0 };
    }
    newCabinet[teamId].leagues++;
  }

  // Cup winner
  if (seasonSummary.cupWinner) {
    const teamId = seasonSummary.cupWinner.id;
    if (!newCabinet[teamId]) {
      newCabinet[teamId] = { leagues: 0, cups: 0, superCups: 0 };
    }
    newCabinet[teamId].cups++;
  }

  return newCabinet;
}

/**
 * Get phase display info
 * @param {string} phase - Current phase
 * @returns {Object} { title, description, icon }
 */
export function getPhaseDisplayInfo(phase) {
  const info = {
    [SEASON_PHASES.PRE_SEASON]: {
      title: 'Pre-Season',
      description: 'Prepare for the new season',
      icon: '📋',
    },
    [SEASON_PHASES.SUPER_CUP]: {
      title: 'Super Cup',
      description: 'Season opener between champions',
      icon: '🏆',
    },
    [SEASON_PHASES.DRAFT]: {
      title: 'Wonderkid Draft',
      description: 'Draft promising young talents',
      icon: '⭐',
    },
    [SEASON_PHASES.RETENTION]: {
      title: 'Retention Phase',
      description: 'Retain your key players',
      icon: '🔒',
    },
    [SEASON_PHASES.AUCTION]: {
      title: 'Player Auction',
      description: 'Build your squad',
      icon: '💰',
    },
    [SEASON_PHASES.TOURNAMENT]: {
      title: 'Super League',
      description: 'Compete for the title',
      icon: '⚽',
    },
    [SEASON_PHASES.LEAGUE_CUP]: {
      title: 'League Cup',
      description: 'Knockout cup competition',
      icon: '🥈',
    },
    [SEASON_PHASES.END_OF_SEASON]: {
      title: 'End of Season',
      description: 'Review the season',
      icon: '📊',
    },
    [SEASON_PHASES.OFF_SEASON]: {
      title: 'Off-Season',
      description: 'Player development & transfers',
      icon: '🔄',
    },
  };

  return info[phase] || { title: phase, description: '', icon: '📅' };
}

/**
 * Check if season is complete
 * @param {string} currentPhase - Current phase
 * @param {number} seasonNumber - Season number
 * @returns {boolean} True if season is complete
 */
export function isSeasonComplete(currentPhase, seasonNumber) {
  return currentPhase === SEASON_PHASES.OFF_SEASON;
}

/**
 * Get progress through season (0-100)
 * @param {string} currentPhase - Current phase
 * @param {number} seasonNumber - Season number
 * @returns {number} Progress percentage
 */
export function getSeasonProgress(currentPhase, seasonNumber) {
  const flow = getSeasonFlow(seasonNumber);
  const currentIndex = flow.indexOf(currentPhase);

  if (currentIndex === -1) return 0;

  return Math.round((currentIndex / (flow.length - 1)) * 100);
}
