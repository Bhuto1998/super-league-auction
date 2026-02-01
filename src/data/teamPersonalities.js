// Team Personality Configurations for AI Bidding
// Each AI team has unique spending styles, bidding behaviors, and preferences

export const TEAM_PERSONALITIES = {
  // === BIG SPENDERS ===

  'man-city': {
    // Spending Profile
    spendingStyle: 'big-spender',
    eliteBudget: 600000000,        // 600M reserved for elite players
    maxElitePurchases: 4,          // Aggressive on 4 elite players
    postEliteMaxBid: 50000000,     // Max 50M per player after elite quota filled

    // Bidding Behavior
    biddingStyle: 'jump-bidder',
    jumpBidChance: 0.7,            // 70% chance to jump bid
    stubbornness: 0.45,            // 45% chance to bid above max
    dropOutThreshold: 0.95,        // Stays until 95% of max

    // Player Preferences
    positionPriorities: { GK: 1.0, DEF: 1.1, MID: 1.3, FWD: 1.4 },
    ratingThreshold: 78,           // Interested in 78+ players
    preferYouth: false,
    preferExperience: false,

    // Risk Profile
    riskTolerance: 'high',
    minBudgetReserve: 0.05,        // Keep 5% minimum
    overbidWillingness: 1.5,       // Willing to pay 150% of value

    // Rivalries
    rivals: ['liverpool', 'real-madrid', 'barcelona', 'bayern'],
    rivalBidBoost: 1.3,            // 30% more aggressive vs rivals
  },

  'psg': {
    // Spending Profile
    spendingStyle: 'big-spender',
    eliteBudget: 650000000,        // 650M for stars
    maxElitePurchases: 4,
    postEliteMaxBid: 50000000,     // 50M after elites

    // Bidding Behavior
    biddingStyle: 'stubborn',
    jumpBidChance: 0.5,
    stubbornness: 0.7,             // 70% chance to overbid - won't give up easily
    dropOutThreshold: 0.98,        // Almost never drops out

    // Player Preferences
    positionPriorities: { GK: 0.9, DEF: 1.0, MID: 1.2, FWD: 1.5 },  // Heavy FWD priority
    ratingThreshold: 79,           // Slightly more open
    preferYouth: false,
    preferExperience: false,

    // Risk Profile
    riskTolerance: 'high',
    minBudgetReserve: 0.03,        // Minimal reserve
    overbidWillingness: 1.6,       // Willing to pay 160% of value!

    // Rivalries - compete with big 3
    rivals: ['real-madrid', 'barcelona', 'bayern'],
    rivalBidBoost: 1.35,           // 35% more aggressive vs big 3
  },

  // === VALUE HUNTERS ===

  'liverpool': {
    // Spending Profile
    spendingStyle: 'value-hunter',
    eliteBudget: 500000000,        // Decent elite budget
    maxElitePurchases: 3,
    postEliteMaxBid: 80000000,     // Still active after elites

    // Bidding Behavior
    biddingStyle: 'minimum-bidder',
    jumpBidChance: 0.2,            // Occasionally jumps
    stubbornness: 0.35,            // Will fight for players they want
    dropOutThreshold: 0.85,        // Drops at 85% of max

    // Player Preferences
    positionPriorities: { GK: 1.0, DEF: 1.1, MID: 1.3, FWD: 1.2 },
    ratingThreshold: 76,           // Finds value in mid-tier
    preferYouth: true,             // Analytics-driven youth preference
    preferExperience: false,

    // Risk Profile
    riskTolerance: 'moderate',
    minBudgetReserve: 0.1,         // Keeps 10% buffer
    overbidWillingness: 1.15,      // Willing to pay 15% over value

    // Rivalries - compete with big 3 too
    rivals: ['man-city', 'real-madrid', 'barcelona', 'bayern'],
    rivalBidBoost: 1.4,            // Gets very aggressive vs rivals
  },

  'atletico': {
    // Spending Profile
    spendingStyle: 'value-hunter',
    eliteBudget: 450000000,        // Decent budget
    maxElitePurchases: 3,
    postEliteMaxBid: 70000000,

    // Bidding Behavior
    biddingStyle: 'quick-dropper',
    jumpBidChance: 0.25,
    stubbornness: 0.3,             // Will fight when needed
    dropOutThreshold: 0.75,        // Drops at 75%

    // Player Preferences
    positionPriorities: { GK: 1.2, DEF: 1.4, MID: 1.1, FWD: 1.0 },  // Defensive focus
    ratingThreshold: 75,           // Will take lower rated players
    preferYouth: false,
    preferExperience: true,        // Simeone loves experience

    // Risk Profile
    riskTolerance: 'moderate',
    minBudgetReserve: 0.1,         // Keeps 10% buffer
    overbidWillingness: 1.1,       // Willing to pay 10% over

    // Rivalries - compete with Spanish giants
    rivals: ['real-madrid', 'barcelona'],
    rivalBidBoost: 1.35,           // Very aggressive vs Spanish rivals
  },

  // === BALANCED ===

  'juventus': {
    // Spending Profile
    spendingStyle: 'balanced',
    eliteBudget: 550000000,
    maxElitePurchases: 3,
    postEliteMaxBid: 65000000,

    // Bidding Behavior
    biddingStyle: 'quick-dropper',
    jumpBidChance: 0.35,
    stubbornness: 0.35,
    dropOutThreshold: 0.8,         // Stays longer now

    // Player Preferences
    positionPriorities: { GK: 1.2, DEF: 1.3, MID: 1.1, FWD: 1.0 },  // Defensive focus but balanced
    ratingThreshold: 77,
    preferYouth: false,
    preferExperience: true,        // Italian defensive tradition

    // Risk Profile
    riskTolerance: 'moderate',
    minBudgetReserve: 0.1,
    overbidWillingness: 1.2,       // Willing to pay 20% over

    // Rivalries
    rivals: ['inter', 'real-madrid', 'barcelona'],
    rivalBidBoost: 1.25,
  },

  'inter': {
    // Spending Profile
    spendingStyle: 'balanced',
    eliteBudget: 520000000,
    maxElitePurchases: 3,
    postEliteMaxBid: 70000000,

    // Bidding Behavior
    biddingStyle: 'minimum-bidder',
    jumpBidChance: 0.3,
    stubbornness: 0.4,
    dropOutThreshold: 0.85,

    // Player Preferences
    positionPriorities: { GK: 1.1, DEF: 1.2, MID: 1.2, FWD: 1.1 },  // Balanced with slight DEF/MID focus
    ratingThreshold: 76,
    preferYouth: false,
    preferExperience: false,       // Pragmatic - takes what works

    // Risk Profile
    riskTolerance: 'moderate',
    minBudgetReserve: 0.08,
    overbidWillingness: 1.2,       // Willing to pay 20% over

    // Rivalries
    rivals: ['juventus', 'bayern'],
    rivalBidBoost: 1.3,
  },

  // === BACK-LOADED ===

  'dortmund': {
    // Spending Profile
    spendingStyle: 'back-loaded',
    eliteBudget: 500000000,
    maxElitePurchases: 3,          // 3 elite targets
    postEliteMaxBid: 90000000,     // Big budget for later players

    // Bidding Behavior
    biddingStyle: 'late-swooper',
    jumpBidChance: 0.75,           // High jump chance when entering
    stubbornness: 0.4,
    dropOutThreshold: 0.85,

    // Player Preferences
    positionPriorities: { GK: 1.0, DEF: 1.1, MID: 1.3, FWD: 1.3 },
    ratingThreshold: 75,           // Will take lower rated youth
    preferYouth: true,             // BIG youth preference
    preferExperience: false,

    // Risk Profile
    riskTolerance: 'moderate',
    minBudgetReserve: 0.08,
    overbidWillingness: 1.25,      // Willing to pay 25% over for youth

    // Rivalries
    rivals: ['bayern'],            // Bayern rivalry (Bayern is user-controlled)
    rivalBidBoost: 1.4,            // Very aggressive vs Bayern

    // Special: Back-loaded timing (less extreme now)
    earlyAuctionMultiplier: 0.7,   // 70% max bid in first half
    lateAuctionMultiplier: 1.4,    // 140% max bid in second half
  },
};

