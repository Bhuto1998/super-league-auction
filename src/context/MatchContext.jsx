import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import {
  createInitialMatchState,
  generateMatchEvent,
  MATCH_DURATION,
  HALF_TIME,
  TICK_INTERVAL,
  calculateTeamStrength,
  calculateAttackStrength,
  calculateDefenseStrength,
  calculateMidfieldStrength,
  calculateDominance,
  getPlayerPositions,
} from '../engine/matchEngine';
import {
  generatePhaseCommentary,
  generateSubstitutionCommentary,
  generateManagerNote,
  generateHalfTimeAnalysis,
  getMatchSummary,
} from '../engine/matchEvents';

const MatchContext = createContext(null);

/**
 * Generate random form history for a team (simulates last 5 matches)
 * @returns {Array} Array of { result: 'W'|'D'|'L' }
 */
function generateRandomForm() {
  const results = ['W', 'D', 'L'];
  const weights = [0.4, 0.25, 0.35]; // Slightly favor wins

  return Array.from({ length: 5 }, () => {
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < results.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        return { result: results[i] };
      }
    }
    return { result: 'D' };
  });
}

/**
 * Get form string for display (e.g., "WWDLW")
 */
function getFormString(form) {
  return form.map(f => f.result).join('');
}

const initialState = {
  isActive: false,
  isPaused: false,
  matchState: null,
  commentary: [],
  managerNotes: { home: [], away: [] },
  homeFormation: '4-3-3',
  awayFormation: '4-3-3',
  homePositions: [],
  awayPositions: [],
  ballPosition: { x: 50, y: 50 },
  speed: 1, // 1x, 2x, 4x
  // Popup state for goals and red cards
  eventPopup: null, // { type: 'goal' | 'redCard', event: {...}, team: 'home' | 'away' }
};

