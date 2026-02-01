// Auction Helper Functions
import { isHumanTeam } from './budgetCalculator';

// Position requirements for each team (18 players total)
export const POSITION_REQUIREMENTS = {
  GK: 2,
  DEF: 6,
  MID: 5,
  FWD: 5
};

// Retention pricing (IPL style fixed tiers) - 5 slots for Season 2+
export const RETENTION_PRICES = {
  1: 150000000,  // 1st retention: 150M
  2: 100000000,  // 2nd retention: 100M
  3: 75000000,   // 3rd retention: 75M
  4: 55000000,   // 4th retention: 55M (Season 2+ only)
  5: 40000000    // 5th retention: 40M (Season 2+ only)
};

// Star player retention override thresholds
export const STAR_PLAYER_RETENTION = {
  ELITE_THRESHOLD: 92,    // 92+ rated players
  ELITE_MIN_PRICE: 150000000,  // Must pay at least €150M
  STAR_THRESHOLD: 90,     // 90-91 rated players
  STAR_MIN_PRICE: 100000000,   // Must pay at least €100M
};

// Max retentions by team type and season
export const MAX_RETENTIONS_SEASON_1 = {
  human: 3,  // Big Three can retain 3 in Season 1
  ai: 0      // AI teams cannot retain in Season 1
};

export const MAX_RETENTIONS_SEASON_2_PLUS = {
  human: 5,  // Big Three can retain 5 in Season 2+
  ai: 2      // AI teams still only 2
};

// Legacy constant for backwards compatibility
export const MAX_RETENTIONS = 3;
export const TOTAL_RETENTION_COST = 325000000; // 325M for slots 1-3

// Total retention cost for all 5 slots
export const TOTAL_RETENTION_COST_5_SLOTS = 420000000; // 420M for all 5

// Starting budget
export const STARTING_BUDGET = 1000000000; // 1B

// RTM cards configuration
export const RTM_CARDS_CONFIG = {
  human: 5,  // Big Three get 5 RTM cards
  ai: 0      // AI teams get NO RTM cards
};

// Legacy constant for backwards compatibility
export const RTM_CARDS_PER_TEAM = 5;

// Squad size
export const MAX_SQUAD_SIZE = 18;

// Base price for auction
export const BASE_PRICE = 5000000; // 5M

/**
 * Get maximum retentions allowed for a team
 * @param {string} teamId - Team ID
 * @param {number} seasonNumber - Current season (1, 2, 3, ...)
 * @returns {number} Maximum retentions allowed
 */
export function getMaxRetentions(teamId, seasonNumber = 1) {
  const isHuman = isHumanTeam(teamId);

  if (seasonNumber === 1) {
    return isHuman ? MAX_RETENTIONS_SEASON_1.human : MAX_RETENTIONS_SEASON_1.ai;
  }

  return isHuman ? MAX_RETENTIONS_SEASON_2_PLUS.human : MAX_RETENTIONS_SEASON_2_PLUS.ai;
}

/**
 * Get RTM cards for a team
 * @param {string} teamId - Team ID
 * @returns {number} RTM cards available (0 for AI teams)
 */
export function getRTMCards(teamId) {
  return isHumanTeam(teamId) ? RTM_CARDS_CONFIG.human : RTM_CARDS_CONFIG.ai;
}

/**
 * Get retention price for a slot, considering star player override
 * @param {number} slot - Slot number (1-5)
 * @param {number} playerRating - Player's rating
 * @returns {number} Retention price
 */
export function getRetentionPrice(slot, playerRating = 0) {
  const basePrice = RETENTION_PRICES[slot] || 0;

  // Star player override: 92+ must pay at least €150M
  if (playerRating >= STAR_PLAYER_RETENTION.ELITE_THRESHOLD) {
    return Math.max(basePrice, STAR_PLAYER_RETENTION.ELITE_MIN_PRICE);
  }

  // Star player override: 90-91 must pay at least €100M
  if (playerRating >= STAR_PLAYER_RETENTION.STAR_THRESHOLD) {
    return Math.max(basePrice, STAR_PLAYER_RETENTION.STAR_MIN_PRICE);
  }

  return basePrice;
}

/**
 * Calculate total retention cost for a list of players
 * @param {Array} players - Array of player objects with rating
 * @returns {Object} { totalCost, breakdown: [{slot, player, price}] }
 */
export function calculateRetentionCost(players) {
  let totalCost = 0;
  const breakdown = [];

  players.forEach((player, index) => {
    const slot = index + 1;
    const price = getRetentionPrice(slot, player.rating);
    totalCost += price;
    breakdown.push({
      slot,
      player: player.name,
      rating: player.rating,
      price,
      hasOverride: price > RETENTION_PRICES[slot]
    });
  });

  return { totalCost, breakdown };
}

