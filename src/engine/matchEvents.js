/**
 * Match Events and Commentary System
 * Generates live commentary, manager notes, and match insights
 */

// Commentary templates for different match situations
export const COMMENTARY_TEMPLATES = {
  kickoff: [
    "And we're underway! {homeTeam} kick off against {awayTeam}!",
    "The referee blows the whistle and the match begins!",
    "Here we go! An exciting clash between {homeTeam} and {awayTeam}!",
  ],
  halfTime: [
    "The referee blows for half-time. {homeTeam} {homeScore} - {awayScore} {awayTeam}",
    "That's the break! We go into half-time with {homeTeam} {homeScore} - {awayScore} {awayTeam}",
    "Half-time here. Plenty to discuss for both managers.",
  ],
  secondHalf: [
    "The second half is underway!",
    "Back we go for the second 45 minutes!",
    "The teams are back out. Let's see what the second half brings!",
  ],
  fullTime: [
    "FULL TIME! {homeTeam} {homeScore} - {awayScore} {awayTeam}",
    "It's all over! The final score: {homeTeam} {homeScore} - {awayScore} {awayTeam}",
    "The referee ends the match. What a game!",
  ],
  substitution: [
    "{playerOut} makes way for {playerIn}. Tactical change by the manager.",
    "Substitution for {team}: {playerIn} replaces {playerOut}",
    "{playerOut} is coming off, {playerIn} coming on for {team}",
  ],
  injurySubstitution: [
    "Forced change as {playerOut} can't continue. {playerIn} comes on.",
    "{playerOut} is stretchered off. {playerIn} replaces the injured player.",
    "Unfortunately {playerOut} has to go off injured. {playerIn} on.",
  ],
  nearMiss: [
    "So close! That was nearly a goal!",
    "Agonizingly close! The crossbar saves {team}!",
    "What a chance! {player} will be disappointed not to score there.",
  ],
  pressure: [
    "{team} are really piling on the pressure now!",
    "Wave after wave of attacks from {team}!",
    "{team} dominating possession in this spell.",
  ],
  counterAttack: [
    "{team} break quickly on the counter!",
    "A rapid counter-attack from {team}!",
    "{team} catch the opposition out with a quick break!",
  ],
};

// Manager notes templates
export const MANAGER_NOTES = {
  winning: [
    "Keep the shape, don't get complacent!",
    "Control the tempo, no need to rush.",
    "Solid defensive work, let's maintain this lead.",
    "Good pressing, keep them under pressure.",
  ],
  losing: [
    "We need to push forward, take more risks!",
    "Get the ball wide, stretch their defense!",
    "More urgency in the final third!",
    "Consider a tactical switch to get back in this.",
  ],
  drawing: [
    "Stay patient, the chance will come.",
    "Keep probing, look for the opening.",
    "Good balance, but we need that breakthrough.",
    "Maintain discipline, don't force it.",
  ],
  injury: [
    "Check on the bench options for that position.",
    "We may need to adjust formation to cover.",
    "Get the physio's assessment on the severity.",
  ],
  yellowCard: [
    "Tell {player} to be careful, one more and they're off.",
    "Adjust the marking, we can't afford another booking.",
  ],
  redCard: [
    "Reorganize! We need to be compact with 10 men.",
    "Drop deeper and stay organized.",
    "Protect what we have, don't overcommit.",
  ],
  substitutionAdvice: [
    "Consider fresh legs in midfield.",
    "An attacking change could unlock this.",
    "Shore up the defense with a substitution.",
    "Time for a tactical change.",
  ],
  halftimeAdvice: [
    "Good first half, let's build on this.",
    "We need to improve in the second half.",
    "Adjustments needed at the break.",
    "Keep doing what we're doing.",
  ],
};

/**
 * Generate commentary for a specific event
 */
export function generateEventCommentary(event) {
  if (!event.description) return null;

  const commentary = {
    minute: event.minute,
    text: event.description,
    type: event.type,
    isGoal: event.goal,
    isCard: !!event.card,
    isInjury: !!event.injury,
    importance: getEventImportance(event),
  };

  return commentary;
}

/**
 * Get event importance for highlighting
 */
function getEventImportance(event) {
  if (event.goal) return 'critical';
  if (event.card === 'red') return 'critical';
  if (event.card === 'yellow') return 'high';
  if (event.injury?.severity === 'serious') return 'high';
  if (event.type === 'shot') return 'medium';
  if (event.type === 'attack') return 'low';
  return 'minimal';
}

/**
 * Generate manager note based on match situation
 */
