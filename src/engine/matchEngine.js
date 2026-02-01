/**
 * Match Simulation Engine
 * Simulates a 90-minute football match based on player ratings
 */

import { getPositionCategory } from '../utils/auctionHelpers';

// Match constants
export const MATCH_DURATION = 90; // minutes
export const HALF_TIME = 45;
export const REAL_TIME_DURATION = 120; // seconds (2 minutes at 1x speed per documentation)
export const TICK_INTERVAL = REAL_TIME_DURATION / MATCH_DURATION; // seconds per match minute

// Extra time constants
export const EXTRA_TIME = {
  DURATION: 30, // 30 minutes total
  HALF_DURATION: 15, // Each half
  FIRST_HALF_START: 91,
  FIRST_HALF_END: 105,
  SECOND_HALF_START: 106,
  SECOND_HALF_END: 120,
};

// Penalty shootout constants
export const PENALTIES = {
  INITIAL_KICKS: 5, // Each team takes 5 kicks initially
  BASE_SUCCESS_RATE: 0.76, // ~76% of penalties are scored in real life
  GK_RATING_IMPACT: 0.003, // Each GK rating point above 75 reduces success by 0.3%
  PLAYER_RATING_IMPACT: 0.004, // Each player rating point above 75 adds 0.4% success
  PRESSURE_FACTOR: 0.05, // Reduces success rate in sudden death
};

// Base event probability weights (per minute)
// These are modified dynamically based on team strength dominance
export const EVENT_PROBABILITIES = {
  NOTHING: 0.38,
  ATTACK: 0.35,
  SHOT: 0.17,    // Balanced for realistic shot counts (~15-25 per match)
  FOUL: 0.08,    // Fouls are common but mostly no card
  INJURY: 0.01,  // Injuries are rare
  CARD: 0.01,    // Direct cards are rare (Poisson: ~10% chance of red per match)
};

// Star player threshold - players above this rating have outsized impact
export const STAR_PLAYER = {
  THRESHOLD: 85,           // Rating to be considered a "star"
  ELITE_THRESHOLD: 90,     // Rating to be considered "elite"
  SHOOTING_WEIGHT: 2.0,    // Stars are 2x more likely to take shots
  ELITE_SHOOTING_WEIGHT: 3.0, // Elite players are 3x more likely
  GOAL_BONUS: 0.05,        // +5% goal probability for star shooters
  ELITE_GOAL_BONUS: 0.10,  // +10% goal probability for elite shooters
};

// Dominance mechanic - when one team is much stronger
// Lowered thresholds to make quality differences matter more
export const DOMINANCE = {
  THRESHOLD: 3,            // Rating difference to trigger dominance
  STRONG_THRESHOLD: 6,     // Rating difference for strong dominance
  OVERWHELMING_THRESHOLD: 10, // Rating difference for overwhelming dominance
  SHOT_BONUS: 0.04,        // +4% shot chance for dominant team
  SHOT_PENALTY: 0.02,      // -2% shot chance for weaker team
  STRONG_SHOT_BONUS: 0.06, // +6% for strong dominance
  STRONG_SHOT_PENALTY: 0.04,
  OVERWHELMING_SHOT_BONUS: 0.10,  // +10% for overwhelming
  OVERWHELMING_SHOT_PENALTY: 0.06,
};

// Card probabilities (realistic Poisson distribution)
// Yellow: ~3-4 per match average, Red: ~0.1 per match (10% chance)
// Reduced direct red probabilities to achieve ~8-10% red card rate per match
export const CARD_PROBABILITIES = {
  YELLOW_FROM_FOUL: 0.12,  // 12% of fouls result in yellow
  RED_FROM_FOUL: 0.001,    // 0.1% of fouls result in direct red (extremely rare)
  YELLOW_FROM_CARD_EVENT: 0.97,  // 97% of card events are yellow
  RED_FROM_CARD_EVENT: 0.03,     // 3% of card events are red (rare)
};

// Home advantage bonus (in rating points)
// Research shows home teams win ~46% vs ~27% away, draw ~27%
// This translates to roughly +3 to +5 rating points advantage
export const HOME_ADVANTAGE = {
  MIN_BONUS: 3,   // Minimum home bonus
  MAX_BONUS: 6,   // Maximum home bonus (varies by match)
  POSSESSION_BOOST: 0.05,  // +5% possession tendency at home
};

// Form impact (based on last 5 matches)
// Form is calculated as: (W*3 + D*1) / 15 * MAX_FORM_IMPACT
export const FORM_IMPACT = {
  MAX_BONUS: 5,      // Maximum form bonus (hot streak)
  MAX_PENALTY: -5,   // Maximum form penalty (cold streak)
  MATCHES_CONSIDERED: 5,  // Last N matches for form calculation
};

// Substitution mechanics
export const SUBSTITUTION = {
  MAX_SUBS: 5,              // Maximum substitutions per match (modern rules)
  SUB_WINDOWS: 3,           // Number of substitution windows (excluding halftime)
  FATIGUE_THRESHOLD: 50,    // Stamina below this triggers sub consideration
  INJURY_FORCE_SUB: true,   // Force substitution on serious injury
};

// Fatigue/Stamina mechanics
export const FATIGUE = {
  STARTING_STAMINA: 100,    // All players start at 100%
  BASE_DRAIN_PER_MIN: 0.8,  // Base stamina drain per minute
  SPRINT_DRAIN: 2.0,        // Extra drain when involved in action
  AGE_FACTOR: 0.02,         // Older players tire faster (per year over 28)
  LOW_STAMINA_PENALTY: 10,  // Rating penalty when stamina < 30%
  CRITICAL_STAMINA: 20,     // Below this, high injury risk
  LATE_GAME_INJURY_MULTIPLIER: 2.5, // Injuries more likely in final 15 mins of each half
};

// Injury mechanics
export const INJURY = {
  BASE_CHANCE: 0.005,       // Base injury chance per minute (0.5%)
  FATIGUE_MULTIPLIER: 3.0,  // Injury chance multiplies when fatigued
  CONTACT_MULTIPLIER: 2.0,  // Higher chance during fouls/tackles
  SEVERITY: {
    MINOR: { chance: 0.6, canContinue: true, ratingPenalty: 5 },
    MODERATE: { chance: 0.3, canContinue: false, ratingPenalty: 15 },
    SERIOUS: { chance: 0.1, canContinue: false, ratingPenalty: 0 }, // Player leaves
  },
};

/**
 * Calculate form bonus based on recent results
 * @param {Array} recentResults - Array of recent match results: [{result: 'W'|'D'|'L'}, ...]
 * @returns {number} Form bonus/penalty (-5 to +5)
 */
export function calculateFormBonus(recentResults = []) {
  if (!recentResults || recentResults.length === 0) {
    // No history, return slight random variance
    return (Math.random() - 0.5) * 2; // -1 to +1
  }

  // Take last N matches
  const matches = recentResults.slice(-FORM_IMPACT.MATCHES_CONSIDERED);

  // Calculate points: W=3, D=1, L=0
  const points = matches.reduce((sum, match) => {
    if (match.result === 'W') return sum + 3;
    if (match.result === 'D') return sum + 1;
    return sum;
  }, 0);

  // Max possible points = matches * 3
  const maxPoints = matches.length * 3;
  const formRatio = points / maxPoints; // 0 to 1

  // Convert to bonus: 0 -> -5, 0.5 -> 0, 1 -> +5
  const bonus = (formRatio - 0.5) * 2 * FORM_IMPACT.MAX_BONUS;

  return bonus;
}

/**
 * Calculate home advantage bonus
 * @param {boolean} isHome - Whether team is playing at home
 * @returns {number} Home advantage bonus (0 if away)
 */
