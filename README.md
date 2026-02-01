# Super League Auction

A React-based football auction simulator with real-time multiplayer support and match simulation engine.

## Features

### Auction System
- **Retention Phase**: Teams can retain up to 4 players before the auction
- **Auction Phase**: Live bidding system with AI-controlled teams
- **RTM (Right to Match)**: Original teams can match winning bids
- **Multiplayer Support**: Real-time multiplayer via Supabase

### Match Simulation Engine
Full football match simulation based on player ratings.

## Match Simulation

### Overview
The match simulation engine simulates a full 90-minute football match in approximately 2 minutes of real time. It uses player ratings to determine match outcomes, with higher-rated players contributing more to their team's success.

### How It Works

#### Team Strength Calculation
```
Team Strength = Average Player Rating + Position Bonus
```
- Position coverage bonuses are applied when teams have proper GK, DEF, MID, and FWD coverage
- Attack strength weighs FWD and MID players
- Defense strength weighs DEF and GK players

#### Match Events
Each simulated minute can produce:
- **Nothing (40%)**: Normal play continues
- **Attack (35%)**: Team builds an attacking move
- **Shot (15%)**: Shot on goal with scoring probability
- **Foul (6%)**: Foul committed, potential cards
- **Injury (2%)**: Player injury, may require substitution
- **Card (2%)**: Direct card shown

#### Goal Probability
```
Goal Prob = Base (20%) + (Attack Strength - Defense Strength) / 100
```
- Clamped between 5% and 40%
- Higher attacking team rating vs lower defending team rating = more goals

### Match Timing
| Match Time | Real Time |
|------------|-----------|
| 90 minutes | ~120 seconds |
| 1 minute   | ~1.33 seconds |

Speed can be adjusted to 1x, 2x, or 4x.

### Features

#### Substitutions
- 5 substitutions allowed per team (modern football rules)
- Can only be made when match is paused
- Bench players are the remaining squad members not in starting 11

#### Injuries
- Random injuries can occur during match
- Serious injuries force substitutions
- Minor injuries allow players to continue

#### Cards
- Yellow cards accumulate (2 yellows = red)
- Red cards remove player from pitch
- Affects team strength for remainder of match

#### Formations
Available formations:
- 4-3-3 (default)
- 4-4-2
- 3-5-2

#### Visual Representation
- Carrom-board style pitch display
- Player positions update based on formation
- Ball position tracks with match events
- Player tokens show jersey numbers
- Card and injury indicators on players

### Commentary System
Live commentary generates contextual descriptions for:
- Goals with shot type descriptions
- Saves and misses
- Fouls and cards
- Injuries
- Phase changes (kickoff, half-time, full-time)

### Manager Notes
AI-generated tactical notes based on match situation:
- Winning: Focus on maintaining shape
- Losing: Push forward, take risks
- Drawing: Stay patient, look for opportunities

## File Structure

```
src/
├── engine/
│   ├── matchEngine.js      # Core simulation logic
│   └── matchEvents.js      # Commentary and event generation
├── context/
│   └── MatchContext.jsx    # Match state management
├── components/
│   └── match/
│       ├── MatchPage.jsx       # Main match view
│       ├── MatchPitch.jsx      # Visual pitch display
│       ├── MatchScoreboard.jsx # Score and stats
│       ├── MatchCommentary.jsx # Live commentary feed
│       └── MatchControls.jsx   # Playback and substitutions
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

## Multiplayer Setup (Optional)

The multiplayer feature allows 3 friends to each control one team (Real Madrid, Barcelona, or Bayern Munich) while 7 teams remain AI-controlled.

### Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign up for a free account
2. Click "New Project"
3. Choose an organization (or create one)
4. Enter a project name (e.g., "super-league-auction")
5. Set a database password (save this somewhere safe)
6. Select a region closest to you
7. Click "Create new project" and wait for setup to complete

### Step 2: Run the Database Schema

1. In your Supabase project dashboard, click "SQL Editor" in the left sidebar
2. Click "New query"
3. Copy the entire contents of `supabase-setup.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" to execute the SQL
6. You should see "Success" messages for each table and policy created

The schema creates:
- `rooms` table: Stores game rooms with their state
- `room_players` table: Tracks players in each room
- Row Level Security policies for data protection

### Step 3: Get Your API Credentials

1. In Supabase dashboard, click "Settings" (gear icon) in the left sidebar
2. Click "API" under "Project Settings"
3. You'll see two important values:
   - **Project URL**: Something like `https://abcdefghij.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`

### Step 4: Configure Environment Variables

For local development:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and fill in your values:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 5: Deploy to Vercel (Production)

1. Push your code to a GitHub repository
2. Go to https://vercel.com and sign in with GitHub
3. Click "Add New" > "Project"
4. Import your GitHub repository
5. In the "Environment Variables" section, add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click "Deploy"

### Step 6: Configure Supabase URL Whitelist

1. In Supabase dashboard, go to "Authentication" > "URL Configuration"
2. Add your Vercel deployment URL to "Redirect URLs":
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/**`
3. Also add `http://localhost:5173` for local development

### How Multiplayer Works

1. **Create Room**: One player creates a room and gets a 6-character code
2. **Join Room**: Other players enter the code to join
3. **Claim Teams**: Each player claims one of the 3 user-controlled teams
4. **Ready Up**: All players mark themselves ready
5. **Start Game**: Host starts the auction
6. **Real-time Sync**: All actions sync instantly via Supabase Realtime

The host's browser acts as the authoritative source for game state and AI decisions

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase** - Real-time multiplayer (optional)

## Usage

### Single Player Auction
1. Start the app
2. Click "Start Single Player"
3. Complete retention phase for all teams
4. Bid on players in auction phase
5. After auction completes, click "Simulate Match"

### Match Simulation
1. Select home and away teams (must have 11+ players)
2. Click "Start Match"
3. Use controls to pause/resume and adjust speed
4. Make substitutions while paused
5. Change formations while paused
6. Watch live commentary and manager notes

## License

MIT