export function generateManagerNote(matchState, isHome = true) {
  const myScore = isHome ? matchState.homeScore : matchState.awayScore;
  const oppScore = isHome ? matchState.awayScore : matchState.homeScore;

  let situation;
  if (myScore > oppScore) {
    situation = 'winning';
  } else if (myScore < oppScore) {
    situation = 'losing';
  } else {
    situation = 'drawing';
  }

  const notes = MANAGER_NOTES[situation];
  return notes[Math.floor(Math.random() * notes.length)];
}

/**
 * Generate phase commentary (kickoff, half-time, etc.)
 */
export function generatePhaseCommentary(phase, matchState) {
  const templates = COMMENTARY_TEMPLATES[phase];
  if (!templates) return null;

  const template = templates[Math.floor(Math.random() * templates.length)];
  return template
    .replace('{homeTeam}', matchState.homeTeam?.name || 'Home')
    .replace('{awayTeam}', matchState.awayTeam?.name || 'Away')
    .replace('{homeScore}', matchState.homeScore)
    .replace('{awayScore}', matchState.awayScore);
}

/**
 * Generate substitution commentary
 */
export function generateSubstitutionCommentary(playerOut, playerIn, team, isInjury = false) {
  const templates = isInjury
    ? COMMENTARY_TEMPLATES.injurySubstitution
    : COMMENTARY_TEMPLATES.substitution;

  const template = templates[Math.floor(Math.random() * templates.length)];
  return template
    .replace('{playerOut}', playerOut.name)
    .replace('{playerIn}', playerIn.name)
    .replace('{team}', team.name);
}

/**
 * Get match summary at any point
 */
export function getMatchSummary(matchState) {
  const homeGoals = matchState.events.filter(e => e.goal && e.team === 'home');
  const awayGoals = matchState.events.filter(e => e.goal && e.team === 'away');

  return {
    score: `${matchState.homeTeam?.name} ${matchState.homeScore} - ${matchState.awayScore} ${matchState.awayTeam?.name}`,
    minute: matchState.minute,
    phase: matchState.phase,
    homeGoalScorers: homeGoals.map(e => `${e.player?.name} ${e.minute}'`),
    awayGoalScorers: awayGoals.map(e => `${e.player?.name} ${e.minute}'`),
    stats: {
      possession: matchState.possession,
      shots: matchState.shots,
      shotsOnTarget: matchState.shotsOnTarget,
      fouls: matchState.fouls,
    },
  };
}

/**
 * Get key events from match
 */
export function getKeyEvents(matchState) {
  return matchState.events.filter(e => {
    return e.goal || e.card || (e.injury?.severity === 'serious');
  });
}

/**
 * Generate half-time analysis
 */
export function generateHalfTimeAnalysis(matchState, isHome = true) {
  const myScore = isHome ? matchState.homeScore : matchState.awayScore;
  const oppScore = isHome ? matchState.awayScore : matchState.homeScore;
  const myPossession = isHome ? matchState.possession.home : matchState.possession.away;
  const myShots = isHome ? matchState.shots.home : matchState.shots.away;

  const analysis = [];

  if (myScore > oppScore) {
    analysis.push("Leading at the break - maintain concentration.");
  } else if (myScore < oppScore) {
    analysis.push("Behind at half-time - need to respond.");
  } else {
    analysis.push("All square - everything to play for.");
  }

  if (myPossession > 55) {
    analysis.push("Dominating possession - create more clear chances.");
  } else if (myPossession < 45) {
    analysis.push("Need to keep the ball better in the second half.");
  }

  if (myShots < 3) {
    analysis.push("Not enough shots on goal - be more clinical.");
  }

  return analysis;
}

/**
 * Get live ticker entries for display
 */
export function getLiveTickerEntries(matchState, lastN = 5) {
  const entries = [];

  // Add phase events
  if (matchState.phase === 'first-half' && matchState.minute === 1) {
    entries.push({
      minute: 0,
      text: generatePhaseCommentary('kickoff', matchState),
      type: 'phase',
    });
  }

  // Add recent events
  const recentEvents = matchState.events.slice(-lastN);
  recentEvents.forEach(event => {
    if (event.description) {
      entries.push({
        minute: event.minute,
        text: event.description,
        type: event.type,
        isGoal: event.goal,
        isCard: !!event.card,
      });
    }
  });

  return entries;
}

/**
 * Determine if a critical moment is happening
 */
export function isCriticalMoment(matchState) {
  const minute = matchState.minute;
  const scoreDiff = Math.abs(matchState.homeScore - matchState.awayScore);

  // Last 5 minutes with close score
  if (minute > 85 && scoreDiff <= 1) return true;

  // Added time
  if (minute > 90) return true;

  // Just after a goal
  const lastEvent = matchState.events[matchState.events.length - 1];
  if (lastEvent?.goal) return true;

  return false;
}
