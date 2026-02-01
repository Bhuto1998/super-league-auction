// AI Bidding Engine with Team Personalities

import {
  POSITION_REQUIREMENTS,
  getNextBidAmount,
  canTeamBid,
  getTeamSquadSize,
  getRemainingPositions,
  getMinBudgetNeeded,
  canUseRTM,
  isRTMEligible,
  MAX_SQUAD_SIZE
} from './auctionHelpers';

import {
  getTeamPersonality,
  AGE_THRESHOLDS,
  AGE_BONUSES,
  ELITE_RATING_THRESHOLD,
  POSITION_VALUE_MULTIPLIERS,
} from '../data/teamPersonalities';

/**
 * Calculate base player value based on rating only
 * Used internally - external callers should use calculatePlayerValue with position
 */
function calculateBaseValue(rating) {
  if (rating >= 90) {
    // Elite tier: 200M - 400M
    return 200000000 + ((rating - 90) * 50000000);
  } else if (rating >= 85) {
    // World class: 100M - 200M
    return 100000000 + ((rating - 85) * 20000000);
  } else if (rating >= 80) {
    // Top tier: 50M - 100M
    return 50000000 + ((rating - 80) * 10000000);
  } else if (rating >= 75) {
    // Good: 20M - 50M
    return 20000000 + ((rating - 75) * 6000000);
  } else {
    // Average: 5M - 20M
    return 5000000 + ((rating - 70) * 3000000);
  }
}

/**
 * Calculate player value based on rating AND position
 * FWD > MID > DEF > GK in value
 * An elite 91-rated FWD is worth ~280M, while a 91-rated GK is worth ~168M
 */
export function calculatePlayerValue(rating, positionCategory = null) {
  const baseValue = calculateBaseValue(rating);

  // If no position provided, return base value
  if (!positionCategory) {
    return baseValue;
  }

  // Apply position multiplier
  const positionMultiplier = POSITION_VALUE_MULTIPLIERS[positionCategory] || 1.0;
  return Math.round(baseValue * positionMultiplier);
}

/**
 * Calculate position urgency for a team (0-1 scale)
 * Higher urgency = team desperately needs this position
 */
export function getPositionNeed(team, positionCategory) {
  const required = POSITION_REQUIREMENTS[positionCategory];
  const current = team.positionCount[positionCategory] || 0;
  const remaining = required - current;

  if (remaining <= 0) return 0.1;  // Backup player only
  if (remaining === required) return 1.0;  // Maximum urgency
  return remaining / required;
}

/**
 * Calculate how much of budget AI should allocate to this position category
 */
export function getBudgetAllocation(team, positionCategory) {
  const squadSize = getTeamSquadSize(team);
  const playersNeeded = MAX_SQUAD_SIZE - squadSize;

  if (playersNeeded <= 0) return 0;

  // Reserve minimum budget for remaining players
  const minReserve = getMinBudgetNeeded(team);
  const availableBudget = team.remainingBudget - minReserve;

  if (availableBudget <= 0) return 0.3; // Minimum allocation

  // Get remaining positions needed
  const remaining = getRemainingPositions(team);
  const positionRemaining = remaining[positionCategory] || 0;

  if (positionRemaining === 0) return 0.3; // Backup interest

  // Calculate weighted allocation based on position priority
  const totalRemaining = Object.values(remaining).reduce((sum, val) => sum + val, 0);
  const baseAllocation = positionRemaining / totalRemaining;

  // Boost allocation if this position is critical
  const criticalBoost = positionRemaining >= POSITION_REQUIREMENTS[positionCategory] ? 1.5 : 1.0;

  return Math.min(1.0, baseAllocation * criticalBoost);
}

/**
 * Get age-based bonus multiplier for a player
 */
function getAgeBonusMultiplier(player, personality) {
  const age = player.age || 25; // Default to 25 if age not specified

  if (personality.preferYouth && age <= AGE_THRESHOLDS.youth) {
    return AGE_BONUSES.youthBonus;
  }

  if (personality.preferExperience && age >= AGE_THRESHOLDS.experienced) {
    return AGE_BONUSES.experienceBonus;
  }

  return 1.0;
}