/**
 * Validate retention affordability
 * @param {Object} team - Team object
 * @param {Array} retentions - Players to retain
 * @param {number} budget - Available budget
 * @param {number} minAuctionBudget - Minimum budget to keep for auction (default 100M)
 * @returns {Object} { valid, totalCost, remainingBudget, error }
 */
export function validateRetentionAffordability(team, retentions, budget, minAuctionBudget = 100000000) {
  const { totalCost, breakdown } = calculateRetentionCost(retentions);
  const remainingBudget = budget - totalCost;

  if (remainingBudget < minAuctionBudget) {
    return {
      valid: false,
      totalCost,
      remainingBudget,
      breakdown,
      error: `Must keep at least €${minAuctionBudget / 1000000}M for auction. Current remaining: €${remainingBudget / 1000000}M`
    };
  }

  return {
    valid: true,
    totalCost,
    remainingBudget,
    breakdown,
    error: null
  };
}

/**
 * Get the next valid bid amount based on current bid using tiered increments
 * Under 100M: +5M increments
 * 100M-200M: +20M increments
 * 200M+: +50M increments
 */
export function getNextBidAmount(currentBid) {
  if (currentBid < 100000000) {
    return currentBid + 5000000;
  } else if (currentBid < 200000000) {
    return currentBid + 20000000;
  } else {
    return currentBid + 50000000;
  }
}

/**
 * Get available bid increments based on current bid tier
 */
export function getBidIncrements(currentBid) {
  if (currentBid < 100000000) {
    return [5000000, 10000000, 25000000, 50000000];
  } else if (currentBid < 200000000) {
    return [20000000, 40000000, 60000000, 100000000];
  } else {
    return [50000000, 100000000, 150000000, 200000000];
  }
}

/**
 * Calculate the minimum valid bid increment
 */
export function getMinimumIncrement(currentBid) {
  if (currentBid < 100000000) {
    return 5000000;
  } else if (currentBid < 200000000) {
    return 20000000;
  } else {
    return 50000000;
  }
}

/**
 * Validate if a bid amount is valid
 */
export function isValidBid(currentBid, newBid) {
  const minIncrement = getMinimumIncrement(currentBid);
  return newBid >= currentBid + minIncrement;
}

/**
 * Format currency to display (e.g., 150000000 -> "150M")
 */
export function formatCurrency(amount) {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(amount % 1000000000 === 0 ? 0 : 1)}B`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`;
  }
  return `${amount.toLocaleString()}`;
}

/**
 * Get position category from position
 */
export function getPositionCategory(position) {
  const categoryMap = {
    'GK': 'GK',
    'CB': 'DEF', 'LB': 'DEF', 'RB': 'DEF', 'LWB': 'DEF', 'RWB': 'DEF',
    'CDM': 'MID', 'CM': 'MID', 'CAM': 'MID', 'LM': 'MID', 'RM': 'MID',
    'LW': 'FWD', 'RW': 'FWD', 'CF': 'FWD', 'ST': 'FWD'
  };
  return categoryMap[position] || 'MID';
}

/**
 * Calculate retention cost for a specific slot (1-indexed)
 */
export function getRetentionCost(slot) {
  return RETENTION_PRICES[slot] || 0;
}

/**
 * Calculate total retention cost for number of players retained
 */
export function getTotalRetentionCost(numRetained) {
  let total = 0;
  for (let i = 1; i <= numRetained && i <= MAX_RETENTIONS; i++) {
    total += RETENTION_PRICES[i];
  }
  return total;
}

/**
 * Check if team can afford a bid
 */
export function canAffordBid(teamBudget, bidAmount) {
  return teamBudget >= bidAmount;
}

/**
 * Check if team has room in squad
 */
export function hasSquadRoom(currentSquadSize) {
  return currentSquadSize < MAX_SQUAD_SIZE;
}

/**
 * Check if team has room in position category
 */
export function hasPositionRoom(positionCounts, positionCategory) {
  const required = POSITION_REQUIREMENTS[positionCategory];
  const current = positionCounts[positionCategory] || 0;
  return current < required;
}

/**
 * Check if team can bid on player
 */
export function canTeamBid(team, bidAmount, player) {
  const squadSize = getTeamSquadSize(team);
  const positionCategory = player.positionCategory || getPositionCategory(player.position);

  return (
    canAffordBid(team.remainingBudget, bidAmount) &&
    hasSquadRoom(squadSize) &&
    hasPositionRoom(team.positionCount, positionCategory)
  );
}

/**
 * Get total squad size for a team
 */
export function getTeamSquadSize(team) {
  return (team.retainedPlayers?.length || 0) + (team.auctionedPlayers?.length || 0);
}

/**
 * Calculate remaining positions needed for a team
 */
export function getRemainingPositions(team) {
  const remaining = {};
  for (const [category, required] of Object.entries(POSITION_REQUIREMENTS)) {
    const current = team.positionCount[category] || 0;
    remaining[category] = Math.max(0, required - current);
  }
  return remaining;
}

