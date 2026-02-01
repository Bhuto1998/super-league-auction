/**
 * Player Progression Engine
 * Handles player aging, rating changes, form, and retirement
 */

// Age curve configuration
export const AGE_CURVES = {
  // Young players (17-23): Growth phase
  YOUTH: {
    minAge: 17,
    maxAge: 23,
    ratingChange: { min: 2, max: 3 },
    description: 'Growth phase - rapid improvement'
  },
  // Development (24-26): Continued improvement
  DEVELOPMENT: {
    minAge: 24,
    maxAge: 26,
    ratingChange: { min: 1, max: 2 },
    description: 'Development phase - steady improvement'
  },
  // Peak (27-30): Prime years
  PEAK: {
    minAge: 27,
    maxAge: 30,
    ratingChange: { min: -1, max: 1 },
    description: 'Peak phase - maintaining form'
  },
  // Early decline (31-33)
  EARLY_DECLINE: {
    minAge: 31,
    maxAge: 33,
    ratingChange: { min: -2, max: -1 },
    description: 'Early decline - gradual decrease'
  },
  // Late decline (34+)
  LATE_DECLINE: {
    minAge: 34,
    maxAge: 45,
    ratingChange: { min: -3, max: -2 },
    description: 'Late decline - significant decrease'
  }
};

// Performance modifier thresholds
export const PERFORMANCE_MODIFIERS = {
  EXCELLENT: { threshold: 8.0, modifier: 2 },   // 8.0+ avg rating: +2 bonus
  GOOD: { threshold: 7.5, modifier: 1 },        // 7.5+ avg rating: +1 bonus
  AVERAGE: { threshold: 7.0, modifier: 0 },     // 7.0+ avg rating: no change
  POOR: { threshold: 6.5, modifier: -1 },       // 6.5+ avg rating: -1 penalty
  VERY_POOR: { threshold: 0, modifier: -2 }     // Below 6.5: -2 penalty
};

// Retirement configuration
export const RETIREMENT = {
  MIN_AGE: 33,           // Can retire from age 33
  BASE_CHANCE_33: 0.05,  // 5% chance at 33
  BASE_CHANCE_34: 0.10,  // 10% chance at 34
  BASE_CHANCE_35: 0.20,  // 20% chance at 35
  BASE_CHANCE_36: 0.35,  // 35% chance at 36
  BASE_CHANCE_37: 0.50,  // 50% chance at 37
  BASE_CHANCE_38: 0.65,  // 65% chance at 38
  BASE_CHANCE_39: 0.80,  // 80% chance at 39
  BASE_CHANCE_40_PLUS: 0.90, // 90% chance at 40+
  LOW_RATING_THRESHOLD: 75, // Players below this rating are more likely to retire
  LOW_RATING_BOOST: 0.10,   // +10% retirement chance for low rated players
};

// Form configuration
export const FORM = {
  MIN: -10,
  MAX: 10,
  DEFAULT: 0,
  MATCH_IMPACT: {
    WIN: 1,       // +1 form for win
    DRAW: 0,      // No change for draw
    LOSS: -1,     // -1 form for loss
    GOAL: 0.5,    // +0.5 per goal scored
    ASSIST: 0.3,  // +0.3 per assist
    MOTM: 1,      // +1 for man of the match
    RED_CARD: -2, // -2 for red card
  },
  DECAY_RATE: 0.8, // Form decays by 20% each match day without playing
};

/**
 * Get age curve for a player's age
 * @param {number} age - Player's age
 * @returns {Object} Age curve configuration
 */
export function getAgeCurve(age) {
  if (age <= AGE_CURVES.YOUTH.maxAge) return AGE_CURVES.YOUTH;
  if (age <= AGE_CURVES.DEVELOPMENT.maxAge) return AGE_CURVES.DEVELOPMENT;
  if (age <= AGE_CURVES.PEAK.maxAge) return AGE_CURVES.PEAK;
  if (age <= AGE_CURVES.EARLY_DECLINE.maxAge) return AGE_CURVES.EARLY_DECLINE;
  return AGE_CURVES.LATE_DECLINE;
}