/**
 * Calculate realistic minimum budget needed to complete squad
 * Uses average expected price per remaining player, not just base price
 */
function getRealisticMinBudgetNeeded(team, auctionProgress = 0.5) {
  const squadSize = getTeamSquadSize(team);
  const playersNeeded = MAX_SQUAD_SIZE - squadSize;

  if (playersNeeded <= 0) return 0;

  // Average price increases as auction progresses (better players go first)
  // Early: ~25M avg, Late: ~10M avg
  const avgPricePerPlayer = auctionProgress < 0.5 ? 25000000 : 15000000;

  // Reserve more budget when more players are needed
  return playersNeeded * avgPricePerPlayer;
}

/**
 * Check if team is in "squad completion" mode
 * Teams become more aggressive when falling behind on squad building
 */
function isInSquadCompletionMode(team, auctionProgress) {
  const squadSize = getTeamSquadSize(team);
  const playersNeeded = MAX_SQUAD_SIZE - squadSize;

  // Expected squad size at this point in auction
  const expectedSquadSize = Math.floor(auctionProgress * MAX_SQUAD_SIZE);

  // If we're 3+ players behind expected, enter completion mode
  if (squadSize < expectedSquadSize - 2) return true;

  // If we need 6+ players and auction is >60% done, enter completion mode
  if (playersNeeded >= 6 && auctionProgress > 0.6) return true;

  // If we need 4+ players and auction is >80% done, enter completion mode
  if (playersNeeded >= 4 && auctionProgress > 0.8) return true;

  return false;
}

/**
 * Calculate maximum price AI is willing to pay for a player
 * Now uses team personality for different spending behaviors
 */
