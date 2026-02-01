import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import teamsData from '../data/teams.json';
import playersData from '../data/players.json';
import { saveCareer, loadCareer, getCurrentCareerId } from '../utils/careerStorage';
import { SEASON_PHASES, getNextPhase, prepareNewSeason, processOffSeason, calculateFinalPositions, createSeasonSummary, updateTrophyCabinet } from '../engine/seasonEngine';
import { generateWonderkids } from '../engine/youthAcademy';
import { createInitialDraftState, runLottery, generateDraftOrder, getAIDraftPick, shouldContinueToRound2 } from '../engine/draftEngine';
import { calculateSeasonBudget, isHumanTeam } from '../utils/budgetCalculator';
import { generatePotential, generatePeakAgeRange } from '../engine/playerProgression';
import { getPositionCategory } from '../utils/auctionHelpers';

// Initial state for career mode
const initialState = {
  // Career identification
  careerId: null,
  isCareerMode: false,
  careerStarted: false,

  // Season tracking
  currentSeason: 1,
  seasonPhase: SEASON_PHASES.PRE_SEASON,

  // Historical data
  seasons: [], // Array of season summaries
  trophyCabinet: {}, // { teamId: { leagues, cups, superCups } }

  // Player stats tracking
  playerCareerStats: {}, // { playerId: { totalGoals, totalAssists, appearances, seasons } }
  seasonPlayerStats: {}, // { playerId: { goals, assists, matchRatings[], form, appearances } }

  // Master player list (with progression data)
  players: [],

  // Youth academy
  youthAcademy: [], // Current season's wonderkids

  // Draft state (Season 2+)
  draftState: null,

  // Team budgets for current season
  teamBudgets: {},

  // Previous season data for budget calculation
  previousSeasonPositions: {},
  previousSeasonChampion: null,
  currentSeasonPositions: {},
  currentSeasonChampion: null,

  // Retirements this off-season
  retirements: [],

  // Teams reference
  teams: teamsData,
};

// Initialize players with career mode fields
function initializePlayersForCareer(players) {
  return players.map(player => {
    const positionCategory = player.positionCategory || getPositionCategory(player.position);
    const potential = player.potential || generatePotential(player);
    const peakRange = player.peakAgeStart
      ? { peakAgeStart: player.peakAgeStart, peakAgeEnd: player.peakAgeEnd }
      : generatePeakAgeRange(positionCategory);

    return {
      ...player,
      positionCategory,
      potential,
      peakAgeStart: peakRange.peakAgeStart,
      peakAgeEnd: peakRange.peakAgeEnd,
      form: player.form || { current: 0, trend: 'stable' },
    };
  });
}