/**
 * Get performance modifier based on season average rating
 * @param {number} avgRating - Season average match rating (1-10 scale)
 * @returns {number} Rating modifier
 */
export function getPerformanceModifier(avgRating) {
  if (avgRating >= PERFORMANCE_MODIFIERS.EXCELLENT.threshold) {
    return PERFORMANCE_MODIFIERS.EXCELLENT.modifier;
  }
  if (avgRating >= PERFORMANCE_MODIFIERS.GOOD.threshold) {
    return PERFORMANCE_MODIFIERS.GOOD.modifier;
  }
  if (avgRating >= PERFORMANCE_MODIFIERS.AVERAGE.threshold) {
    return PERFORMANCE_MODIFIERS.AVERAGE.modifier;
  }
  if (avgRating >= PERFORMANCE_MODIFIERS.POOR.threshold) {
    return PERFORMANCE_MODIFIERS.POOR.modifier;
  }
  return PERFORMANCE_MODIFIERS.VERY_POOR.modifier;
}

/**
 * Calculate rating change for end of season
 * @param {Object} player - Player object with age, rating, potential
 * @param {Object} seasonStats - { appearances, avgRating, goals, assists }
 * @returns {Object} { newRating, change, reason }
 */
export function calculateRatingChange(player, seasonStats = {}) {
  const age = player.age;
  const currentRating = player.rating;
  const potential = player.potential || currentRating + 5;

  // Get base change from age curve
  const curve = getAgeCurve(age);
  const baseChange = Math.floor(
    Math.random() * (curve.ratingChange.max - curve.ratingChange.min + 1) + curve.ratingChange.min
  );

  // Get performance modifier
  const avgRating = seasonStats.avgRating || 7.0;
  const performanceModifier = getPerformanceModifier(avgRating);

  // Calculate total change
  let totalChange = baseChange + performanceModifier;
  let reason = curve.description;

  // For young players, can't exceed potential
  if (age <= AGE_CURVES.DEVELOPMENT.maxAge) {
    const newRating = currentRating + totalChange;
    if (newRating > potential) {
      totalChange = potential - currentRating;
      reason += ' (capped at potential)';
    }
  }

  // For declining players, can't go below 65
  const MIN_RATING = 65;
  if (currentRating + totalChange < MIN_RATING) {
    totalChange = MIN_RATING - currentRating;
    reason += ' (minimum rating reached)';
  }

  // Maximum rating is 99
  const MAX_RATING = 99;
  if (currentRating + totalChange > MAX_RATING) {
    totalChange = MAX_RATING - currentRating;
    reason += ' (maximum rating reached)';
  }

  // Add performance note to reason
  if (performanceModifier > 0) {
    reason += ` (+${performanceModifier} performance bonus)`;
  } else if (performanceModifier < 0) {
    reason += ` (${performanceModifier} performance penalty)`;
  }

  return {
    newRating: currentRating + totalChange,
    change: totalChange,
    reason,
    agePhase: curve.description,
    performanceModifier
  };
}

/**
 * Check if player retires at end of season
 * @param {Object} player - Player object with age, rating
 * @param {Object} seasonStats - { appearances, avgRating }
 * @returns {Object} { retires, reason }
 */
