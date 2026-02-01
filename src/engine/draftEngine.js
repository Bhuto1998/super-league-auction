/**
 * Draft Engine
 * Handles NBA-style lottery and draft pick logic for wonderkids
 */

import { isHumanTeam } from '../utils/budgetCalculator';
import { getPositionCategory } from '../utils/auctionHelpers';

// Lottery configuration
export const LOTTERY_CONFIG = {
  // Number of teams in lottery (bottom 4)
  LOTTERY_TEAMS: 4,

  // Weighted odds based on previous season finish (10th, 9th, 8th, 7th)
  LOTTERY_ODDS: {
    10: 0.40, // 40% - Last place
    9: 0.30,  // 30% - 9th place
    8: 0.20,  // 20% - 8th place
    7: 0.10,  // 10% - 7th place
  },

  // Number of rounds
  MAX_ROUNDS: 2,
};

// AI draft pick preferences by position need
export const AI_DRAFT_PREFERENCES = {
  // Weight multipliers for position needs
  POSITION_WEIGHTS: {
    GK: 0.8,   // Lower priority for GKs
    DEF: 1.0,
    MID: 1.0,
    FWD: 1.2,  // Slightly prefer forwards
  },

  // Rating weight - prefer higher rated wonderkids
  RATING_WEIGHT: 1.5,

  // Potential weight - prefer higher potential
  POTENTIAL_WEIGHT: 1.0,
};

/**
 * Get bottom N teams for lottery based on standings
 * @param {Array} standings - Final standings array (position 1-10)
 * @returns {Array} Bottom 4 teams sorted by position (10th first)
 */
export function getLotteryTeams(standings) {
  // Get the bottom 4 teams (positions 7-10)
  const bottomTeams = standings
    .slice(-LOTTERY_CONFIG.LOTTERY_TEAMS)
    .reverse(); // Put 10th place first

  return bottomTeams.map((team, index) => ({
    ...team,
    previousPosition: standings.length - LOTTERY_CONFIG.LOTTERY_TEAMS + index + 1,
    lotteryOdds: LOTTERY_CONFIG.LOTTERY_ODDS[standings.length - LOTTERY_CONFIG.LOTTERY_TEAMS + index + 1] || 0.10,
  }));
}

/**
 * Run the lottery to determine picks 1-4
 * @param {Array} lotteryTeams - Bottom 4 teams with lottery odds
 * @returns {Object} { results: Array, animations: Array }
 */
export function runLottery(lotteryTeams) {
  const results = [];
  const remainingTeams = [...lotteryTeams];
  const animations = []; // For UI animation purposes

  // Draw 4 picks
  for (let pick = 1; pick <= LOTTERY_CONFIG.LOTTERY_TEAMS; pick++) {
    // Calculate total remaining odds
    const totalOdds = remainingTeams.reduce((sum, t) => sum + t.lotteryOdds, 0);

    // Roll for this pick
    const roll = Math.random() * totalOdds;
    let cumulative = 0;
    let winner = null;
    let winnerIndex = -1;

    for (let i = 0; i < remainingTeams.length; i++) {
      cumulative += remainingTeams[i].lotteryOdds;
      if (roll < cumulative) {
        winner = remainingTeams[i];
        winnerIndex = i;
        break;
      }
    }

    // Fallback to first team if something went wrong
    if (!winner) {
      winner = remainingTeams[0];
      winnerIndex = 0;
    }

    // Record result
    results.push({
      pick,
      team: winner,
      odds: winner.lotteryOdds,
      roll: roll / totalOdds, // Normalized roll for display
    });

    // Animation data
    animations.push({
      pick,
      teamId: winner.id,
      teamName: winner.name,
      previousPosition: winner.previousPosition,
      jumped: winner.previousPosition < 10 - pick + 1, // Did they jump up?
    });

    // Remove winner from remaining
    remainingTeams.splice(winnerIndex, 1);
  }

  return { results, animations };
}

/**
 * Generate full draft order based on standings and lottery results
 * @param {Array} standings - Full standings (1-10)
 * @param {Array} lotteryResults - Results from runLottery
 * @returns {Array} Complete draft order for all teams
 */