export function calculateHomeAdvantage(isHome) {
  if (!isHome) return 0;

  // Random variance in home advantage (some matches crowd is more influential)
  const variance = Math.random() * (HOME_ADVANTAGE.MAX_BONUS - HOME_ADVANTAGE.MIN_BONUS);
  return HOME_ADVANTAGE.MIN_BONUS + variance;
}

// Formation templates with positions
export const FORMATIONS = {
  '4-3-3': {
    GK: [{ x: 10, y: 50 }],
    DEF: [
      { x: 25, y: 15 },
      { x: 25, y: 38 },
      { x: 25, y: 62 },
      { x: 25, y: 85 },
    ],
    MID: [
      { x: 45, y: 25 },
      { x: 45, y: 50 },
      { x: 45, y: 75 },
    ],
    FWD: [
      { x: 70, y: 20 },
      { x: 75, y: 50 },
      { x: 70, y: 80 },
    ],
  },
  '4-4-2': {
    GK: [{ x: 10, y: 50 }],
    DEF: [
      { x: 25, y: 15 },
      { x: 25, y: 38 },
      { x: 25, y: 62 },
      { x: 25, y: 85 },
    ],
    MID: [
      { x: 45, y: 15 },
      { x: 45, y: 38 },
      { x: 45, y: 62 },
      { x: 45, y: 85 },
    ],
    FWD: [
      { x: 70, y: 35 },
      { x: 70, y: 65 },
    ],
  },
  '3-5-2': {
    GK: [{ x: 10, y: 50 }],
    DEF: [
      { x: 25, y: 25 },
      { x: 25, y: 50 },
      { x: 25, y: 75 },
    ],
    MID: [
      { x: 40, y: 10 },
      { x: 45, y: 30 },
      { x: 45, y: 50 },
      { x: 45, y: 70 },
      { x: 40, y: 90 },
    ],
    FWD: [
      { x: 70, y: 35 },
      { x: 70, y: 65 },
    ],
  },
};

/**
 * Calculate base team strength from player ratings (without modifiers)
 */
export function calculateBaseTeamStrength(players) {
  if (!players || players.length === 0) return 50;

  const totalRating = players.reduce((sum, p) => sum + (p.rating || 70), 0);
  const avgRating = totalRating / players.length;

  // Weight by position coverage
  const positions = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  players.forEach(p => {
    const cat = p.positionCategory || getPositionCategory(p.position);
    positions[cat]++;
  });

  // Penalize if missing key positions
  let positionBonus = 0;
  if (positions.GK >= 1) positionBonus += 2;
  if (positions.DEF >= 3) positionBonus += 3;
  if (positions.MID >= 2) positionBonus += 2;
  if (positions.FWD >= 1) positionBonus += 3;

  return avgRating + positionBonus;
}

/**
 * Calculate team strength with all modifiers (form, home advantage)
 * @param {Array} players - Team players
 * @param {Object} options - { isHome: boolean, recentResults: Array }
 * @returns {Object} { total: number, base: number, formBonus: number, homeBonus: number }
 */
export function calculateTeamStrength(players, options = {}) {
  const { isHome = false, recentResults = [] } = options;

  const base = calculateBaseTeamStrength(players);
  const formBonus = calculateFormBonus(recentResults);
  const homeBonus = calculateHomeAdvantage(isHome);

  return {
    total: base + formBonus + homeBonus,
    base,
    formBonus: Math.round(formBonus * 10) / 10,
    homeBonus: Math.round(homeBonus * 10) / 10,
  };
}

/**
 * Calculate attack strength with star player bonus
 * Star players contribute more to attack rating
 */
export function calculateAttackStrength(players) {
  const attackers = players.filter(p => {
    const cat = p.positionCategory || getPositionCategory(p.position);
    return cat === 'FWD' || cat === 'MID';
  });

  if (attackers.length === 0) return 50;

  // Weight by player rating - stars have more impact
  let totalWeight = 0;
  let weightedSum = 0;

  attackers.forEach(p => {
    const rating = p.rating || 70;
    let weight = 1;

    // Star players have outsized impact
    if (rating >= STAR_PLAYER.ELITE_THRESHOLD) {
      weight = 2.5; // Elite players count 2.5x
    } else if (rating >= STAR_PLAYER.THRESHOLD) {
      weight = 1.5; // Star players count 1.5x
    }

    totalWeight += weight;
    weightedSum += rating * weight;
  });

  return weightedSum / totalWeight;
}

/**
 * Calculate defense strength with star player bonus
 */
export function calculateDefenseStrength(players) {
  const defenders = players.filter(p => {
    const cat = p.positionCategory || getPositionCategory(p.position);
    return cat === 'DEF' || cat === 'GK';
  });

  if (defenders.length === 0) return 50;

  // Weight by player rating - stars have more impact
  let totalWeight = 0;
  let weightedSum = 0;

  defenders.forEach(p => {
    const rating = p.rating || 70;
    let weight = 1;

    // Star players have outsized impact
    if (rating >= STAR_PLAYER.ELITE_THRESHOLD) {
      weight = 2.5;
    } else if (rating >= STAR_PLAYER.THRESHOLD) {
      weight = 1.5;
    }

    totalWeight += weight;
    weightedSum += rating * weight;
  });

  return weightedSum / totalWeight;
}

/**
 * Calculate midfield strength - used for possession control
 * This is separate from attack strength because possession is controlled by midfielders
 */
export function calculateMidfieldStrength(players) {
  const midfielders = players.filter(p => {
    const cat = p.positionCategory || getPositionCategory(p.position);
    return cat === 'MID';
  });

  if (midfielders.length === 0) return 50;

  // Weight by player rating - stars dominate possession
  let totalWeight = 0;
  let weightedSum = 0;

  midfielders.forEach(p => {
    const rating = p.rating || 70;
    let weight = 1;

    if (rating >= STAR_PLAYER.ELITE_THRESHOLD) {
      weight = 3.0; // Elite midfielders like Modric/KDB dominate possession
    } else if (rating >= STAR_PLAYER.THRESHOLD) {
      weight = 2.0;
    }

    totalWeight += weight;
    weightedSum += rating * weight;
  });

  return weightedSum / totalWeight;
}

/**
 * Simulate a shot attempt
 * Returns { scored: boolean, savedBy: player|null, scoredBy: player|null }
 *
 * Improvements:
 * - Wider goal probability range (2%-50%)
 * - Star players more likely to take shots (weighted selection)
 * - Star shooters get bonus to goal probability
 */
export function simulateShot(attackingTeam, defendingTeam, attackingPlayers, defendingPlayers) {
  const attackStrength = calculateAttackStrength(attackingPlayers);
  const defenseStrength = calculateDefenseStrength(defendingPlayers);

  // Select shooter from attackers - weighted by rating (stars shoot more often)
  const attackers = attackingPlayers.filter(p => {
    const cat = p.positionCategory || getPositionCategory(p.position);
    return cat === 'FWD' || cat === 'MID';
  });

  // Weight shooter selection by rating
  const shooter = selectWeightedPlayer(attackers) || attackingPlayers[0];
  const shooterRating = shooter?.rating || 70;

  // Base goal probability - balanced for realistic scorelines (1-3 goals typical)
  const baseProb = 0.12;

  // Attack vs Defense difference - balanced impact
  // A 7-point advantage (90 ATK vs 83 DEF) gives ~14% boost
  const strengthDiff = (attackStrength - defenseStrength) / 50;

  // Star player shooting bonus
  let starBonus = 0;
  if (shooterRating >= STAR_PLAYER.ELITE_THRESHOLD) {
    starBonus = 0.075; // +7.5% for elite (90+ rated)
  } else if (shooterRating >= STAR_PLAYER.THRESHOLD) {
    starBonus = 0.03; // +3% for star (85-89 rated)
  }

  // Shooter's individual rating - minor bonus
  const shooterBonus = (shooterRating - 75) / 300; // +5% for a 90-rated player

  // Final goal probability: realistic range 5%-40%
  const goalProb = Math.max(0.05, Math.min(0.40, baseProb + strengthDiff + starBonus + shooterBonus));

  // Select goalkeeper
  const goalkeeper = defendingPlayers.find(p => {
    const cat = p.positionCategory || getPositionCategory(p.position);
    return cat === 'GK';
  }) || defendingPlayers[0];

  // Goalkeeper rating affects save probability
  // Elite GK (90) gives -15% to goal prob
  const gkRating = goalkeeper?.rating || 70;
  const gkBonus = (gkRating - 75) / 100;

  const finalGoalProb = Math.max(0.05, Math.min(0.40, goalProb - gkBonus));
  const scored = Math.random() < finalGoalProb;

  return {
    scored,
    shooter,
    goalkeeper,
    shotType: getRandomShotType(),
    goalProbability: finalGoalProb, // For debugging/display
  };
}

