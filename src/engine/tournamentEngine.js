// Tournament Engine - Manages Super League tournament structure

const BIG_THREE = ['real-madrid', 'barcelona', 'bayern'];

// Check if match involves a big 3 team
export function isBigThreeMatch(homeId, awayId) {
  return BIG_THREE.includes(homeId) || BIG_THREE.includes(awayId);
}

// Divide teams into two groups (5 teams each)
export function createGroups(teams) {
  // Shuffle teams
  const shuffled = [...teams].sort(() => Math.random() - 0.5);

  // Try to distribute big 3 across groups
  const big3Teams = shuffled.filter(t => BIG_THREE.includes(t.id));
  const otherTeams = shuffled.filter(t => !BIG_THREE.includes(t.id));

  const groupA = [];
  const groupB = [];

  // Distribute big 3 (at least 1 in each group if possible)
  big3Teams.forEach((team, i) => {
    if (i % 2 === 0) groupA.push(team);
    else groupB.push(team);
  });

  // Fill remaining spots to get 5 per group
  otherTeams.forEach(team => {
    if (groupA.length < 5) groupA.push(team);
    else if (groupB.length < 5) groupB.push(team);
  });

  return { groupA, groupB };
}

// Generate group stage fixtures (home and away for each pairing)
export function generateGroupFixtures(group) {
  const fixtures = [];

  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      // Home and away
      fixtures.push({ home: group[i], away: group[j] });
      fixtures.push({ home: group[j], away: group[i] });
    }
  }

  return fixtures;
}

// Organize fixtures into 8 match days
// Each match day has 5 matches (2-3 from each group)
export function organizeIntoMatchDays(fixturesA, fixturesB) {
  // With 5 teams per group:
  // - Each team plays 4 opponents home + 4 away = 8 matches
  // - Total per group: 5 teams × 8 matches / 2 = 20 matches
  // - Total both groups: 40 matches
  // - 8 match days = 5 matches per day

  const matchDays = [];

  // Clone and shuffle fixtures
  const availableA = [...fixturesA].sort(() => Math.random() - 0.5);
  const availableB = [...fixturesB].sort(() => Math.random() - 0.5);

  // Track which teams play on each day to avoid conflicts
  for (let day = 0; day < 8; day++) {
    const dayFixtures = [];
    const teamsPlayingToday = new Set();

    // Try to get 2-3 matches from Group A
    let groupAMatches = 0;
    for (let i = 0; i < availableA.length && groupAMatches < 3 && dayFixtures.length < 5; i++) {
      const fixture = availableA[i];
      const homeId = fixture.home.id;
      const awayId = fixture.away.id;

      if (!teamsPlayingToday.has(homeId) && !teamsPlayingToday.has(awayId)) {
        dayFixtures.push({ ...fixture, group: 'A' });
        teamsPlayingToday.add(homeId);
        teamsPlayingToday.add(awayId);
        availableA.splice(i, 1);
        i--;
        groupAMatches++;
      }
    }

    // Fill remaining with Group B matches
    for (let i = 0; i < availableB.length && dayFixtures.length < 5; i++) {
      const fixture = availableB[i];
      const homeId = fixture.home.id;
      const awayId = fixture.away.id;

      if (!teamsPlayingToday.has(homeId) && !teamsPlayingToday.has(awayId)) {
        dayFixtures.push({ ...fixture, group: 'B' });
        teamsPlayingToday.add(homeId);
        teamsPlayingToday.add(awayId);
        availableB.splice(i, 1);
        i--;
      }
    }

    matchDays.push(dayFixtures);
  }

  // Any remaining fixtures - must check team conflicts
  const allRemaining = [
    ...availableA.map(f => ({ ...f, group: 'A' })),
    ...availableB.map(f => ({ ...f, group: 'B' })),
  ];

  for (const fixture of allRemaining) {
    let placed = false;
    for (const day of matchDays) {
      // Check if either team is already playing this day
      const teamsInDay = new Set();
      day.forEach(f => {
        teamsInDay.add(f.home.id);
        teamsInDay.add(f.away.id);
      });

      if (!teamsInDay.has(fixture.home.id) && !teamsInDay.has(fixture.away.id)) {
        day.push(fixture);
        placed = true;
        break;
      }
    }

    // If couldn't place, create overflow day
    if (!placed) {
      matchDays.push([fixture]);
    }
  }

  return matchDays;
}