function careerReducer(state, action) {
  switch (action.type) {
    case 'LOAD_CAREER':
      return {
        ...action.payload,
        isCareerMode: true,
        careerStarted: true,
      };

    case 'START_NEW_CAREER': {
      const players = initializePlayersForCareer(playersData);

      // Initialize team budgets for Season 1
      const teamBudgets = {};
      teamsData.forEach(team => {
        teamBudgets[team.id] = calculateSeasonBudget(team, null, 1);
      });

      return {
        ...initialState,
        isCareerMode: true,
        careerStarted: true,
        currentSeason: 1,
        seasonPhase: SEASON_PHASES.PRE_SEASON,
        players,
        teams: teamsData,
        teamBudgets,
      };
    }

    case 'ADVANCE_PHASE': {
      const nextPhase = getNextPhase(state.seasonPhase, state.currentSeason);

      if (!nextPhase) {
        // Season complete, prepare for new season
        return {
          ...state,
          seasonPhase: SEASON_PHASES.OFF_SEASON,
        };
      }

      // Handle phase-specific initialization
      let updates = { seasonPhase: nextPhase };

      // Generate wonderkids when entering draft phase
      if (nextPhase === SEASON_PHASES.DRAFT && state.currentSeason >= 2) {
        const wonderkids = generateWonderkids(state.currentSeason);
        updates.youthAcademy = wonderkids;
      }

      return { ...state, ...updates };
    }

    case 'SET_PHASE':
      return { ...state, seasonPhase: action.payload };

    case 'COMPLETE_TOURNAMENT': {
      const { tournamentState } = action.payload;
      const positions = calculateFinalPositions(tournamentState);
      const summary = createSeasonSummary(state, tournamentState);
      const updatedTrophyCabinet = updateTrophyCabinet(state.trophyCabinet, summary);

      return {
        ...state,
        seasons: [...state.seasons, summary],
        trophyCabinet: updatedTrophyCabinet,
        currentSeasonPositions: positions,
        currentSeasonChampion: tournamentState.champion?.id,
        seasonPhase: SEASON_PHASES.END_OF_SEASON,
      };
    }

    case 'START_OFF_SEASON': {
      // Process player aging and rating changes
      const offSeasonResult = processOffSeason(state.players, state.seasonPlayerStats);

      return {
        ...state,
        players: offSeasonResult.updatedPlayers,
        retirements: offSeasonResult.retiredPlayers,
        seasonPhase: SEASON_PHASES.OFF_SEASON,
      };
    }

    case 'START_NEW_SEASON': {
      const newState = prepareNewSeason(state);

      // Reset season-specific data
      return {
        ...newState,
        retirements: [],
        seasonPlayerStats: {},
        draftState: null,
      };
    }

    // Draft actions
    case 'INITIALIZE_DRAFT': {
      const { standings, wonderkids } = action.payload;
      const draftState = createInitialDraftState(standings, wonderkids);

      return {
        ...state,
        draftState,
      };
    }

    case 'RUN_LOTTERY': {
      const { results, animations } = runLottery(state.draftState.lotteryTeams);
      const draftOrder = generateDraftOrder(state.draftState.standings, results);

      return {
        ...state,
        draftState: {
          ...state.draftState,
          phase: 'drafting',
          lotteryResults: results,
          lotteryAnimations: animations,
          draftOrder,
          currentPick: 1,
        },
      };
    }

    case 'MAKE_DRAFT_PICK': {
      const { teamId, wonderkid } = action.payload;
      const currentDraft = state.draftState;

      // Add pick to history
      const newPick = {
        pick: currentDraft.currentPick,
        teamId,
        selection: wonderkid,
        isAI: !isHumanTeam(teamId),
      };

      // Remove wonderkid from available pool
      const newAvailable = currentDraft.availableWonderkids.filter(
        wk => wk.id !== wonderkid.id
      );

      // Add wonderkid to players list
      const newPlayers = [...state.players, {
        ...wonderkid,
        draftedBy: teamId,
        draftSeason: state.currentSeason,
        draftPick: currentDraft.currentPick,
      }];

      // Determine next pick
      const nextPick = currentDraft.currentPick + 1;
      const isRound1Complete = nextPick > 10;
      const isRound2 = currentDraft.currentPick > 10;

      // Check if draft is complete
      let isDraftComplete = false;
      if (isRound1Complete && !shouldContinueToRound2(newAvailable.length)) {
        isDraftComplete = true;
      } else if (isRound2 && nextPick > 20) {
        isDraftComplete = true;
      } else if (newAvailable.length === 0) {
        isDraftComplete = true;
      }

      return {
        ...state,
        players: newPlayers,
        draftState: {
          ...currentDraft,
          availableWonderkids: newAvailable,
          picks: [...currentDraft.picks, newPick],
          currentPick: isDraftComplete ? currentDraft.currentPick : nextPick,
          round: isRound1Complete ? 2 : 1,
          phase: isDraftComplete ? 'complete' : 'drafting',
          isComplete: isDraftComplete,
        },
      };
    }

    case 'COMPLETE_DRAFT': {
      // Add remaining wonderkids to auction pool
      const remainingWonderkids = state.draftState?.availableWonderkids || [];

      return {
        ...state,
        players: [...state.players, ...remainingWonderkids],
        draftState: {
          ...state.draftState,
          phase: 'complete',
          isComplete: true,
        },
        youthAcademy: [], // Clear after draft
      };
    }

    // Player stats tracking
    case 'UPDATE_PLAYER_MATCH_STATS': {
      const { playerId, matchStats } = action.payload;
      const currentStats = state.seasonPlayerStats[playerId] || {
        goals: 0,
        assists: 0,
        appearances: 0,
        matchRatings: [],
        yellowCards: 0,
        redCards: 0,
      };

      const newStats = {
        ...currentStats,
        goals: currentStats.goals + (matchStats.goals || 0),
        assists: currentStats.assists + (matchStats.assists || 0),
        appearances: currentStats.appearances + 1,
        matchRatings: [...currentStats.matchRatings, matchStats.rating || 7.0],
        yellowCards: currentStats.yellowCards + (matchStats.yellowCards || 0),
        redCards: currentStats.redCards + (matchStats.redCards || 0),
      };

      // Calculate average rating
      newStats.avgRating = newStats.matchRatings.reduce((a, b) => a + b, 0) / newStats.matchRatings.length;

      return {
        ...state,
        seasonPlayerStats: {
          ...state.seasonPlayerStats,
          [playerId]: newStats,
        },
      };
    }

    case 'AGGREGATE_CAREER_STATS': {
      const newCareerStats = { ...state.playerCareerStats };

      Object.entries(state.seasonPlayerStats).forEach(([playerId, seasonStats]) => {
        const existing = newCareerStats[playerId] || {
          totalGoals: 0,
          totalAssists: 0,
          totalAppearances: 0,
          seasonsPlayed: 0,
          allTimeRatings: [],
        };

        newCareerStats[playerId] = {
          totalGoals: existing.totalGoals + seasonStats.goals,
          totalAssists: existing.totalAssists + seasonStats.assists,
          totalAppearances: existing.totalAppearances + seasonStats.appearances,
          seasonsPlayed: existing.seasonsPlayed + 1,
          allTimeRatings: [...existing.allTimeRatings, ...seasonStats.matchRatings],
          avgCareerRating: 0, // Calculated below
        };

        // Calculate career average
        const allRatings = newCareerStats[playerId].allTimeRatings;
        if (allRatings.length > 0) {
          newCareerStats[playerId].avgCareerRating =
            allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
        }
      });

      return {
        ...state,
        playerCareerStats: newCareerStats,
      };
    }

    case 'SET_CAREER_ID':
      return { ...state, careerId: action.payload };

    case 'RESET_CAREER':
      return { ...initialState };

    default:
      return state;
  }
}