export function calculateMaxBid(team, player, aiAuctionState = {}, auctionProgress = 0.5) {
  const personality = getTeamPersonality(team.id);
  const positionCategory = player.positionCategory;
  const playerValue = calculatePlayerValue(player.rating, positionCategory);
  const positionNeed = getPositionNeed(team, positionCategory);

  // Get position priority multiplier from personality
  const positionPriority = personality.positionPriorities[positionCategory] || 1.0;

  // Get age bonus multiplier
  const ageBonus = getAgeBonusMultiplier(player, personality);

  // Get team's elite purchase state
  const teamState = aiAuctionState[team.id] || { elitePurchases: 0, totalSpentOnElite: 0 };
  const elitePurchases = teamState.elitePurchases;
  const isElitePlayer = player.rating >= ELITE_RATING_THRESHOLD;

  // Check squad completion mode - overrides personality when team is falling behind
  const squadSize = getTeamSquadSize(team);
  const playersNeeded = MAX_SQUAD_SIZE - squadSize;
  const inCompletionMode = isInSquadCompletionMode(team, auctionProgress);

  let maxBid;

  // Squad completion mode: become more aggressive to ensure squad is filled
  if (inCompletionMode && positionNeed > 0.3) {
    // Willing to pay up to player value to complete squad
    maxBid = playerValue * 1.1;
    // But cap it based on remaining budget per player needed
    const budgetPerPlayer = team.remainingBudget / Math.max(playersNeeded, 1);
    maxBid = Math.min(maxBid, budgetPerPlayer * 0.8);
  }
  // Calculate base max bid based on spending style
  else {
    // Only apply overbidWillingness for non-elite players (below 88 rating)
    // Elite players are already expensive - no need to inflate further
    const isHighRated = player.rating >= 88;
    const effectiveOverbid = isHighRated ? 1.0 : personality.overbidWillingness;

    switch (personality.spendingStyle) {
      case 'big-spender': {
        // Calculate how much budget should be reserved for remaining non-elite players
        const nonElitePlayersNeeded = Math.max(0, playersNeeded - (personality.maxElitePurchases - elitePurchases));
        const reserveForNonElite = nonElitePlayersNeeded * 20000000; // 20M avg per non-elite
        const availableForElite = team.remainingBudget - reserveForNonElite;

        if (isElitePlayer && elitePurchases < personality.maxElitePurchases && availableForElite > 50000000) {
          // Aggressive bidding for elite players, but ensure budget for squad completion
          const eliteBudgetRemaining = Math.min(
            personality.eliteBudget - teamState.totalSpentOnElite,
            availableForElite
          );
          // Willing to spend up to 50% of remaining elite budget on a single elite player
          // No overbid for elite - just pay up to player value
          maxBid = Math.min(
            280000000, // 280M cap per elite
            eliteBudgetRemaining * 0.5,
            playerValue * 1.05 // Only 5% over value for elite
          );
          // Apply position priority - big spenders want MID/FWD
          maxBid *= positionPriority;
        } else {
          // Budget mode after elite quota filled or budget getting tight
          maxBid = Math.min(personality.postEliteMaxBid, playerValue * effectiveOverbid);
        }
        break;
      }

      case 'value-hunter': {
        // Apply overbid only for non-elite players
        maxBid = playerValue * effectiveOverbid;
        // Apply position priority
        maxBid *= positionPriority;
        // Apply age bonus (Liverpool loves youth)
        maxBid *= ageBonus;

        // But if falling behind, be slightly more flexible
        if (playersNeeded > 10 && auctionProgress > 0.3) {
          maxBid *= 1.15; // 15% boost when falling behind
        }
        break;
      }

      case 'back-loaded': {
        // Dortmund-style: conservative early, aggressive late
        const timingMultiplier = auctionProgress < 0.5
          ? personality.earlyAuctionMultiplier || 0.5
          : personality.lateAuctionMultiplier || 1.5;

        // For elite players, cap the timing multiplier
        const effectiveTiming = isHighRated ? Math.min(timingMultiplier, 1.1) : timingMultiplier;
        maxBid = playerValue * effectiveTiming;
        // Apply position priority
        maxBid *= positionPriority;
        // Apply youth bonus (Dortmund loves youth)
        maxBid *= ageBonus;

        // Ensure Dortmund doesn't fall too far behind early
        if (auctionProgress < 0.5 && playersNeeded > 14) {
          // Haven't bought enough players, be more active
          maxBid = Math.max(maxBid, playerValue * 0.7);
        }
        break;
      }

      case 'balanced':
      default: {
        // Standard calculation with personality modifiers
        // Only apply overbid for non-elite
        maxBid = playerValue * positionNeed * effectiveOverbid;
        maxBid *= positionPriority;
        maxBid *= ageBonus;
        break;
      }
    }
  }

  // Apply position need urgency (but less penalty when in completion mode)
  if (!inCompletionMode) {
    maxBid *= Math.max(0.5, positionNeed);
  } else {
    maxBid *= Math.max(0.7, positionNeed);
  }

  // Adjust based on remaining budget and squad progress
  const squadProgress = squadSize / MAX_SQUAD_SIZE;
  if (squadProgress < 0.3 && personality.spendingStyle !== 'big-spender' && !inCompletionMode) {
    // Early in auction, be more conservative (except big spenders)
    maxBid *= 0.85;
  }

  // Extra boost for former club players (RTM candidates)
  if (isRTMEligible(player, team)) {
    maxBid *= 1.2;
  }

  // Apply minimum budget reserve - use realistic calculation
  const realisticMinBudget = getRealisticMinBudgetNeeded(team, auctionProgress);
  const personalityReserve = team.remainingBudget * personality.minBudgetReserve;
  const safeMax = team.remainingBudget - Math.max(personalityReserve, realisticMinBudget, getMinBudgetNeeded(team));

  // Check if player meets rating threshold (relaxed in completion mode)
  if (player.rating < personality.ratingThreshold && !inCompletionMode) {
    // Reduce interest in players below threshold
    maxBid *= 0.5;
  }

  return Math.max(0, Math.min(maxBid, safeMax, team.remainingBudget));
}