/**
 * Select a player weighted by their rating
 * Higher rated players are more likely to be selected
 */
function selectWeightedPlayer(players) {
  if (!players || players.length === 0) return null;

  // Calculate weights based on rating
  const weights = players.map(p => {
    const rating = p.rating || 70;
    if (rating >= STAR_PLAYER.ELITE_THRESHOLD) {
      return rating * STAR_PLAYER.ELITE_SHOOTING_WEIGHT;
    } else if (rating >= STAR_PLAYER.THRESHOLD) {
      return rating * STAR_PLAYER.SHOOTING_WEIGHT;
    }
    return rating;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < players.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return players[i];
    }
  }

  return players[players.length - 1];
}

/**
 * Get random shot type for commentary
 */
function getRandomShotType() {
  const types = [
    'powerful strike',
    'curling effort',
    'header',
    'volley',
    'placed shot',
    'long-range effort',
    'close-range finish',
    'chip',
  ];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * Simulate a foul event
 * Uses realistic Poisson-based card probabilities
 */
export function simulateFoul(team, players) {
  const fouler = players[Math.floor(Math.random() * players.length)];
  const cardRoll = Math.random();

  let card = null;
  // Most fouls don't result in cards
  if (cardRoll < CARD_PROBABILITIES.RED_FROM_FOUL) {
    card = 'red';  // Very rare direct red from foul (~0.5%)
  } else if (cardRoll < CARD_PROBABILITIES.RED_FROM_FOUL + CARD_PROBABILITIES.YELLOW_FROM_FOUL) {
    card = 'yellow';  // ~15% of fouls get yellow
  }
  // ~84.5% of fouls have no card

  return {
    fouler,
    card,
    foulType: getRandomFoulType(),
  };
}

function getRandomFoulType() {
  const types = [
    'tactical foul',
    'late challenge',
    'shirt pull',
    'obstruction',
    'dangerous tackle',
    'handball',
  ];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * Simulate an injury event with severity and stamina consideration
 */
export function simulateInjury(players, minute = 45) {
  // Filter out already injured players
  const healthyPlayers = players.filter(p => !p.injured && !p.sentOff);
  if (healthyPlayers.length === 0) return null;

  // Weight injury chance by stamina - fatigued players more likely to get injured
  const weights = healthyPlayers.map(p => {
    const stamina = p.stamina || 100;
    const baseWeight = 1;
    const fatigueMultiplier = stamina < FATIGUE.CRITICAL_STAMINA ? INJURY.FATIGUE_MULTIPLIER : 1;
    return baseWeight * fatigueMultiplier;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  let injured = healthyPlayers[0];

  for (let i = 0; i < healthyPlayers.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      injured = healthyPlayers[i];
      break;
    }
  }

  // Determine severity
  const severityRoll = Math.random();
  let severity, canContinue, ratingPenalty;

  if (severityRoll < INJURY.SEVERITY.SERIOUS.chance) {
    severity = 'serious';
    canContinue = false;
    ratingPenalty = 0; // Player leaves immediately
  } else if (severityRoll < INJURY.SEVERITY.SERIOUS.chance + INJURY.SEVERITY.MODERATE.chance) {
    severity = 'moderate';
    canContinue = false;
    ratingPenalty = INJURY.SEVERITY.MODERATE.ratingPenalty;
  } else {
    severity = 'minor';
    canContinue = true;
    ratingPenalty = INJURY.SEVERITY.MINOR.ratingPenalty;
  }

  return {
    player: injured,
    severity,
    canContinue,
    ratingPenalty,
    minute,
    requiresSubstitution: !canContinue,
  };
}

/**
 * Calculate stamina drain for a player based on age and activity
 * @param {Object} player - Player object with age
 * @param {boolean} wasActive - Whether player was involved in action
 * @returns {number} Stamina to drain this minute
 */
export function calculateStaminaDrain(player, wasActive = false) {
  let drain = FATIGUE.BASE_DRAIN_PER_MIN;

  // Activity increases drain
  if (wasActive) {
    drain += FATIGUE.SPRINT_DRAIN;
  }

  // Older players tire faster (over 28)
  const age = player.age || 25;
  if (age > 28) {
    drain *= 1 + (age - 28) * FATIGUE.AGE_FACTOR;
  }

  // Younger players have better recovery
  if (age < 24) {
    drain *= 0.9;
  }

  return drain;
}

/**
 * Update player stamina during match
 * @param {Array} players - Current on-pitch players
 * @param {Object} event - Current match event
 * @returns {Array} Updated players with new stamina values
 */
export function updatePlayerStamina(players, event = null) {
  return players.map(player => {
    if (player.injured || player.sentOff) return player;

    const wasActive = event && event.player?.id === player.id;
    const drain = calculateStaminaDrain(player, wasActive);
    const newStamina = Math.max(0, (player.stamina || 100) - drain);

    // Apply rating penalty for low stamina
    let effectiveRating = player.rating || 70;
    if (newStamina < 30) {
      effectiveRating -= FATIGUE.LOW_STAMINA_PENALTY;
    }

    return {
      ...player,
      stamina: newStamina,
      effectiveRating: Math.max(50, effectiveRating),
    };
  });
}

/**
 * Determine if a substitution should be made (AI decision)
 * AGGRESSIVE: Ensures all 5 subs are used during the match
 * @param {Array} onPitch - Players currently on pitch
 * @param {Array} bench - Available substitutes
 * @param {number} subsUsed - Substitutions already made
 * @param {number} minute - Current match minute
 * @returns {Object|null} Substitution suggestion or null
 */
export function suggestSubstitution(onPitch, bench, subsUsed, minute) {
  if (subsUsed >= SUBSTITUTION.MAX_SUBS || bench.length === 0) {
    return null;
  }

  // Priority 1: Injured players who can't continue (immediate)
  const injuredOut = onPitch.find(p => p.injured && !p.canContinue);
  if (injuredOut) {
    const replacement = findBestReplacement(injuredOut, bench);
    if (replacement) {
      return {
        out: injuredOut,
        in: replacement,
        reason: 'injury',
        priority: 'critical',
      };
    }
  }

  // Scheduled substitution windows - FORCE subs at these minutes
  // 5 windows: 55, 62, 70, 78, 85 (one sub per window to use all 5)
  const subWindows = [55, 62, 70, 78, 85];
  const currentWindow = subWindows.findIndex(w => minute >= w && minute < w + 3);
  const expectedSubsAtWindow = currentWindow + 1;

  // Force a sub if we're in a window and haven't made enough subs yet
  const shouldForceSub = currentWindow >= 0 && subsUsed < expectedSubsAtWindow;

  // Also force remaining subs in final minutes (88-90)
  const finalPush = minute >= 88 && subsUsed < SUBSTITUTION.MAX_SUBS;

  if (shouldForceSub || finalPush) {
    // Get all outfield players (not GK) sorted by priority
    const eligibleForSub = onPitch
      .filter(p => !p.sentOff && p.position !== 'GK' && getPositionCategory(p.position) !== 'GK')
      .sort((a, b) => {
        // Injured first
        if (a.injured && !b.injured) return -1;
        if (!a.injured && b.injured) return 1;
        // Then lowest stamina
        return (a.stamina || 100) - (b.stamina || 100);
      });

    if (eligibleForSub.length > 0) {
      const playerOut = eligibleForSub[0];
      const replacement = findBestReplacement(playerOut, bench);
      if (replacement) {
        const reason = playerOut.injured ? 'injury' :
                       (playerOut.stamina || 100) < 40 ? 'fatigue' : 'tactical';
        return {
          out: playerOut,
          in: replacement,
          reason,
          priority: playerOut.injured ? 'critical' : 'normal',
        };
      }
    }
  }

  // Priority 2: Very fatigued players (stamina < 30) - any time after 50'
  if (minute > 50) {
    const exhausted = onPitch
      .filter(p => (p.stamina || 100) < 30 && !p.injured && !p.sentOff)
      .sort((a, b) => (a.stamina || 100) - (b.stamina || 100))[0];

    if (exhausted) {
      const replacement = findBestReplacement(exhausted, bench);
      if (replacement) {
        return {
          out: exhausted,
          in: replacement,
          reason: 'fatigue',
          priority: 'high',
        };
      }
    }
  }

  return null;
}

/**
 * Find best replacement for a player from bench
 */
function findBestReplacement(playerOut, bench) {
  const position = playerOut.position;
  const positionCategory = playerOut.positionCategory || getPositionCategory(position);

  // First try to find same position
  let candidates = bench.filter(p =>
    (p.positionCategory || getPositionCategory(p.position)) === positionCategory
  );

  // If no same position, get any available
  if (candidates.length === 0) {
    candidates = bench;
  }

  // Sort by rating and return best
  candidates.sort((a, b) => (b.rating || 70) - (a.rating || 70));
  return candidates[0] || null;
}

/**
 * Execute a substitution
 * @param {Array} onPitch - Current on-pitch players
 * @param {Array} bench - Bench players
 * @param {Object} playerOut - Player coming off
 * @param {Object} playerIn - Player coming on
 * @returns {Object} Updated onPitch and bench arrays
 */
export function executeSubstitution(onPitch, bench, playerOut, playerIn) {
  const newOnPitch = onPitch.map(p =>
    p.id === playerOut.id
      ? { ...playerIn, stamina: 100, substitutedIn: true }
      : p
  );

  const newBench = bench.filter(p => p.id !== playerIn.id);
  newBench.push({ ...playerOut, substitutedOff: true });

  return {
    onPitch: newOnPitch,
    bench: newBench,
  };
}

/**
 * Initialize players with stamina for match start
 */
export function initializePlayersForMatch(players) {
  return players.map(p => ({
    ...p,
    stamina: FATIGUE.STARTING_STAMINA,
    effectiveRating: p.rating || 70,
    injured: false,
    yellowCards: 0,
    sentOff: false,
  }));
}

/**
 * Determine which team gets possession/attack opportunity
 * Now uses MIDFIELD strength for more realistic possession control
 * Enhanced to give stronger midfield more possession dominance
 */
export function determinePossession(homeMidfieldStrength, awayMidfieldStrength) {
  // Calculate midfield advantage with amplification
  // A 5-point midfield advantage (88 vs 83) should give ~60-65% possession
  const diff = homeMidfieldStrength - awayMidfieldStrength;

  // Amplify the difference - each point of advantage gives ~2% more possession
  // Base is 50%, so 88 vs 83 (5 point diff) = 50% + (5 * 2%) = 60%
  const homeProb = 0.5 + (diff * 0.02);

  // Clamp between 30% and 70% to avoid extreme cases
  const clampedProb = Math.max(0.30, Math.min(0.70, homeProb));

  return Math.random() < clampedProb ? 'home' : 'away';
}

/**
 * Calculate dominance level between two teams
 * Returns { dominant: 'home'|'away'|null, level: 'normal'|'dominant'|'strong'|'overwhelming', diff: number }
 * Now uses a combined metric of attack, midfield, and defense advantages
 */
export function calculateDominance(homeStrength, awayStrength, homeAttack = null, awayAttack = null, homeDefense = null, awayDefense = null) {
  // If we have detailed stats, calculate composite advantage
  let diff;
  if (homeAttack !== null && awayAttack !== null && homeDefense !== null && awayDefense !== null) {
    // Home attacking advantage: homeAttack vs awayDefense
    const homeAttackAdv = homeAttack - awayDefense;
    // Away attacking advantage: awayAttack vs homeDefense
    const awayAttackAdv = awayAttack - homeDefense;
    // Overall team strength advantage
    const strengthAdv = homeStrength - awayStrength;

    // Combined advantage (weighted average)
    const homeComposite = (homeAttackAdv * 0.4 + strengthAdv * 0.6);
    const awayComposite = (awayAttackAdv * 0.4 - strengthAdv * 0.6);

    diff = homeComposite - awayComposite;
  } else {
    diff = homeStrength - awayStrength;
  }

  const dominant = diff > 0 ? 'home' : 'away';
  const absDiff = Math.abs(diff);

  if (absDiff >= DOMINANCE.OVERWHELMING_THRESHOLD) {
    return { dominant, level: 'overwhelming', diff: absDiff };
  } else if (absDiff >= DOMINANCE.STRONG_THRESHOLD) {
    return { dominant, level: 'strong', diff: absDiff };
  } else if (absDiff >= DOMINANCE.THRESHOLD) {
    return { dominant, level: 'dominant', diff: absDiff };
  }

  return { dominant: null, level: 'normal', diff: absDiff };
}

/**
 * Get dynamic shot probability based on team strength and dominance
 */
function getDynamicShotProbability(team, dominance, baseProb = EVENT_PROBABILITIES.SHOT) {
  if (!dominance.dominant) return baseProb;

  const isDominant = dominance.dominant === team;

  switch (dominance.level) {
    case 'overwhelming':
      return isDominant
        ? baseProb + DOMINANCE.OVERWHELMING_SHOT_BONUS
        : Math.max(0.03, baseProb - DOMINANCE.OVERWHELMING_SHOT_PENALTY);
    case 'strong':
      return isDominant
        ? baseProb + DOMINANCE.STRONG_SHOT_BONUS
        : Math.max(0.05, baseProb - DOMINANCE.STRONG_SHOT_PENALTY);
    case 'dominant':
      return isDominant
        ? baseProb + DOMINANCE.SHOT_BONUS
        : Math.max(0.08, baseProb - DOMINANCE.SHOT_PENALTY);
    default:
      return baseProb;
  }
}

/**
 * Generate match event for a given minute
 * @param {number} minute - Current match minute
 * @param {Object} homeTeam - Home team data
 * @param {Object} awayTeam - Away team data
 * @param {Array} homePlayers - Home team players
 * @param {Array} awayPlayers - Away team players
 * @param {Object} matchState - Current match state including form data
 *
 * Improvements:
 * - Uses midfield strength for possession (not total team strength)
 * - Dynamic shot probability based on dominance
 * - Dominant teams create more chances
 */
export function generateMatchEvent(minute, homeTeam, awayTeam, homePlayers, awayPlayers, matchState) {
  // Calculate all strength metrics
  const homeStrengthData = calculateTeamStrength(homePlayers, {
    isHome: true,
    recentResults: matchState?.homeForm || [],
  });
  const awayStrengthData = calculateTeamStrength(awayPlayers, {
    isHome: false,
    recentResults: matchState?.awayForm || [],
  });

  const homeStrength = homeStrengthData.total;
  const awayStrength = awayStrengthData.total;

  // Use MIDFIELD strength for possession control
  const homeMidfield = calculateMidfieldStrength(homePlayers);
  const awayMidfield = calculateMidfieldStrength(awayPlayers);

  // Calculate attack and defense for dominance calculation
  const homeAttack = calculateAttackStrength(homePlayers);
  const awayAttack = calculateAttackStrength(awayPlayers);
  const homeDefense = calculateDefenseStrength(homePlayers);
  const awayDefense = calculateDefenseStrength(awayPlayers);

  // Calculate dominance for dynamic shot probability (now uses attack vs defense matchups)
  const dominance = calculateDominance(homeStrength, awayStrength, homeAttack, awayAttack, homeDefense, awayDefense);

  // Determine which team has possession this minute (based on midfield)
  const possessionTeam = determinePossession(homeMidfield, awayMidfield);

  // Get dynamic shot probability for the team with possession
  const shotProb = getDynamicShotProbability(possessionTeam, dominance);

  // Build dynamic event probabilities
  const dynamicProbs = {
    ...EVENT_PROBABILITIES,
    SHOT: shotProb,
    // Adjust "nothing" to compensate for shot probability changes
    NOTHING: EVENT_PROBABILITIES.NOTHING - (shotProb - EVENT_PROBABILITIES.SHOT),
  };

  const rand = Math.random();
  let cumProb = 0;

  // Determine event type with dynamic probabilities
  let eventType = 'nothing';
  for (const [type, prob] of Object.entries(dynamicProbs)) {
    cumProb += prob;
    if (rand < cumProb) {
      eventType = type.toLowerCase();
      break;
    }
  }

  // Increase attack probability near end of half
  if ((minute > 40 && minute < 46) || minute > 85) {
    if (eventType === 'nothing' && Math.random() < 0.3) {
      eventType = 'attack';
    }
  }

  // Late-game fatigue increases injury probability (final 15 mins of each half)
  const isLateGame = (minute > 30 && minute <= 45) || (minute > 75 && minute <= 90) || minute > 105;
  if (isLateGame && eventType === 'nothing' && Math.random() < EVENT_PROBABILITIES.INJURY * FATIGUE.LATE_GAME_INJURY_MULTIPLIER) {
    eventType = 'injury';
  }

  // For shots and attacks, use the possession team
  // For fouls/cards/injuries, can happen to either team
  const attackingTeam = (eventType === 'shot' || eventType === 'attack') ? possessionTeam : determinePossession(homeMidfield, awayMidfield);

  const event = {
    minute,
    type: eventType,
    team: attackingTeam,
    homeTeam: homeTeam.name,
    awayTeam: awayTeam.name,
  };

  switch (eventType) {
    case 'attack': {
      const isHome = attackingTeam === 'home';
      const attacking = isHome ? homePlayers : awayPlayers;
      const attackers = attacking.filter(p => {
        const cat = p.positionCategory || getPositionCategory(p.position);
        return cat === 'FWD' || cat === 'MID';
      });
      const player = attackers[Math.floor(Math.random() * attackers.length)] || attacking[0];
      event.player = player;
      event.description = getAttackDescription(player, isHome ? homeTeam : awayTeam);
      break;
    }

    case 'shot': {
      const isHome = attackingTeam === 'home';
      const result = simulateShot(
        isHome ? homeTeam : awayTeam,
        isHome ? awayTeam : homeTeam,
        isHome ? homePlayers : awayPlayers,
        isHome ? awayPlayers : homePlayers
      );
      event.shot = result;
      event.goal = result.scored;
      event.player = result.shooter;
      event.description = getShotDescription(result, isHome ? homeTeam : awayTeam);
      break;
    }

    case 'foul': {
      const isHome = Math.random() < 0.5;
      const result = simulateFoul(
        isHome ? homeTeam : awayTeam,
        isHome ? homePlayers : awayPlayers
      );
      event.foul = result;
      event.team = isHome ? 'home' : 'away';
      event.player = result.fouler;
      event.card = result.card;
      event.description = getFoulDescription(result);
      break;
    }

    case 'injury': {
      const isHome = Math.random() < 0.5;
      const result = simulateInjury(isHome ? homePlayers : awayPlayers);
      if (result) {
        event.injury = result;
        event.team = isHome ? 'home' : 'away';
        event.player = result.player;
        event.description = getInjuryDescription(result);
        event.requiresSubstitution = !result.canContinue;
      } else {
        event.type = 'nothing';
        event.description = '';
      }
      break;
    }

    case 'card': {
      const isHome = Math.random() < 0.5;
      const players = isHome ? homePlayers : awayPlayers;
      const player = players[Math.floor(Math.random() * players.length)];
      // Use Poisson-based probabilities: 90% yellow, 10% red
      const cardType = Math.random() < CARD_PROBABILITIES.YELLOW_FROM_CARD_EVENT ? 'yellow' : 'red';
      event.team = isHome ? 'home' : 'away';
      event.player = player;
      event.card = cardType;
      event.description = getCardDescription(player, cardType, isHome ? homeTeam : awayTeam);
      break;
    }

    default:
      event.description = '';
  }

  return event;
}

// Commentary generators
function getAttackDescription(player, team) {
  const templates = [
    `${player.name} drives forward for ${team.name}!`,
    `${team.name} building an attack through ${player.name}`,
    `Excellent ball control by ${player.name}`,
    `${player.name} picks up the ball in a dangerous area`,
    `${team.name} looking threatening with ${player.name} on the ball`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function getShotDescription(result, attackingTeam) {
  if (result.scored) {
    const templates = [
      `GOAL! ${result.shooter.name} scores with a ${result.shotType}! What a finish!`,
      `IT'S IN! ${result.shooter.name} beats ${result.goalkeeper.name}! ${attackingTeam.name} celebrate!`,
      `BRILLIANT! ${result.shooter.name} finds the back of the net with a ${result.shotType}!`,
      `GOAL! ${attackingTeam.name} take the lead through ${result.shooter.name}!`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  } else {
    const templates = [
      `${result.shooter.name}'s ${result.shotType} is saved by ${result.goalkeeper.name}!`,
      `Good save! ${result.goalkeeper.name} denies ${result.shooter.name}`,
      `${result.shooter.name} fires wide with the ${result.shotType}`,
      `Just over the bar! ${result.shooter.name}'s effort goes close`,
      `${result.goalkeeper.name} makes himself big and blocks the shot!`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

function getFoulDescription(result) {
  let desc = `${result.foulType} by ${result.fouler.name}`;
  if (result.card === 'yellow') {
    desc += `. Yellow card shown!`;
  } else if (result.card === 'red') {
    desc += `. RED CARD! ${result.fouler.name} is sent off!`;
  }
  return desc;
}

function getInjuryDescription(result) {
  if (result.severity === 'serious') {
    return `Concern for ${result.player.name} who goes down injured. The physios are on the pitch. This looks serious.`;
  }
  return `${result.player.name} is down but should be able to continue after treatment.`;
}

function getCardDescription(player, cardType, team) {
  if (cardType === 'red') {
    return `RED CARD! ${player.name} is sent off! ${team.name} down to ${10} men!`;
  }
  return `Yellow card for ${player.name}. The referee has had enough of that!`;
}

/**
 * Get player positions for visualization
 */
export function getPlayerPositions(players, formation = '4-3-3', isHome = true) {
  const template = FORMATIONS[formation] || FORMATIONS['4-3-3'];
  const positions = [];

  // Group players by position category
  const grouped = { GK: [], DEF: [], MID: [], FWD: [] };
  players.forEach(p => {
    const cat = p.positionCategory || getPositionCategory(p.position);
    if (grouped[cat]) {
      grouped[cat].push(p);
    }
  });

  // Assign positions based on template
  Object.entries(template).forEach(([cat, slots]) => {
    const categoryPlayers = grouped[cat] || [];
    slots.forEach((slot, idx) => {
      const player = categoryPlayers[idx];
      if (player) {
        let x = slot.x;
        let y = slot.y;

        // Mirror for away team
        if (!isHome) {
          x = 100 - x;
        }

        positions.push({
          player,
          x,
          y,
          category: cat,
        });
      }
    });
  });

  return positions;
}

/**
 * Create initial match state
 * @param {Object} homeTeam - Home team data
 * @param {Object} awayTeam - Away team data
 * @param {Array} homePlayers - Home starting XI
 * @param {Array} awayPlayers - Away starting XI
 * @param {Array} homeBench - Home bench players
 * @param {Array} awayBench - Away bench players
 * @param {Object} options - { homeForm: Array, awayForm: Array } - Recent results for form calculation
 */
export function createInitialMatchState(homeTeam, awayTeam, homePlayers, awayPlayers, homeBench = [], awayBench = [], options = {}) {
  const { homeForm = [], awayForm = [] } = options;

  // Calculate team strengths with modifiers
  const homeStrengthBase = calculateTeamStrength(homePlayers, { isHome: true, recentResults: homeForm });
  const awayStrengthBase = calculateTeamStrength(awayPlayers, { isHome: false, recentResults: awayForm });

  // Add attack, defense, and midfield breakdown
  const homeStrength = {
    ...homeStrengthBase,
    attack: calculateAttackStrength(homePlayers),
    defense: calculateDefenseStrength(homePlayers),
    midfield: calculateMidfieldStrength(homePlayers),
    playersOnPitch: 11,
  };
  const awayStrength = {
    ...awayStrengthBase,
    attack: calculateAttackStrength(awayPlayers),
    defense: calculateDefenseStrength(awayPlayers),
    midfield: calculateMidfieldStrength(awayPlayers),
    playersOnPitch: 11,
  };

  // Calculate initial dominance for display
  const dominance = calculateDominance(homeStrengthBase.total, awayStrengthBase.total);

  return {
    minute: 0,
    phase: 'pre-match', // pre-match, first-half, half-time, second-half, full-time
    homeScore: 0,
    awayScore: 0,
    homeTeam,
    awayTeam,
    homePlayers: homePlayers.map(p => ({ ...p, injured: false, yellowCards: 0, redCard: false })),
    awayPlayers: awayPlayers.map(p => ({ ...p, injured: false, yellowCards: 0, redCard: false })),
    homeBench: homeBench.map(p => ({ ...p, injured: false, yellowCards: 0, redCard: false })),
    awayBench: awayBench.map(p => ({ ...p, injured: false, yellowCards: 0, redCard: false })),
    events: [],
    homeSubstitutions: 0,
    awaySubstitutions: 0,
    maxSubstitutions: 5, // Modern football allows 5 subs
    ballPosition: { x: 50, y: 50 },
    possession: { home: 50, away: 50 },
    shots: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    corners: { home: 0, away: 0 },
    fouls: { home: 0, away: 0 },
    // Form and strength data for display and calculations
    homeForm,
    awayForm,
    homeStrength,
    awayStrength,
    dominance, // Which team is dominant and by how much
  };
}

/**
 * Get best formation based on squad composition
 */
export function getBestFormation(players) {
  const posCount = { GK: 0, DEF: 0, MID: 0, FWD: 0 };

  players.forEach(p => {
    const cat = p.positionCategory || getPositionCategory(p.position);
    posCount[cat]++;
  });

  const formationReq = {
    '4-3-3': { GK: 1, DEF: 4, MID: 3, FWD: 3 },
    '4-4-2': { GK: 1, DEF: 4, MID: 4, FWD: 2 },
    '3-5-2': { GK: 1, DEF: 3, MID: 5, FWD: 2 },
  };

  let bestFormation = '4-3-3';
  let bestScore = -Infinity;

  for (const [name, req] of Object.entries(formationReq)) {
    let score = 0;
    score += Math.min(posCount.DEF, req.DEF) * 10;
    score += Math.min(posCount.MID, req.MID) * 10;
    score += Math.min(posCount.FWD, req.FWD) * 12;
    score -= Math.max(0, req.DEF - posCount.DEF) * 15;
    score -= Math.max(0, req.MID - posCount.MID) * 15;
    score -= Math.max(0, req.FWD - posCount.FWD) * 20;

    if (score > bestScore) {
      bestScore = score;
      bestFormation = name;
    }
  }

  return bestFormation;
}

/**
 * Select best 11 players for a formation
 */
export function selectStartingEleven(players, formation = '4-3-3') {
  const formationReq = {
    '4-3-3': { GK: 1, DEF: 4, MID: 3, FWD: 3 },
    '4-4-2': { GK: 1, DEF: 4, MID: 4, FWD: 2 },
    '3-5-2': { GK: 1, DEF: 3, MID: 5, FWD: 2 },
  };

  const req = formationReq[formation] || formationReq['4-3-3'];
  const selected = [];
  const available = [...players].sort((a, b) => (b.rating || 70) - (a.rating || 70));

  for (const [pos, count] of Object.entries(req)) {
    const posPlayers = available.filter(p => {
      const cat = p.positionCategory || getPositionCategory(p.position);
      return cat === pos;
    });
    const toSelect = posPlayers.slice(0, count);
    selected.push(...toSelect);
    toSelect.forEach(p => {
      const idx = available.indexOf(p);
      if (idx > -1) available.splice(idx, 1);
    });
  }

  while (selected.length < 11 && available.length > 0) {
    selected.push(available.shift());
  }

  return selected.slice(0, 11);
}

/**
 * Simulate a full match with events (for visual simulation)
 */
export function simulateMatch(homeTeam, awayTeam, isNeutral = false) {
  const homeFormation = getBestFormation(homeTeam.players || []);
  const awayFormation = getBestFormation(awayTeam.players || []);

  const homeEleven = selectStartingEleven(homeTeam.players || [], homeFormation);
  const awayEleven = selectStartingEleven(awayTeam.players || [], awayFormation);

  const homeStrength = calculateTeamStrength(homeEleven, { isHome: !isNeutral });
  const awayStrength = calculateTeamStrength(awayEleven, { isHome: false });

  const events = [];
  let homeGoals = 0;
  let awayGoals = 0;

  // Simulate 90 minutes - generate event for each minute
  for (let minute = 1; minute <= 93; minute++) {
    const event = generateMatchEvent(minute, homeTeam, awayTeam, homeEleven, awayEleven, {
      homeStrength,
      awayStrength,
    });

    // Only track meaningful events (not 'nothing')
    if (event.type !== 'nothing') {
      events.push(event);

      if (event.goal) {
        if (event.team === 'home') homeGoals++;
        else awayGoals++;
      }
    }
  }

  let winner = null;
  if (homeGoals > awayGoals) winner = homeTeam.id;
  else if (awayGoals > homeGoals) winner = awayTeam.id;

  return {
    homeTeam: homeTeam.id,
    awayTeam: awayTeam.id,
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,
    homeFormation,
    awayFormation,
    homeEleven,
    awayEleven,
    homeGoals,
    awayGoals,
    winner,
    events,
    homeStrength: Math.round(homeStrength.total),
    awayStrength: Math.round(awayStrength.total),
  };
}

/**
 * Simulate knockout match with potential extra time/penalties
 * @param {Object} homeTeam - Home team
 * @param {Object} awayTeam - Away team
 * @param {Object} firstLegResult - First leg result (null for single-leg final)
 * @param {boolean} isFinal - Whether this is a final (single match, goes to ET/pens)
 */
export function simulateKnockoutMatch(homeTeam, awayTeam, firstLegResult = null, isFinal = false) {
  const match = simulateMatch(homeTeam, awayTeam);

  let aggregateHome = match.homeGoals;
  let aggregateAway = match.awayGoals;

  // For two-legged ties
  if (firstLegResult) {
    aggregateHome += firstLegResult.awayGoals;
    aggregateAway += firstLegResult.homeGoals;
  }

  match.aggregateHome = aggregateHome;
  match.aggregateAway = aggregateAway;
  match.isSecondLeg = !!firstLegResult;
  match.isFinal = isFinal;

  // For finals: need ET/pens if tied at 90 mins
  // For two-legged ties (leg 2): need ET/pens only if aggregate AND away goals are tied
  if (isFinal) {
    // Single leg final - if tied at 90 mins, go to extra time
    if (match.homeGoals === match.awayGoals) {
      // Generate extra time events
      const etEvents = generateExtraTimeEvents(
        homeTeam, awayTeam,
        match.homeEleven, match.awayEleven
      );

      let etHomeGoals = 0;
      let etAwayGoals = 0;

      etEvents.forEach(event => {
        if (event.goal) {
          if (event.team === 'home') etHomeGoals++;
          else etAwayGoals++;
        }
      });

      match.extraTime = {
        events: etEvents,
        homeGoals: etHomeGoals,
        awayGoals: etAwayGoals,
      };

      match.homeGoalsAET = match.homeGoals + etHomeGoals;
      match.awayGoalsAET = match.awayGoals + etAwayGoals;

      if (match.homeGoalsAET !== match.awayGoalsAET) {
        match.aggregateWinner = match.homeGoalsAET > match.awayGoalsAET ? homeTeam.id : awayTeam.id;
        match.decidedIn = 'extraTime';
      } else {
        // Still tied - penalties
        const penaltyResult = simulatePenaltyShootout(
          homeTeam, awayTeam,
          match.homeEleven, match.awayEleven
        );

        match.penalties = penaltyResult;
        match.aggregateWinner = penaltyResult.winner;
        match.decidedIn = 'penalties';
      }
    } else {
      match.aggregateWinner = match.homeGoals > match.awayGoals ? homeTeam.id : awayTeam.id;
      match.decidedIn = 'regularTime';
    }
  } else if (firstLegResult) {
    // Two-legged tie - leg 2
    // In leg 2: homeTeam is actually the away team from leg 1 (playing at home in leg 2)
    // firstLegResult.homeGoals = leg 1 home team's goals (now away team)
    // firstLegResult.awayGoals = leg 1 away team's goals (now home team)
    // match.homeGoals = leg 2 home team's goals (was away in leg 1)
    // match.awayGoals = leg 2 away team's goals (was home in leg 1)

    // Away goals for the team that was HOME in leg 1 (now AWAY in leg 2): match.awayGoals
    // Away goals for the team that was AWAY in leg 1 (now HOME in leg 2): firstLegResult.awayGoals
    const leg1HomeTeamAwayGoals = match.awayGoals; // They're away in leg 2
    const leg1AwayTeamAwayGoals = firstLegResult.awayGoals; // They were away in leg 1

    match.awayGoalsRule = {
      leg1HomeTeam: leg1HomeTeamAwayGoals,
      leg1AwayTeam: leg1AwayTeamAwayGoals,
    };

    if (aggregateHome !== aggregateAway) {
      // Aggregate decides it
      match.aggregateWinner = aggregateHome > aggregateAway ? homeTeam.id : awayTeam.id;
      match.decidedIn = 'regularTime';
    } else {
      // Aggregate is tied - check away goals rule
      // homeTeam in leg 2 was away in leg 1, so their away goals = firstLegResult.awayGoals
      // awayTeam in leg 2 was home in leg 1, so their away goals = match.awayGoals
      if (leg1AwayTeamAwayGoals > leg1HomeTeamAwayGoals) {
        // Leg 1 away team (leg 2 home team) wins on away goals
        match.aggregateWinner = homeTeam.id;
        match.decidedIn = 'awayGoals';
      } else if (leg1HomeTeamAwayGoals > leg1AwayTeamAwayGoals) {
        // Leg 1 home team (leg 2 away team) wins on away goals
        match.aggregateWinner = awayTeam.id;
        match.decidedIn = 'awayGoals';
      } else {
        // Tied on aggregate AND away goals - go to extra time
        const etEvents = generateExtraTimeEvents(
          homeTeam, awayTeam,
          match.homeEleven, match.awayEleven
        );

        let etHomeGoals = 0;
        let etAwayGoals = 0;

        etEvents.forEach(event => {
          if (event.goal) {
            if (event.team === 'home') etHomeGoals++;
            else etAwayGoals++;
          }
        });

        match.extraTime = {
          events: etEvents,
          homeGoals: etHomeGoals,
          awayGoals: etAwayGoals,
        };

        match.homeGoalsAET = match.homeGoals + etHomeGoals;
        match.awayGoalsAET = match.awayGoals + etAwayGoals;

        // Update aggregate with ET goals
        aggregateHome += etHomeGoals;
        aggregateAway += etAwayGoals;
        match.aggregateHome = aggregateHome;
        match.aggregateAway = aggregateAway;

        if (aggregateHome !== aggregateAway) {
          match.aggregateWinner = aggregateHome > aggregateAway ? homeTeam.id : awayTeam.id;
          match.decidedIn = 'extraTime';
        } else {
          // Still tied after ET - penalties
          const penaltyResult = simulatePenaltyShootout(
            homeTeam, awayTeam,
            match.homeEleven, match.awayEleven
          );

          match.penalties = penaltyResult;
          match.aggregateWinner = penaltyResult.winner;
          match.decidedIn = 'penalties';
        }
      }
    }
  } else {
    // First leg of two-legged tie - no decision needed
    match.aggregateWinner = null;
    match.decidedIn = null;
  }

  return match;
}

/**
 * Simulate a penalty kick
 * @param {Object} taker - Player taking the penalty
 * @param {Object} goalkeeper - Opposing goalkeeper
 * @param {boolean} isSuddenDeath - Whether this is in sudden death
 * @returns {Object} { scored: boolean, direction: string }
 */
export function simulatePenaltyKick(taker, goalkeeper, isSuddenDeath = false) {
  const takerRating = taker?.rating || 75;
  const gkRating = goalkeeper?.rating || 75;

  // Calculate success probability
  let successRate = PENALTIES.BASE_SUCCESS_RATE;

  // Player skill bonus (higher rated players score more)
  successRate += (takerRating - 75) * PENALTIES.PLAYER_RATING_IMPACT;

  // GK skill penalty (better keepers save more)
  successRate -= (gkRating - 75) * PENALTIES.GK_RATING_IMPACT;

  // Pressure factor in sudden death
  if (isSuddenDeath) {
    successRate -= PENALTIES.PRESSURE_FACTOR;
  }

  // Clamp between 50% and 95%
  successRate = Math.max(0.50, Math.min(0.95, successRate));

  const scored = Math.random() < successRate;

  // Direction for visual
  const directions = ['left', 'center', 'right'];
  const direction = directions[Math.floor(Math.random() * directions.length)];

  return {
    scored,
    direction,
    taker,
    goalkeeper,
    successRate,
  };
}

/**
 * Select best penalty takers from squad
 * @param {Array} players - Available players
 * @param {number} count - Number of takers needed
 * @returns {Array} Selected penalty takers
 */
export function selectPenaltyTakers(players, count = 5) {
  // Filter out sent off/injured players
  const available = players.filter(p => !p.sentOff && !p.injured);

  // Sort by rating (best players take first), but GK takes last
  const outfield = available.filter(p => getPositionCategory(p.position) !== 'GK');
  const gk = available.filter(p => getPositionCategory(p.position) === 'GK');

  outfield.sort((a, b) => (b.rating || 70) - (a.rating || 70));

  // Take top outfield players, then GK if needed
  const takers = [...outfield.slice(0, count)];
  if (takers.length < count && gk.length > 0) {
    takers.push(...gk.slice(0, count - takers.length));
  }

  return takers;
}

/**
 * Simulate a full penalty shootout
 * @param {Object} homeTeam - Home team
 * @param {Object} awayTeam - Away team
 * @param {Array} homePlayers - Home team players
 * @param {Array} awayPlayers - Away team players
 * @returns {Object} Shootout result with all kicks
 */
export function simulatePenaltyShootout(homeTeam, awayTeam, homePlayers, awayPlayers) {
  const homeGK = homePlayers.find(p => getPositionCategory(p.position) === 'GK') || homePlayers[0];
  const awayGK = awayPlayers.find(p => getPositionCategory(p.position) === 'GK') || awayPlayers[0];

  const homeTakers = selectPenaltyTakers(homePlayers, 11); // Get enough for sudden death
  const awayTakers = selectPenaltyTakers(awayPlayers, 11);

  const kicks = [];
  let homeScore = 0;
  let awayScore = 0;
  let kickNum = 0;

  // Initial 5 kicks each
  while (kickNum < PENALTIES.INITIAL_KICKS * 2) {
    const isHomeKick = kickNum % 2 === 0;
    const round = Math.floor(kickNum / 2) + 1;

    const taker = isHomeKick
      ? homeTakers[round - 1] || homeTakers[homeTakers.length - 1]
      : awayTakers[round - 1] || awayTakers[awayTakers.length - 1];
    const gk = isHomeKick ? awayGK : homeGK;

    const result = simulatePenaltyKick(taker, gk, false);

    kicks.push({
      round,
      team: isHomeKick ? 'home' : 'away',
      teamName: isHomeKick ? homeTeam.name : awayTeam.name,
      ...result,
      homeScore: isHomeKick && result.scored ? homeScore + 1 : homeScore,
      awayScore: !isHomeKick && result.scored ? awayScore + 1 : awayScore,
    });

    if (result.scored) {
      if (isHomeKick) homeScore++;
      else awayScore++;
    }

    kickNum++;

    // Check if shootout can be decided early
    // Away can't catch up
    if (awayScore + Math.ceil((PENALTIES.INITIAL_KICKS * 2 - kickNum) / 2) < homeScore && kickNum % 2 === 0) {
      break;
    }
    // Home can't catch up
    if (homeScore + Math.floor((PENALTIES.INITIAL_KICKS * 2 - kickNum + 1) / 2) < awayScore && kickNum % 2 === 1) {
      break;
    }
  }

  // Sudden death if tied
  let suddenDeathRound = PENALTIES.INITIAL_KICKS + 1;

  while (homeScore === awayScore && suddenDeathRound <= 20) {
    // Home takes
    const homeTaker = homeTakers[(suddenDeathRound - 1) % homeTakers.length];
    const homeResult = simulatePenaltyKick(homeTaker, awayGK, true);

    kicks.push({
      round: suddenDeathRound,
      team: 'home',
      teamName: homeTeam.name,
      ...homeResult,
      isSuddenDeath: true,
      homeScore: homeResult.scored ? homeScore + 1 : homeScore,
      awayScore,
    });

    if (homeResult.scored) homeScore++;

    // Away takes
    const awayTaker = awayTakers[(suddenDeathRound - 1) % awayTakers.length];
    const awayResult = simulatePenaltyKick(awayTaker, homeGK, true);

    kicks.push({
      round: suddenDeathRound,
      team: 'away',
      teamName: awayTeam.name,
      ...awayResult,
      isSuddenDeath: true,
      homeScore,
      awayScore: awayResult.scored ? awayScore + 1 : awayScore,
    });

    if (awayResult.scored) awayScore++;

    // Check if decided after both teams take
    if (homeScore !== awayScore) {
      // If home scored and away missed, or home missed and away scored
      if ((homeResult.scored && !awayResult.scored) || (!homeResult.scored && awayResult.scored)) {
        break;
      }
    }

    suddenDeathRound++;
  }

  return {
    homeScore,
    awayScore,
    winner: homeScore > awayScore ? homeTeam.id : awayTeam.id,
    winnerName: homeScore > awayScore ? homeTeam.name : awayTeam.name,
    kicks,
    isSuddenDeath: suddenDeathRound > PENALTIES.INITIAL_KICKS,
    totalRounds: Math.max(PENALTIES.INITIAL_KICKS, suddenDeathRound - 1),
  };
}

/**
 * Generate extra time events
 * @param {Object} homeTeam - Home team
 * @param {Object} awayTeam - Away team
 * @param {Array} homePlayers - Home players
 * @param {Array} awayPlayers - Away players
 * @returns {Array} Extra time events
 */
export function generateExtraTimeEvents(homeTeam, awayTeam, homePlayers, awayPlayers) {
  const events = [];

  // Fewer events in extra time (players are tired), but still meaningful action
  // Increased from 10% to 18% for more engaging extra time periods
  for (let minute = EXTRA_TIME.FIRST_HALF_START; minute <= EXTRA_TIME.SECOND_HALF_END; minute++) {
    // 18% chance of event per minute (players tired but still pushing)
    if (Math.random() > 0.18) continue;

    const event = generateMatchEvent(minute, homeTeam, awayTeam, homePlayers, awayPlayers, {});

    if (event.type !== 'nothing') {
      events.push(event);
    }
  }

  return events;
}

/**
 * Quick simulation without full events (for non-Big-3 matches)
 */
export function quickSimulate(homeTeam, awayTeam) {
  const homeFormation = getBestFormation(homeTeam.players || []);
  const awayFormation = getBestFormation(awayTeam.players || []);

  const homeEleven = selectStartingEleven(homeTeam.players || [], homeFormation);
  const awayEleven = selectStartingEleven(awayTeam.players || [], awayFormation);

  // Calculate attack and defense separately for more realistic results
  const homeAttack = calculateAttackStrength(homeEleven);
  const awayAttack = calculateAttackStrength(awayEleven);
  const homeDefense = calculateDefenseStrength(homeEleven);
  const awayDefense = calculateDefenseStrength(awayEleven);

  // Expected goals based on attack vs opposing defense
  // Higher attack vs lower defense = more goals, but scaled down
  const homeAdvantage = (homeAttack - awayDefense) / 20; // e.g., 90 ATK vs 86 DEF = +0.2
  const awayAdvantage = (awayAttack - homeDefense) / 20;

  // Base expected goals (1.3 for home, 1.0 for away) - realistic scorelines
  const homeExpected = Math.max(0.3, 1.3 + homeAdvantage + (Math.random() * 1.0 - 0.5));
  const awayExpected = Math.max(0.2, 1.0 + awayAdvantage + (Math.random() * 1.0 - 0.5));

  // Poisson-like distribution for actual goals
  const homeGoals = Math.max(0, Math.round(homeExpected + (Math.random() - 0.5)));
  const awayGoals = Math.max(0, Math.round(awayExpected + (Math.random() - 0.5)));

  let winner = null;
  if (homeGoals > awayGoals) winner = homeTeam.id;
  else if (awayGoals > homeGoals) winner = awayTeam.id;

  return {
    homeTeam: homeTeam.id,
    awayTeam: awayTeam.id,
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,
    homeGoals,
    awayGoals,
    winner,
    isQuickSim: true,
  };
}
