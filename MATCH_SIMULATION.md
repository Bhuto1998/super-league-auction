# Match Simulation Documentation

## Overview

The match simulation engine creates realistic 90-minute football matches based on player ratings, team composition, form, and home advantage. It features a carrom board style visual pitch, dynamic events, stamina tracking, substitutions, injuries, and supports extra time and penalty shootouts for knockout matches.

## Key Files

```
src/
├── engine/
│   ├── matchEngine.js              # Core simulation logic
│   ├── commentary.js               # Fabrizio-style commentary
│   └── tournamentEngine.js         # Tournament fixtures & standings
├── context/
│   └── TournamentContext.jsx       # Tournament state management
└── components/tournament/
    └── LiveMatchSimulator.jsx      # Unified match visualization
```

## Visual Experience

### Carrom Board Style Pitch
- Wooden border frame with corner pockets
- SVG-based pitch markings (center circle, penalty areas, goals)
- Player tokens styled as carrom pieces with team colors
- Stamina rings around each player (green/yellow/red based on energy)
- Smooth ball movement transitions
- Player name labels beneath tokens

### Match Controls
- **Speed Control**: 1x, 2x, 4x match speed
- **Skip to Final**: Jump directly to final score
- **Pre-match Kick Off**: Button to start the match

## Core Concepts

### Team Strength Calculation

```javascript
Total Strength = Base Rating + Form Bonus + Home Bonus

// Base Rating: Average of starting 11 player ratings
// Form Bonus: Based on recent match results
// Home Bonus: +3 to +6 for home team
```

### Formation System

Supports three formations with automatic player positioning:
- **4-3-3**: Balanced with attacking width
- **4-4-2**: Traditional midfield-heavy
- **3-5-2**: Defensive with wing-backs

Players are assigned positions based on their role (GK, DEF, MID, FWD).

### Stamina System

```javascript
// Each player starts at 100% stamina
// Stamina decreases by ~0.3% per minute
// Visual indicators:
// - Green ring: >60% stamina
// - Yellow ring: 30-60% stamina
// - Red ring: <30% stamina

// Low stamina triggers substitution suggestions
```

### Substitution System

```javascript
SUBSTITUTION = {
  MAX_SUBS: 5,              // Maximum substitutions allowed
  STAMINA_THRESHOLD: 40,    // Suggest sub below this
  CRITICAL_STAMINA: 25,     // Auto-sub recommended
}

// AI auto-subs when:
// - Player stamina critically low
// - Player injured
// - Tactical reasons (after 55th minute)
```

## Match Flow

### Pre-Generated Events

Unlike real-time simulation, matches are pre-generated then animated:

```javascript
// 1. Generate all 90 minutes of events
const result = simulateMatch(homeTeam, awayTeam);

// 2. Animate events in real-time
// 90 game minutes = 120 real seconds (at 1x speed)
```

### Event Types

```javascript
EVENT_TYPES = {
  GOAL: { commentary: "GOOOAL!", visual: ball at goal },
  SHOT: { commentary: "Shot!", visual: ball near goal },
  CARD: { yellow or red, player marked },
  INJURY: { player may need substitution },
  FOUL: { brief stoppage },
}
```

### Knockout Match Features

For knockout (QF, SF, Final) matches:

```javascript
// If match tied after 90 minutes:
// 1. Extra Time (2x15 minutes)
//    - generateExtraTimeEvents()
//    - Additional goal opportunities

// 2. If still tied: Penalty Shootout
//    - simulatePenaltyShootout()
//    - 5 kicks each, then sudden death
//    - Visual penalty tracker UI
```

## Commentary System

### Fabrizio Romano Style

```javascript
// Goal commentary examples:
"HERE WE GO! {player} scores for {team}!"
"DONE DEAL! {player} finds the net!"
"BOOM! {player} with a stunning strike!"

// Card commentary:
"Yellow card shown to {player}!"
"RED CARD! {player} is sent off!"

// Phase commentary:
"KICK OFF! Here we go!"
"HALF TIME! {home} {score} {away}"
"FULL TIME! What a match!"
```