/**
 * Main AI decision function: should AI bid on current player?
 * Now uses team personality for different bidding behaviors
 */
export function shouldAIBid(team, player, currentBid, aiAuctionState = {}, auctionProgress = 0.5, highestBidder = null) {
  // Skip if team is user-controlled
  if (team.isUserControlled) return false;

  const personality = getTeamPersonality(team.id);

  // Calculate next valid bid
  const nextBid = getNextBidAmount(currentBid);

  // Check if team can legally bid
  if (!canTeamBid(team, nextBid, player)) return false;

  // Calculate maximum AI is willing to pay
  const maxBid = calculateMaxBid(team, player, aiAuctionState, auctionProgress);

  // Check if in squad completion mode - more aggressive bidding
  const inCompletionMode = isInSquadCompletionMode(team, auctionProgress);
  const positionNeed = getPositionNeed(team, player.positionCategory);

  // In completion mode, bid on any player we need (position-wise)
  if (inCompletionMode && positionNeed > 0.3) {
    // Always bid if we can afford it and need the position
    if (nextBid <= maxBid) {
      return true;
    }
    // Even slightly exceed max bid if desperate
    if (nextBid <= maxBid * 1.2) {
      return true;
    }
  }

  // Bidding style specific logic
  switch (personality.biddingStyle) {
    case 'late-swooper': {
      // Dortmund: Skip early bidding, let others commit first
      // Only enter when price is reasonable or in late auction
      // But don't skip if falling behind on squad building
      const squadSize = getTeamSquadSize(team);
      const playersNeeded = MAX_SQUAD_SIZE - squadSize;

      if (auctionProgress < 0.5 && currentBid < 50000000 && player.rating < ELITE_RATING_THRESHOLD) {
        // Early auction, low bid, non-elite: wait (unless falling behind)
        if (playersNeeded <= 14 && Math.random() > 0.3) return false; // 70% chance to skip
      }
      break;
    }

    case 'quick-dropper': {
      // Juventus/Atletico: Drop out fast if price rises above threshold
      if (nextBid > maxBid * personality.dropOutThreshold) {
        return false;
      }
      break;
    }

    case 'stubborn': {
      // PSG: Won't give up on targets - may bid above calculated max
      if (nextBid > maxBid) {
        // Stubborn chance to overbid (up to 1.5x max)
        if (Math.random() < personality.stubbornness && nextBid <= maxBid * 1.5) {
          return true;
        }
        return false;
      }
      break;
    }

    case 'minimum-bidder':
    case 'jump-bidder':
    default: {
      // Standard logic: bid if next bid is within max
      if (nextBid > maxBid) {
        // Small chance to stubbornly overbid
        if (Math.random() < personality.stubbornness && nextBid <= maxBid * 1.2) {
          return true;
        }
        return false;
      }
      break;
    }
  }

  return nextBid <= maxBid;
}

/**
 * Decide AI bid amount (may bid higher than minimum for strategic reasons)
 * Now uses team personality for jump bidding and rivalry logic
 */