export function checkRetirement(player, seasonStats = {}) {
  const age = player.age;

  // Players under 33 don't retire
  if (age < RETIREMENT.MIN_AGE) {
    return { retires: false, reason: null };
  }

  // Get base retirement chance by age
  let retirementChance;
  switch (age) {
    case 33: retirementChance = RETIREMENT.BASE_CHANCE_33; break;
    case 34: retirementChance = RETIREMENT.BASE_CHANCE_34; break;
    case 35: retirementChance = RETIREMENT.BASE_CHANCE_35; break;
    case 36: retirementChance = RETIREMENT.BASE_CHANCE_36; break;
    case 37: retirementChance = RETIREMENT.BASE_CHANCE_37; break;
    case 38: retirementChance = RETIREMENT.BASE_CHANCE_38; break;
    case 39: retirementChance = RETIREMENT.BASE_CHANCE_39; break;
    default: retirementChance = RETIREMENT.BASE_CHANCE_40_PLUS; break;
  }

  // Low-rated players more likely to retire
  if (player.rating < RETIREMENT.LOW_RATING_THRESHOLD) {
    retirementChance += RETIREMENT.LOW_RATING_BOOST;
  }

  // Few appearances increases retirement chance
  if (seasonStats.appearances !== undefined && seasonStats.appearances < 10) {
    retirementChance += 0.10; // +10% for lack of playing time
  }

  // Roll for retirement
  const roll = Math.random();
  if (roll < retirementChance) {
    const reasons = [
      'announced retirement from professional football',
      'has decided to hang up their boots',
      'will retire at the end of the season',
      'is calling time on their career',
      'has announced this will be their final season',
    ];
    return {
      retires: true,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      chance: retirementChance,
      roll
    };
  }

  return { retires: false, reason: null, chance: retirementChance, roll };
}

/**
 * Process end of season for a player
 * @param {Object} player - Player object
 * @param {Object} seasonStats - { appearances, avgRating, goals, assists }
 * @returns {Object} { updatedPlayer, retired, ratingChange }
 */
export function processEndOfSeason(player, seasonStats = {}) {
  // Check retirement first
  const retirementCheck = checkRetirement(player, seasonStats);

  if (retirementCheck.retires) {
    return {
      updatedPlayer: null,
      retired: true,
      retirementReason: retirementCheck.reason,
      ratingChange: null
    };
  }

  // Calculate rating change
  const ratingResult = calculateRatingChange(player, seasonStats);

  // Age the player
  const updatedPlayer = {
    ...player,
    age: player.age + 1,
    rating: ratingResult.newRating,
    // Update potential if player exceeded it (rare cases)
    potential: Math.max(player.potential || player.rating + 5, ratingResult.newRating),
    // Reset form for new season
    form: { current: 0, trend: 'stable' }
  };

  return {
    updatedPlayer,
    retired: false,
    retirementReason: null,
    ratingChange: ratingResult
  };
}

/**
 * Update player form after a match
 * @param {Object} player - Player object with form
 * @param {Object} matchResult - { won, drew, goals, assists, rating, redCard, isMotm }
 * @returns {Object} Updated form object
 */
export function updatePlayerForm(player, matchResult) {
  const currentForm = player.form?.current || 0;

  let formChange = 0;

  // Match result impact
  if (matchResult.won) formChange += FORM.MATCH_IMPACT.WIN;
  if (matchResult.drew) formChange += FORM.MATCH_IMPACT.DRAW;
  if (matchResult.lost) formChange += FORM.MATCH_IMPACT.LOSS;

  // Individual performance
  formChange += (matchResult.goals || 0) * FORM.MATCH_IMPACT.GOAL;
  formChange += (matchResult.assists || 0) * FORM.MATCH_IMPACT.ASSIST;
  if (matchResult.isMotm) formChange += FORM.MATCH_IMPACT.MOTM;
  if (matchResult.redCard) formChange += FORM.MATCH_IMPACT.RED_CARD;

  // Calculate new form
  let newForm = currentForm + formChange;
  newForm = Math.max(FORM.MIN, Math.min(FORM.MAX, newForm));

  // Determine trend
  let trend = 'stable';
  if (formChange > 0.5) trend = 'improving';
  else if (formChange < -0.5) trend = 'declining';

  return {
    current: Math.round(newForm * 10) / 10, // Round to 1 decimal
    trend,
    lastChange: formChange
  };
}

/**
 * Decay form for players who didn't play
 * @param {Object} player - Player object with form
 * @returns {Object} Updated form object
 */
