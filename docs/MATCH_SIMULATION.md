# Match Simulation Engine Documentation

## Overview

The Super League Match Simulation Engine provides a realistic football match simulation based on player ratings, with full support for substitutions, injuries, extra time, and penalty shootouts.

## Core Features

### 1. Rating-Based Simulation

The engine calculates team strength from player ratings with positional weighting:

```javascript
// Team strength factors
- Base team strength: Average of all player ratings
- Position coverage bonus: +2-3 for proper positional balance
- Attack strength: Weighted average of FWD/MID players (stars count 2.5x)
- Defense strength: Weighted average of DEF/GK players
- Midfield strength: Controls possession calculations
```

**Star Player System:**
- Players rated 85+ are "Stars" (1.5x weight, +5% goal bonus)
- Players rated 90+ are "Elite" (2.5x weight, +10% goal bonus)

**Home Advantage:**
- +3 to +6 rating points bonus for home team
- +5% possession tendency at home

### 2. Match Duration

- **Regular Time:** 90 minutes simulated in 120 seconds (2 minutes real-time)
- **Extra Time:** 30 minutes (2 x 15 minute halves)
- **Penalties:** 5 kicks each, then sudden death

Speed controls: 1x, 2x, 4x available during simulation.

### 3. Substitutions

```javascript
SUBSTITUTION = {
  MAX_SUBS: 5,              // Modern rules allow 5 substitutions
  SUB_WINDOWS: 3,           // 3 windows (excluding halftime)
  FATIGUE_THRESHOLD: 50,    // AI considers sub when stamina < 50%
  INJURY_FORCE_SUB: true,   // Force sub on serious injury
}
```

**AI Substitution Logic:**
1. **Critical:** Injured players who can't continue
2. **High Priority:** Exhausted players (stamina < 30%) after 60'
3. **Tactical:** Tired players (stamina < 50%) after 70'

### 4. Fatigue/Stamina System

```javascript
FATIGUE = {
  STARTING_STAMINA: 100,    // All players start at 100%
  BASE_DRAIN_PER_MIN: 0.8,  // ~72% stamina after 90 mins
  SPRINT_DRAIN: 2.0,        // Extra drain during actions
  AGE_FACTOR: 0.02,         // Older players (28+) tire faster
  LOW_STAMINA_PENALTY: 10,  // -10 rating when stamina < 30%
  CRITICAL_STAMINA: 20,     // High injury risk below this
}
```

### 5. Injury System

```javascript
INJURY = {
  BASE_CHANCE: 0.005,       // 0.5% per minute base
  FATIGUE_MULTIPLIER: 3.0,  // 3x chance when fatigued
  CONTACT_MULTIPLIER: 2.0,  // 2x during fouls/tackles
  SEVERITY: {
    MINOR: 60% chance, can continue with -5 rating
    MODERATE: 30% chance, must substitute, -15 rating
    SERIOUS: 10% chance, immediate exit
  }
}
```

### 6. Extra Time (Knockout Matches)

Triggered when:
- Single-leg knockout (final) is tied after 90 minutes
- Two-leg aggregate is tied after second leg

**Format:**
- First half: Minutes 91-105
- Halftime break
- Second half: Minutes 106-120
- If still tied: Penalties

### 7. Penalty Shootout

```javascript
PENALTIES = {
  INITIAL_KICKS: 5,
  BASE_SUCCESS_RATE: 0.76,      // 76% base (realistic)
  GK_RATING_IMPACT: 0.003,      // Better GK = more saves
  PLAYER_RATING_IMPACT: 0.004,  // Better player = more goals
  PRESSURE_FACTOR: 0.05,        // -5% in sudden death
}
```

**Taker Selection:** Best-rated outfield players first, GK last.

## Visual Components

### Carrom Board Pitch

The match is displayed on a carrom board-styled pitch featuring:
- Wooden border with authentic styling
- Corner pockets (decorative)
- Standard pitch markings (center circle, penalty areas, goals)
- Player tokens as carrom pieces with team colors
- Ball movement animation

### Player Tokens

Each player token displays:
- Team color gradient
- First initial
- Gold/dark border (home/away)
- Stamina ring (green > yellow > red)
- Name label on hover

### Commentary Panel

Live commentary in "Fabrizio Romano" style:
- Goal celebrations with "HERE WE GO!"
- Card notifications
- Injury updates
- Phase transitions (halftime, extra time, penalties)

### Manager Notes Panel

Tactical notes showing:
- Pre-match formations
- Substitution decisions and reasons
- Halftime tactical adjustments
- Post-match summary

### Penalty Shootout View

Visual tracker showing:
- Team logos and names
- Current penalty score
- Each kick result (checkmark/X)
- Taker names
- Sudden death indicator

## Event Probabilities

Per-minute base probabilities:
```javascript
EVENT_PROBABILITIES = {
  NOTHING: 40%
  ATTACK: 35%
  SHOT: 15%
  FOUL: 8%
  INJURY: 1%
  CARD: 1%
}
```

**Dynamic Adjustments:**
- Dominant teams get +5% to +12% shot bonus
- Weaker teams get -3% to -8% shot penalty
- Increased attacks near halftime and fulltime

## Card System

Realistic Poisson distribution:
- ~3-4 yellow cards per match average
- ~10% chance of red card per match
- Yellow from foul: 12%
- Direct red from foul: 0.1%
- Card events: 97% yellow, 3% red

## File Structure

```
src/engine/
  matchEngine.js     # Core simulation logic
  commentary.js      # Commentary generation
  tournamentEngine.js # Tournament structure

src/components/tournament/
  LiveMatchSimulator.jsx  # Main match UI
  - CarromBoardPitch      # Pitch visualization
  - PitchMarkings         # SVG pitch lines
  - PlayerToken           # Player representation
  - PenaltyShootoutView   # Shootout UI
```

## Usage

```jsx
<LiveMatchSimulator
  homeTeam={homeTeamObject}
  awayTeam={awayTeamObject}
  isKnockout={true}           // Enable extra time/penalties
  firstLegResult={null}       // For single-leg matches
  onComplete={(result) => {}} // Callback with match result
/>
```

## Match Result Object

```javascript
{
  homeGoals: 2,
  awayGoals: 1,
  homeTeamName: "Real Madrid",
  awayTeamName: "Barcelona",
  events: [...],              // All match events
  homeFormation: "4-3-3",
  awayFormation: "4-4-2",

  // Extra time (if applicable)
  extraTime: {
    events: [...],
    homeGoals: 1,
    awayGoals: 0
  },
  homeGoalsAET: 3,
  awayGoalsAET: 1,

  // Penalties (if applicable)
  penalties: {
    homeScore: 4,
    awayScore: 2,
    winner: "team-id",
    winnerName: "Real Madrid",
    kicks: [...],
    isSuddenDeath: false
  }
}
```

## Speed Controls

| Speed | Real Time per Match Minute |
|-------|---------------------------|
| 1x    | 1.33 seconds             |
| 2x    | 0.67 seconds             |
| 4x    | 0.33 seconds             |

"Skip to Final Score" button instantly completes the match.