function matchReducer(state, action) {
  switch (action.type) {
    case 'START_MATCH': {
      const { homeTeam, awayTeam, homePlayers, awayPlayers, homeBench, awayBench, homeForm, awayForm } = action.payload;

      // Use provided form or generate random form
      const actualHomeForm = homeForm || generateRandomForm();
      const actualAwayForm = awayForm || generateRandomForm();

      const matchState = createInitialMatchState(
        homeTeam,
        awayTeam,
        homePlayers,
        awayPlayers,
        homeBench || [],
        awayBench || [],
        { homeForm: actualHomeForm, awayForm: actualAwayForm }
      );
      matchState.phase = 'first-half';
      matchState.minute = 1;

      const homePositions = getPlayerPositions(matchState.homePlayers, state.homeFormation, true);
      const awayPositions = getPlayerPositions(matchState.awayPlayers, state.awayFormation, false);

      // Create pre-match commentary including form and strength info
      const kickoffCommentary = generatePhaseCommentary('kickoff', matchState);
      const initialCommentary = [
        { minute: 0, text: kickoffCommentary, type: 'phase' },
      ];

      // Add form and advantage info
      const homeFormStr = getFormString(actualHomeForm);
      const awayFormStr = getFormString(actualAwayForm);
      initialCommentary.push({
        minute: 0,
        text: `📊 Form Guide: ${homeTeam.name} (${homeFormStr}) vs ${awayTeam.name} (${awayFormStr})`,
        type: 'info',
      });

      // Show strength comparison
      const { homeStrength, awayStrength } = matchState;
      initialCommentary.push({
        minute: 0,
        text: `⚡ Team Ratings - ${homeTeam.name}: ${homeStrength.total.toFixed(1)} (Base: ${homeStrength.base.toFixed(1)}, Form: ${homeStrength.formBonus > 0 ? '+' : ''}${homeStrength.formBonus}, Home: +${homeStrength.homeBonus}) | ${awayTeam.name}: ${awayStrength.total.toFixed(1)} (Base: ${awayStrength.base.toFixed(1)}, Form: ${awayStrength.formBonus > 0 ? '+' : ''}${awayStrength.formBonus})`,
        type: 'info',
      });

      return {
        ...state,
        isActive: true,
        isPaused: false,
        matchState,
        commentary: initialCommentary,
        managerNotes: { home: [], away: [] },
        homePositions,
        awayPositions,
        ballPosition: { x: 50, y: 50 },
      };
    }

    case 'TICK': {
      if (!state.matchState || state.isPaused) return state;

      const newMinute = state.matchState.minute + 1;
      let newPhase = state.matchState.phase;
      const newCommentary = [...state.commentary];
      const newManagerNotes = { ...state.managerNotes };

      // Check for phase transitions
      if (newMinute === HALF_TIME + 1 && state.matchState.phase === 'first-half') {
        newPhase = 'half-time';
        const htCommentary = generatePhaseCommentary('halfTime', state.matchState);
        newCommentary.push({ minute: HALF_TIME, text: htCommentary, type: 'phase' });

        // Add half-time analysis
        const homeAnalysis = generateHalfTimeAnalysis(state.matchState, true);
        const awayAnalysis = generateHalfTimeAnalysis(state.matchState, false);
        newManagerNotes.home = [...newManagerNotes.home, ...homeAnalysis.map(a => ({ minute: 45, text: a }))];
        newManagerNotes.away = [...newManagerNotes.away, ...awayAnalysis.map(a => ({ minute: 45, text: a }))];
      } else if (newMinute === HALF_TIME + 2 && state.matchState.phase === 'half-time') {
        newPhase = 'second-half';
        const shCommentary = generatePhaseCommentary('secondHalf', state.matchState);
        newCommentary.push({ minute: 46, text: shCommentary, type: 'phase' });
      } else if (newMinute > MATCH_DURATION) {
        newPhase = 'full-time';
        const ftCommentary = generatePhaseCommentary('fullTime', state.matchState);
        newCommentary.push({ minute: 90, text: ftCommentary, type: 'phase' });

        return {
          ...state,
          isActive: false,
          matchState: {
            ...state.matchState,
            minute: MATCH_DURATION,
            phase: newPhase,
          },
          commentary: newCommentary,
          managerNotes: newManagerNotes,
        };
      }

      // Generate event for this minute (skip half-time)
      let newEvent = null;
      let newBallPosition = state.ballPosition;

      if (newPhase === 'first-half' || newPhase === 'second-half') {
        newEvent = generateMatchEvent(
          newMinute,
          state.matchState.homeTeam,
          state.matchState.awayTeam,
          state.matchState.homePlayers.filter(p => !p.redCard && !p.injured),
          state.matchState.awayPlayers.filter(p => !p.redCard && !p.injured),
          state.matchState
        );

        if (newEvent.description) {
          newCommentary.push({
            minute: newMinute,
            text: newEvent.description,
            type: newEvent.type,
            isGoal: newEvent.goal,
            isCard: !!newEvent.card,
          });
        }

        // Update ball position based on event
        if (newEvent.type !== 'nothing') {
          const isHome = newEvent.team === 'home';
          newBallPosition = {
            x: newEvent.goal ? (isHome ? 95 : 5) :
               newEvent.type === 'shot' ? (isHome ? 85 : 15) :
               newEvent.type === 'attack' ? (isHome ? 70 : 30) :
               50 + (Math.random() - 0.5) * 40,
            y: 30 + Math.random() * 40,
          };
        }

        // Occasional manager notes
        if (Math.random() < 0.1) {
          const homeNote = generateManagerNote(state.matchState, true);
          const awayNote = generateManagerNote(state.matchState, false);
          newManagerNotes.home = [...newManagerNotes.home, { minute: newMinute, text: homeNote }];
          newManagerNotes.away = [...newManagerNotes.away, { minute: newMinute, text: awayNote }];
        }
      }

      // Update match state
      const updatedMatchState = {
        ...state.matchState,
        minute: newMinute,
        phase: newPhase,
        events: newEvent ? [...state.matchState.events, newEvent] : state.matchState.events,
        homeScore: newEvent?.goal && newEvent.team === 'home'
          ? state.matchState.homeScore + 1
          : state.matchState.homeScore,
        awayScore: newEvent?.goal && newEvent.team === 'away'
          ? state.matchState.awayScore + 1
          : state.matchState.awayScore,
        shots: {
          home: state.matchState.shots.home + (newEvent?.type === 'shot' && newEvent.team === 'home' ? 1 : 0),
          away: state.matchState.shots.away + (newEvent?.type === 'shot' && newEvent.team === 'away' ? 1 : 0),
        },
        shotsOnTarget: {
          home: state.matchState.shotsOnTarget.home + (newEvent?.goal && newEvent.team === 'home' ? 1 : 0),
          away: state.matchState.shotsOnTarget.away + (newEvent?.goal && newEvent.team === 'away' ? 1 : 0),
        },
        fouls: {
          home: state.matchState.fouls.home + (newEvent?.type === 'foul' && newEvent.team === 'home' ? 1 : 0),
          away: state.matchState.fouls.away + (newEvent?.type === 'foul' && newEvent.team === 'away' ? 1 : 0),
        },
        possession: {
          home: Math.min(70, Math.max(30, state.matchState.possession.home + (Math.random() - 0.5) * 5)),
          away: 100 - Math.min(70, Math.max(30, state.matchState.possession.home + (Math.random() - 0.5) * 5)),
        },
      };

      // Handle cards
      let redCardIssued = false;
      let redCardTeam = null;
      if (newEvent?.card) {
        const isHome = newEvent.team === 'home';
        const players = isHome ? updatedMatchState.homePlayers : updatedMatchState.awayPlayers;
        const playerIdx = players.findIndex(p => p.id === newEvent.player.id);
        if (playerIdx >= 0) {
          if (newEvent.card === 'yellow') {
            players[playerIdx].yellowCards++;
            if (players[playerIdx].yellowCards >= 2) {
              players[playerIdx].redCard = true;
              redCardIssued = true;
              redCardTeam = isHome ? 'home' : 'away';
            }
          } else if (newEvent.card === 'red') {
            players[playerIdx].redCard = true;
            redCardIssued = true;
            redCardTeam = isHome ? 'home' : 'away';
          }
        }
      }

      // Recalculate team strength when red card is issued (team is now weaker)
      if (redCardIssued) {
        const activePlayers = (team) => {
          const players = team === 'home' ? updatedMatchState.homePlayers : updatedMatchState.awayPlayers;
          return players.filter(p => !p.redCard && !p.injured);
        };

        const homeActive = activePlayers('home');
        const awayActive = activePlayers('away');

        if (redCardTeam === 'home') {
          updatedMatchState.homeStrength = {
            ...updatedMatchState.homeStrength,
            total: calculateTeamStrength(homeActive, { isHome: true, recentResults: updatedMatchState.homeForm }).total,
            attack: calculateAttackStrength(homeActive),
            defense: calculateDefenseStrength(homeActive),
            midfield: calculateMidfieldStrength(homeActive),
            playersOnPitch: homeActive.length,
          };
        } else {
          updatedMatchState.awayStrength = {
            ...updatedMatchState.awayStrength,
            total: calculateTeamStrength(awayActive, { isHome: false, recentResults: updatedMatchState.awayForm }).total,
            attack: calculateAttackStrength(awayActive),
            defense: calculateDefenseStrength(awayActive),
            midfield: calculateMidfieldStrength(awayActive),
            playersOnPitch: awayActive.length,
          };
        }

        // Recalculate dominance after red card
        updatedMatchState.dominance = calculateDominance(
          updatedMatchState.homeStrength.total,
          updatedMatchState.awayStrength.total
        );
      }

      // Handle injuries
      if (newEvent?.injury && !newEvent.injury.canContinue) {
        const isHome = newEvent.team === 'home';
        const players = isHome ? updatedMatchState.homePlayers : updatedMatchState.awayPlayers;
        const playerIdx = players.findIndex(p => p.id === newEvent.player.id);
        if (playerIdx >= 0) {
          players[playerIdx].injured = true;
        }
      }

      // Check for goal or red card - show popup and pause match
      let eventPopup = null;
      let shouldPause = false;

      if (newEvent?.goal) {
        // Goal scored!
        const teamData = newEvent.team === 'home' ? state.matchState.homeTeam : state.matchState.awayTeam;
        eventPopup = {
          type: 'goal',
          event: newEvent,
          team: newEvent.team,
          teamName: teamData.name,
          teamColor: teamData.color,
          scorer: newEvent.player?.name || 'Unknown',
          minute: newMinute,
          newScore: {
            home: updatedMatchState.homeScore,
            away: updatedMatchState.awayScore,
          },
        };
        shouldPause = true;
      } else if (redCardIssued) {
        // Red card (direct or second yellow) - only show popup when redCardIssued is true
        const isSecondYellow = newEvent.card === 'yellow'; // If card was yellow but red was issued, it's second yellow
        const teamData = redCardTeam === 'home' ? state.matchState.homeTeam : state.matchState.awayTeam;
        eventPopup = {
          type: 'redCard',
          event: newEvent,
          team: redCardTeam,
          teamName: teamData.name,
          teamColor: teamData.color,
          player: newEvent.player?.name || 'Unknown',
          minute: newMinute,
          isSecondYellow,
          reason: newEvent.foul?.foulType || 'serious foul play',
        };
        shouldPause = true;
      }

      return {
        ...state,
        matchState: updatedMatchState,
        commentary: newCommentary,
        managerNotes: newManagerNotes,
        ballPosition: newBallPosition,
        eventPopup,
        isPaused: shouldPause ? true : state.isPaused,
      };
    }

    case 'DISMISS_POPUP':
      return {
        ...state,
        eventPopup: null,
        isPaused: false,
      };

    case 'PAUSE':
      return { ...state, isPaused: true };

    case 'RESUME':
      return { ...state, isPaused: false, eventPopup: null };

    case 'SET_SPEED':
      return { ...state, speed: action.payload };

    case 'SUBSTITUTE': {
      const { team, playerOut, playerIn } = action.payload;
      const isHome = team === 'home';
      const players = isHome ? [...state.matchState.homePlayers] : [...state.matchState.awayPlayers];
      const bench = isHome ? [...state.matchState.homeBench] : [...state.matchState.awayBench];
      const subs = isHome ? state.matchState.homeSubstitutions : state.matchState.awaySubstitutions;
      const maxSubs = state.matchState.maxSubstitutions;

      if (subs >= maxSubs) return state;

      const outIdx = players.findIndex(p => p.id === playerOut.id);
      const inIdx = bench.findIndex(p => p.id === playerIn.id);

      if (outIdx < 0 || inIdx < 0) return state;

      // Swap players
      const removedPlayer = players[outIdx];
      players[outIdx] = { ...playerIn, injured: false, yellowCards: 0, redCard: false };
      bench.splice(inIdx, 1);
      // Add removed player to bench (unless red-carded or seriously injured)
      if (!removedPlayer.redCard) {
        bench.push({ ...removedPlayer });
      }

      const teamData = isHome ? state.matchState.homeTeam : state.matchState.awayTeam;
      const subCommentary = generateSubstitutionCommentary(playerOut, playerIn, teamData, playerOut.injured);

      const newPositions = getPlayerPositions(
        players,
        isHome ? state.homeFormation : state.awayFormation,
        isHome
      );

      return {
        ...state,
        matchState: {
          ...state.matchState,
          [isHome ? 'homePlayers' : 'awayPlayers']: players,
          [isHome ? 'homeBench' : 'awayBench']: bench,
          [isHome ? 'homeSubstitutions' : 'awaySubstitutions']: subs + 1,
        },
        [isHome ? 'homePositions' : 'awayPositions']: newPositions,
        commentary: [
          ...state.commentary,
          { minute: state.matchState.minute, text: subCommentary, type: 'substitution' },
        ],
      };
    }

    case 'SET_FORMATION': {
      const { team, formation } = action.payload;
      const isHome = team === 'home';
      const players = isHome ? state.matchState?.homePlayers : state.matchState?.awayPlayers;
      const newPositions = players ? getPlayerPositions(players, formation, isHome) : [];

      return {
        ...state,
        [isHome ? 'homeFormation' : 'awayFormation']: formation,
        [isHome ? 'homePositions' : 'awayPositions']: newPositions,
      };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export function MatchProvider({ children }) {
  const [state, dispatch] = useReducer(matchReducer, initialState);
  const intervalRef = useRef(null);

  // Handle match tick interval
  useEffect(() => {
    if (state.isActive && !state.isPaused && state.matchState?.phase !== 'full-time') {
      const tickMs = (TICK_INTERVAL * 1000) / state.speed;
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, tickMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isActive, state.isPaused, state.speed, state.matchState?.phase]);

  /**
   * Start a match simulation
   * @param {Object} homeTeam - Home team data
   * @param {Object} awayTeam - Away team data
   * @param {Array} homePlayers - Home starting XI
   * @param {Array} awayPlayers - Away starting XI
   * @param {Array} homeBench - Home bench players (optional)
   * @param {Array} awayBench - Away bench players (optional)
   * @param {Object} options - { homeForm: Array, awayForm: Array } - Recent results (optional, will be generated if not provided)
   */
  const startMatch = useCallback((homeTeam, awayTeam, homePlayers, awayPlayers, homeBench = [], awayBench = [], options = {}) => {
    dispatch({
      type: 'START_MATCH',
      payload: {
        homeTeam,
        awayTeam,
        homePlayers,
        awayPlayers,
        homeBench,
        awayBench,
        homeForm: options.homeForm,
        awayForm: options.awayForm,
      },
    });
  }, []);

  const pauseMatch = useCallback(() => {
    dispatch({ type: 'PAUSE' });
  }, []);

  const resumeMatch = useCallback(() => {
    dispatch({ type: 'RESUME' });
  }, []);

  const setSpeed = useCallback((speed) => {
    dispatch({ type: 'SET_SPEED', payload: speed });
  }, []);

  const makeSubstitution = useCallback((team, playerOut, playerIn) => {
    dispatch({ type: 'SUBSTITUTE', payload: { team, playerOut, playerIn } });
  }, []);

  const setFormation = useCallback((team, formation) => {
    dispatch({ type: 'SET_FORMATION', payload: { team, formation } });
  }, []);

  const resetMatch = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const dismissPopup = useCallback(() => {
    dispatch({ type: 'DISMISS_POPUP' });
  }, []);

  // Automated substitutions - check periodically
  useEffect(() => {
    if (!state.isActive || state.isPaused || !state.matchState) return;

    const minute = state.matchState.minute;

    // Auto-sub windows: 60', 70', 80' (typical sub times)
    const subWindows = [60, 70, 80];
    if (!subWindows.includes(minute)) return;

    // Check both teams for injured/tired players
    ['home', 'away'].forEach(team => {
      const isHome = team === 'home';
      const players = isHome ? state.matchState.homePlayers : state.matchState.awayPlayers;
      const bench = isHome ? state.matchState.homeBench : state.matchState.awayBench;
      const subs = isHome ? state.matchState.homeSubstitutions : state.matchState.awaySubstitutions;
      const maxSubs = state.matchState.maxSubstitutions;

      if (subs >= maxSubs || bench.length === 0) return;

      // Find player needing substitution (injured or yellow-carded and risky)
      const needsSub = players.find(p =>
        (p.injured && !p.redCard) ||
        (p.yellowCards >= 1 && Math.random() < 0.3) // 30% chance to sub yellow-carded player
      );

      // Or random tactical sub (30% chance per window)
      const tacticalSub = !needsSub && Math.random() < 0.3;

      if (needsSub || tacticalSub) {
        const playerOut = needsSub || players.filter(p => !p.injured && !p.redCard)[Math.floor(Math.random() * players.filter(p => !p.injured && !p.redCard).length)];
        const playerIn = bench.filter(p => !p.injured)[0];

        if (playerOut && playerIn) {
          setTimeout(() => {
            dispatch({ type: 'SUBSTITUTE', payload: { team, playerOut, playerIn } });
          }, 500);
        }
      }
    });
  }, [state.isActive, state.isPaused, state.matchState]);

  const value = {
    ...state,
    startMatch,
    pauseMatch,
    resumeMatch,
    setSpeed,
    makeSubstitution,
    setFormation,
    resetMatch,
    dismissPopup,
    getMatchSummary: () => state.matchState ? getMatchSummary(state.matchState) : null,
  };

  return (
    <MatchContext.Provider value={value}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatch must be used within MatchProvider');
  }
  return context;
}
