# DRONATRIX 2026 — Competition Leaderboard

Professional esports-style leaderboard system for DRONATRIX 2026 drone racing competition.

## Features

### 4 Tab System

#### 1. Live Action Tab
- **Control Center** for running the competition in real-time
- Shows current round, current team flying, and progress
- Form to input pilot selection, mode declaration, and time
- Displays reference times and target requirements
- Shows what's at stake (points for success/fail)
- Team queue showing who's completed and who's waiting
- Auto-advances to next team after submission

#### 2. Time Tab
- Pure time leaderboards for all 4 rounds
- Shows fastest times with gold/silver/bronze ranks
- Displays pilot names for each flight
- Highlights Round 1 & Round 3 fastest bonuses (+20/+30 pts)

#### 3. Score Tab
- Final standings ranked by total points
- Top 3 highlighted (gold/silver/bronze styling)
- Shows point breakdown per round (R1, R2, R3, R4)
- Displays total points with animated updates
- Competition statistics (max possible, current leader, completion status)

#### 4. Mode Tab
- Declaration tracker for Round 2 & Round 4
- Shows which mode each team declared
- Success/Fail status with visual indicators
- Points earned/lost per declaration
- Rival matchups and penalties
- Mode reference guide

## Competition Rules Implementation

### Round 1 — The Opener
- Time trial (no points)
- Fastest team gets +20 bonus points

### Round 2 — The Declaration
- Must use different pilot than Round 1
- Choose mode before flying:
  - **Safe**: Beat R1 time → +10 pts | Fail → 0 pts
  - **Risky**: Beat R1 by 10s → +20 pts | Fail → -10 pts
  - **All In**: Beat fastest R1 → +30 pts | Fail → -20 pts
- Round 1 fastest cannot declare All In

### Round 3 — Pure Time
- Time trial (no points)
- Fastest team gets +30 bonus points

### Round 4 — Rival Declaration
- Must use different pilot than Round 3
- Choose mode before flying:
  - **Safe**: Beat R3 by 5s → +15 pts | Fail → -10 pts
  - **Challenge**: Beat rival's R3 → +30 pts | Fail → -15 pts (rival loses -10 if you succeed)
  - **Blood Match**: Beat R3 fastest → +50 pts | Fail → -30 pts (R3 #1 loses -20 if you succeed)
- Round 3 fastest cannot declare Blood Match

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling (professional dark theme, no gradients)
- **Framer Motion** - Smooth animations
- **LocalStorage** - Data persistence

## Installation

```bash
cd dronatrix-leaderboard
npm install
npm run dev
```

Open http://localhost:5173

## Usage

1. Start at **Live Action** tab
2. For each team in Round 1:
   - Select pilot
   - Enter time in seconds (e.g., 125.45)
   - Click "Submit & Next Team"
3. After all 8 teams complete Round 1, click "Start Round 2"
4. For Round 2, each team:
   - System auto-selects available pilot (other member)
   - Choose mode (Safe/Risky/All In)
   - Enter time
   - Submit
5. Repeat for Rounds 3 & 4
6. Check **Score** tab for final standings

## Features

- Real-time scoring calculation
- Automatic validation (pilot rotation, mode restrictions)
- Data persists in browser (refresh-safe)
- Responsive design
- Professional esports aesthetic
- Smooth animations on rank changes

## Data Management

- **Reset Competition**: Button in header clears all data
- **Auto-save**: Every change saved to localStorage
- **Edit**: Navigate back in Live Action to previous teams

## Project Structure

```
src/
├── components/
│   ├── LiveAction.jsx      # Control center
│   ├── TimeLeaderboard.jsx # Time rankings
│   ├── ScoreLeaderboard.jsx # Score rankings
│   ├── ModeLeaderboard.jsx  # Mode declarations
├── hooks/
│   └── useLeaderboard.js    # State management
├── utils/
│   └── scoring.js           # Scoring engine
├── data/
│   └── initialData.js       # Team data & rules
└── App.jsx                  # Main app
```

## Customization

Edit team names in [src/data/initialData.js](src/data/initialData.js):

```javascript
export const INITIAL_TEAMS = [
  { id: 1, name: 'Your Team Name', members: ['Pilot 1', 'Pilot 2'] },
  // ... 8 teams total
];
```

## Build for Production

```bash
npm run build
npm run preview
```

## License

MIT