export function generateDraftOrder(standings, lotteryResults) {
  const draftOrder = [];

  // Picks 1-4: Lottery winners
  lotteryResults.forEach((result, index) => {
    draftOrder.push({
      pick: index + 1,
      round: 1,
      teamId: result.team.id,
      team: result.team,
      source: 'lottery',
      previousPosition: result.team.previousPosition,
    });
  });

  // Get team IDs that won lottery picks
  const lotteryWinnerIds = new Set(lotteryResults.map(r => r.team.id));

  // Picks 5-10: Reverse order of remaining teams (6th, 5th, 4th, 3rd, 2nd, 1st)
  // But skip lottery winners
  const remainingTeams = standings
    .filter(team => !lotteryWinnerIds.has(team.id))
    .reverse(); // Worst to best

  let pickNumber = 5;
  remainingTeams.forEach(team => {
    draftOrder.push({
      pick: pickNumber,
      round: 1,
      teamId: team.id,
      team,
      source: 'standing',
      previousPosition: standings.findIndex(t => t.id === team.id) + 1,
    });
    pickNumber++;
  });

  // Round 2: Snake draft (reverse order)
  // Champion picks 11th, 2nd place picks 12th, etc.
  const round2Order = [...standings]; // Best to worst for round 2

  round2Order.forEach((team, index) => {
    draftOrder.push({
      pick: 11 + index,
      round: 2,
      teamId: team.id,
      team,
      source: 'snake',
      previousPosition: index + 1,
    });
  });

  return draftOrder;
}

/**
 * Determine if round 2 should continue
 * @param {number} wonderkidsRemaining - Number of undrafted wonderkids
 * @returns {boolean} True if round 2 should happen
 */
export function shouldContinueToRound2(wonderkidsRemaining) {
  // Round 2 only if there are 11+ wonderkids
  return wonderkidsRemaining >= 1;
}

/**
 * Calculate AI preference score for a wonderkid
 * @param {Object} team - Team object with position needs
 * @param {Object} wonderkid - Wonderkid to evaluate
 * @returns {number} Preference score (higher = more wanted)
 */
export function calculateAIPreferenceScore(team, wonderkid) {
  let score = 0;

  // Base rating score
  score += wonderkid.rating * AI_DRAFT_PREFERENCES.RATING_WEIGHT;

  // Potential score
  score += wonderkid.potential * AI_DRAFT_PREFERENCES.POTENTIAL_WEIGHT;

  // Position need score
  const posCategory = wonderkid.positionCategory || getPositionCategory(wonderkid.position);
  const positionWeight = AI_DRAFT_PREFERENCES.POSITION_WEIGHTS[posCategory] || 1.0;

  // Check team's position needs
  const currentCount = team.positionCount?.[posCategory] || 0;
  const needed = getPositionNeed(posCategory);
  const needScore = Math.max(0, needed - currentCount);

  score += needScore * 10 * positionWeight; // Position need is important

  // Small random factor to add variety
  score += Math.random() * 5;

  return score;
}

/**
 * Get base position needs
 * @param {string} category - Position category
 * @returns {number} Number needed
 */
function getPositionNeed(category) {
  const needs = { GK: 2, DEF: 6, MID: 5, FWD: 5 };
  return needs[category] || 0;
}

/**
 * Get AI's draft pick from available wonderkids
 * @param {Object} team - Team making the pick
 * @param {Array} availableWonderkids - Remaining wonderkids
 * @returns {Object} Selected wonderkid
 */
export function getAIDraftPick(team, availableWonderkids) {
  if (availableWonderkids.length === 0) return null;
  if (availableWonderkids.length === 1) return availableWonderkids[0];

  // Score all available wonderkids
  const scored = availableWonderkids.map(wk => ({
    wonderkid: wk,
    score: calculateAIPreferenceScore(team, wk),
  }));

  // Sort by score (highest first)
  scored.sort((a, b) => b.score - a.score);

  // Usually pick the top choice, but occasionally take 2nd or 3rd
  const roll = Math.random();
  if (roll < 0.70) {
    return scored[0].wonderkid; // 70% - take best
  } else if (roll < 0.90 && scored.length > 1) {
    return scored[1].wonderkid; // 20% - take 2nd best
  } else if (scored.length > 2) {
    return scored[2].wonderkid; // 10% - take 3rd best
  }

  return scored[0].wonderkid;
}

