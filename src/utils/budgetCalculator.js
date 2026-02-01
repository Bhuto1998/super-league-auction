/**
 * Budget Calculator for Season 2+
 * Handles budget calculations, carry-over, and position bonuses
 */

// Budget constants
export const BUDGET_CONSTANTS = {
  // Season 1 budget (same for all)
  SEASON_1_BUDGET: 1_000_000_000, // €1B

  // Season 2+ base budgets
  HUMAN_BASE_BUDGET: 750_000_000, // €750M
  AI_BASE_BUDGET: 800_000_000,    // €800M

  // Budget limits
  HUMAN_MIN_BUDGET: 750_000_000,  // €750M
  HUMAN_MAX_BUDGET: 1_200_000_000, // €1.2B
  AI_MIN_BUDGET: 750_000_000,     // €750M
  AI_MAX_BUDGET: 1_100_000_000,   // €1.1B

  // Carry-over rates
  HUMAN_CARRY_OVER_RATE: 0.40,    // 40%
  AI_CARRY_OVER_RATE: 0.25,       // 25%
  HUMAN_MAX_CARRY_OVER: 150_000_000, // €150M
  AI_MAX_CARRY_OVER: 100_000_000,    // €100M

  // Minimum budget for auction after retentions
  MIN_AUCTION_BUDGET: 100_000_000, // €100M

  // AI balance modifiers
  CHAMPION_AI_PENALTY: 0.05,      // -5% for AI champion
  BOTTOM_AI_BOOST: 0.05,          // +5% for bottom AI
};

// League position bonuses
export const POSITION_BONUSES = {
  1: 200_000_000,  // Champion: €200M
  2: 150_000_000,  // Runner-up: €150M
  3: 100_000_000,  // SF losers: €100M
  4: 100_000_000,  // SF losers: €100M
  5: 60_000_000,   // QF losers: €60M
  6: 60_000_000,   // QF losers: €60M
  7: 60_000_000,   // QF losers: €60M
  8: 60_000_000,   // QF losers: €60M
  9: 30_000_000,   // Group stage: €30M
  10: 20_000_000,  // Last place: €20M
};

// Teams that are human-controlled (Big Three)
export const BIG_THREE_TEAMS = ['real-madrid', 'barcelona', 'bayern'];

/**
 * Get league position bonus based on final tournament position
 * @param {number} finalPosition - Final position (1-10)
 * @returns {number} Position bonus in euros
 */
export function getLeaguePositionBonus(finalPosition) {
  if (finalPosition < 1 || finalPosition > 10) {
    console.warn(`Invalid position: ${finalPosition}, defaulting to 10th place bonus`);
    return POSITION_BONUSES[10];
  }
  return POSITION_BONUSES[finalPosition] || POSITION_BONUSES[10];
}

/**
 * Calculate carry-over amount from unspent budget
 * @param {number} unspentBudget - Unspent budget from previous season
 * @param {boolean} isAI - Whether this is an AI team
 * @returns {number} Carry-over amount (capped at max)
 */
export function calculateCarryOver(unspentBudget, isAI = false) {
  if (unspentBudget <= 0) return 0;

  const rate = isAI ? BUDGET_CONSTANTS.AI_CARRY_OVER_RATE : BUDGET_CONSTANTS.HUMAN_CARRY_OVER_RATE;
  const maxCarryOver = isAI ? BUDGET_CONSTANTS.AI_MAX_CARRY_OVER : BUDGET_CONSTANTS.HUMAN_MAX_CARRY_OVER;

  const carryOver = Math.floor(unspentBudget * rate);
  return Math.min(carryOver, maxCarryOver);
}

/**
 * Get balance modifier for AI teams (anti-snowball mechanic)
 * @param {Object} previousSeasonData - { finalPosition, wasChampion }
 * @returns {number} Modifier multiplier (e.g., 0.95 for -5%, 1.05 for +5%)
 */
export function getBalanceModifier(previousSeasonData) {
  if (!previousSeasonData) return 1.0;

  const { finalPosition, wasChampion } = previousSeasonData;

  // Champion AI gets penalty
  if (wasChampion || finalPosition === 1) {
    return 1 - BUDGET_CONSTANTS.CHAMPION_AI_PENALTY;
  }

  // Bottom place AI gets boost
  if (finalPosition === 10) {
    return 1 + BUDGET_CONSTANTS.BOTTOM_AI_BOOST;
  }

  return 1.0;
}

/**
 * Check if a team is human-controlled (Big Three)
 * @param {string} teamId - Team ID
 * @returns {boolean} True if human-controlled
 */
export function isHumanTeam(teamId) {
  return BIG_THREE_TEAMS.includes(teamId);
}

/**
 * Calculate season budget for a team
 * @param {Object} team - Team object with id, remainingBudget from previous season
 * @param {Object} previousSeasonData - { finalPosition, unspentBudget, wasChampion }
 * @param {number} seasonNumber - Current season number (1, 2, 3, ...)
 * @returns {Object} { totalBudget, baseBudget, positionBonus, carryOver, balanceModifier }
 */