const CareerContext = createContext(null);

export function CareerProvider({ children }) {
  const [state, dispatch] = useReducer(careerReducer, initialState);

  // Auto-save career on state changes
  useEffect(() => {
    if (state.isCareerMode && state.careerStarted && state.careerId) {
      saveCareer(state, state.careerId);
    }
  }, [state]);

  // Start a new career
  const startNewCareer = useCallback(() => {
    dispatch({ type: 'START_NEW_CAREER' });
  }, []);

  // Load existing career
  const loadExistingCareer = useCallback((careerId) => {
    const careerState = loadCareer(careerId);
    if (careerState) {
      dispatch({ type: 'LOAD_CAREER', payload: careerState });
      return true;
    }
    return false;
  }, []);

  // Try to load the last played career
  const loadLastCareer = useCallback(() => {
    const currentId = getCurrentCareerId();
    if (currentId) {
      return loadExistingCareer(currentId);
    }
    return false;
  }, [loadExistingCareer]);

  // Advance to next phase
  const advancePhase = useCallback(() => {
    dispatch({ type: 'ADVANCE_PHASE' });
  }, []);

  // Set specific phase
  const setPhase = useCallback((phase) => {
    dispatch({ type: 'SET_PHASE', payload: phase });
  }, []);

  // Complete tournament and transition to end of season
  const completeTournament = useCallback((tournamentState) => {
    dispatch({ type: 'COMPLETE_TOURNAMENT', payload: { tournamentState } });
  }, []);

  // Start off-season processing
  const startOffSeason = useCallback(() => {
    dispatch({ type: 'START_OFF_SEASON' });
  }, []);

  // Start new season (after off-season)
  const startNewSeason = useCallback(() => {
    dispatch({ type: 'START_NEW_SEASON' });
  }, []);

  // Initialize draft
  const initializeDraft = useCallback((standings, wonderkids) => {
    dispatch({ type: 'INITIALIZE_DRAFT', payload: { standings, wonderkids } });
  }, []);

  // Run lottery
  const runDraftLottery = useCallback(() => {
    dispatch({ type: 'RUN_LOTTERY' });
  }, []);

  // Make draft pick
  const makeDraftPick = useCallback((teamId, wonderkid) => {
    dispatch({ type: 'MAKE_DRAFT_PICK', payload: { teamId, wonderkid } });
  }, []);

  // Complete draft
  const completeDraft = useCallback(() => {
    dispatch({ type: 'COMPLETE_DRAFT' });
  }, []);

  // Update player match stats
  const updatePlayerMatchStats = useCallback((playerId, matchStats) => {
    dispatch({ type: 'UPDATE_PLAYER_MATCH_STATS', payload: { playerId, matchStats } });
  }, []);

  // Aggregate career stats at end of season
  const aggregateCareerStats = useCallback(() => {
    dispatch({ type: 'AGGREGATE_CAREER_STATS' });
  }, []);

  // Set career ID (for saving)
  const setCareerId = useCallback((id) => {
    dispatch({ type: 'SET_CAREER_ID', payload: id });
  }, []);

  // Reset career
  const resetCareer = useCallback(() => {
    dispatch({ type: 'RESET_CAREER' });
  }, []);

  // Get team budget for current season
  const getTeamBudget = useCallback((teamId) => {
    return state.teamBudgets[teamId] || calculateSeasonBudget({ id: teamId }, null, state.currentSeason);
  }, [state.teamBudgets, state.currentSeason]);

  // Get player by ID
  const getPlayerById = useCallback((playerId) => {
    return state.players.find(p => p.id === playerId);
  }, [state.players]);

  // Get player career stats
  const getPlayerCareerStats = useCallback((playerId) => {
    return state.playerCareerStats[playerId] || null;
  }, [state.playerCareerStats]);

  // Get team trophy count
  const getTeamTrophies = useCallback((teamId) => {
    return state.trophyCabinet[teamId] || { leagues: 0, cups: 0, superCups: 0 };
  }, [state.trophyCabinet]);

  // Get current draft pick data
  const getCurrentDraftPick = useCallback(() => {
    if (!state.draftState) return null;
    const { draftOrder, currentPick } = state.draftState;
    return draftOrder?.find(p => p.pick === currentPick) || null;
  }, [state.draftState]);

  // AI makes draft pick
  const processAIDraftPick = useCallback(() => {
    const pickData = getCurrentDraftPick();
    if (!pickData || isHumanTeam(pickData.teamId)) return null;

    const team = state.teams.find(t => t.id === pickData.teamId);
    if (!team) return null;

    const selection = getAIDraftPick(team, state.draftState.availableWonderkids);
    if (selection) {
      makeDraftPick(pickData.teamId, selection);
      return selection;
    }
    return null;
  }, [getCurrentDraftPick, state.draftState, state.teams, makeDraftPick]);

  const value = {
    state,
    dispatch,

    // Career management
    startNewCareer,
    loadExistingCareer,
    loadLastCareer,
    resetCareer,
    setCareerId,

    // Phase management
    advancePhase,
    setPhase,
    completeTournament,
    startOffSeason,
    startNewSeason,

    // Draft management
    initializeDraft,
    runDraftLottery,
    makeDraftPick,
    completeDraft,
    getCurrentDraftPick,
    processAIDraftPick,

    // Stats management
    updatePlayerMatchStats,
    aggregateCareerStats,

    // Getters
    getTeamBudget,
    getPlayerById,
    getPlayerCareerStats,
    getTeamTrophies,

    // Helper values
    isCareerMode: state.isCareerMode,
    currentSeason: state.currentSeason,
    seasonPhase: state.seasonPhase,
    teams: state.teams,
    players: state.players,
  };

  return (
    <CareerContext.Provider value={value}>
      {children}
    </CareerContext.Provider>
  );
}

export function useCareer() {
  const context = useContext(CareerContext);
  if (!context) {
    throw new Error('useCareer must be used within CareerProvider');
  }
  return context;
}