/**
 * Get draft pick description for UI
 * @param {Object} pickData - Pick data from draft order
 * @returns {string} Description string
 */
export function getPickDescription(pickData) {
  if (pickData.source === 'lottery') {
    if (pickData.previousPosition === 10) {
      return 'Won lottery from last place';
    }
    const jumpedFrom = 11 - pickData.previousPosition;
    if (pickData.pick < jumpedFrom) {
      return `Jumped from #${jumpedFrom} to #${pickData.pick}`;
    }
    return 'Lottery pick';
  }

  if (pickData.source === 'standing') {
    return `Based on ${ordinal(pickData.previousPosition)} place finish`;
  }

  if (pickData.source === 'snake') {
    return `Round 2 snake draft`;
  }

  return '';
}

/**
 * Get ordinal suffix for number
 * @param {number} n - Number
 * @returns {string} Number with ordinal suffix
 */
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Check if team picks in current round
 * @param {number} currentPick - Current pick number
 * @param {string} teamId - Team ID to check
 * @param {Array} draftOrder - Full draft order
 * @returns {boolean} True if team picks now
 */
export function isTeamsTurn(currentPick, teamId, draftOrder) {
  const pickData = draftOrder.find(p => p.pick === currentPick);
  return pickData?.teamId === teamId;
}

/**
 * Get current pick data
 * @param {number} currentPick - Current pick number
 * @param {Array} draftOrder - Full draft order
 * @returns {Object|null} Pick data or null
 */
export function getCurrentPickData(currentPick, draftOrder) {
  return draftOrder.find(p => p.pick === currentPick) || null;
}

/**
 * Get team's draft picks
 * @param {string} teamId - Team ID
 * @param {Array} draftOrder - Full draft order
 * @returns {Array} Team's picks
 */
export function getTeamPicks(teamId, draftOrder) {
  return draftOrder.filter(p => p.teamId === teamId);
}

/**
 * Get draft summary after completion
 * @param {Array} picks - All made picks with selections
 * @returns {Object} Summary data
 */
export function getDraftSummary(picks) {
  const summary = {
    totalPicks: picks.length,
    byPosition: { GK: 0, DEF: 0, MID: 0, FWD: 0 },
    byRound: { 1: [], 2: [] },
    topPicks: [],
    teamSummaries: {},
  };

  picks.forEach(pick => {
    if (!pick.selection) return;

    const posCategory = pick.selection.positionCategory;
    summary.byPosition[posCategory]++;

    const round = pick.pick <= 10 ? 1 : 2;
    summary.byRound[round].push(pick);

    // Track by team
    if (!summary.teamSummaries[pick.teamId]) {
      summary.teamSummaries[pick.teamId] = [];
    }
    summary.teamSummaries[pick.teamId].push(pick.selection);
  });

  // Top 5 picks by potential
  summary.topPicks = picks
    .filter(p => p.selection)
    .sort((a, b) => b.selection.potential - a.selection.potential)
    .slice(0, 5);

  return summary;
}

/**
 * Create initial draft state
 * @param {Array} standings - Final standings
 * @param {Array} wonderkids - Generated wonderkids
 * @returns {Object} Initial draft state
 */
export function createInitialDraftState(standings, wonderkids) {
  // Get lottery teams
  const lotteryTeams = getLotteryTeams(standings);

  return {
    phase: 'pre-lottery', // pre-lottery, lottery, drafting, complete
    standings,
    wonderkids: [...wonderkids],
    availableWonderkids: [...wonderkids],
    lotteryTeams,
    lotteryResults: null,
    draftOrder: null,
    currentPick: 0,
    picks: [], // { pick, teamId, selection, isAI }
    round: 1,
    isComplete: false,
  };
}
