# Super League Auction & Tournament System - Architecture Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Data Models](#4-data-models)
5. [Auction System](#5-auction-system)
6. [Tournament System](#6-tournament-system)
7. [Match Simulation Engine](#7-match-simulation-engine)
8. [State Management](#8-state-management)
9. [UI Components](#9-ui-components)
10. [Constants & Configuration](#10-constants--configuration)

---

## 1. Project Overview

Super League is a fantasy football auction and tournament simulation system. It consists of two main phases:

1. **Auction Phase**: Teams bid on players to build their squads
2. **Tournament Phase**: Teams compete in a group stage followed by knockout rounds

### Key Features
- 10 teams compete (3 "Big Three" teams with retention privileges)
- Budget-based auction with tiered bid increments
- AI-controlled bidding for non-user teams
- Full match simulation with realistic football mechanics
- Two-legged knockout ties with away goals rule
- Single-leg final at neutral venue

---

## 2. Tech Stack

```
Frontend Framework: React 18 with Vite
Styling: Tailwind CSS
State Management: React Context + useReducer
Data Storage: JSON files + localStorage
Build Tool: Vite
```

### Dependencies
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "tailwindcss": "^3.x",
  "vite": "^5.x"
}
```

---

## 3. Project Structure

```
super-league-auction/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── ARCHITECTURE.md
├── src/
│   ├── main.jsx                    # React entry point
│   ├── App.jsx                     # Main app component & routing
│   ├── index.css                   # Tailwind imports + custom styles
│   │
│   ├── context/
│   │   ├── AuctionContext.jsx      # Auction state management
│   │   ├── TournamentContext.jsx   # Tournament state management
│   │   └── MultiplayerContext.jsx  # Multiplayer support (optional)
│   │
│   ├── components/
│   │   ├── RetentionPhase.jsx      # Big 3 retention UI
│   │   ├── AuctionPhase.jsx        # Main auction UI
│   │   ├── multiplayer/            # Multiplayer components
│   │   └── tournament/
│   │       ├── TournamentDraw.jsx      # Group draw animation
│   │       ├── GroupStage.jsx          # Group stage matches
│   │       ├── KnockoutStage.jsx       # QF/SF/Final UI
│   │       ├── LiveMatchSimulator.jsx  # Real-time match simulation
│   │       └── WinnerCelebration.jsx   # Champion celebration
│   │
│   ├── engine/
│   │   ├── matchEngine.js          # Match simulation logic
│   │   ├── tournamentEngine.js     # Tournament structure logic
│   │   └── commentary.js           # Match commentary generation
│   │
│   ├── utils/
│   │   ├── auctionHelpers.js       # Auction utility functions
│   │   └── aiEngine.js             # AI bidding logic
│   │
│   └── data/
│       ├── players.json            # Player database (90 players)
│       └── teams.json              # Team configurations (10 teams)
```

---

## 4. Data Models

### 4.1 Team Model

```javascript
// src/data/teams.json
{
  "id": "real-madrid",           // Unique identifier (kebab-case)
  "name": "Real Madrid",         // Full display name
  "shortName": "RMA",            // 3-letter abbreviation
  "country": "Spain",            // Country of origin
  "manager": "Jose Mourinho",    // Manager name for commentary
  "isUserControlled": true,      // true = human player, false = AI
  "budget": 1000000000,          // Starting budget (1 billion)
  "color": "#FFFFFF",            // Primary color (hex)
  "secondaryColor": "#FFD700",   // Secondary color (hex)
  "logoEmoji": "⚪👑"            // Emoji representation
}
```

### 4.2 Player Model

```javascript
// src/data/players.json
{
  "id": 1,                       // Unique numeric ID
  "name": "Erling Haaland",      // Full name
  "position": "ST",              // Position code (see Position Codes below)
  "positionCategory": "FWD",     // Category: GK, DEF, MID, FWD
  "nationality": "Norway",       // Country
  "club": "Manchester City",     // Real-world club (for display)
  "realClub": "man-city",        // Team ID for RTM eligibility
  "rating": 93,                  // Overall rating (1-99)
  "age": 24,                     // Age (affects stamina drain)
  "basePrice": 5000000           // Starting auction price (5M)
}
```

### 4.3 Position Codes

```javascript
// Position to Category mapping
const POSITION_CATEGORIES = {
  'GK': 'GK',                    // Goalkeeper
  'CB': 'DEF', 'LB': 'DEF', 'RB': 'DEF', 'LWB': 'DEF', 'RWB': 'DEF',  // Defenders
  'CDM': 'MID', 'CM': 'MID', 'CAM': 'MID', 'LM': 'MID', 'RM': 'MID', // Midfielders
  'LW': 'FWD', 'RW': 'FWD', 'CF': 'FWD', 'ST': 'FWD'                 // Forwards
};
```

### 4.4 Squad Requirements

```javascript
const POSITION_REQUIREMENTS = {
  GK: 2,    // 2 goalkeepers
  DEF: 6,   // 6 defenders
  MID: 5,   // 5 midfielders
  FWD: 5    // 5 forwards
};
// Total: 18 players per squad
```

---

## 5. Auction System

### 5.1 Overview

The auction follows an IPL-style mega auction format:
1. **Retention Phase**: Big 3 teams retain up to 3 players at fixed prices
2. **Auction Phase**: Remaining players are auctioned one by one
3. **RTM Phase**: Teams can use Right-to-Match cards on former players

### 5.2 Big Three Teams

```javascript
const BIG_THREE = ['real-madrid', 'barcelona', 'bayern'];
```

Only Big Three teams can retain players. They start with pre-defined players from previous seasons.

### 5.3 Retention Pricing

```javascript
const RETENTION_PRICES = {
  1: 150000000,  // 1st retention: €150M
  2: 100000000,  // 2nd retention: €100M
  3: 75000000    // 3rd retention: €75M
};
// Total for 3 retentions: €325M
```

### 5.4 Budget System

```javascript
const STARTING_BUDGET = 1000000000;  // €1 billion per team
const BASE_PRICE = 5000000;          // €5M minimum bid
const MAX_SQUAD_SIZE = 18;           // Maximum players per team
const RTM_CARDS_PER_TEAM = 5;        // RTM cards available
```

### 5.5 Bid Increment Tiers

```javascript
function getNextBidAmount(currentBid) {
  if (currentBid < 100000000) {
    return currentBid + 5000000;      // Under €100M: +€5M
  } else if (currentBid < 200000000) {
    return currentBid + 20000000;     // €100M-€200M: +€20M
  } else {
    return currentBid + 50000000;     // Over €200M: +€50M
  }
}
```

### 5.6 Auction Order (Tiered Shuffle)

Players are auctioned in tiers, shuffled within each tier:

```javascript
function weightedShuffleByRating(players) {
  // Tier 1: Elite players (88+) - auctioned first
  const tier1 = players.filter(p => p.rating >= 88);
  // Tier 2: High rated (85-87) - auctioned second
  const tier2 = players.filter(p => p.rating >= 85 && p.rating < 88);
  // Tier 3: Standard (below 85) - auctioned last
  const tier3 = players.filter(p => p.rating < 85);

  // Shuffle within each tier (not sorted by exact rating)
  return [
    ...shuffleArray(tier1),
    ...shuffleArray(tier2),
    ...shuffleArray(tier3)
  ];
}
```

### 5.7 AI Bidding Logic

Location: `src/utils/aiEngine.js`

```javascript
function calculateAIBid(team, player, currentBid, allTeams) {
  // 1. Check if team CAN bid (budget, squad space, position needs)
  if (!canTeamBid(team, nextBid, player)) return null;

  // 2. Calculate player value based on:
  //    - Rating (higher = more valuable)
  //    - Position need (urgently needed positions = higher value)
  //    - Remaining budget (rich teams bid more aggressively)

  // 3. Decision factors:
  //    - Base interest from rating
  //    - Position scarcity bonus
  //    - Budget availability
  //    - Random factor for unpredictability

  // 4. Returns: { shouldBid: boolean, bidAmount: number }
}
```

**AI Bid Delay**: 250-500ms random delay for realistic pacing

### 5.8 RTM (Right to Match)

When a player's auction ends:
1. Check if any team has RTM cards remaining
2. Check if player's `realClub` matches a team's ID
3. If yes, that team can match the winning bid to acquire the player
4. RTM uses one RTM card (5 per team maximum)

### 5.9 Auto-Complete Auction

When triggered, automatically assigns remaining players:

```javascript
function autoCompleteAuction(teams, remainingPlayers) {
  // 1. Identify position needs for each team
  // 2. Shuffle players within each position category
  // 3. Randomly assign players to teams that need that position
  // 4. Use base price for all auto-assigned players
  // 5. Ensure fair distribution (randomize team order)
}
```

---

## 6. Tournament System

### 6.1 Tournament Structure

```
10 Teams → 2 Groups (5 each) → Group Stage → Knockout

Group Stage:
- Each team plays 8 matches (home & away vs 4 opponents)
- Top 4 from each group qualify (8 teams total)

Knockout Stage:
- Quarter Finals: 4 ties (two-legged)
- Semi Finals: 2 ties (two-legged)
- Final: 1 match (single leg, neutral venue)
```

### 6.2 Group Draw

Location: `src/engine/tournamentEngine.js`

```javascript
function createGroups(teams) {
  // 1. Separate Big 3 from other teams
  // 2. Distribute Big 3 across groups (at least 1 per group)
  // 3. Fill remaining slots randomly
  // 4. Return { groupA: [...], groupB: [...] }
}
```

### 6.3 Group Stage Fixtures

```javascript
function generateGroupFixtures(group) {
  // Round-robin: each team plays every other team twice
  // 5 teams = 4 opponents × 2 (home/away) = 8 matches per team
  // Total: 20 matches per group, 40 matches total

  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      fixtures.push({ home: group[i], away: group[j] });  // First leg
      fixtures.push({ home: group[j], away: group[i] });  // Second leg
    }
  }
}
```

### 6.4 Match Day Organization

```javascript
function organizeIntoMatchDays(fixturesA, fixturesB) {
  // Organize 40 matches into 8 match days
  // Each day: ~5 matches
  // Constraint: No team plays twice on same day
  // Mix matches from both groups
}
```

### 6.5 Standings Calculation

```javascript
function calculateStandings(teams, results) {
  // For each team, calculate:
  // - Played, Won, Drawn, Lost
  // - Goals For, Goals Against, Goal Difference
  // - Points (Win=3, Draw=1, Loss=0)

  // Sort by: Points → Goal Difference → Goals For
}
```

### 6.6 Knockout Fixtures

```javascript
function generateKnockoutFixtures(standingsA, standingsB) {
  // Cross-group matchups:
  // QF1: A1 vs B4
  // QF2: A2 vs B3
  // QF3: B1 vs A4
  // QF4: B2 vs A3
}
```

### 6.7 Two-Legged Ties (QF & SF)

```javascript
// Tie structure
{
  id: 'QF1',
  home: team1,           // "Home" team (hosts leg 1)
  away: team2,           // "Away" team (hosts leg 2)
  leg1Result: {          // Leg 1: home team hosts
    homeGoals: 2,
    awayGoals: 1
  },
  leg2Result: {          // Leg 2: away team hosts (swap home/away)
    homeGoals: 1,        // This is actually the original "away" team at home
    awayGoals: 2         // This is the original "home" team playing away
  },
  aggregate: {
    home: 4,             // home leg1 + away leg2 goals
    away: 2              // away leg1 + home leg2 goals
  },
  winner: team1,
  decidedBy: 'aggregate' // or 'awayGoals' or 'penalties'
}
```

### 6.8 Tie-Breaking Rules

```javascript
function determineTieWinner(tie) {
  const homeAgg = tie.leg1Result.homeGoals + tie.leg2Result.awayGoals;
  const awayAgg = tie.leg1Result.awayGoals + tie.leg2Result.homeGoals;

  // 1. Aggregate score
  if (homeAgg > awayAgg) return tie.home;
  if (awayAgg > homeAgg) return tie.away;

  // 2. Away goals rule (goals scored away from home)
  const homeAwayGoals = tie.leg2Result.awayGoals;  // Home team's away goals
  const awayAwayGoals = tie.leg1Result.awayGoals;  // Away team's away goals

  if (awayAwayGoals > homeAwayGoals) return tie.away;
  if (homeAwayGoals > awayAwayGoals) return tie.home;

  // 3. Penalties (random simulation)
  return simulatePenalties(tie.home, tie.away);
}
```

### 6.9 Final (Neutral Venue)

- Single match (no home/away legs)
- No home advantage bonus for either team
- Goes to extra time if tied after 90 minutes
- Penalties if still tied after extra time

---

## 7. Match Simulation Engine

Location: `src/engine/matchEngine.js`

### 7.1 Match Flow

```
Pre-match Setup
    ↓
First Half (0-45')
    ↓
Half Time
    ↓
Second Half (46-90')
    ↓
Full Time
    ↓
[If knockout & tied]
    ↓
Extra Time (91-120')
    ↓
[If still tied]
    ↓
Penalty Shootout
```

### 7.2 Team Strength Calculations

```javascript
// Overall team strength
function calculateTeamStrength(players, options = {}) {
  const { isHome = false, recentResults = [] } = options;

  const base = calculateBaseTeamStrength(players);  // Average rating + position bonus
  const formBonus = calculateFormBonus(recentResults);  // -5 to +5 based on recent results
  const homeBonus = isHome ? (3 + Math.random() * 3) : 0;  // +3 to +6 for home team

  return base + formBonus + homeBonus;
}

// Attack strength (FWD + MID players, weighted by rating)
function calculateAttackStrength(players) {
  // Star players (85+) count 1.5x
  // Elite players (90+) count 2.5x
}

// Defense strength (DEF + GK players, weighted by rating)
function calculateDefenseStrength(players) {
  // Same weighting as attack
}

// Midfield strength (MID players only, for possession)
function calculateMidfieldStrength(players) {
  // Elite midfielders count 3x (they dominate possession)
}
```

### 7.3 Player Rating Tiers

```javascript
const STAR_PLAYER = {
  THRESHOLD: 85,           // 85-89 = "Star" player
  ELITE_THRESHOLD: 90,     // 90+ = "Elite" player
  SHOOTING_WEIGHT: 2.0,    // Stars 2x more likely to shoot
  ELITE_SHOOTING_WEIGHT: 3.0,  // Elite 3x more likely to shoot
  GOAL_BONUS: 0.05,        // +5% goal chance for stars (not used in current impl)
  ELITE_GOAL_BONUS: 0.10,  // +10% goal chance for elite (not used in current impl)
};
```

### 7.4 Event Generation (Per Minute)

```javascript
const EVENT_PROBABILITIES = {
  NOTHING: 0.38,    // No significant event
  ATTACK: 0.35,     // Attack builds up
  SHOT: 0.17,       // Shot attempted
  FOUL: 0.08,       // Foul committed
  INJURY: 0.01,     // Injury occurs
  CARD: 0.01,       // Direct card (rare)
};

function generateMatchEvent(minute, homeTeam, awayTeam, homePlayers, awayPlayers) {
  // 1. Calculate team strengths
  // 2. Determine possession (based on midfield strength)
  // 3. Calculate dominance level
  // 4. Adjust shot probability based on dominance
  // 5. Roll for event type
  // 6. If SHOT, simulate shot outcome
  // 7. Return event with details
}
```

### 7.5 Possession Calculation

```javascript
function determinePossession(homeMidfield, awayMidfield) {
  // Each midfield point = ~2% possession advantage
  // 88 vs 83 midfield = 60% vs 40% possession

  const diff = homeMidfield - awayMidfield;
  const homeProb = 0.5 + (diff * 0.02);  // Base 50% + advantage

  // Clamp between 30% and 70%
  return Math.random() < clamp(homeProb, 0.30, 0.70) ? 'home' : 'away';
}
```

### 7.6 Dominance System

```javascript
const DOMINANCE = {
  THRESHOLD: 3,             // 3+ point diff = dominant
  STRONG_THRESHOLD: 6,      // 6+ = strongly dominant
  OVERWHELMING_THRESHOLD: 10,  // 10+ = overwhelming

  SHOT_BONUS: 0.04,         // +4% shot chance when dominant
  STRONG_SHOT_BONUS: 0.06,  // +6% when strongly dominant
  OVERWHELMING_SHOT_BONUS: 0.10,  // +10% when overwhelming
};

function calculateDominance(homeStrength, awayStrength, homeAttack, awayAttack, homeDefense, awayDefense) {
  // Combines overall strength with attack vs defense matchups
  // Returns { dominant: 'home'|'away'|null, level: 'normal'|'dominant'|'strong'|'overwhelming' }
}
```

### 7.7 Shot Simulation

```javascript
function simulateShot(attackingTeam, defendingTeam, attackingPlayers, defendingPlayers) {
  const attackStrength = calculateAttackStrength(attackingPlayers);
  const defenseStrength = calculateDefenseStrength(defendingPlayers);

  // Select shooter (weighted by rating - stars shoot more)
  const shooter = selectWeightedPlayer(attackers);

  // Base goal probability: 12%
  let goalProb = 0.12;

  // Attack vs Defense bonus: (ATK - DEF) / 50
  // e.g., 90 ATK vs 86 DEF = +8%
  goalProb += (attackStrength - defenseStrength) / 50;

  // Star player bonus
  if (shooter.rating >= 90) goalProb += 0.10;  // Elite: +10%
  else if (shooter.rating >= 85) goalProb += 0.03;  // Star: +3%

  // Individual shooter bonus: (rating - 75) / 300
  goalProb += (shooter.rating - 75) / 300;

  // Goalkeeper penalty: (GK rating - 75) / 100
  goalProb -= (goalkeeper.rating - 75) / 100;

  // Clamp between 5% and 40%
  goalProb = clamp(goalProb, 0.05, 0.40);

  return {
    scored: Math.random() < goalProb,
    shooter,
    goalkeeper,
    goalProbability: goalProb
  };
}
```

### 7.8 Stamina & Fatigue

```javascript
const FATIGUE = {
  STARTING_STAMINA: 100,
  BASE_DRAIN_PER_MIN: 0.8,    // Lose 0.8% per minute
  SPRINT_DRAIN: 2.0,          // Extra drain when involved in action
  AGE_FACTOR: 0.02,           // Older players (28+) tire faster
  LOW_STAMINA_PENALTY: 10,    // -10 rating when stamina < 30%
  CRITICAL_STAMINA: 20,       // Below this = high injury risk
};

function calculateStaminaDrain(player, wasActive) {
  let drain = FATIGUE.BASE_DRAIN_PER_MIN;
  if (wasActive) drain += FATIGUE.SPRINT_DRAIN;
  if (player.age > 28) drain *= 1 + (player.age - 28) * FATIGUE.AGE_FACTOR;
  if (player.age < 24) drain *= 0.9;  // Young players recover better
  return drain;
}
```

### 7.9 Substitution System

```javascript
const SUBSTITUTION = {
  MAX_SUBS: 5,              // Modern rules: 5 subs per match
  SUB_WINDOWS: 3,           // 3 windows (excluding halftime)
  FATIGUE_THRESHOLD: 50,    // Consider sub when stamina < 50%
};

function suggestSubstitution(onPitch, bench, subsUsed, minute) {
  // Priority 1: Injured players who can't continue
  // Priority 2: Scheduled windows (55', 62', 70', 78', 85')
  // Priority 3: Very fatigued players (stamina < 30%)

  // Ensures all 5 subs are used by end of match
  const subWindows = [55, 62, 70, 78, 85];
  // Force sub if in window and behind on sub count
}
```

### 7.10 Injury System

```javascript
const INJURY = {
  BASE_CHANCE: 0.005,       // 0.5% per minute base
  FATIGUE_MULTIPLIER: 3.0,  // 3x more likely when fatigued
  SEVERITY: {
    MINOR: { chance: 0.6, canContinue: true, ratingPenalty: 5 },
    MODERATE: { chance: 0.3, canContinue: false, ratingPenalty: 15 },
    SERIOUS: { chance: 0.1, canContinue: false, ratingPenalty: 0 }  // Must sub off
  }
};
```

### 7.11 Card System

```javascript
const CARD_PROBABILITIES = {
  YELLOW_FROM_FOUL: 0.12,       // 12% of fouls = yellow
  RED_FROM_FOUL: 0.001,         // 0.1% of fouls = direct red
  YELLOW_FROM_CARD_EVENT: 0.97, // Card events: 97% yellow
  RED_FROM_CARD_EVENT: 0.03,    // Card events: 3% red
};
// Results in ~3-4 yellows per match, ~10% chance of red per match
```

### 7.12 Extra Time

```javascript
const EXTRA_TIME = {
  DURATION: 30,           // 30 minutes total
  HALF_DURATION: 15,      // 15 minutes each half
  FIRST_HALF: [91, 105],  // Minutes 91-105
  SECOND_HALF: [106, 120] // Minutes 106-120
};

// Extra time events are less frequent (players tired)
// 18% chance of event per minute (vs normal ~60%)
```

### 7.13 Penalty Shootout

```javascript
const PENALTIES = {
  INITIAL_KICKS: 5,          // 5 kicks each initially
  BASE_SUCCESS_RATE: 0.76,   // 76% base conversion rate
  GK_RATING_IMPACT: 0.003,   // Each GK point above 75 = -0.3%
  PLAYER_RATING_IMPACT: 0.004, // Each player point above 75 = +0.4%
  PRESSURE_FACTOR: 0.05,     // -5% in sudden death
};

function simulatePenaltyKick(taker, goalkeeper, isSuddenDeath) {
  let successRate = PENALTIES.BASE_SUCCESS_RATE;
  successRate += (taker.rating - 75) * PENALTIES.PLAYER_RATING_IMPACT;
  successRate -= (goalkeeper.rating - 75) * PENALTIES.GK_RATING_IMPACT;
  if (isSuddenDeath) successRate -= PENALTIES.PRESSURE_FACTOR;

  return Math.random() < clamp(successRate, 0.50, 0.95);
}
```

### 7.14 Quick Simulate (Non-Big 3 Matches)

```javascript
function quickSimulate(homeTeam, awayTeam) {
  // Simplified simulation for AI vs AI matches
  // Based on attack vs defense calculations

  const homeAdvantage = (homeAttack - awayDefense) / 20;
  const awayAdvantage = (awayAttack - homeDefense) / 20;

  const homeExpected = 1.3 + homeAdvantage + random(-0.5, 0.5);
  const awayExpected = 1.0 + awayAdvantage + random(-0.5, 0.5);

  return {
    homeGoals: Math.round(homeExpected),
    awayGoals: Math.round(awayExpected)
  };
}
```

---

## 8. State Management

### 8.1 Auction State (AuctionContext)

```javascript
const auctionState = {
  phase: 'retention' | 'auction' | 'rtm' | 'complete',

  teams: [...],              // All 10 teams with their data
  playerPool: [...],         // All available players

  // Retention tracking
  retentionComplete: { teamId: true, ... },

  // Current auction
  currentPlayer: { ... },    // Player being auctioned
  currentBid: 5000000,       // Current highest bid
  highestBidder: 'team-id',  // Team with highest bid
  biddingTeams: [...],       // Teams still in bidding
  passedTeams: [...],        // Teams that passed

  // Auction history
  soldPlayers: [...],        // Players sold with prices
  unsoldPlayers: [...],      // Players that went unsold

  // Team states
  // Each team has:
  // - remainingBudget
  // - retainedPlayers[]
  // - auctionedPlayers[]
  // - rtmCardsRemaining
  // - positionCount: { GK: n, DEF: n, MID: n, FWD: n }
};
```

### 8.2 Tournament State (TournamentContext)

```javascript
const tournamentState = {
  phase: 'idle' | 'draw' | 'groups' | 'groups_complete' | 'qf' | 'sf' | 'final' | 'winner',

  teams: [...],              // Teams from auction
  teamsMap: { id: team },    // Quick lookup

  // Groups
  groups: { A: [...], B: [...] },

  // Group Stage
  matchDay: 1,
  totalMatchDays: 8,
  allMatchDays: [[...], ...],    // Fixtures organized by day
  matchDayFixtures: [...],       // Current day's fixtures
  groupResults: { A: [...], B: [...] },
  standings: { A: [...], B: [...] },

  // Live match queue
  currentMatch: { ... },     // Match being simulated
  matchQueue: [...],         // Big 3 matches waiting

  // Knockouts
  knockout: {
    qf: {
      ties: [...],           // 4 two-legged ties
      currentTieIndex: 0,
      currentLeg: 1
    },
    sf: {
      ties: [...],           // 2 two-legged ties
      currentTieIndex: 0,
      currentLeg: 1
    },
    final: {
      fixture: { ... },
      result: null,
      isNeutral: true
    }
  },

  champion: null
};
```

---

## 9. UI Components

### 9.1 Component Hierarchy

```
App.jsx
├── LandingPage (mode selection)
├── RetentionPhase (Big 3 retention)
├── AuctionPhase (main auction)
├── CompletePhase (auction results)
└── Tournament
    ├── TournamentDraw (animated draw)
    ├── GroupStage (match days)
    ├── KnockoutStage (QF/SF/Final)
    ├── LiveMatchSimulator (real-time match)
    └── WinnerCelebration (champion screen)
```

### 9.2 LiveMatchSimulator Components

```
LiveMatchSimulator
├── Scoreboard (teams, score, time)
├── SpeedControl (1x, 2x, 4x, 8x, 16x)
├── CarromBoardPitch
│   ├── PitchMarkings
│   ├── PlayerToken (for each player)
│   ├── Ball
│   └── PreMatchOverlay (lineups)
├── Commentary (live text feed)
├── TacticalNotes (manager insights)
├── LineupDisplay (starting XI + bench)
├── EventPopup (goals, red cards)
├── PenaltyShootoutView (if applicable)
└── PostMatchQuotes (manager reactions)
```

### 9.3 Visual Match Simulation

The match is displayed on a "carrom board" style pitch:
- Green pitch with wooden border
- Players shown as colored discs
- Ball moves based on events
- Formations based on team composition (4-3-3, 4-4-2, 3-5-2)

---

## 10. Constants & Configuration

### 10.1 Financial Constants

```javascript
const STARTING_BUDGET = 1000000000;  // €1 billion
const BASE_PRICE = 5000000;           // €5 million
const RETENTION_PRICES = {
  1: 150000000,  // €150M
  2: 100000000,  // €100M
  3: 75000000    // €75M
};
```

### 10.2 Squad Constants

```javascript
const MAX_SQUAD_SIZE = 18;
const MAX_RETENTIONS = 3;
const RTM_CARDS_PER_TEAM = 5;
const POSITION_REQUIREMENTS = { GK: 2, DEF: 6, MID: 5, FWD: 5 };
```

### 10.3 Match Constants

```javascript
const MATCH_DURATION = 90;           // Minutes
const REAL_TIME_DURATION = 120;      // Seconds (at 1x speed)
const TICK_INTERVAL = 1.33;          // Seconds per match minute
```

### 10.4 Home Advantage

```javascript
const HOME_ADVANTAGE = {
  MIN_BONUS: 3,            // +3 rating points minimum
  MAX_BONUS: 6,            // +6 rating points maximum
  POSSESSION_BOOST: 0.05   // +5% possession tendency
};
```

---

## Appendix A: Currency Formatting

```javascript
function formatCurrency(amount) {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B`;  // e.g., "1.5B"
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(0)}M`;     // e.g., "150M"
  }
  return amount.toLocaleString();
}
```

---

## Appendix B: Match Result Format

```javascript
// Full match result object
{
  homeTeam: { id, name, ... },
  awayTeam: { id, name, ... },
  homeGoals: 2,
  awayGoals: 1,
  events: [...],              // All match events
  homeFormation: '4-3-3',
  awayFormation: '4-4-2',

  // If extra time was played
  extraTime: {
    events: [...],
    homeGoals: 1,
    awayGoals: 0
  },
  homeGoalsAET: 3,
  awayGoalsAET: 1,

  // If penalties were taken
  penalties: {
    homeScore: 4,
    awayScore: 3,
    kicks: [...],
    winner: 'team-id',
    winnerName: 'Team Name'
  },

  winner: { ... },
  decidedIn: 'regularTime' | 'extraTime' | 'penalties'
}
```

---

## Appendix C: Commentary System

Location: `src/engine/commentary.js`

Generates contextual commentary for:
- Goals (with Fabrizio Romano style)
- Cards (yellow/red)
- Injuries
- Substitutions
- Half time / Full time
- Extra time start/end
- Penalty kicks
- Manager post-match quotes (unique per manager)

Each manager has personalized quotes based on their real-world personality.

---

## Appendix D: Multiplayer Support

The system includes optional multiplayer support via WebSocket:
- Room-based matchmaking
- Host broadcasts state changes
- Players control their assigned teams
- Real-time auction synchronization

(Implementation in `MultiplayerContext.jsx`)

---

*Document Version: 1.0*
*Last Updated: January 2025*