export function getAIBidAmount(team, player, currentBid, aiAuctionState = {}, auctionProgress = 0.5, highestBidder = null) {
  const personality = getTeamPersonality(team.id);
  const nextBid = getNextBidAmount(currentBid);
  const maxBid = calculateMaxBid(team, player, aiAuctionState, auctionProgress);

  if (nextBid > maxBid && Math.random() >= personality.stubbornness) {
    return null;
  }

  // Check for rivalry - increases aggression
  const isRivalBidding = highestBidder && personality.rivals.includes(highestBidder);
  let jumpChance = personality.jumpBidChance;

  if (isRivalBidding) {
    jumpChance *= personality.rivalBidBoost;
  }

  // Position need also affects jump bidding
  const positionNeed = getPositionNeed(team, player.positionCategory);
  if (positionNeed > 0.8 && player.rating >= 85) {
    jumpChance += 0.2; // More aggressive for urgent needs
  }

  // Determine if we should jump bid based on bidding style
  let shouldJump = false;
  let jumpMultiplier = 1;

  switch (personality.biddingStyle) {
    case 'jump-bidder': {
      // Man City: High jump chance, 2x increment
      shouldJump = Math.random() < jumpChance;
      jumpMultiplier = 2;
      break;
    }

    case 'late-swooper': {
      // Dortmund: Very high jump chance when entering late
      if (auctionProgress >= 0.5 || currentBid >= 50000000) {
        shouldJump = Math.random() < 0.7;
        jumpMultiplier = 2;
      }
      break;
    }

    case 'stubborn': {
      // PSG: Normal jumps but very persistent
      shouldJump = Math.random() < jumpChance;
      jumpMultiplier = 1.5;
      break;
    }

    case 'minimum-bidder': {
      // Liverpool/Inter: Rarely jumps
      shouldJump = Math.random() < jumpChance * 0.5;
      jumpMultiplier = 1;
      break;
    }

    case 'quick-dropper': {
      // Juventus/Atletico: Occasional jumps for priority positions
      shouldJump = Math.random() < jumpChance && positionNeed > 0.7;
      jumpMultiplier = 1;
      break;
    }

    default: {
      shouldJump = Math.random() < jumpChance;
      jumpMultiplier = 1;
      break;
    }
  }

  // Calculate jump bid if applicable
  if (shouldJump) {
    let jumpBid = nextBid;
    for (let i = 0; i < jumpMultiplier; i++) {
      const nextJump = getNextBidAmount(jumpBid);
      if (nextJump <= maxBid && canTeamBid(team, nextJump, player)) {
        jumpBid = nextJump;
      } else {
        break;
      }
    }

    if (jumpBid > nextBid && canTeamBid(team, jumpBid, player)) {
      return jumpBid;
    }
  }

  // Return minimum bid if we can afford it
  if (nextBid <= maxBid || Math.random() < personality.stubbornness) {
    return canTeamBid(team, nextBid, player) ? nextBid : null;
  }

  return null;
}

/**
 * AI decision on whether to use RTM card
 */
export function shouldAIUseRTM(team, player, winningBid) {
  // Skip if team is user-controlled
  if (team.isUserControlled) return false;

  // Basic eligibility check
  if (!canUseRTM(team, winningBid, player)) return false;

  // Calculate value factors
  const positionNeed = getPositionNeed(team, player.positionCategory);
  const playerValue = calculatePlayerValue(player.rating, player.positionCategory);

  // Factor 1: Position urgency (if we desperately need this position, use RTM)
  if (positionNeed >= 0.8) {
    return true;
  }

  // Factor 2: Player value vs price (good deal = use RTM)
  if (winningBid < playerValue * 0.8) {
    // Getting player below market value
    return true;
  }

  // Factor 3: Rating threshold (always try for elite players)
  if (player.rating >= 88) {
    return true;
  }

  // Factor 4: RTM card conservation
  // If we have few RTM cards left, save them for better players
  if (team.rtmCardsRemaining <= 2) {
    // Only use for 85+ rated players
    return player.rating >= 85;
  }

  // Factor 5: Price reasonability
  // Don't overpay for mid-tier players
  if (winningBid > playerValue * 1.2 && player.rating < 85) {
    return false;
  }

  // Default: use RTM if we need the position and price is reasonable
  return positionNeed >= 0.5 && winningBid <= playerValue;
}

/**
 * AI retention selection - pick top 3 players by rating
 */
export function getAIRetentions(players, teamId) {
  // Filter players belonging to this team
  const teamPlayers = players.filter(p => p.realClub === teamId);

  // Sort by rating (highest first)
  const sorted = [...teamPlayers].sort((a, b) => b.rating - a.rating);

  // Return top 3
  return sorted.slice(0, 3);
}

/**
 * Calculate AI bid delay (for balanced pacing)
 * Different personalities have slightly different timing
 */
