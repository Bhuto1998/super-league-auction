import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getBestFormation,
  selectStartingEleven,
  updatePlayerStamina,
  suggestSubstitution,
  executeSubstitution,
  initializePlayersForMatch,
  simulateMatch,
  simulateKnockoutMatch,
  calculateAttackStrength,
  calculateDefenseStrength,
  calculateMidfieldStrength,
  calculateTeamStrength,
  MATCH_DURATION,
  REAL_TIME_DURATION,
  SUBSTITUTION,
  EXTRA_TIME,
} from '../../engine/matchEngine';
import {
  getFabrizioComment,
  getHalftimeComment,
  getFulltimeComment,
  getManagerQuote,
  getPreMatchHype,
  getExtraTimeStartComment,
  getExtraTimeHalftimeComment,
  getExtraTimeEndComment,
  getPenaltiesStartComment,
  getPenaltyScoredComment,
  getPenaltyMissedComment,
  getPenaltyWinnerComment,
  getFabrizioPostMatchComment,
} from '../../engine/commentary';

// Formation positions on pitch (percentage based) - carrom board style
const FORMATION_POSITIONS = {
  '4-3-3': {
    GK: [{ x: 8, y: 50 }],
    DEF: [{ x: 22, y: 12 }, { x: 20, y: 37 }, { x: 20, y: 63 }, { x: 22, y: 88 }],
    MID: [{ x: 42, y: 25 }, { x: 38, y: 50 }, { x: 42, y: 75 }],
    FWD: [{ x: 68, y: 18 }, { x: 75, y: 50 }, { x: 68, y: 82 }],
  },
  '4-4-2': {
    GK: [{ x: 8, y: 50 }],
    DEF: [{ x: 22, y: 12 }, { x: 20, y: 37 }, { x: 20, y: 63 }, { x: 22, y: 88 }],
    MID: [{ x: 42, y: 12 }, { x: 40, y: 37 }, { x: 40, y: 63 }, { x: 42, y: 88 }],
    FWD: [{ x: 70, y: 35 }, { x: 70, y: 65 }],
  },
  '3-5-2': {
    GK: [{ x: 8, y: 50 }],
    DEF: [{ x: 20, y: 25 }, { x: 18, y: 50 }, { x: 20, y: 75 }],
    MID: [{ x: 38, y: 8 }, { x: 40, y: 30 }, { x: 36, y: 50 }, { x: 40, y: 70 }, { x: 38, y: 92 }],
    FWD: [{ x: 70, y: 35 }, { x: 70, y: 65 }],
  },
};

function getPositionCategory(position) {
  if (!position) return 'MID';
  const pos = position.toUpperCase();
  if (pos.includes('GK')) return 'GK';
  if (pos.includes('CB') || pos.includes('LB') || pos.includes('RB') || pos.includes('DEF')) return 'DEF';
  if (pos.includes('ST') || pos.includes('CF') || pos.includes('LW') || pos.includes('RW') || pos.includes('FWD')) return 'FWD';
  return 'MID';
}

