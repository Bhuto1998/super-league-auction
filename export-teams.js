// Run this in the browser console or as a module to export team data
// Or run: node export-teams.js (after copying localStorage data)

const fs = require('fs');

// Read the saved state from a JSON file (copy from localStorage)
// To get this data: In browser console, run: copy(localStorage.getItem('super-league-auction-s3-v2'))
// Then paste into state.json file

const STORAGE_KEY = 'super-league-auction-s3-v2';

// Check if we have a state.json file
let state;
try {
  const stateData = fs.readFileSync('./state.json', 'utf8');
  state = JSON.parse(stateData);
} catch (e) {
  console.log('No state.json found. Please follow these steps:');
  console.log('1. Open the app in browser (http://localhost:5174)');
  console.log('2. Open browser console (F12 -> Console)');
  console.log('3. Run: copy(localStorage.getItem("super-league-auction-s3-v2"))');
  console.log('4. Create state.json file and paste the content');
  console.log('5. Run this script again');
  process.exit(1);
}

// Generate CSV
const rows = [['Team', 'Manager', 'Player', 'Position', 'Rating', 'Nationality', 'Club', 'Type', 'Price (€M)']];

state.teams.forEach(team => {
  // Add retained players (Big 3 only)
  if (team.retainedPlayers && team.retainedPlayers.length > 0) {
    team.retainedPlayers.forEach(player => {
      rows.push([
        team.name,
        team.manager,
        player.name,
        player.position,
        player.rating,
        player.nationality,
        player.club || '-',
        'Retained',
        (player.retentionPrice || player.season2Price || 0) / 1000000
      ]);
    });
  }

  // Add auctioned players
  if (team.auctionedPlayers && team.auctionedPlayers.length > 0) {
    team.auctionedPlayers.forEach(player => {
      rows.push([
        team.name,
        team.manager,
        player.name,
        player.position,
        player.rating,
        player.nationality,
        player.club || '-',
        'Auctioned',
        (player.purchasePrice || 0) / 1000000
      ]);
    });
  }
});

// Add team summary rows
rows.push([]);
rows.push(['=== TEAM SUMMARY ===']);
rows.push(['Team', 'Manager', 'Total Players', 'Budget Remaining (€M)', 'Budget Spent (€M)']);
state.teams.forEach(team => {
  const totalPlayers = (team.retainedPlayers?.length || 0) + (team.auctionedPlayers?.length || 0);
  const budgetRemaining = team.remainingBudget / 1000000;
  const budgetSpent = (team.budget - team.remainingBudget) / 1000000;
  rows.push([team.name, team.manager, totalPlayers, budgetRemaining, budgetSpent]);
});

// Convert to CSV string
const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

// Write to file
const outputPath = './super-league-teams-export.csv';
fs.writeFileSync(outputPath, csv);
console.log(`CSV exported to: ${outputPath}`);
console.log(`Total rows: ${rows.length}`);