export function calculateSeasonBudget(team, previousSeasonData = null, seasonNumber = 1) {
  // Season 1: Everyone gets €1B
  if (seasonNumber === 1) {
    return {
      totalBudget: BUDGET_CONSTANTS.SEASON_1_BUDGET,
      baseBudget: BUDGET_CONSTANTS.SEASON_1_BUDGET,
      positionBonus: 0,
      carryOver: 0,
      balanceModifier: 1.0,
      breakdown: {
        base: BUDGET_CONSTANTS.SEASON_1_BUDGET,
        position: 0,
        carry: 0,
        modifier: 1.0,
      },
    };
  }

  // Season 2+: Calculate based on formula
  const isAI = !isHumanTeam(team.id);
  const baseBudget = isAI ? BUDGET_CONSTANTS.AI_BASE_BUDGET : BUDGET_CONSTANTS.HUMAN_BASE_BUDGET;
  const minBudget = isAI ? BUDGET_CONSTANTS.AI_MIN_BUDGET : BUDGET_CONSTANTS.HUMAN_MIN_BUDGET;
  const maxBudget = isAI ? BUDGET_CONSTANTS.AI_MAX_BUDGET : BUDGET_CONSTANTS.HUMAN_MAX_BUDGET;

  // Position bonus
  const positionBonus = previousSeasonData
    ? getLeaguePositionBonus(previousSeasonData.finalPosition)
    : getLeaguePositionBonus(5); // Default to mid-table if no data

  // Carry-over
  const carryOver = previousSeasonData
    ? calculateCarryOver(previousSeasonData.unspentBudget, isAI)
    : 0;

  // Balance modifier (only for AI)
  const balanceModifier = isAI && previousSeasonData
    ? getBalanceModifier(previousSeasonData)
    : 1.0;

  // Calculate total before modifier
  let totalBudget = baseBudget + positionBonus + carryOver;

  // Apply balance modifier for AI teams
  if (isAI) {
    totalBudget = Math.floor(totalBudget * balanceModifier);
  }

  // Clamp to min/max
  totalBudget = Math.max(minBudget, Math.min(maxBudget, totalBudget));

  return {
    totalBudget,
    baseBudget,
    positionBonus,
    carryOver,
    balanceModifier,
    breakdown: {
      base: baseBudget,
      position: positionBonus,
      carry: carryOver,
      modifier: balanceModifier,
    },
  };
}

/**
 * Validate that a team has enough budget for auction after retentions
 * @param {number} budgetAfterRetention - Budget remaining after retention costs
 * @returns {boolean} True if team has enough for auction
 */
export function hasEnoughForAuction(budgetAfterRetention) {
  return budgetAfterRetention >= BUDGET_CONSTANTS.MIN_AUCTION_BUDGET;
}

/**
 * Calculate maximum retention spending allowed
 * @param {number} totalBudget - Total budget for the season
 * @returns {number} Maximum that can be spent on retentions
 */
export function getMaxRetentionSpending(totalBudget) {
  return totalBudget - BUDGET_CONSTANTS.MIN_AUCTION_BUDGET;
}

/**
 * Format budget breakdown for display
 * @param {Object} budgetData - Result from calculateSeasonBudget
 * @returns {string[]} Array of formatted breakdown strings
 */
export function formatBudgetBreakdown(budgetData) {
  const lines = [];
  const { breakdown, totalBudget } = budgetData;

  lines.push(`Base Budget: €${(breakdown.base / 1_000_000).toFixed(0)}M`);

  if (breakdown.position > 0) {
    lines.push(`Position Bonus: +€${(breakdown.position / 1_000_000).toFixed(0)}M`);
  }

  if (breakdown.carry > 0) {
    lines.push(`Carry-Over: +€${(breakdown.carry / 1_000_000).toFixed(0)}M`);
  }

  if (breakdown.modifier !== 1.0) {
    const modPercent = ((breakdown.modifier - 1) * 100).toFixed(0);
    const sign = breakdown.modifier > 1 ? '+' : '';
    lines.push(`Balance Modifier: ${sign}${modPercent}%`);
  }

  lines.push(`Total: €${(totalBudget / 1_000_000).toFixed(0)}M`);

  return lines;
}

/**
 * Get budget example for documentation/help
 * @param {string} scenario - 'champion', 'mid-table', 'bottom'
 * @returns {Object} Example budget breakdown
 */
export function getBudgetExample(scenario) {
  const examples = {
    champion: {
      description: 'Champion who saved €150M',
      baseBudget: 750_000_000,
      positionBonus: 200_000_000,
      carryOver: 60_000_000, // 40% of 150M = 60M
      totalBudget: 1_010_000_000,
    },
    'mid-table': {
      description: '6th place who spent everything',
      baseBudget: 750_000_000,
      positionBonus: 60_000_000,
      carryOver: 0,
      totalBudget: 810_000_000,
    },
    bottom: {
      description: '10th place who saved €400M',
      baseBudget: 750_000_000,
      positionBonus: 20_000_000,
      carryOver: 150_000_000, // Capped at max
      totalBudget: 920_000_000,
    },
  };

  return examples[scenario] || examples['mid-table'];
}