export function getAIBidDelay(teamId = null) {
  // Base delay between 250ms and 500ms
  let baseDelay = 250 + Math.random() * 250;

  if (teamId) {
    const personality = getTeamPersonality(teamId);

    // Stubborn teams (PSG) wait a bit longer to create tension
    if (personality.biddingStyle === 'stubborn') {
      baseDelay += 100;
    }

    // Late swoopers (Dortmund) can be quick when they decide to enter
    if (personality.biddingStyle === 'late-swooper') {
      baseDelay -= 50;
    }

    // Jump bidders (Man City) are quick
    if (personality.biddingStyle === 'jump-bidder') {
      baseDelay -= 75;
    }
  }

  return Math.max(200, baseDelay);
}

/**
 * Get AI team names that should bid on this player (for displaying multiple interested teams)
 */
export function getInterestedAITeams(teams, player, currentBid, aiAuctionState = {}, auctionProgress = 0.5) {
  return teams
    .filter(team => !team.isUserControlled && shouldAIBid(team, player, currentBid, aiAuctionState, auctionProgress))
    .map(team => team.id);
}

/**
 * Simulate competitive AI bidding - multiple AIs may want same player
 */
export function simulateAIBiddingRound(aiTeams, player, currentBid, highestBidder, aiAuctionState = {}, auctionProgress = 0.5) {
  const bids = [];

  aiTeams.forEach(team => {
    if (team.id === highestBidder) return; // Skip current highest bidder

    if (shouldAIBid(team, player, currentBid, aiAuctionState, auctionProgress, highestBidder)) {
      const bidAmount = getAIBidAmount(team, player, currentBid, aiAuctionState, auctionProgress, highestBidder);
      if (bidAmount) {
        bids.push({
          teamId: team.id,
          amount: bidAmount,
          priority: calculateBidPriority(team, player)
        });
      }
    }
  });

  // Sort by priority (higher priority bids first), then by amount
  bids.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.amount - a.amount;
  });

  // Return the winning AI bid (if any)
  return bids.length > 0 ? bids[0] : null;
}

/**
 * Calculate bid priority for tie-breaking between AI teams
 * Now considers personality factors
 */
function calculateBidPriority(team, player) {
  const personality = getTeamPersonality(team.id);
  const positionNeed = getPositionNeed(team, player.positionCategory);
  const budgetRatio = team.remainingBudget / 1000000000; // Ratio of budget remaining
  const isFormerClub = isRTMEligible(player, team) ? 0.2 : 0;

  // Position priority from personality
  const positionPriority = personality.positionPriorities[player.positionCategory] || 1.0;

  // Big spenders get slight priority boost for elite players
  const eliteBoost = personality.spendingStyle === 'big-spender' && player.rating >= ELITE_RATING_THRESHOLD ? 0.15 : 0;

  return (positionNeed * 0.4) + (budgetRatio * 0.2) + isFormerClub + (positionPriority * 0.15) + eliteBoost;
}

/**
 * Get AI bid behavior description (for logging/debugging)
 */
export function getAIBidReason(team, player, currentBid, aiAuctionState = {}, auctionProgress = 0.5) {
  const personality = getTeamPersonality(team.id);
  const positionNeed = getPositionNeed(team, player.positionCategory);
  const maxBid = calculateMaxBid(team, player, aiAuctionState, auctionProgress);
  const nextBid = getNextBidAmount(currentBid);

  if (!canTeamBid(team, nextBid, player)) {
    return 'Cannot bid (budget/squad constraints)';
  }

  if (nextBid > maxBid) {
    return `Price exceeds value (max: ${maxBid / 1000000}M, style: ${personality.biddingStyle})`;
  }

  if (player.rating < personality.ratingThreshold) {
    return `Below rating threshold (${personality.ratingThreshold})`;
  }

  if (positionNeed >= 0.8) {
    return `Urgently needs ${player.positionCategory}`;
  }

  if (positionNeed >= 0.5) {
    return `Needs ${player.positionCategory}, ${personality.biddingStyle} style`;
  }

  return `Backup interest (${personality.spendingStyle})`;
}