### Manager Notes

Tactical observations displayed in sidebar:
- Formation information
- Halftime analysis
- Substitution reasons
- Score updates

## State Management

### Live Match State

```javascript
{
  phase: 'firsthalf',     // prematch|firsthalf|halftime|secondhalf|fulltime|extratime|penalties|postmatch
  minute: 45,
  homeGoals: 2,
  awayGoals: 1,

  // Players with stamina
  homePlayers: [{ ...player, stamina: 85 }],
  awayPlayers: [...],
  homeBench: [...],
  awayBench: [...],

  // Substitution counts
  homeSubs: 2,
  awaySubs: 1,

  // Pre-generated events
  events: [...],
  extraTimeEvents: [...],
  penaltyShootout: { kicks: [...], winner: 'home' },
}
```

## UI Components

### LiveMatchSimulator Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Home Logo] HOME 2 - 1 AWAY [Away Logo]   45' HALF TIME│
│  Formation: 4-3-3          Formation: 4-4-2             │
│  Subs: 2/5                 Subs: 1/5                    │
├─────────────────────────────────────────────────────────┤
│  [1x] [2x] [4x]                    [Skip to Final]      │
├─────────────────────────────────────────────────────────┤
│                                          │ Commentary   │
│        ┌─────────────────────┐           │ 45' GOAL!    │
│        │   Carrom Board      │           │ 42' Shot     │
│        │      Pitch          │           │ 38' Foul     │
│        │                     │           │──────────────│
│        │   [Players]         │           │ Manager Notes│
│        │      [Ball]         │           │ Formation... │
│        └─────────────────────┘           │ Tactics...   │
├─────────────────────────────────────────────────────────┤
│  Post-Match: Manager Quotes                             │
│  [Home Manager Quote]  [Away Manager Quote]             │
├─────────────────────────────────────────────────────────┤
│                    [Continue →]                         │
└─────────────────────────────────────────────────────────┘
```

### Penalty Shootout View

Replaces pitch during shootouts:
- Goal net background
- Team headers with running score
- Round-by-round kick tracker
- Checkmarks (scored) / X marks (missed)
- Sudden death indicator

## Configuration Constants

All tunable values in `matchEngine.js`:

```javascript
// Match timing
MATCH_DURATION: 90              // minutes
REAL_TIME_DURATION: 120         // seconds (2 min real = 90 min game)

// Stamina
STAMINA_DECAY_PER_MINUTE: 0.3   // Percentage lost per minute

// Substitution
SUBSTITUTION.MAX_SUBS: 5
SUBSTITUTION.STAMINA_THRESHOLD: 40
SUBSTITUTION.CRITICAL_STAMINA: 25

// Extra time
EXTRA_TIME.FIRST_HALF_START: 91
EXTRA_TIME.FIRST_HALF_END: 105
EXTRA_TIME.SECOND_HALF_START: 106
EXTRA_TIME.SECOND_HALF_END: 120
```

## Usage

### Standalone Match (from Auction Complete)

1. Complete an auction
2. Click "Simulate Match"
3. Select home and away teams
4. Click "Start Match" → Kick Off
5. Watch the carrom board simulation
6. Click "Continue" when finished

### Tournament Matches (Group Stage & Knockouts)

1. Click "Start Super League Draw"
2. Watch animated group draw
3. Click "Simulate Match Day"
4. Big Three matches show live simulation
5. Other matches quick-simulated
6. Progress through knockout stages

## Expected Match Statistics

With current settings, typical match produces:
- **Total shots**: 10-16 per match
- **Goals**: 2-4 per match
- **Yellow cards**: 2-4 per match
- **Red cards**: ~5% of matches
- **Penalties (knockouts)**: ~15% of tied matches go to shootout

## Testing

```bash
# Start development server
cd super-league-auction
npm run dev

# Run linter
npm run lint

# Build for production
npm run build
```
