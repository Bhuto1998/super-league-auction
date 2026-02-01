# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start Vite dev server (hot reload)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint on src/
```

## Architecture Overview

This is a React 18 + Vite application simulating a fantasy football auction and tournament system. The app has two main phases:

### Phase 1: Auction System
Teams (3 human-controlled "Big Three" + 7 AI) bid on 90 players to build 18-player squads.

**State Management:** `src/context/AuctionContext.jsx`
- Uses `useReducer` for complex auction state
- Phases: `retention` → `auction` → `rtm` → `complete`
- Persists to localStorage for single-player, uses Supabase Realtime for multiplayer
- Key actions: `COMPLETE_RETENTION`, `PLACE_BID`, `PASS`, `END_AUCTION`, `USE_RTM`

**AI Bidding Logic:** `src/utils/aiEngine.js`
- Team personalities define spending styles: `big-spender`, `value-hunter`, `back-loaded`, `balanced`
- Bidding styles: `jump-bidder`, `late-swooper`, `stubborn`, `minimum-bidder`, `quick-dropper`
- `shouldAIBid()` and `getAIBidAmount()` are the main decision functions
- Uses `auctionProgress` (0-1) to adjust strategy as auction proceeds

**Auction Rules:** `src/utils/auctionHelpers.js`
- Budget: €1B per team
- Squad requirements: 2 GK, 6 DEF, 5 MID, 5 FWD (18 total)
- Retention prices: €150M/€100M/€75M for slots 1/2/3
- Bid increments: +€5M (<100M), +€20M (100-200M), +€50M (>200M)
- RTM: 5 cards per Big Three team to reclaim former players

### Phase 2: Tournament System
Full group stage + knockout tournament with live match simulation.

**State Management:** `src/context/TournamentContext.jsx`
- Phases: `idle` → `draw` → `groups` → `qf` → `sf` → `final` → `winner`
- Manages two-legged knockout ties with away goals rule
- Tracks group standings, fixtures, and match results

**Tournament Engine:** `src/engine/tournamentEngine.js`
- `createGroups()`: Distributes 10 teams into 2 groups of 5
- `generateGroupFixtures()`: Home-and-away round robin
- `calculateStandings()`: Points, GD, GF sorting
- `generateKnockoutFixtures()`: Cross-group QF matchups (A1 vs B4, etc.)

**Match Engine:** `src/engine/matchEngine.js`
- Full 90-minute simulation with stamina, injuries, cards, substitutions
- `calculateTeamStrength()`: Base rating + form bonus + home advantage
- `simulateShot()`: Goal probability based on attack vs defense + star player bonuses
- `simulatePenaltyShootout()`: For knockout ties after extra time
- Star players (85+) get weighted selection for shots and bonus goal probability
- Dominance mechanic amplifies chances for stronger teams

### Key Data Flow

1. **Auction Phase**
   - User/AI bids via `dispatch({ type: 'PLACE_BID' })`
   - `AuctionContext.processAIBids()` triggers AI decisions
   - RTM check happens in `END_AUCTION` reducer case
   - Teams track `remainingBudget`, `positionCount`, `retainedPlayers`, `auctionedPlayers`

2. **Tournament Phase**
   - `startTournament(teams)` builds team objects with `players` array
   - Big Three matches trigger `LiveMatchSimulator` component
   - Other matches use `quickSimulate()` for fast results
   - `completeKnockoutMatch()` handles two-leg aggregate + away goals logic

### Key Constants

```javascript
// Auction
STARTING_BUDGET = 1_000_000_000  // €1B
MAX_SQUAD_SIZE = 18
RTM_CARDS_PER_TEAM = 5
BASE_PRICE = 5_000_000  // €5M

// Match Engine
MATCH_DURATION = 90
HOME_ADVANTAGE.MIN_BONUS = 3  // rating points
STAR_PLAYER.THRESHOLD = 85
ELITE_RATING_THRESHOLD = 88
```

### Multiplayer Architecture

- Optional Supabase Realtime integration via `src/context/MultiplayerContext.jsx`
- Host broadcasts state changes; clients receive via `SYNC_STATE`
- Playable teams limited to: `real-madrid`, `barcelona`, `bayern`

### Component Structure

- `src/components/AuctionPhase.jsx`: Main auction UI with bidding panel
- `src/components/RetentionPhase.jsx`: Pre-auction player retention
- `src/components/tournament/LiveMatchSimulator.jsx`: Visual match simulation
- `src/components/tournament/GroupStage.jsx`: Group standings and fixtures
- `src/components/tournament/KnockoutStage.jsx`: QF/SF/Final brackets

### Data Files

- `src/data/teams.json`: 10 teams with colors, logos, manager names
- `src/data/players.json`: 90 players with ratings (76-93), positions, ages
- `src/data/teamPersonalities.js`: AI behavior profiles per team