// Get match day fixtures with Big 3 markers
export function getMatchDayFixtures(matchDay, allMatchDays) {
  const fixtures = allMatchDays[matchDay - 1] || [];

  return fixtures.map(fixture => ({
    ...fixture,
    isBigThree: isBigThreeMatch(fixture.home.id, fixture.away.id),
  }));
}

// Calculate standings from results
export function calculateStandings(teams, results) {
  const standings = {};

  // Initialize
  teams.forEach(team => {
    standings[team.id] = {
      team: team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  });

  // Process results
  results.forEach(result => {
    const home = standings[result.homeTeam];
    const away = standings[result.awayTeam];

    if (!home || !away) return;

    home.played++;
    away.played++;

    home.goalsFor += result.homeGoals;
    home.goalsAgainst += result.awayGoals;
    away.goalsFor += result.awayGoals;
    away.goalsAgainst += result.homeGoals;

    if (result.homeGoals > result.awayGoals) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (result.awayGoals > result.homeGoals) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  });

  // Sort by points, then GD, then GF
  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
}

// Generate knockout fixtures (top 4 from each group)
export function generateKnockoutFixtures(standingsA, standingsB) {
  // Top 4 from each group
  const qualifiersA = standingsA.slice(0, 4);
  const qualifiersB = standingsB.slice(0, 4);

  // Quarter finals: A1 vs B4, A2 vs B3, B1 vs A4, B2 vs A3 (cross-group matchups)
  const quarterFinals = [
    { home: qualifiersA[0].team, away: qualifiersB[3].team, id: 'QF1' },
    { home: qualifiersA[1].team, away: qualifiersB[2].team, id: 'QF2' },
    { home: qualifiersB[0].team, away: qualifiersA[3].team, id: 'QF3' },
    { home: qualifiersB[1].team, away: qualifiersA[2].team, id: 'QF4' },
  ];

  return { quarterFinals, qualifiersA, qualifiersB };
}

// Generate semi-final fixtures from QF winners
export function generateSemiFinalFixtures(qfWinners) {
  return [
    { home: qfWinners[0], away: qfWinners[1], id: 'SF1' },
    { home: qfWinners[2], away: qfWinners[3], id: 'SF2' },
  ];
}

// Generate final fixture from SF winners
export function generateFinalFixture(sfWinners) {
  return { home: sfWinners[0], away: sfWinners[1], id: 'FINAL' };
}

// Determine two-leg knockout winner
export function determineKnockoutWinner(leg1Result, leg2Result, homeTeam, awayTeam) {
  const aggregateHome = leg1Result.homeGoals + leg2Result.awayGoals;
  const aggregateAway = leg1Result.awayGoals + leg2Result.homeGoals;

  if (aggregateHome > aggregateAway) {
    return { winner: homeTeam, aggregate: [aggregateHome, aggregateAway] };
  } else if (aggregateAway > aggregateHome) {
    return { winner: awayTeam, aggregate: [aggregateHome, aggregateAway] };
  } else {
    // Away goals rule
    const awayGoalsHome = leg2Result.awayGoals; // Away team's away goals
    const awayGoalsAway = leg1Result.awayGoals; // Home team's away goals

    if (awayGoalsHome > awayGoalsAway) {
      return { winner: awayTeam, aggregate: [aggregateHome, aggregateAway], awayGoals: true };
    } else if (awayGoalsAway > awayGoalsHome) {
      return { winner: homeTeam, aggregate: [aggregateHome, aggregateAway], awayGoals: true };
    } else {
      // Penalties
      const penaltyWinner = Math.random() < 0.5 ? homeTeam : awayTeam;
      return { winner: penaltyWinner, aggregate: [aggregateHome, aggregateAway], penalties: true };
    }
  }
}

export { BIG_THREE };