// Age thresholds for youth/experience bonuses
export const AGE_THRESHOLDS = {
  youth: 25,       // Players <= 25 are "young"
  experienced: 28, // Players >= 28 are "experienced"
};

// Bonus multipliers for age preferences
export const AGE_BONUSES = {
  youthBonus: 1.25,        // 25% boost for youth-preferring teams
  experienceBonus: 1.2,    // 20% boost for experience-preferring teams
};

// Position value multipliers - FWD most valuable, GK least
// These reflect real-world transfer market values
export const POSITION_VALUE_MULTIPLIERS = {
  FWD: 1.0,   // Forwards are the baseline (elite strikers command highest fees)
  MID: 0.85,  // Midfielders are 15% less valuable
  DEF: 0.7,   // Defenders are 30% less valuable
  GK: 0.45,   // Goalkeepers are 55% less valuable (even elite GKs rarely break 80M)
};

// Elite player threshold (for tracking big spender purchases)
export const ELITE_RATING_THRESHOLD = 90;

// Get personality for a team (returns default if not found)
export function getTeamPersonality(teamId) {
  return TEAM_PERSONALITIES[teamId] || getDefaultPersonality();
}

// Default personality for teams without specific config
function getDefaultPersonality() {
  return {
    spendingStyle: 'balanced',
    eliteBudget: 400000000,
    maxElitePurchases: 3,
    postEliteMaxBid: 50000000,
    biddingStyle: 'minimum-bidder',
    jumpBidChance: 0.2,
    stubbornness: 0.2,
    dropOutThreshold: 0.75,
    positionPriorities: { GK: 1.0, DEF: 1.0, MID: 1.0, FWD: 1.0 },
    ratingThreshold: 78,
    preferYouth: false,
    preferExperience: false,
    riskTolerance: 'moderate',
    minBudgetReserve: 0.1,
    overbidWillingness: 1.0,
    rivals: [],
    rivalBidBoost: 1.0,
  };
}
