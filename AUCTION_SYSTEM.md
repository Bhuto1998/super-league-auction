# Auction System Documentation

## Overview

The Super League Auction is a fantasy football auction simulator where 3 human players (controlling Real Madrid, Barcelona, and Bayern Munich) compete against 7 AI teams to build their squads through bidding.

## Key Files

```
src/
├── context/AuctionContext.jsx    # Main state management (reducer pattern)
├── components/AuctionPhase.jsx   # Auction UI components
├── utils/auctionHelpers.js       # Utility functions
└── data/players.js               # Player database
```

## Data Structures

### Team Object
```javascript
{
  id: 'real-madrid',
  name: 'Real Madrid',
  shortName: 'RMA',
  color: '#FEBE10',
  logoEmoji: '👑',
  budget: 100000000,          // Starting budget (100M)
  retainedPlayers: [],        // Players kept via RTM
  auctionedPlayers: [],       // Players won in auction
  isHuman: true,              // true for RMA, BAR, BAY
}
```

### Player Object
```javascript
{
  id: 'player-1',
  name: 'Kylian Mbappé',
  position: 'LW',             // Specific position
  positionCategory: 'FWD',    // Category: GK, DEF, MID, FWD
  rating: 91,
  nationality: 'France',
  club: 'Paris Saint-Germain',
  basePrice: 15000000,        // Starting bid price
}
```

### Auction State
```javascript
{
  phase: 'pre-auction',       // pre-auction | rtm | auction | completed
  teams: [...],               // Array of 10 teams
  auctionPool: [...],         // Shuffled players for auction
  currentPlayerIndex: 0,      // Current player being auctioned
  currentBid: 0,
  currentBidder: null,
  biddingTeams: [],           // Teams still in bidding for current player
  rtmQueue: [],               // Players available for RTM
  rtmCurrentTeam: null,       // Team currently doing RTM
  timer: 10,                  // Countdown timer for bids
  settings: {
    maxSquadSize: 18,
    minSquadSize: 11,
    bidIncrement: 500000,     // 500K increments
    aiSpeed: 'normal',
  }
}
```

## Auction Flow

### Phase 1: Pre-Auction
- Teams review available players
- Settings can be configured
- Start button initiates RTM phase

### Phase 2: RTM (Right to Match)
Each human team gets opportunity to retain players from their real-world squad:
1. System shows players from team's actual roster
2. Team can "retain" players at base price
3. Limited slots available
4. Retained players skip auction pool

### Phase 3: Main Auction
```
┌─────────────────────────────────────────────────────────┐
│  For each player in auctionPool:                        │
│                                                         │
│  1. Display player card with base price                 │
│  2. All eligible teams can bid                          │
│  3. Bids increase by bidIncrement (500K)                │
│  4. 10-second timer resets on each bid                  │
│  5. When timer expires → highest bidder wins            │
│  6. Player added to winner's auctionedPlayers           │
│  7. Winner's budget reduced                             │
│  8. Move to next player                                 │
└─────────────────────────────────────────────────────────┘
```

### Phase 4: Completed
- All players distributed
- Final squads displayed
- Option to simulate matches

## Key Actions (Reducer)

### `PLACE_BID`
```javascript
// Human team places a bid
dispatch({
  type: 'PLACE_BID',
  payload: { teamId: 'real-madrid', amount: 15500000 }
});
```

### `AI_BID`
```javascript
// AI team decides to bid (handled automatically)
// AI logic considers:
// - Current budget
// - Squad needs (position gaps)
// - Player rating vs price value
// - Random factor for unpredictability
```

### `TIMER_TICK`
```javascript
// Called every second during bidding
// When timer reaches 0 → triggers SOLD
```

### `SOLD`
```javascript
// Player awarded to highest bidder
// Updates: team.auctionedPlayers, team.budget, currentPlayerIndex
```

### `AUTO_COMPLETE_AUCTION`
```javascript
// Randomly distributes remaining players to teams
// Ensures each team reaches 18 players (maxSquadSize)
// Used to quickly finish auction
```

## AI Bidding Logic

Located in `AuctionContext.jsx`:

```javascript
function shouldAIBid(team, player, currentBid) {
  // Skip if can't afford
  if (currentBid + bidIncrement > team.budget) return false;

  // Skip if squad full
  if (teamSquadSize >= maxSquadSize) return false;

  // Calculate value score
  const valueRatio = player.rating / (currentBid / 1000000);

  // Check position need
  const needsPosition = !hasEnoughInPosition(team, player.positionCategory);

  // Higher chance to bid if:
  // - Good value (high rating, low price)
  // - Fills position need
  // - Random factor (30% base chance)

  return Math.random() < calculateBidProbability(valueRatio, needsPosition);
}
```

## Budget Management

- Starting budget: 100,000,000 (100M)
- Minimum bid: Player's `basePrice`
- Bid increment: 500,000 (500K)
- Teams cannot bid more than their remaining budget
- Budget updates immediately when player is won

## Position Categories

```javascript
const POSITION_MAPPING = {
  'GK': 'GK',
  'CB': 'DEF', 'LB': 'DEF', 'RB': 'DEF', 'LWB': 'DEF', 'RWB': 'DEF',
  'CDM': 'MID', 'CM': 'MID', 'CAM': 'MID', 'LM': 'MID', 'RM': 'MID',
  'LW': 'FWD', 'RW': 'FWD', 'CF': 'FWD', 'ST': 'FWD',
};
```

## UI Components

### AuctionPhase.jsx
- **PlayerCard**: Displays current player being auctioned
- **BiddingPanel**: Shows current bid, timer, bid button
- **TeamBudgets**: Shows all teams' remaining budgets
- **SquadView**: Shows team's current squad

### Key UI States
- Bidding active: Green timer, bid button enabled
- Outbid: Yellow highlight on current leader
- Won: Celebration animation, player moves to squad
- Cannot afford: Bid button disabled, red budget text

## Testing the Auction

1. Start dev server: `npm run dev`
2. Navigate to auction page
3. Click "Start Auction"
4. Complete RTM phase (or skip)
5. Bid on players as they appear
6. Use "Auto Complete" to finish quickly

## Common Modifications

### Change starting budget
```javascript
// In AuctionContext.jsx, modify team initialization
budget: 150000000  // 150M instead of 100M
```

### Change bid increment
```javascript
// In initialState.settings
bidIncrement: 1000000  // 1M increments
```

### Add more human teams
```javascript
// In teams array, set isHuman: true for desired teams
{ id: 'manchester-city', ..., isHuman: true }
```

### Modify AI aggressiveness
```javascript
// In shouldAIBid function, adjust probability thresholds
const baseBidChance = 0.5;  // 50% instead of 30%
```
