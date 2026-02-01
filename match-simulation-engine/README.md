# Super League Match Simulation Engine

A real-time soccer match simulation engine built with Next.js and TypeScript. This engine simulates 90-minute football matches at **2X speed** (1 minute real time) with realistic gameplay mechanics and sound effects.

## Features

### Core Simulation Engine
- **Rating-based Gameplay**: Match outcomes are influenced by player ratings (1-99 scale)
- **Position Weighting**: Players in attacking positions have higher goal-scoring probability
- **Stamina System**: Players lose stamina throughout the match, affecting performance
- **Injuries**: Random injuries can occur, especially for low-stamina players
- **Cards**: Yellow and red cards are simulated based on fouls
- **Substitutions**: Up to 5 substitutions per team (FIFA rules)
- **2X Speed**: 90-minute match compressed to 1 minute real time

### Visual Match Board (Carrom-style)
- Real-time player positions on a styled pitch
- **Dynamic ball movement** across the entire pitch
- Player markers with ratings, cards, and stamina indicators
- Team formation display
- Half-time and full-time overlays (auto-clears after half-time)

### Sound Effects (Web Audio API)
- **Whistle sounds** for kick-off, half-time, and full-time
- **Goal celebration** with crowd roar
- **Ambient crowd noise** during match
- **Card sounds** for yellow/red cards
- **Kick sounds** for shots
- **Foul whistle** for fouls
- Toggle button to enable/disable sounds

### Live Statistics
- Real-time scoreboard
- Possession percentages
- Shots and shots on target
- Corners and fouls
- Player goal and assist tracking

### Manager Notes
- Tactical recommendations based on match situation
- Injury alerts with substitution suggestions
- Low stamina warnings
- Card warnings (risk of second yellow)
- Half-time performance analysis

### Commentary
- Live match commentary
- Highlight events (goals, red cards)
- Play-by-play updates
- Event-specific icons

## Project Structure

```
match-simulation-engine/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Team selection & match page
│   │   ├── layout.tsx         # App layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── MatchSimulator.tsx # Main simulator component
│   │   ├── MatchBoard.tsx     # Visual pitch display
│   │   ├── Scoreboard.tsx     # Score and stats display
│   │   ├── Commentary.tsx     # Live commentary feed
│   │   ├── ManagerNotes.tsx   # Manager notifications
│   │   ├── TeamLineup.tsx     # Team roster display
│   │   └── MatchControls.tsx  # Start/pause/reset controls
│   └── lib/
│       ├── types.ts           # TypeScript interfaces
│       ├── simulation-engine.ts # Core simulation logic
│       ├── sample-teams.ts    # Sample team data
│       └── sounds.ts          # Web Audio API sound effects
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

### Simulation Engine (`simulation-engine.ts`)

The engine runs on a configurable interval (default: 1 minute for 90-minute match at 2X speed):

1. **Team Strength Calculation**
   - Based on average player ratings
   - Weighted by stamina levels
   - Reduced by missing players (injuries/red cards)

2. **Attack/Defense Strength**
   - Attackers (ST, RW, LW, CAM) have higher attack weights
   - Defenders (CB, LB, RB, CDM, GK) have higher defense weights

3. **Event Simulation**
   - Each game minute generates 0-2 events
   - Event types: goals, shots, fouls, corners, tackles, injuries
   - Goal probability = attack strength vs defense strength

4. **Match Flow**
   - Possession shifts based on team strength
   - Ball position updates with each action
   - Stamina decreases over time

### Key Interfaces

```typescript
interface Player {
  id: string;
  name: string;
  position: Position;
  rating: number;        // 1-99
  stamina: number;       // 0-100
  isInjured: boolean;
  goals: number;
  assists: number;
  yellowCards: number;
  redCard: boolean;
}

interface Team {
  id: string;
  name: string;
  lineup: Player[];      // 11 players
  bench: Player[];       // Substitutes
  formation: Formation;
  substitutionsMade: number;
}

interface MatchState {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  currentMinute: number;
  events: MatchEvent[];
  possession: { home: number; away: number };
  isHalfTime: boolean;
  isFullTime: boolean;
}
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd match-simulation-engine
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Production Build

```bash
npm run build
npm start
```

## Usage

1. **Select Teams**: Choose a home team and away team from the available options
2. **Start Match**: Click "Start Match Simulation" to begin
3. **Watch**: Observe the 90-minute match unfold in 1 minute (2X speed)
4. **Controls**: Use Pause/Resume to control the simulation
5. **Reset**: Start a new match with the same or different teams

## Configuration

The simulation can be configured via the `SimulationConfig` interface:

```typescript
const config: SimulationConfig = {
  matchDurationMs: 60000,     // 1 minute real time (2X speed)
  eventFrequency: 1.5,        // Events per game minute
  injuryProbability: 0.02,    // 2% per event
  cardProbability: 0.05,      // 5% per foul
};
```

## Sample Teams

The engine includes 4 sample teams:
- FC Barcelona (Pep Guardiola)
- Real Madrid (Jose Mourinho)
- Bayern Munich (Hansi Flick)
- Manchester City (Pep Guardiola)

## Integration with Auction System

This engine is designed to work with the Super League Auction system. Teams and players from the auction can be imported to simulate matches:

```typescript
import { createTeam, createPlayer } from '@/lib/simulation-engine';

const myTeam = createTeam(
  'my-team',
  'My Team Name',
  'MTN',
  '#FF0000',
  'Manager Name',
  lineup,   // Array of 11 Players
  bench,    // Array of substitute Players
  '4-3-3'
);
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks (useState, useRef, useMemo)

## License

Part of the Super League Season 3 project.