/**
 * Check if player is RTM eligible for a team
 */
export function isRTMEligible(player, team) {
  return player.realClub === team.id;
}

/**
 * Check if team can use RTM
 */
export function canUseRTM(team, bidAmount, player) {
  const positionCategory = player.positionCategory || getPositionCategory(player.position);

  return (
    team.rtmCardsRemaining > 0 &&
    canAffordBid(team.remainingBudget, bidAmount) &&
    hasSquadRoom(getTeamSquadSize(team)) &&
    hasPositionRoom(team.positionCount, positionCategory)
  );
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Tiered auction order:
 * 1. Players rated 88+ come first (shuffled randomly within tier)
 * 2. Players rated 85-87 come next (shuffled randomly within tier)
 * 3. Players rated below 85 come last (shuffled randomly within tier)
 */
export function weightedShuffleByRating(players) {
  // Tier 1: Elite players (88+)
  const tier1 = players.filter(p => p.rating >= 88);
  // Tier 2: High rated players (85-87)
  const tier2 = players.filter(p => p.rating >= 85 && p.rating < 88);
  // Tier 3: Standard players (below 85)
  const tier3 = players.filter(p => p.rating < 85);

  // Shuffle each tier randomly (not sorted by rating)
  const shuffledTier1 = shuffleArray(tier1);
  const shuffledTier2 = shuffleArray(tier2);
  const shuffledTier3 = shuffleArray(tier3);

  // Combine tiers: 88+ first, then 85-87, then below 85
  return [...shuffledTier1, ...shuffledTier2, ...shuffledTier3];
}

/**
 * Sort players by rating (highest first) for auction order
 */
export function sortByRating(players) {
  return [...players].sort((a, b) => b.rating - a.rating);
}

/**
 * Group players by position category
 */
export function groupByPositionCategory(players) {
  return players.reduce((groups, player) => {
    const category = player.positionCategory || getPositionCategory(player.position);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(player);
    return groups;
  }, {});
}

/**
 * Calculate minimum budget needed to complete squad
 * Assumes minimum price for remaining players
 */
export function getMinBudgetNeeded(team) {
  const remaining = getRemainingPositions(team);
  const totalRemaining = Object.values(remaining).reduce((sum, val) => sum + val, 0);
  return totalRemaining * BASE_PRICE;
}

/**
 * Check if auction should auto-end (only one bidder can afford)
 */
export function shouldAutoSell(teams, currentAuction, passedTeams) {
  const eligibleTeams = teams.filter(team => {
    if (passedTeams.includes(team.id)) return false;
    if (team.id === currentAuction.highestBidder) return true;

    const nextBid = getNextBidAmount(currentAuction.currentBid);
    return canTeamBid(team, nextBid, currentAuction.player);
  });

  return eligibleTeams.length <= 1;
}

/**
 * Get color for position category badge
 */
export function getPositionColor(positionCategory) {
  const colors = {
    'GK': 'bg-amber-500',
    'DEF': 'bg-blue-500',
    'MID': 'bg-green-500',
    'FWD': 'bg-red-500'
  };
  return colors[positionCategory] || 'bg-gray-500';
}

/**
 * Get position category display name
 */
export function getPositionCategoryName(category) {
  const names = {
    'GK': 'Goalkeeper',
    'DEF': 'Defender',
    'MID': 'Midfielder',
    'FWD': 'Forward'
  };
  return names[category] || category;
}

/**
 * Export auction results to CSV format
 */
export function exportToCSV(teams) {
  let csv = 'Team,Player,Position,Rating,Price,Acquisition Type\n';

  teams.forEach(team => {
    // Retained players
    team.retainedPlayers?.forEach((player, index) => {
      const cost = RETENTION_PRICES[index + 1];
      csv += `${team.name},${player.name},${player.position},${player.rating},${cost},Retained\n`;
    });

    // Auctioned players
    team.auctionedPlayers?.forEach(player => {
      csv += `${team.name},${player.name},${player.position},${player.rating},${player.purchasePrice},Auctioned\n`;
    });
  });

  return csv;
}

/**
 * Export auction results to JSON format
 */
export function exportToJSON(teams, soldPlayers) {
  return JSON.stringify({
    teams: teams.map(team => ({
      id: team.id,
      name: team.name,
      remainingBudget: team.remainingBudget,
      squad: [
        ...(team.retainedPlayers || []).map((p, i) => ({
          ...p,
          acquisitionType: 'retained',
          cost: RETENTION_PRICES[i + 1]
        })),
        ...(team.auctionedPlayers || []).map(p => ({
          ...p,
          acquisitionType: 'auctioned',
          cost: p.purchasePrice
        }))
      ]
    })),
    summary: {
      totalSold: soldPlayers.length,
      totalVolume: soldPlayers.reduce((sum, p) => sum + (p.soldFor || 0), 0)
    }
  }, null, 2);
}