export default function LiveMatchSimulator({
  homeTeam,
  awayTeam,
  onComplete,
  isKnockout = false,
  firstLegResult = null,
  leg1Result = null, // For two-legged ties, leg 1 result
  isNeutral = false, // For finals at neutral venue
  leg = 1, // Current leg (1 or 2)
  isTwoLegged = false, // Whether this is a two-legged tie
}) {
  const [phase, setPhase] = useState('prematch');
  const [minute, setMinute] = useState(0);
  const [events, setEvents] = useState([]);
  const [commentary, setCommentary] = useState([]);
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [matchResult, setMatchResult] = useState(null);
  const [managerQuotes, setManagerQuotes] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [isSkipping, setIsSkipping] = useState(false);

  // Player state with stamina
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [homeBench, setHomeBench] = useState([]);
  const [awayBench, setAwayBench] = useState([]);
  const [homeSubs, setHomeSubs] = useState(0);
  const [awaySubs, setAwaySubs] = useState(0);
  const [, setPendingSub] = useState(null);

  // Manager tactical notes
  const [tacticalNotes, setTacticalNotes] = useState([]);

  // Fabrizio post-match press comment
  const [fabrizioComment, setFabrizioComment] = useState(null);

  // Extra time and penalties state
  const [extraTimeEvents, setExtraTimeEvents] = useState([]);
  const [penaltyShootout, setPenaltyShootout] = useState(null);
  const [currentPenaltyIndex, setCurrentPenaltyIndex] = useState(0);

  // Popup notification state for goals and red cards
  const [popup, setPopup] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // Team ratings for display
  const [teamRatings, setTeamRatings] = useState({ home: null, away: null });

  const commentaryRef = useRef(null);
  const intervalRef = useRef(null);
  const speedRef = useRef(speed); // Ref to track speed for intervals
  const pausedRef = useRef(false); // Track paused state for intervals

  // Keep speedRef in sync with speed state
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Keep pausedRef in sync
  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  // Show popup notification - pauses match for goals
  const showPopup = useCallback((type, data) => {
    setPopup({ type, data, id: Date.now() });
    if (type === 'goal') {
      setIsPaused(true); // Pause match for goals - user must acknowledge
    } else {
      // Auto-dismiss red cards after delay
      setTimeout(() => setPopup(null), 3500 / speedRef.current);
    }
  }, []);

  // Dismiss popup and resume match
  const dismissPopup = useCallback(() => {
    setPopup(null);
    setIsPaused(false);
  }, []);

  const addCommentary = useCallback((min, text, type = 'normal') => {
    setCommentary(prev => [...prev, { minute: min, text, type, id: Date.now() + Math.random() }]);
  }, []);

  const addTacticalNote = useCallback((phase, note) => {
    setTacticalNotes(prev => [...prev, { phase, note, id: Date.now() + Math.random() }]);
  }, []);

  // Initialize match on mount
  useEffect(() => {
    // Reset extra time and penalty states for new match
    setExtraTimeEvents([]);
    setPenaltyShootout(null);

    // Build players array from retainedPlayers + auctionedPlayers if not present
    const buildPlayersArray = (team) => {
      if (team.players && team.players.length > 0) {
        return team.players;
      }
      return [...(team.retainedPlayers || []), ...(team.auctionedPlayers || [])];
    };

    const homeAllPlayers = buildPlayersArray(homeTeam);
    const awayAllPlayers = buildPlayersArray(awayTeam);

    // Create team objects with guaranteed players array for simulation
    const homeTeamWithPlayers = { ...homeTeam, players: homeAllPlayers };
    const awayTeamWithPlayers = { ...awayTeam, players: awayAllPlayers };

    const homeFormation = getBestFormation(homeAllPlayers);
    const awayFormation = getBestFormation(awayAllPlayers);

    const homeEleven = selectStartingEleven(homeAllPlayers, homeFormation);
    const awayEleven = selectStartingEleven(awayAllPlayers, awayFormation);

    // Initialize with stamina
    setHomePlayers(initializePlayersForMatch(homeEleven));
    setAwayPlayers(initializePlayersForMatch(awayEleven));

    // Calculate team ratings for display
    // If neutral venue (final), neither team has home advantage
    const homeRatings = {
      overall: Math.round(calculateTeamStrength(homeEleven, { isHome: !isNeutral }).total),
      attack: Math.round(calculateAttackStrength(homeEleven)),
      midfield: Math.round(calculateMidfieldStrength(homeEleven)),
      defense: Math.round(calculateDefenseStrength(homeEleven)),
      formation: homeFormation,
      players: homeEleven,
    };
    const awayRatings = {
      overall: Math.round(calculateTeamStrength(awayEleven, { isHome: false }).total),
      attack: Math.round(calculateAttackStrength(awayEleven)),
      midfield: Math.round(calculateMidfieldStrength(awayEleven)),
      defense: Math.round(calculateDefenseStrength(awayEleven)),
      formation: awayFormation,
      players: awayEleven,
    };
    setTeamRatings({ home: homeRatings, away: awayRatings });

    // Set bench (remaining players)
    const homeBenchPlayers = homeAllPlayers.filter(p => !homeEleven.find(e => e.id === p.id));
    const awayBenchPlayers = awayAllPlayers.filter(p => !awayEleven.find(e => e.id === p.id));
    setHomeBench(initializePlayersForMatch(homeBenchPlayers));
    setAwayBench(initializePlayersForMatch(awayBenchPlayers));

    // Simulate the match to get events (use teams with guaranteed players)
    let result;
    if (isKnockout) {
      // For knockout matches, use simulateKnockoutMatch which handles extra time and penalties
      // Final is single leg at neutral venue (goes to ET/pens if tied)
      // QF/SF are two-legged, but each leg is simulated separately
      const isFinal = isNeutral; // Neutral venue = final
      const effectiveFirstLegResult = leg1Result || firstLegResult;
      result = simulateKnockoutMatch(homeTeamWithPlayers, awayTeamWithPlayers, effectiveFirstLegResult, isFinal);
    } else {
      result = simulateMatch(homeTeamWithPlayers, awayTeamWithPlayers, isNeutral);
    }
    setMatchResult(result);
    setEvents(result.events || []);

    // If knockout match needs extra time, prepare extra time events
    if (result.extraTime) {
      setExtraTimeEvents(result.extraTime.events || []);
    }

    // If match went to penalties, prepare shootout data
    if (result.penalties) {
      setPenaltyShootout(result.penalties);
    }

    // Pre-match tactical notes
    addTacticalNote('pre', `${homeTeam.name} formation: ${homeFormation}`);
    addTacticalNote('pre', `${awayTeam.name} formation: ${awayFormation}`);
    addCommentary(0, getPreMatchHype(), 'hype');

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [homeTeam, awayTeam, isKnockout, firstLegResult, leg1Result, isNeutral, leg, isTwoLegged, addCommentary, addTacticalNote]);

  // Auto-scroll commentary
  useEffect(() => {
    if (commentaryRef.current) {
      commentaryRef.current.scrollTop = commentaryRef.current.scrollHeight;
    }
  }, [commentary]);

  // Start match
  const startMatch = () => {
    setPhase('firsthalf');
    addCommentary(0, "KICK OFF! Here we go! The match has begun!", 'phase');
    runMatch();
  };

  // Skip to final score
  const skipToFinalScore = () => {
    if (!matchResult) return;

    setIsSkipping(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Determine final score based on match result
    let finalHomeGoals = matchResult.homeGoals;
    let finalAwayGoals = matchResult.awayGoals;
    let finalMinute = 90;

    // Check if match went to extra time
    if (matchResult.extraTime) {
      finalHomeGoals = matchResult.homeGoalsAET;
      finalAwayGoals = matchResult.awayGoalsAET;
      finalMinute = 120;
    }

    setHomeGoals(finalHomeGoals);
    setAwayGoals(finalAwayGoals);
    setMinute(finalMinute);

    // Add goal commentary for regular time
    const goalEvents = events.filter(e => e.goal);
    goalEvents.forEach(event => {
      const fabComment = getFabrizioComment(
        { type: 'goal', player: event.player?.name || 'Unknown', team: event.team },
        homeTeam,
        awayTeam
      );
      if (fabComment) {
        addCommentary(event.minute, fabComment, 'goal');
      }
    });

    // Add extra time goal commentary if applicable
    if (matchResult.extraTime && matchResult.extraTime.events) {
      const etGoals = matchResult.extraTime.events.filter(e => e.goal);
      etGoals.forEach(event => {
        const fabComment = getFabrizioComment(
          { type: 'goal', player: event.player?.name || 'Unknown', team: event.team, dramatic: true },
          homeTeam,
          awayTeam
        );
        if (fabComment) {
          addCommentary(event.minute, `(ET) ${fabComment}`, 'goal');
        }
      });
    }

    // Handle penalties if match went to shootout
    if (matchResult.penalties) {
      addCommentary(120, "Match decided on penalties!", 'phase');
      addCommentary(120, getPenaltyWinnerComment(
        matchResult.penalties.winnerName,
        matchResult.penalties.homeScore,
        matchResult.penalties.awayScore
      ), 'goal');
      setPenaltyShootout(matchResult.penalties);
    }

    setTimeout(() => {
      setPhase('postmatch');
      const homeWon = matchResult.penalties
        ? matchResult.penalties.winner === homeTeam.id
        : finalHomeGoals > finalAwayGoals;
      const homeQuote = getManagerQuote(true, homeWon ? 1 : 0, homeWon ? 0 : 1, homeTeam.name, homeTeam.id);
      const awayQuote = getManagerQuote(false, !homeWon ? 1 : 0, !homeWon ? 0 : 1, awayTeam.name, awayTeam.id);
      setManagerQuotes({ home: homeQuote, away: awayQuote });
      // Fabrizio post-match comment
      const hadDrama = matchResult.penalties || matchResult.extraTime || false;
      setFabrizioComment(getFabrizioPostMatchComment(finalHomeGoals, finalAwayGoals, hadDrama));
      setIsSkipping(false);
    }, 500);
  };

  // Process substitution
  const processSubstitution = useCallback((team, sub) => {
    if (team === 'home' && homeSubs < SUBSTITUTION.MAX_SUBS) {
      const result = executeSubstitution(homePlayers, homeBench, sub.out, sub.in);
      setHomePlayers(result.onPitch);
      setHomeBench(result.bench);
      setHomeSubs(prev => prev + 1);
      addCommentary(minute, `SUBSTITUTION: ${sub.out.name} OFF, ${sub.in.name} ON for ${homeTeam.name}`, 'sub');
      addTacticalNote('match', `${homeTeam.name}: ${sub.reason} substitution - ${sub.in.name} replaces ${sub.out.name}`);
    } else if (team === 'away' && awaySubs < SUBSTITUTION.MAX_SUBS) {
      const result = executeSubstitution(awayPlayers, awayBench, sub.out, sub.in);
      setAwayPlayers(result.onPitch);
      setAwayBench(result.bench);
      setAwaySubs(prev => prev + 1);
      addCommentary(minute, `SUBSTITUTION: ${sub.out.name} OFF, ${sub.in.name} ON for ${awayTeam.name}`, 'sub');
      addTacticalNote('match', `${awayTeam.name}: ${sub.reason} substitution - ${sub.in.name} replaces ${sub.out.name}`);
    }
    setPendingSub(null);
  }, [homePlayers, awayPlayers, homeBench, awayBench, homeSubs, awaySubs, minute, homeTeam, awayTeam, addCommentary, addTacticalNote]);

  // Run the match simulation with dynamic speed support
  const runMatch = () => {
    let currentMinute = 0;
    let eventIndex = 0;
    let homeG = 0;
    let awayG = 0;

    // Base time per minute at 1x speed (in ms)
    const baseTickInterval = (REAL_TIME_DURATION / MATCH_DURATION) * 1000;
    let lastTickTime = Date.now();
    let accumulatedTime = 0;

    // Use a fast fixed interval and check speedRef for dynamic speed
    intervalRef.current = setInterval(() => {
      // Skip if paused (waiting for user to acknowledge goal)
      if (pausedRef.current) return;

      const now = Date.now();
      const deltaTime = now - lastTickTime;
      lastTickTime = now;

      // Accumulate time scaled by current speed
      accumulatedTime += deltaTime * speedRef.current;

      // Only advance when we've accumulated enough time for a minute
      if (accumulatedTime < baseTickInterval) return;
      accumulatedTime -= baseTickInterval;

      currentMinute += 1;
      setMinute(currentMinute);

      // Update stamina for all players
      setHomePlayers(prev => updatePlayerStamina(prev));
      setAwayPlayers(prev => updatePlayerStamina(prev));

      // Random ball movement
      setBallPosition({
        x: 30 + Math.random() * 40,
        y: 20 + Math.random() * 60,
      });

      // Automated substitutions (AI decision)
      if (currentMinute > 55 && currentMinute % 5 === 0) {
        // Check home team subs
        const homeSub = suggestSubstitution(homePlayers, homeBench, homeSubs, currentMinute);
        if (homeSub) {
          processSubstitution('home', homeSub);
        }
        // Check away team subs
        const awaySub = suggestSubstitution(awayPlayers, awayBench, awaySubs, currentMinute);
        if (awaySub) {
          processSubstitution('away', awaySub);
        }
      }

      // Process events
      while (eventIndex < events.length && events[eventIndex].minute <= currentMinute) {
        const event = events[eventIndex];

        if (event.goal) {
          if (event.team === 'home') {
            homeG++;
            setHomeGoals(homeG);
          } else {
            awayG++;
            setAwayGoals(awayG);
          }
          setBallPosition({ x: event.team === 'home' ? 95 : 5, y: 50 });

          // Show goal popup
          showPopup('goal', {
            scorer: event.player?.name || 'Unknown',
            team: event.team === 'home' ? homeTeam : awayTeam,
            minute: event.minute,
            homeScore: homeG,
            awayScore: awayG,
          });

          const fabComment = getFabrizioComment(
            { type: 'goal', player: event.player?.name || 'Unknown', team: event.team },
            homeTeam,
            awayTeam
          );
          if (fabComment) {
            addCommentary(event.minute, fabComment, 'goal');
          }
        } else if (event.card) {
          // Show red card popup
          if (event.card === 'red') {
            showPopup('redCard', {
              player: event.player?.name || 'Unknown',
              team: event.team === 'home' ? homeTeam : awayTeam,
              minute: event.minute,
            });
          }

          const fabComment = getFabrizioComment(
            { type: event.card === 'red' ? 'red_card' : 'yellow_card', player: event.player?.name || 'Unknown', team: event.team },
            homeTeam,
            awayTeam
          );
          if (fabComment) {
            addCommentary(event.minute, fabComment, event.card === 'red' ? 'red_card' : 'yellow_card');
          }
        } else if (event.injury) {
          addCommentary(event.minute, `Injury concern: ${event.player?.name || 'A player'} is down`, 'injury');
          if (event.requiresSubstitution) {
            addTacticalNote('match', `Forced substitution needed for injured ${event.player?.name}`);
          }
        }

        eventIndex++;
      }

      // Halftime
      if (currentMinute === 45) {
        setPhase('halftime');
        addCommentary(45, getHalftimeComment(), 'phase');
        addTacticalNote('halftime', `Score: ${homeTeam.shortName || homeTeam.name} ${homeG} - ${awayG} ${awayTeam.shortName || awayTeam.name}`);

        // Manager halftime notes
        if (homeG < awayG) {
          addTacticalNote('halftime', `${homeTeam.name} manager needs to find a response`);
        } else if (awayG < homeG) {
          addTacticalNote('halftime', `${awayTeam.name} manager will be making changes`);
        }

        clearInterval(intervalRef.current);

        setTimeout(() => {
          setPhase('secondhalf');
          addCommentary(45, "Second half begins! Here we go again!", 'phase');
          runSecondHalf(eventIndex, homeG, awayG);
        }, 2000 / speedRef.current);
        return;
      }

      if (currentMinute >= 90) {
        clearInterval(intervalRef.current);
        endMatch(homeG, awayG);
      }
    }, 50); // Fast fixed interval, speed controlled by accumulator
  };

  const runSecondHalf = (startEventIndex, homeG, awayG) => {
    let currentMinute = 45;
    let eventIndex = startEventIndex;

    const baseTickInterval = (REAL_TIME_DURATION / MATCH_DURATION) * 1000;
    let lastTickTime = Date.now();
    let accumulatedTime = 0;

    intervalRef.current = setInterval(() => {
      // Skip if paused
      if (pausedRef.current) return;

      const now = Date.now();
      const deltaTime = now - lastTickTime;
      lastTickTime = now;

      accumulatedTime += deltaTime * speedRef.current;
      if (accumulatedTime < baseTickInterval) return;
      accumulatedTime -= baseTickInterval;

      currentMinute += 1;
      setMinute(currentMinute);

      // Update stamina
      setHomePlayers(prev => updatePlayerStamina(prev));
      setAwayPlayers(prev => updatePlayerStamina(prev));

      setBallPosition({
        x: 30 + Math.random() * 40,
        y: 20 + Math.random() * 60,
      });

      // Automated substitutions in second half
      if (currentMinute > 55 && currentMinute % 5 === 0) {
        const homeSub = suggestSubstitution(homePlayers, homeBench, homeSubs, currentMinute);
        if (homeSub) {
          processSubstitution('home', homeSub);
        }
        const awaySub = suggestSubstitution(awayPlayers, awayBench, awaySubs, currentMinute);
        if (awaySub) {
          processSubstitution('away', awaySub);
        }
      }

      // Process events
      while (eventIndex < events.length && events[eventIndex].minute <= currentMinute) {
        const event = events[eventIndex];

        if (event.goal) {
          if (event.team === 'home') {
            homeG++;
            setHomeGoals(homeG);
          } else {
            awayG++;
            setAwayGoals(awayG);
          }
          setBallPosition({ x: event.team === 'home' ? 95 : 5, y: 50 });

          // Show goal popup
          showPopup('goal', {
            scorer: event.player?.name || 'Unknown',
            team: event.team === 'home' ? homeTeam : awayTeam,
            minute: event.minute,
            homeScore: homeG,
            awayScore: awayG,
          });

          const fabComment = getFabrizioComment(
            { type: 'goal', player: event.player?.name || 'Unknown', team: event.team },
            homeTeam,
            awayTeam
          );
          if (fabComment) {
            addCommentary(event.minute, fabComment, 'goal');
          }
        } else if (event.card) {
          // Show red card popup
          if (event.card === 'red') {
            showPopup('redCard', {
              player: event.player?.name || 'Unknown',
              team: event.team === 'home' ? homeTeam : awayTeam,
              minute: event.minute,
            });
          }

          const fabComment = getFabrizioComment(
            { type: event.card === 'red' ? 'red_card' : 'yellow_card', player: event.player?.name || 'Unknown', team: event.team },
            homeTeam,
            awayTeam
          );
          if (fabComment) {
            addCommentary(event.minute, fabComment, event.card === 'red' ? 'red_card' : 'yellow_card');
          }
        }

        eventIndex++;
      }

      if (currentMinute >= 93) {
        clearInterval(intervalRef.current);
        endMatch(homeG, awayG);
      }
    }, 50); // Fast fixed interval
  };

  const endMatch = (homeG, awayG) => {
    // Check if knockout match needs extra time
    const isTied = homeG === awayG;
    const isKnockoutDecider = isKnockout && (
      !firstLegResult || // Single leg (final)
      (firstLegResult && (homeG + firstLegResult.awayGoals) === (awayG + firstLegResult.homeGoals)) // Aggregate tied
    );

    if (isTied && isKnockoutDecider && matchResult?.extraTime) {
      // Go to extra time
      setPhase('fulltime');
      addCommentary(90, getFulltimeComment(homeTeam, awayTeam, homeG, awayG), 'phase');
      addCommentary(90, "It's all level! We're going to EXTRA TIME!", 'phase');
      addTacticalNote('fulltime', `Score after 90 mins: ${homeG} - ${awayG}. Extra time required!`);

      setTimeout(() => {
        setPhase('extratime_first');
        addCommentary(91, getExtraTimeStartComment(), 'phase');
        runExtraTime(homeG, awayG);
      }, 2000 / speedRef.current);
    } else {
      // Regular full time
      setPhase('fulltime');
      addCommentary(90, getFulltimeComment(homeTeam, awayTeam, homeG, awayG), 'phase');
      addTacticalNote('post', `Final Score: ${homeTeam.name} ${homeG} - ${awayG} ${awayTeam.name}`);
      addTacticalNote('post', `Substitutions - ${homeTeam.shortName}: ${homeSubs}, ${awayTeam.shortName}: ${awaySubs}`);

      setTimeout(() => {
        setPhase('postmatch');
        const homeQuote = getManagerQuote(true, homeG, awayG, homeTeam.name, homeTeam.id);
        const awayQuote = getManagerQuote(false, homeG, awayG, awayTeam.name, awayTeam.id);
        setManagerQuotes({ home: homeQuote, away: awayQuote });
        // Add Fabrizio post-match sarcastic comment
        const hadDrama = matchResult?.events?.some(e => e.minute > 85 && e.goal) || false;
        setFabrizioComment(getFabrizioPostMatchComment(homeG, awayG, hadDrama));
      }, 1500 / speedRef.current);
    }
  };

  // Run extra time simulation
  const runExtraTime = (regHomeGoals, regAwayGoals) => {
    let currentMinute = EXTRA_TIME.FIRST_HALF_START;
    let eventIndex = 0;
    let homeG = regHomeGoals;
    let awayG = regAwayGoals;

    const baseTickInterval = (REAL_TIME_DURATION / MATCH_DURATION) * 1000;
    let lastTickTime = Date.now();
    let accumulatedTime = 0;

    intervalRef.current = setInterval(() => {
      // Skip if paused
      if (pausedRef.current) return;

      const now = Date.now();
      const deltaTime = now - lastTickTime;
      lastTickTime = now;

      accumulatedTime += deltaTime * speedRef.current;
      if (accumulatedTime < baseTickInterval) return;
      accumulatedTime -= baseTickInterval;

      currentMinute += 1;
      setMinute(currentMinute);

      // Update stamina
      setHomePlayers(prev => updatePlayerStamina(prev));
      setAwayPlayers(prev => updatePlayerStamina(prev));

      setBallPosition({
        x: 30 + Math.random() * 40,
        y: 20 + Math.random() * 60,
      });

      // Process extra time events
      while (eventIndex < extraTimeEvents.length && extraTimeEvents[eventIndex].minute <= currentMinute) {
        const event = extraTimeEvents[eventIndex];

        if (event.goal) {
          if (event.team === 'home') {
            homeG++;
            setHomeGoals(homeG);
          } else {
            awayG++;
            setAwayGoals(awayG);
          }
          setBallPosition({ x: event.team === 'home' ? 95 : 5, y: 50 });

          // Show goal popup (extra time goal!)
          showPopup('goal', {
            scorer: event.player?.name || 'Unknown',
            team: event.team === 'home' ? homeTeam : awayTeam,
            minute: event.minute,
            homeScore: homeG,
            awayScore: awayG,
            isExtraTime: true,
          });

          const fabComment = getFabrizioComment(
            { type: 'goal', player: event.player?.name || 'Unknown', team: event.team, dramatic: true },
            homeTeam,
            awayTeam
          );
          if (fabComment) {
            addCommentary(event.minute, fabComment, 'goal');
          }
        } else if (event.card) {
          if (event.card === 'red') {
            showPopup('redCard', {
              player: event.player?.name || 'Unknown',
              team: event.team === 'home' ? homeTeam : awayTeam,
              minute: event.minute,
            });
          }

          const fabComment = getFabrizioComment(
            { type: event.card === 'red' ? 'red_card' : 'yellow_card', player: event.player?.name || 'Unknown', team: event.team },
            homeTeam,
            awayTeam
          );
          if (fabComment) {
            addCommentary(event.minute, fabComment, event.card === 'red' ? 'red_card' : 'yellow_card');
          }
        }

        eventIndex++;
      }

      // Extra time halftime
      if (currentMinute === EXTRA_TIME.FIRST_HALF_END) {
        setPhase('extratime_halftime');
        addCommentary(105, getExtraTimeHalftimeComment(), 'phase');

        clearInterval(intervalRef.current);

        setTimeout(() => {
          setPhase('extratime_second');
          addCommentary(106, "Second half of extra time begins!", 'phase');
          runExtraTimeSecondHalf(eventIndex, homeG, awayG);
        }, 2000 / speedRef.current);
        return;
      }

      if (currentMinute >= EXTRA_TIME.SECOND_HALF_END) {
        clearInterval(intervalRef.current);
        endExtraTime(homeG, awayG);
      }
    }, 50); // Fast fixed interval
  };

  const runExtraTimeSecondHalf = (startEventIndex, homeG, awayG) => {
    let currentMinute = EXTRA_TIME.SECOND_HALF_START;
    let eventIndex = startEventIndex;

    const baseTickInterval = (REAL_TIME_DURATION / MATCH_DURATION) * 1000;
    let lastTickTime = Date.now();
    let accumulatedTime = 0;

    intervalRef.current = setInterval(() => {
      // Skip if paused
      if (pausedRef.current) return;

      const now = Date.now();
      const deltaTime = now - lastTickTime;
      lastTickTime = now;

      accumulatedTime += deltaTime * speedRef.current;
      if (accumulatedTime < baseTickInterval) return;
      accumulatedTime -= baseTickInterval;

      currentMinute += 1;
      setMinute(currentMinute);

      setHomePlayers(prev => updatePlayerStamina(prev));
      setAwayPlayers(prev => updatePlayerStamina(prev));

      setBallPosition({
        x: 30 + Math.random() * 40,
        y: 20 + Math.random() * 60,
      });

      // Process events
      while (eventIndex < extraTimeEvents.length && extraTimeEvents[eventIndex].minute <= currentMinute) {
        const event = extraTimeEvents[eventIndex];

        if (event.goal) {
          if (event.team === 'home') {
            homeG++;
            setHomeGoals(homeG);
          } else {
            awayG++;
            setAwayGoals(awayG);
          }
          setBallPosition({ x: event.team === 'home' ? 95 : 5, y: 50 });

          // Show goal popup (extra time goal!)
          showPopup('goal', {
            scorer: event.player?.name || 'Unknown',
            team: event.team === 'home' ? homeTeam : awayTeam,
            minute: event.minute,
            homeScore: homeG,
            awayScore: awayG,
            isExtraTime: true,
          });

          const fabComment = getFabrizioComment(
            { type: 'goal', player: event.player?.name || 'Unknown', team: event.team, dramatic: true },
            homeTeam,
            awayTeam
          );
          if (fabComment) {
            addCommentary(event.minute, fabComment, 'goal');
          }
        } else if (event.card) {
          // Show red card popup
          if (event.card === 'red') {
            showPopup('redCard', {
              player: event.player?.name || 'Unknown',
              team: event.team === 'home' ? homeTeam : awayTeam,
              minute: event.minute,
            });
          }

          const fabComment = getFabrizioComment(
            { type: event.card === 'red' ? 'red_card' : 'yellow_card', player: event.player?.name || 'Unknown', team: event.team },
            homeTeam,
            awayTeam
          );
          if (fabComment) {
            addCommentary(event.minute, fabComment, event.card === 'red' ? 'red_card' : 'yellow_card');
          }
        }

        eventIndex++;
      }

      if (currentMinute >= EXTRA_TIME.SECOND_HALF_END) {
        clearInterval(intervalRef.current);
        endExtraTime(homeG, awayG);
      }
    }, 50); // Fast fixed interval
  };

  const endExtraTime = (homeG, awayG) => {
    setPhase('extratime_end');
    addCommentary(120, getExtraTimeEndComment(homeTeam, awayTeam, homeG, awayG), 'phase');
    addTacticalNote('extratime', `Extra time complete: ${homeTeam.name} ${homeG} - ${awayG} ${awayTeam.name}`);

    // Check if still tied (need penalties)
    const stillTied = homeG === awayG;

    if (stillTied && penaltyShootout) {
      addCommentary(120, "Still level after extra time! PENALTIES it is!", 'phase');

      setTimeout(() => {
        setPhase('penalties');
        addCommentary(120, getPenaltiesStartComment(), 'phase');
        addTacticalNote('penalties', 'Penalty shootout begins!');
        runPenaltyShootout();
      }, 2000 / speedRef.current);
    } else {
      // Extra time decided it
      setTimeout(() => {
        setPhase('postmatch');
        const homeQuote = getManagerQuote(true, homeG, awayG, homeTeam.name, homeTeam.id);
        const awayQuote = getManagerQuote(false, homeG, awayG, awayTeam.name, awayTeam.id);
        setManagerQuotes({ home: homeQuote, away: awayQuote });
        // Fabrizio comment - extra time goals are dramatic!
        setFabrizioComment(getFabrizioPostMatchComment(homeG, awayG, true));
      }, 1500 / speedRef.current);
    }
  };

  // Run penalty shootout
  const runPenaltyShootout = () => {
    if (!penaltyShootout || !penaltyShootout.kicks) return;

    let index = 0;

    const showNextPenalty = () => {
      if (index >= penaltyShootout.kicks.length) {
        // Shootout complete
        const winner = penaltyShootout.winnerName;
        addCommentary(120, getPenaltyWinnerComment(winner, penaltyShootout.homeScore, penaltyShootout.awayScore), 'goal');
        addTacticalNote('penalties', `${winner} wins on penalties ${penaltyShootout.homeScore}-${penaltyShootout.awayScore}`);

        setTimeout(() => {
          setPhase('postmatch');
          const homeWon = penaltyShootout.winner === homeTeam.id;
          const homeQuote = getManagerQuote(homeWon, homeWon ? 1 : 0, homeWon ? 0 : 1, homeTeam.name, homeTeam.id);
          const awayQuote = getManagerQuote(!homeWon, !homeWon ? 1 : 0, !homeWon ? 0 : 1, awayTeam.name, awayTeam.id);
          setManagerQuotes({ home: homeQuote, away: awayQuote });
          // Penalties are always dramatic!
          setFabrizioComment(getFabrizioPostMatchComment(homeGoals, awayGoals, true));
        }, 2000 / speedRef.current);
        return;
      }

      const kick = penaltyShootout.kicks[index];
      setCurrentPenaltyIndex(index);

      const playerName = kick.taker?.name || 'Unknown';
      const comment = kick.scored
        ? getPenaltyScoredComment(playerName, kick.homeScore, kick.awayScore)
        : getPenaltyMissedComment(playerName, kick.homeScore, kick.awayScore);

      addCommentary(120, comment, kick.scored ? 'goal' : 'miss');

      index++;
      setTimeout(showNextPenalty, 2500 / speedRef.current);
    };

    showNextPenalty();
  };

  const handleContinue = () => {
    if (matchResult) {
      const finalResult = {
        ...matchResult,
        homeGoals,
        awayGoals,
      };

      // Include extra time and penalty info
      if (matchResult.extraTime) {
        finalResult.homeGoalsAET = matchResult.homeGoalsAET;
        finalResult.awayGoalsAET = matchResult.awayGoalsAET;
        finalResult.wentToExtraTime = true;
      }

      if (penaltyShootout) {
        finalResult.penalties = penaltyShootout;
        finalResult.penaltyWinner = penaltyShootout.winnerName;
      }

      onComplete(finalResult);
    }
  };

  // Get player positions for display - ensures all 11 players are shown
  const getPlayerPositions = (players, isHome) => {
    const formation = getBestFormation(players);
    const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-4-2'];

    const result = [];
    const posCount = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    const overflow = []; // Players that don't fit their natural position

    players.forEach(player => {
      if (player.sentOff) return;

      const cat = getPositionCategory(player.position);
      const posArray = positions[cat];
      if (posArray && posCount[cat] < posArray.length) {
        let pos = posArray[posCount[cat]];
        if (!isHome) {
          pos = { x: 100 - pos.x, y: pos.y };
        }
        result.push({ player, ...pos });
        posCount[cat]++;
      } else {
        overflow.push(player);
      }
    });

    // Place overflow players in any available position
    const posOrder = ['MID', 'FWD', 'DEF', 'GK']; // Priority order for overflow
    overflow.forEach(player => {
      for (const cat of posOrder) {
        const posArray = positions[cat];
        if (posArray && posCount[cat] < posArray.length) {
          let pos = posArray[posCount[cat]];
          if (!isHome) {
            pos = { x: 100 - pos.x, y: pos.y };
          }
          result.push({ player, ...pos });
          posCount[cat]++;
          break;
        }
      }
    });

    return result;
  };

  const homePositions = getPlayerPositions(homePlayers, true);
  const awayPositions = getPlayerPositions(awayPlayers, false);

  const isMatchInProgress = phase === 'firsthalf' || phase === 'secondhalf' ||
    phase === 'extratime_first' || phase === 'extratime_second';

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      {/* Event Popup for Goals and Red Cards */}
      {popup && <EventPopup popup={popup} onDismiss={dismissPopup} />}

      <div className="max-w-7xl mx-auto p-4">
        {/* Header / Scoreboard */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-xl p-4 mb-4 shadow-2xl">
          <div className="flex items-center justify-between">
            {/* Home Team */}
            <div className="flex items-center gap-4 flex-1">
              <span className="text-4xl drop-shadow-lg">{homeTeam.logoEmoji}</span>
              <div>
                <div className="text-white font-bold text-xl">{homeTeam.name}</div>
                <div className="text-slate-400 text-sm">{teamRatings?.home?.formation || getBestFormation(homeTeam.players || [])}</div>
                <div className="text-xs text-slate-500">Subs: {homeSubs}/{SUBSTITUTION.MAX_SUBS}</div>
              </div>
              {/* Home Team Ratings */}
              {teamRatings?.home && (
                <div className="hidden md:flex gap-2 ml-2">
                  <div className="text-center px-2 py-1 bg-red-900/40 rounded">
                    <div className="text-[10px] text-red-400">ATK</div>
                    <div className="text-sm font-bold text-white">{teamRatings.home.attack}</div>
                  </div>
                  <div className="text-center px-2 py-1 bg-green-900/40 rounded">
                    <div className="text-[10px] text-green-400">MID</div>
                    <div className="text-sm font-bold text-white">{teamRatings.home.midfield}</div>
                  </div>
                  <div className="text-center px-2 py-1 bg-blue-900/40 rounded">
                    <div className="text-[10px] text-blue-400">DEF</div>
                    <div className="text-sm font-bold text-white">{teamRatings.home.defense}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Score */}
            <div className="text-center px-4">
              <div className="text-6xl font-bold text-white drop-shadow-lg">
                {homeGoals} - {awayGoals}
              </div>
              <div className="text-yellow-400 font-mono mt-1 text-lg">
                {phase === 'prematch' ? 'PRE-MATCH' :
                  phase === 'halftime' ? 'HALF TIME' :
                  phase === 'extratime_halftime' ? 'ET HALF TIME' :
                  phase === 'extratime_end' ? 'AET' :
                  phase === 'penalties' ? 'PENALTIES' :
                  phase === 'fulltime' ? 'FULL TIME' :
                  phase === 'postmatch' ? (penaltyShootout ? 'PENALTIES' : matchResult?.extraTime ? 'AET' : 'FULL TIME') :
                  phase.startsWith('extratime') ? `${minute}' (ET)` :
                  `${minute}'`}
              </div>
              {/* Aggregate score for two-legged knockout ties */}
              {isKnockout && isTwoLegged && leg === 2 && leg1Result && (
                <div className="text-slate-400 text-sm mt-1">
                  Agg: {homeGoals + leg1Result.awayGoals} - {awayGoals + leg1Result.homeGoals}
                </div>
              )}
              {/* Neutral venue indicator for finals */}
              {isNeutral && (
                <div className="text-yellow-400 text-xs mt-1">
                  Neutral Venue
                </div>
              )}
              {/* Penalty score */}
              {phase === 'penalties' && penaltyShootout && currentPenaltyIndex > 0 && (
                <div className="text-orange-400 text-sm mt-1 font-bold">
                  Pens: {penaltyShootout.kicks[currentPenaltyIndex - 1]?.homeScore || 0} - {penaltyShootout.kicks[currentPenaltyIndex - 1]?.awayScore || 0}
                </div>
              )}
              {phase === 'postmatch' && penaltyShootout && (
                <div className="text-orange-400 text-sm mt-1 font-bold">
                  Pens: {penaltyShootout.homeScore} - {penaltyShootout.awayScore}
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-4 flex-1 justify-end">
              {/* Away Team Ratings */}
              {teamRatings?.away && (
                <div className="hidden md:flex gap-2 mr-2">
                  <div className="text-center px-2 py-1 bg-blue-900/40 rounded">
                    <div className="text-[10px] text-blue-400">DEF</div>
                    <div className="text-sm font-bold text-white">{teamRatings.away.defense}</div>
                  </div>
                  <div className="text-center px-2 py-1 bg-green-900/40 rounded">
                    <div className="text-[10px] text-green-400">MID</div>
                    <div className="text-sm font-bold text-white">{teamRatings.away.midfield}</div>
                  </div>
                  <div className="text-center px-2 py-1 bg-red-900/40 rounded">
                    <div className="text-[10px] text-red-400">ATK</div>
                    <div className="text-sm font-bold text-white">{teamRatings.away.attack}</div>
                  </div>
                </div>
              )}
              <div className="text-right">
                <div className="text-white font-bold text-xl">{awayTeam.name}</div>
                <div className="text-slate-400 text-sm">{teamRatings?.away?.formation || getBestFormation(awayTeam.players || [])}</div>
                <div className="text-xs text-slate-500">Subs: {awaySubs}/{SUBSTITUTION.MAX_SUBS}</div>
              </div>
              <span className="text-4xl drop-shadow-lg">{awayTeam.logoEmoji}</span>
            </div>
          </div>
        </div>

        {/* Speed Control & Skip Button */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
            {[1, 2, 4, 8, 16].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                  speed === s ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {isMatchInProgress && !isSkipping && (
            <button
              onClick={skipToFinalScore}
              className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all shadow-lg"
            >
              &#9193; Skip to Final Score
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Pitch - Carrom Board Style OR Penalty Shootout */}
          <div className="lg:col-span-3">
            {phase === 'penalties' && penaltyShootout ? (
              <PenaltyShootoutView
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                shootout={penaltyShootout}
                currentIndex={currentPenaltyIndex}
              />
            ) : (
              <CarromBoardPitch
                homePositions={homePositions}
                awayPositions={awayPositions}
                ballPosition={ballPosition}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                phase={phase}
                onStartMatch={startMatch}
                teamRatings={teamRatings}
              />
            )}

            {/* Lineup Display - Starting XI and Subs */}
            {phase !== 'prematch' && (
              <LineupDisplay
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                homePlayers={homePlayers}
                awayPlayers={awayPlayers}
                homeBench={homeBench}
                awayBench={awayBench}
                teamRatings={teamRatings}
              />
            )}
          </div>

          {/* Side Panel - Commentary & Stats */}
          <div className="space-y-4">
            {/* Commentary */}
            <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl">
              <div className="bg-slate-700 px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white font-semibold text-sm">Live Commentary</span>
              </div>
              <div ref={commentaryRef} className="h-64 overflow-y-auto p-3 space-y-2">
                {commentary.map(c => (
                  <div
                    key={c.id}
                    className={`p-2 rounded text-xs ${
                      c.type === 'goal' ? 'bg-green-900/50 border-l-4 border-green-500' :
                        c.type === 'red_card' ? 'bg-red-900/50 border-l-4 border-red-500' :
                          c.type === 'yellow_card' ? 'bg-yellow-900/50 border-l-4 border-yellow-500' :
                            c.type === 'sub' ? 'bg-blue-900/50 border-l-4 border-blue-500' :
                              c.type === 'injury' ? 'bg-orange-900/50 border-l-4 border-orange-500' :
                                c.type === 'phase' ? 'bg-purple-900/50 border-l-4 border-purple-500' :
                                  'bg-slate-700/50'
                    }`}
                  >
                    <span className="text-slate-400 font-mono mr-2">{c.minute}'</span>
                    <span className="text-slate-200">{c.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tactical Notes */}
            <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl">
              <div className="bg-slate-700 px-4 py-2">
                <span className="text-white font-semibold text-sm">&#128203; Manager Notes</span>
              </div>
              <div className="h-40 overflow-y-auto p-3 space-y-1">
                {tacticalNotes.map(note => (
                  <div key={note.id} className="text-xs text-slate-300 p-1 bg-slate-700/30 rounded">
                    <span className="text-slate-500 uppercase mr-2">[{note.phase}]</span>
                    {note.note}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Post-match Manager Quotes */}
        {phase === 'postmatch' && managerQuotes && (
          <div className="mt-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{homeTeam.logoEmoji}</span>
                  <div>
                    <span className="text-white font-semibold">{managerQuotes.home.managerName || 'Manager'}</span>
                    <span className="text-slate-400 text-sm ml-2">({managerQuotes.home.managerTitle || 'Head Coach'})</span>
                  </div>
                </div>
                <p className="text-slate-300 italic text-sm leading-relaxed">"{managerQuotes.home.quote}"</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{awayTeam.logoEmoji}</span>
                  <div>
                    <span className="text-white font-semibold">{managerQuotes.away.managerName || 'Manager'}</span>
                    <span className="text-slate-400 text-sm ml-2">({managerQuotes.away.managerTitle || 'Head Coach'})</span>
                  </div>
                </div>
                <p className="text-slate-300 italic text-sm leading-relaxed">"{managerQuotes.away.quote}"</p>
              </div>
            </div>

            {/* Fabrizio Post-Match Press Comment */}
            {fabrizioComment && (
              <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-4 border border-blue-500/50 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">F</div>
                  <div>
                    <span className="text-white font-semibold">Fabrizio Romano</span>
                    <span className="text-blue-400 text-sm ml-2">@FabrizioRomano</span>
                    <span className="text-blue-400 ml-1">&#10004;</span>
                  </div>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">{fabrizioComment}</p>
                <div className="flex gap-6 mt-3 text-slate-500 text-xs">
                  <span>&#128172; 2.4K</span>
                  <span>&#128257; 8.1K</span>
                  <span>&#10084; 47.2K</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Continue Button */}
        {phase === 'postmatch' && (
          <div className="mt-6 text-center">
            <button
              onClick={handleContinue}
              className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all hover:scale-105"
            >
              Continue &#8594;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Carrom Board Style Pitch Component
function CarromBoardPitch({ homePositions, awayPositions, ballPosition, homeTeam, awayTeam, phase, onStartMatch, teamRatings }) {
  // Determine favorite based on overall rating
  const homeFavorite = teamRatings?.home && teamRatings?.away && teamRatings.home.overall > teamRatings.away.overall;
  const awayFavorite = teamRatings?.home && teamRatings?.away && teamRatings.away.overall > teamRatings.home.overall;

  return (
    <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, #1a472a 0%, #2d5a3e 50%, #1a472a 100%)',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5), 0 10px 40px rgba(0,0,0,0.6)',
      }}
    >
      {/* Wooden border - carrom style */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          border: '12px solid #8B4513',
          borderRadius: '16px',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4)',
        }}
      />

      {/* Corner pockets - carrom style */}
      <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/60 shadow-inner" />
      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 shadow-inner" />
      <div className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-black/60 shadow-inner" />
      <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 shadow-inner" />

      {/* Pitch markings */}
      <PitchMarkings />

      {/* Home players */}
      {homePositions.map((pos, idx) => (
        <PlayerToken
          key={`home-${idx}`}
          player={pos.player}
          x={pos.x}
          y={pos.y}
          teamColor={homeTeam.color || '#1E40AF'}
          isHome={true}
        />
      ))}

      {/* Away players */}
      {awayPositions.map((pos, idx) => (
        <PlayerToken
          key={`away-${idx}`}
          player={pos.player}
          x={pos.x}
          y={pos.y}
          teamColor={awayTeam.color || '#DC2626'}
          isHome={false}
        />
      ))}

      {/* Ball */}
      <div
        className="absolute z-30 transition-all duration-500 ease-out"
        style={{
          left: `${ballPosition.x}%`,
          top: `${ballPosition.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className="w-5 h-5 rounded-full bg-white shadow-lg"
          style={{
            boxShadow: '0 3px 8px rgba(0,0,0,0.5), inset -2px -2px 4px rgba(0,0,0,0.2)',
            background: 'radial-gradient(circle at 30% 30%, #fff, #ddd)',
          }}
        />
      </div>

      {/* Pre-match overlay with team ratings */}
      {phase === 'prematch' && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-40 p-4 overflow-y-auto">
          {/* Title */}
          <h2 className="text-white text-xl font-bold mb-4">STARTING LINEUPS</h2>

          {/* Team comparison */}
          <div className="flex gap-6 mb-4 w-full max-w-4xl">
            {/* Home Team */}
            <div className={`flex-1 bg-slate-800/90 rounded-xl p-3 border-2 ${homeFavorite ? 'border-yellow-500' : 'border-slate-600'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{homeTeam.logoEmoji}</span>
                <div>
                  <div className="text-white font-bold text-sm">{homeTeam.shortName || homeTeam.name}</div>
                  <div className="text-slate-400 text-xs">{teamRatings?.home?.formation}</div>
                </div>
                {homeFavorite && <span className="text-yellow-400 text-xs ml-auto">FAVORITE</span>}
              </div>

              {/* Ratings bars */}
              {teamRatings?.home && (
                <div className="space-y-1 mb-2">
                  <RatingBar label="ATK" value={teamRatings.home.attack} color="red" />
                  <RatingBar label="MID" value={teamRatings.home.midfield} color="green" />
                  <RatingBar label="DEF" value={teamRatings.home.defense} color="blue" />
                  <div className="flex justify-between text-xs mt-1 pt-1 border-t border-slate-600">
                    <span className="text-slate-400">Overall</span>
                    <span className="text-white font-bold">{teamRatings.home.overall}</span>
                  </div>
                </div>
              )}

              {/* Starting XI */}
              <div className="text-xs space-y-0.5 max-h-32 overflow-y-auto">
                {teamRatings?.home?.players?.map((p, i) => (
                  <div key={i} className="flex justify-between text-slate-300">
                    <span className="truncate">{p.name}</span>
                    <span className={`ml-1 ${p.rating >= 85 ? 'text-yellow-400' : ''}`}>{p.rating}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-slate-500 text-2xl font-bold">VS</span>
            </div>

            {/* Away Team */}
            <div className={`flex-1 bg-slate-800/90 rounded-xl p-3 border-2 ${awayFavorite ? 'border-yellow-500' : 'border-slate-600'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{awayTeam.logoEmoji}</span>
                <div>
                  <div className="text-white font-bold text-sm">{awayTeam.shortName || awayTeam.name}</div>
                  <div className="text-slate-400 text-xs">{teamRatings?.away?.formation}</div>
                </div>
                {awayFavorite && <span className="text-yellow-400 text-xs ml-auto">FAVORITE</span>}
              </div>

              {/* Ratings bars */}
              {teamRatings?.away && (
                <div className="space-y-1 mb-2">
                  <RatingBar label="ATK" value={teamRatings.away.attack} color="red" />
                  <RatingBar label="MID" value={teamRatings.away.midfield} color="green" />
                  <RatingBar label="DEF" value={teamRatings.away.defense} color="blue" />
                  <div className="flex justify-between text-xs mt-1 pt-1 border-t border-slate-600">
                    <span className="text-slate-400">Overall</span>
                    <span className="text-white font-bold">{teamRatings.away.overall}</span>
                  </div>
                </div>
              )}

              {/* Starting XI */}
              <div className="text-xs space-y-0.5 max-h-32 overflow-y-auto">
                {teamRatings?.away?.players?.map((p, i) => (
                  <div key={i} className="flex justify-between text-slate-300">
                    <span className="truncate">{p.name}</span>
                    <span className={`ml-1 ${p.rating >= 85 ? 'text-yellow-400' : ''}`}>{p.rating}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kick off button */}
          <button
            onClick={onStartMatch}
            className="bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-xl font-bold text-xl transition-all shadow-2xl hover:scale-105"
          >
            &#9917; KICK OFF
          </button>
        </div>
      )}
    </div>
  );
}

function PitchMarkings() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62.5" preserveAspectRatio="none">
      {/* Outer boundary */}
      <rect x="4" y="4" width="92" height="54.5" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" />

      {/* Center line */}
      <line x1="50" y1="4" x2="50" y2="58.5" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />

      {/* Center circle */}
      <circle cx="50" cy="31.25" r="9" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
      <circle cx="50" cy="31.25" r="0.8" fill="rgba(255,255,255,0.8)" />

      {/* Left penalty area */}
      <rect x="4" y="15" width="14" height="32.5" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
      <rect x="4" y="22" width="5" height="18.5" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
      <circle cx="13" cy="31.25" r="0.6" fill="rgba(255,255,255,0.8)" />

      {/* Right penalty area */}
      <rect x="82" y="15" width="14" height="32.5" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
      <rect x="91" y="22" width="5" height="18.5" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.3" />
      <circle cx="87" cy="31.25" r="0.6" fill="rgba(255,255,255,0.8)" />

      {/* Goals */}
      <rect x="1" y="26" width="3" height="10.5" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" />
      <rect x="96" y="26" width="3" height="10.5" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.4" />
    </svg>
  );
}

function PlayerToken({ player, x, y, teamColor, isHome }) {
  const displayColor = teamColor === '#FFFFFF' ? '#E5E5E5' : teamColor;
  const stamina = player.stamina || 100;
  const staminaColor = stamina > 60 ? '#22c55e' : stamina > 30 ? '#eab308' : '#ef4444';

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-20"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {/* Stamina ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          width: '42px',
          height: '42px',
          transform: 'translate(-5px, -5px)',
          background: `conic-gradient(${staminaColor} ${stamina * 3.6}deg, transparent 0deg)`,
          opacity: 0.4,
        }}
      />

      {/* Player disc - carrom piece style */}
      <div
        className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${displayColor}, ${displayColor}aa)`,
          border: `3px solid ${isHome ? '#FFD700' : '#333'}`,
          boxShadow: `
            0 4px 8px rgba(0,0,0,0.4),
            inset 0 2px 4px rgba(255,255,255,0.3),
            inset 0 -2px 4px rgba(0,0,0,0.2)
          `,
        }}
        title={`${player.name} (${player.rating}) - Stamina: ${Math.round(stamina)}%`}
      >
        <span className={`text-xs md:text-sm font-bold ${
          displayColor === '#FFFFFF' || displayColor === '#E5E5E5' || displayColor === '#FDE100'
            ? 'text-black' : 'text-white'
        }`} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
          {player.name?.charAt(0) || '?'}
        </span>
      </div>

      {/* Player name label */}
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <span className="text-[9px] text-white bg-black/70 px-1.5 py-0.5 rounded font-medium">
          {player.name?.split(' ').pop() || ''}
        </span>
      </div>
    </div>
  );
}

// Penalty Shootout Visual Component
function PenaltyShootoutView({ homeTeam, awayTeam, shootout, currentIndex }) {
  const displayedKicks = shootout.kicks.slice(0, currentIndex);

  // Group kicks by round
  const rounds = [];
  for (let i = 0; i < displayedKicks.length; i += 2) {
    const homeKick = displayedKicks[i];
    const awayKick = displayedKicks[i + 1];
    rounds.push({ home: homeKick, away: awayKick });
  }

  // Add current/pending kicks
  if (currentIndex < shootout.kicks.length) {
    const currentKick = shootout.kicks[currentIndex];
    if (currentKick.team === 'home') {
      rounds.push({ home: currentKick, away: null, isCurrent: true });
    } else if (rounds.length > 0 && !rounds[rounds.length - 1].away) {
      rounds[rounds.length - 1].away = currentKick;
      rounds[rounds.length - 1].isCurrent = true;
    }
  }

  return (
    <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-b from-slate-800 to-slate-900">
      {/* Goal net background */}
      <div className="absolute inset-x-0 top-0 h-1/3 flex justify-center items-end">
        <div className="w-3/4 h-full max-w-md border-4 border-white/80 border-t-0 bg-gradient-to-b from-transparent to-slate-700/30"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 22px), repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 22px)',
          }}
        />
      </div>

      {/* Title */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-red-600 px-6 py-2 rounded-lg shadow-lg">
          <span className="text-white font-bold text-lg tracking-wider">PENALTY SHOOTOUT</span>
        </div>
      </div>

      {/* Shootout tracker */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 p-4 overflow-y-auto">
        {/* Team headers */}
        <div className="flex justify-between items-center mb-4 px-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{homeTeam.logoEmoji}</span>
            <span className="text-white font-bold text-lg">{homeTeam.shortName || homeTeam.name}</span>
          </div>
          <div className="bg-slate-700 px-6 py-2 rounded-lg">
            <span className="text-4xl font-bold text-white">
              {displayedKicks.filter(k => k.team === 'home' && k.scored).length}
              {' - '}
              {displayedKicks.filter(k => k.team === 'away' && k.scored).length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-lg">{awayTeam.shortName || awayTeam.name}</span>
            <span className="text-3xl">{awayTeam.logoEmoji}</span>
          </div>
        </div>

        {/* Penalty rounds */}
        <div className="space-y-2 max-w-2xl mx-auto">
          {rounds.map((round, idx) => (
            <div key={idx} className={`flex items-center justify-between px-4 py-2 rounded-lg ${
              round.isCurrent ? 'bg-yellow-600/30 border border-yellow-500' : 'bg-slate-700/50'
            }`}>
              {/* Home kick */}
              <div className="flex-1 flex items-center gap-2">
                {round.home && (
                  <>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
                      round.home.scored ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {round.home.scored ? '✓' : '✗'}
                    </span>
                    <span className="text-white text-sm">{round.home.taker?.name || 'Unknown'}</span>
                  </>
                )}
              </div>

              {/* Round number */}
              <div className="w-12 text-center">
                <span className={`text-sm font-bold ${
                  round.home?.isSuddenDeath ? 'text-orange-400' : 'text-slate-400'
                }`}>
                  {round.home?.isSuddenDeath ? 'SD' : idx + 1}
                </span>
              </div>

              {/* Away kick */}
              <div className="flex-1 flex items-center gap-2 justify-end">
                {round.away && (
                  <>
                    <span className="text-white text-sm">{round.away.taker?.name || 'Unknown'}</span>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
                      round.away.scored ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {round.away.scored ? '✓' : '✗'}
                    </span>
                  </>
                )}
                {!round.away && round.home && (
                  <span className="text-slate-500 text-sm">Awaiting...</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sudden death indicator */}
        {shootout.isSuddenDeath && currentIndex >= 10 && (
          <div className="mt-4 text-center">
            <span className="text-orange-400 font-bold animate-pulse">SUDDEN DEATH</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Event Popup Component for Goals and Red Cards
function EventPopup({ popup, onDismiss }) {
  if (!popup) return null;

  const { type, data } = popup;

  if (type === 'goal') {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black/50">
        <div
          className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-6 shadow-2xl border-4 border-green-400 transform scale-100"
          style={{
            animation: 'popupIn 0.3s ease-out',
            boxShadow: '0 0 60px rgba(34, 197, 94, 0.6)',
          }}
        >
          <div className="text-center">
            <div className="text-6xl mb-2">&#9917;</div>
            <div className="text-4xl font-bold text-white mb-2">GOAL!</div>
            {data.isExtraTime && (
              <div className="text-yellow-300 text-sm font-bold mb-1">EXTRA TIME</div>
            )}
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-3xl">{data.team?.logoEmoji}</span>
              <span className="text-white text-xl font-semibold">{data.team?.shortName || data.team?.name}</span>
            </div>
            <div className="text-green-200 text-lg">{data.scorer}</div>
            <div className="text-green-300 text-sm mt-1">{data.minute}'</div>
            <div className="mt-3 bg-black/30 rounded-lg px-4 py-2">
              <span className="text-3xl font-bold text-white">{data.homeScore} - {data.awayScore}</span>
            </div>
            {/* OK Button to continue match */}
            <button
              onClick={onDismiss}
              className="mt-4 bg-white hover:bg-green-100 text-green-800 px-8 py-3 rounded-xl font-bold text-lg transition-all shadow-lg hover:scale-105"
            >
              Continue Match
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'redCard') {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[60] pointer-events-none">
        <div
          className="bg-gradient-to-br from-red-600 to-red-900 rounded-2xl p-6 shadow-2xl border-4 border-red-400 transform"
          style={{
            animation: 'popupIn 0.3s ease-out, shake 0.5s ease-in-out 0.3s',
            boxShadow: '0 0 60px rgba(239, 68, 68, 0.6)',
          }}
        >
          <div className="text-center">
            <div className="text-6xl mb-2">&#128308;</div>
            <div className="text-3xl font-bold text-white mb-2">RED CARD!</div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-3xl">{data.team?.logoEmoji}</span>
              <span className="text-white text-xl font-semibold">{data.team?.shortName || data.team?.name}</span>
            </div>
            <div className="text-red-200 text-lg">{data.player}</div>
            <div className="text-red-300 text-sm mt-1">{data.minute}' - SENT OFF!</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Lineup Display Component - shows starting XI and subs below the pitch
function LineupDisplay({ homeTeam, awayTeam, homePlayers, awayPlayers, homeBench, awayBench, teamRatings }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      {/* Home Team Lineup */}
      <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
        <div className="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
          <span className="text-xl">{homeTeam.logoEmoji}</span>
          <span className="text-white font-bold text-sm">{homeTeam.shortName || homeTeam.name}</span>
          <span className="text-slate-400 text-xs ml-auto">{teamRatings?.home?.formation}</span>
        </div>

        {/* Starting XI */}
        <div className="mb-2">
          <div className="text-xs text-green-400 font-semibold mb-1">Starting XI</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
            {homePlayers.map((p, i) => (
              <div key={i} className={`flex justify-between ${p.sentOff ? 'text-red-400 line-through' : 'text-slate-300'}`}>
                <span className="truncate">{p.name?.split(' ').pop()}</span>
                <span className={`ml-1 ${p.rating >= 85 ? 'text-yellow-400' : 'text-slate-500'}`}>{p.rating}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bench */}
        <div>
          <div className="text-xs text-blue-400 font-semibold mb-1">Substitutes</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
            {homeBench.slice(0, 7).map((p, i) => (
              <div key={i} className={`flex justify-between ${p.substitutedIn ? 'text-green-400' : 'text-slate-500'}`}>
                <span className="truncate">{p.name?.split(' ').pop()}</span>
                <span className={`ml-1 ${p.rating >= 85 ? 'text-yellow-400' : ''}`}>{p.rating}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Away Team Lineup */}
      <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
        <div className="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
          <span className="text-xl">{awayTeam.logoEmoji}</span>
          <span className="text-white font-bold text-sm">{awayTeam.shortName || awayTeam.name}</span>
          <span className="text-slate-400 text-xs ml-auto">{teamRatings?.away?.formation}</span>
        </div>

        {/* Starting XI */}
        <div className="mb-2">
          <div className="text-xs text-green-400 font-semibold mb-1">Starting XI</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
            {awayPlayers.map((p, i) => (
              <div key={i} className={`flex justify-between ${p.sentOff ? 'text-red-400 line-through' : 'text-slate-300'}`}>
                <span className="truncate">{p.name?.split(' ').pop()}</span>
                <span className={`ml-1 ${p.rating >= 85 ? 'text-yellow-400' : 'text-slate-500'}`}>{p.rating}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bench */}
        <div>
          <div className="text-xs text-blue-400 font-semibold mb-1">Substitutes</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
            {awayBench.slice(0, 7).map((p, i) => (
              <div key={i} className={`flex justify-between ${p.substitutedIn ? 'text-green-400' : 'text-slate-500'}`}>
                <span className="truncate">{p.name?.split(' ').pop()}</span>
                <span className={`ml-1 ${p.rating >= 85 ? 'text-yellow-400' : ''}`}>{p.rating}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Rating Bar Component for pre-match display
function RatingBar({ label, value, color }) {
  const colors = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
  };

  // Normalize value to percentage (assume 60-95 range)
  const percentage = Math.min(100, Math.max(0, ((value - 60) / 35) * 100));

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-400 w-8">{label}</span>
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-white w-6 text-right">{value}</span>
    </div>
  );
}