export function decayPlayerForm(player) {
  const currentForm = player.form?.current || 0;
  const newForm = currentForm * FORM.DECAY_RATE;

  return {
    current: Math.round(newForm * 10) / 10,
    trend: currentForm > 0 ? 'declining' : currentForm < 0 ? 'improving' : 'stable',
    lastChange: newForm - currentForm
  };
}

/**
 * Get form description for display
 * @param {number} form - Current form value (-10 to 10)
 * @returns {Object} { label, color, description }
 */
export function getFormDescription(form) {
  if (form >= 8) return { label: 'On Fire', color: 'text-green-400', description: 'Exceptional form' };
  if (form >= 5) return { label: 'Hot', color: 'text-green-300', description: 'Very good form' };
  if (form >= 2) return { label: 'Good', color: 'text-lime-400', description: 'Positive form' };
  if (form >= -2) return { label: 'Average', color: 'text-slate-400', description: 'Normal form' };
  if (form >= -5) return { label: 'Cold', color: 'text-orange-400', description: 'Below average' };
  if (form >= -8) return { label: 'Poor', color: 'text-red-400', description: 'Struggling' };
  return { label: 'Crisis', color: 'text-red-500', description: 'Severe form crisis' };
}

/**
 * Apply form bonus to player's effective rating
 * @param {Object} player - Player object
 * @returns {number} Effective rating with form applied
 */
export function getEffectiveRating(player) {
  const baseRating = player.rating;
  const form = player.form?.current || 0;

  // Form impacts rating: each point of form = 0.3 rating points
  const formImpact = form * 0.3;

  // Cap the impact at +/- 3 rating points
  const cappedImpact = Math.max(-3, Math.min(3, formImpact));

  return Math.round((baseRating + cappedImpact) * 10) / 10;
}

/**
 * Generate default potential for a player based on age and current rating
 * @param {Object} player - Player with age and rating
 * @returns {number} Calculated potential
 */
export function generatePotential(player) {
  const age = player.age;
  const rating = player.rating;

  // Younger players have higher potential ceiling
  let potentialBoost;
  if (age <= 20) potentialBoost = Math.floor(Math.random() * 8) + 5; // 5-12 points higher
  else if (age <= 23) potentialBoost = Math.floor(Math.random() * 6) + 3; // 3-8 points higher
  else if (age <= 26) potentialBoost = Math.floor(Math.random() * 4) + 1; // 1-4 points higher
  else potentialBoost = Math.floor(Math.random() * 2); // 0-1 points higher

  const potential = rating + potentialBoost;

  // Cap at 99
  return Math.min(99, potential);
}

/**
 * Generate default peak age range for a player
 * @param {string} position - Player's position category (GK, DEF, MID, FWD)
 * @returns {Object} { peakAgeStart, peakAgeEnd }
 */
export function generatePeakAgeRange(position) {
  // Goalkeepers peak later and for longer
  if (position === 'GK') {
    const start = 27 + Math.floor(Math.random() * 3); // 27-29
    const end = start + 5 + Math.floor(Math.random() * 3); // 5-7 years of peak
    return { peakAgeStart: start, peakAgeEnd: Math.min(37, end) };
  }

  // Defenders also tend to peak later
  if (position === 'DEF') {
    const start = 26 + Math.floor(Math.random() * 3); // 26-28
    const end = start + 4 + Math.floor(Math.random() * 3); // 4-6 years of peak
    return { peakAgeStart: start, peakAgeEnd: Math.min(35, end) };
  }

  // Midfielders have standard peak
  if (position === 'MID') {
    const start = 25 + Math.floor(Math.random() * 3); // 25-27
    const end = start + 4 + Math.floor(Math.random() * 2); // 4-5 years of peak
    return { peakAgeStart: start, peakAgeEnd: Math.min(33, end) };
  }

  // Forwards peak earliest, shorter peak window
  const start = 24 + Math.floor(Math.random() * 3); // 24-26
  const end = start + 3 + Math.floor(Math.random() * 3); // 3-5 years of peak
  return { peakAgeStart: start, peakAgeEnd: Math.min(32, end) };
}
