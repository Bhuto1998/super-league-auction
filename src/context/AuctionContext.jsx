import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import teamsData from '../data/teams.json';
import playersData from '../data/players.json';
import {
  POSITION_REQUIREMENTS,
  RETENTION_PRICES,
  RTM_CARDS_PER_TEAM,
  MAX_SQUAD_SIZE,
  BASE_PRICE,
  STARTING_BUDGET,
  getNextBidAmount,
  canTeamBid,
  getTeamSquadSize,
  getPositionCategory,
  weightedShuffleByRating,
  shuffleArray,
  isRTMEligible,
  canUseRTM,
  formatCurrency,
  exportToCSV,
  exportToJSON,
  getMaxRetentions,
  getRTMCards,
  getRetentionPrice,
  calculateRetentionCost,
  validateRetentionAffordability,
} from '../utils/auctionHelpers';
import { isHumanTeam } from '../utils/budgetCalculator';
import {
  shouldAIBid,
  getAIBidAmount,
  shouldAIUseRTM,
  getAIRetentions,
  getAIBidDelay,
} from '../utils/aiEngine';
import { ELITE_RATING_THRESHOLD } from '../data/teamPersonalities';

const STORAGE_KEY = 'super-league-auction-s4-v1';

// Playable teams in multiplayer mode
const MULTIPLAYER_TEAMS = ['real-madrid', 'barcelona', 'bayern'];

// Initialize teams with auction state
function initializeTeams(teams, isMultiplayer = false, localTeamId = null, careerBudgets = null, seasonNumber = 1) {
  return teams.map(team => {
    // In multiplayer, only the local team is user-controlled
    const isUserControlled = isMultiplayer
      ? team.id === localTeamId
      : team.isUserControlled;

    // Use career budgets if provided, otherwise default
    const budget = careerBudgets?.[team.id]?.totalBudget || STARTING_BUDGET;

    // RTM cards: 5 for human teams, 0 for AI teams
    const rtmCards = isHumanTeam(team.id) ? getRTMCards(team.id) : 0;

    return {
      ...team,
      isUserControlled,
      remainingBudget: budget,
      budget: budget, // Store original budget for reference
      retainedPlayers: [],
      auctionedPlayers: [],
      rtmCardsRemaining: rtmCards,
      positionCount: { GK: 0, DEF: 0, MID: 0, FWD: 0 },
    };
  });
}

// Initialize player pool with position categories
function initializePlayerPool(players) {
  return players.map(player => ({
    ...player,
    positionCategory: player.positionCategory || getPositionCategory(player.position),
  }));
}

// Initialize AI auction state for tracking elite purchases
function initializeAIAuctionState() {
  const state = {};
  teamsData.forEach(team => {
    if (!team.isUserControlled) {
      state[team.id] = {
        elitePurchases: 0,
        totalSpentOnElite: 0,
      };
    }
  });
  return state;
}

const initialState = {
  // Phase: 'retention' | 'auction' | 'rtm' | 'complete'
  phase: 'retention',

  // Teams with full state
  teams: initializeTeams(teamsData),

  // Player pools
  allPlayers: initializePlayerPool(playersData),
  auctionPool: [],  // Players available for auction (excludes retained)
  currentPlayerIndex: 0,

  // Current auction state
  currentAuction: null,
  bidHistory: [],
  passedTeams: [],

  // RTM state
  pendingRTM: null,

  // Results
  soldPlayers: [],
  unsoldPlayers: [],

  // Retention tracking (for user-controlled teams)
  retentionComplete: {},

  // AI auction state (tracks elite purchases per AI team)
  aiAuctionState: initializeAIAuctionState(),

  // UI state
  selectedUserTeam: teamsData.find(t => t.isUserControlled)?.id || 'real-madrid',
  auctionRound: 0,

  // Multiplayer state
  isMultiplayer: false,
  isHost: false,
  localTeamId: null,
  roomCode: null,

  // Career mode state
  isCareerMode: false,
  careerSeasonNumber: 1,
  careerBudgets: null,
};

function auctionReducer(state, action) {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...action.payload };

    case 'SYNC_STATE':
      // For multiplayer clients receiving state from host
      return { ...action.payload };

    case 'SET_MULTIPLAYER_MODE': {
      const { isMultiplayer, isHost, localTeamId, roomCode } = action.payload;

      // Reinitialize teams for multiplayer mode
      const newTeams = initializeTeams(teamsData, isMultiplayer, localTeamId);

      return {
        ...initialState,
        teams: newTeams,
        allPlayers: initializePlayerPool(playersData),
        isMultiplayer,
        isHost,
        localTeamId,
        roomCode,
        selectedUserTeam: localTeamId || 'real-madrid',
      };
    }

    case 'SET_CAREER_MODE': {
      const { players, budgets, seasonNumber, draftedPlayers = [] } = action.payload;

      // Reinitialize teams with career budgets
      const newTeams = initializeTeams(teamsData, false, null, budgets, seasonNumber);

      // Add drafted players to their teams
      const teamsWithDraftPicks = newTeams.map(team => {
        const teamDraftPicks = draftedPlayers.filter(p => p.draftedBy === team.id);
        if (teamDraftPicks.length === 0) return team;

        const positionCount = { ...team.positionCount };
        teamDraftPicks.forEach(player => {
          const category = player.positionCategory || getPositionCategory(player.position);
          positionCount[category] = (positionCount[category] || 0) + 1;
        });

        return {
          ...team,
          retainedPlayers: teamDraftPicks.map(p => ({
            ...p,
            isDraftPick: true,
            retentionPrice: 0, // Drafted players are free
          })),
          positionCount,
        };
      });

      return {
        ...initialState,
        teams: teamsWithDraftPicks,
        allPlayers: initializePlayerPool(players),
        isCareerMode: true,
        careerSeasonNumber: seasonNumber,
        careerBudgets: budgets,
        selectedUserTeam: 'real-madrid',
      };
    }

    case 'SET_SELECTED_TEAM':
      return { ...state, selectedUserTeam: action.payload };

    // === RETENTION PHASE ===
    case 'COMPLETE_RETENTION': {
      const { teamId, players } = action.payload;

      // Find the team to get its budget
      const team = state.teams.find(t => t.id === teamId);
      const teamBudget = team?.budget || STARTING_BUDGET;

      // Calculate retention cost using career-aware pricing
      const { totalCost: retentionCost } = calculateRetentionCost(players);

      // Preserve any existing draft picks in retained players
      const existingDraftPicks = team?.retainedPlayers?.filter(p => p.isDraftPick) || [];

      // Update position counts (include draft picks)
      const positionCount = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
      existingDraftPicks.forEach(player => {
        const category = player.positionCategory || getPositionCategory(player.position);
        positionCount[category] = (positionCount[category] || 0) + 1;
      });
      players.forEach(player => {
        const category = player.positionCategory || getPositionCategory(player.position);
        positionCount[category] = (positionCount[category] || 0) + 1;
      });

      const newTeams = state.teams.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            retainedPlayers: [
              ...existingDraftPicks,
              ...players.map((p, i) => ({
                ...p,
                retentionPrice: getRetentionPrice(i + 1, p.rating),
                retentionSlot: i + 1,
              })),
            ],
            remainingBudget: teamBudget - retentionCost,
            positionCount,
          };
        }
        return t;
      });

      const newRetentionComplete = {
        ...state.retentionComplete,
        [teamId]: true,
      };

      return {
        ...state,
        teams: newTeams,
        retentionComplete: newRetentionComplete,
      };
    }

    case 'AUTO_RETAIN_AI_TEAMS': {
      // AI teams can retain 2 players in career mode
      const newRetentionComplete = { ...state.retentionComplete };
      const newTeams = [...state.teams];

      state.teams.forEach((team, teamIndex) => {
        // Skip human teams
        if (isHumanTeam(team.id)) return;

        // Get max retentions for this AI team (always 2)
        const maxRetentions = getMaxRetentions(team.id, state.careerSeasonNumber || 1);

        if (maxRetentions > 0) {
          // AI auto-retains based on rating (top rated players)
          const aiRetentions = getAIRetentions(state.allPlayers, team.id).slice(0, maxRetentions);

          if (aiRetentions.length > 0) {
            const { totalCost: retentionCost } = calculateRetentionCost(aiRetentions);
            const positionCount = { ...team.positionCount };

            // Preserve any draft picks
            const existingDraftPicks = team.retainedPlayers?.filter(p => p.isDraftPick) || [];
            existingDraftPicks.forEach(player => {
              const category = player.positionCategory || getPositionCategory(player.position);
              positionCount[category] = (positionCount[category] || 0) + 1;
            });

            aiRetentions.forEach(player => {
              const category = player.positionCategory || getPositionCategory(player.position);
              positionCount[category] = (positionCount[category] || 0) + 1;
            });

            newTeams[teamIndex] = {
              ...team,
              retainedPlayers: [
                ...existingDraftPicks,
                ...aiRetentions.map((p, i) => ({
                  ...p,
                  retentionPrice: getRetentionPrice(i + 1, p.rating),
                  retentionSlot: i + 1,
                })),
              ],
              remainingBudget: (team.budget || STARTING_BUDGET) - retentionCost,
              positionCount,
            };
          }
        }

        newRetentionComplete[team.id] = true;
      });

      return {
        ...state,
        teams: newTeams,
        retentionComplete: newRetentionComplete,
      };
    }

    case 'START_AUCTION_PHASE': {
      // Get all retained player IDs (including draft picks)
      const retainedIds = new Set();
      state.teams.forEach(team => {
        team.retainedPlayers.forEach(player => {
          retainedIds.add(player.id);
        });
      });

      // Create auction pool (exclude retained players and draft picks)
      const auctionPool = state.allPlayers.filter(player => {
        // Exclude retained players
        if (retainedIds.has(player.id)) return false;
        // Exclude players already drafted by a team (they're already assigned)
        if (player.draftedBy) return false;
        return true;
      });
      const shuffledPool = weightedShuffleByRating(auctionPool);

      return {
        ...state,
        phase: 'auction',
        auctionPool: shuffledPool,
        currentPlayerIndex: 0,
        auctionRound: 1,
      };
    }

    // === AUCTION PHASE ===
    case 'START_NEXT_AUCTION': {
      // Check if auction is complete
      const allTeamsFull = state.teams.every(team => getTeamSquadSize(team) >= MAX_SQUAD_SIZE);
      if (allTeamsFull || state.currentPlayerIndex >= state.auctionPool.length) {
        return { ...state, phase: 'complete', currentAuction: null };
      }

      const player = state.auctionPool[state.currentPlayerIndex];

      return {
        ...state,
        currentAuction: {
          player,
          currentBid: BASE_PRICE,
          highestBidder: null,
          startingPrice: BASE_PRICE,
        },
        bidHistory: [],
        passedTeams: [],
        auctionRound: state.currentPlayerIndex + 1,
      };
    }

    case 'PLACE_BID': {
      const { teamId, amount } = action.payload;

      // Validate bid
      const team = state.teams.find(t => t.id === teamId);
      if (!team || !canTeamBid(team, amount, state.currentAuction.player)) {
        return state;
      }

      // Don't allow bidding if team has passed
      if (state.passedTeams.includes(teamId)) {
        return state;
      }

      // Check if bid is valid increment
      if (amount < getNextBidAmount(state.currentAuction.currentBid) && state.currentAuction.highestBidder) {
        return state;
      }

      const newBidHistory = [
        ...state.bidHistory,
        { teamId, amount, type: 'bid', teamName: team.name },
      ];

      return {
        ...state,
        currentAuction: {
          ...state.currentAuction,
          currentBid: amount,
          highestBidder: teamId,
        },
        bidHistory: newBidHistory,
        // Passes are permanent - don't reset passedTeams
      };
    }

    case 'PASS': {
      const { teamId } = action.payload;

      // Don't allow highest bidder to pass (they already have winning bid)
      if (teamId === state.currentAuction?.highestBidder) {
        return state;
      }

      const newPassedTeams = [...state.passedTeams, teamId];
      const team = state.teams.find(t => t.id === teamId);

      const newBidHistory = [
        ...state.bidHistory,
        { teamId, type: 'pass', teamName: team?.name },
      ];

      return {
        ...state,
        passedTeams: newPassedTeams,
        bidHistory: newBidHistory,
      };
    }

    case 'END_AUCTION': {
      const { sold, winnerId, winningBid } = action.payload;

      if (!sold) {
        // Player goes unsold
        const player = state.currentAuction.player;
        return {
          ...state,
          unsoldPlayers: [...state.unsoldPlayers, player],
          currentAuction: null,
          bidHistory: [],
          passedTeams: [],
          currentPlayerIndex: state.currentPlayerIndex + 1,
        };
      }

      const player = state.currentAuction.player;

      // Check for RTM eligibility - only human teams (Big Three) can use RTM
      const rtmEligibleTeam = state.teams.find(team =>
        team.id !== winnerId &&
        isHumanTeam(team.id) &&  // Only human teams can use RTM
        team.rtmCardsRemaining > 0 &&
        isRTMEligible(player, team) &&
        canUseRTM(team, winningBid, player)
      );

      if (rtmEligibleTeam) {
        // Trigger RTM phase
        return {
          ...state,
          phase: 'rtm',
          pendingRTM: {
            player,
            winningTeam: winnerId,
            winningBid,
            rtmTeam: rtmEligibleTeam.id,
          },
        };
      }

      // No RTM - complete the sale
      return completeSale(state, winnerId, winningBid, player);
    }

    // === RTM PHASE ===
    case 'USE_RTM': {
      const { teamId } = action.payload;
      const { player, winningBid } = state.pendingRTM;

      // Update RTM cards
      const newTeams = state.teams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            rtmCardsRemaining: team.rtmCardsRemaining - 1,
          };
        }
        return team;
      });

      // Complete sale to RTM team
      const stateWithTeams = { ...state, teams: newTeams };
      const finalState = completeSale(stateWithTeams, teamId, winningBid, player, true);

      return {
        ...finalState,
        phase: 'auction',
        pendingRTM: null,
      };
    }

    case 'DECLINE_RTM': {
      const { winningTeam, winningBid, player } = state.pendingRTM;

      const finalState = completeSale(state, winningTeam, winningBid, player);

      return {
        ...finalState,
        phase: 'auction',
        pendingRTM: null,
      };
    }

    // === CONTROL ===
    case 'RESET_AUCTION':
      localStorage.removeItem(STORAGE_KEY);
      return {
        ...initialState,
        teams: initializeTeams(
          teamsData,
          state.isMultiplayer,
          state.localTeamId,
          state.careerBudgets,
          state.careerSeasonNumber
        ),
        allPlayers: initializePlayerPool(playersData),
        aiAuctionState: initializeAIAuctionState(),
        isMultiplayer: state.isMultiplayer,
        isHost: state.isHost,
        localTeamId: state.localTeamId,
        roomCode: state.roomCode,
        selectedUserTeam: state.localTeamId || 'real-madrid',
        // Preserve career mode state
        isCareerMode: state.isCareerMode,
        careerSeasonNumber: state.careerSeasonNumber,
        careerBudgets: state.careerBudgets,
      };

    case 'AUTO_COMPLETE_AUCTION': {
      // Get remaining players from the auction pool
      const remainingPlayers = state.auctionPool.slice(state.currentPlayerIndex);

      // Group remaining players by position category
      const playersByPosition = {
        GK: remainingPlayers.filter(p => (p.positionCategory || getPositionCategory(p.position)) === 'GK'),
        DEF: remainingPlayers.filter(p => (p.positionCategory || getPositionCategory(p.position)) === 'DEF'),
        MID: remainingPlayers.filter(p => (p.positionCategory || getPositionCategory(p.position)) === 'MID'),
        FWD: remainingPlayers.filter(p => (p.positionCategory || getPositionCategory(p.position)) === 'FWD'),
      };

      // Shuffle each position group randomly for variety
      Object.keys(playersByPosition).forEach(pos => {
        playersByPosition[pos] = shuffleArray(playersByPosition[pos]);
      });

      // Clone teams for modification
      let newTeams = state.teams.map(team => ({
        ...team,
        auctionedPlayers: [...team.auctionedPlayers],
        positionCount: { ...team.positionCount },
      }));

      const newSoldPlayers = [...state.soldPlayers];
      const newUnsoldPlayers = [...state.unsoldPlayers];

      // Helper function to find team that needs a position (with randomization)
      const findTeamNeedingPosition = (positionCategory) => {
        const required = POSITION_REQUIREMENTS[positionCategory];

        // Find teams that still need this position and have room
        const eligibleTeams = newTeams.filter(team => {
          const squadSize = team.retainedPlayers.length + team.auctionedPlayers.length;
          const currentCount = team.positionCount[positionCategory] || 0;
          return squadSize < MAX_SQUAD_SIZE && currentCount < required;
        });

        if (eligibleTeams.length === 0) {
          // No team needs this position, find any team with room
          const teamsWithRoom = newTeams.filter(team => {
            const squadSize = team.retainedPlayers.length + team.auctionedPlayers.length;
            return squadSize < MAX_SQUAD_SIZE;
          });
          // Return random team from those with room
          return teamsWithRoom.length > 0
            ? teamsWithRoom[Math.floor(Math.random() * teamsWithRoom.length)]
            : null;
        }

        // Group teams by how much they need this position
        const maxNeed = Math.max(...eligibleTeams.map(t => required - (t.positionCount[positionCategory] || 0)));
        const teamsWithMaxNeed = eligibleTeams.filter(t => {
          const need = required - (t.positionCount[positionCategory] || 0);
          return need === maxNeed;
        });

        // Randomly pick from teams with highest need
        return teamsWithMaxNeed[Math.floor(Math.random() * teamsWithMaxNeed.length)];
      };

      // Distribute players position by position to ensure balanced squads
      const positionOrder = ['GK', 'DEF', 'MID', 'FWD'];

      // First pass: Fill required positions
      for (const positionCategory of positionOrder) {
        const playersInPosition = playersByPosition[positionCategory];

        for (const player of playersInPosition) {
          const team = findTeamNeedingPosition(positionCategory);

          if (!team) {
            newUnsoldPlayers.push(player);
            continue;
          }

          const teamIndex = newTeams.findIndex(t => t.id === team.id);
          const price = BASE_PRICE + Math.floor(Math.random() * BASE_PRICE);

          newTeams[teamIndex] = {
            ...newTeams[teamIndex],
            auctionedPlayers: [
              ...newTeams[teamIndex].auctionedPlayers,
              { ...player, purchasePrice: price, wasRTM: false, autoAssigned: true },
            ],
            remainingBudget: newTeams[teamIndex].remainingBudget - price,
            positionCount: {
              ...newTeams[teamIndex].positionCount,
              [positionCategory]: (newTeams[teamIndex].positionCount[positionCategory] || 0) + 1,
            },
          };

          newSoldPlayers.push({
            ...player,
            soldTo: team.id,
            soldFor: price,
            wasRTM: false,
            autoAssigned: true,
          });
        }
      }

      return {
        ...state,
        teams: newTeams,
        soldPlayers: newSoldPlayers,
        unsoldPlayers: newUnsoldPlayers,
        currentAuction: null,
        phase: 'complete',
        currentPlayerIndex: state.auctionPool.length,
      };
    }

    case 'SKIP_TO_AUCTION': {
      // For testing - auto-retain only for main 3 teams, AI teams start clean
      const newTeams = state.teams.map(team => {
        // Only main 3 teams get retentions
        if (!MULTIPLAYER_TEAMS.includes(team.id)) {
          return {
            ...team,
            retainedPlayers: [],
            remainingBudget: STARTING_BUDGET,
            positionCount: { GK: 0, DEF: 0, MID: 0, FWD: 0 },
          };
        }

        const retentions = getAIRetentions(state.allPlayers, team.id);

        let retentionCost = 0;
        retentions.forEach((_, index) => {
          retentionCost += RETENTION_PRICES[index + 1] || 0;
        });

        const positionCount = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
        retentions.forEach(player => {
          const category = player.positionCategory || getPositionCategory(player.position);
          positionCount[category] = (positionCount[category] || 0) + 1;
        });

        return {
          ...team,
          retainedPlayers: retentions.map((p, i) => ({
            ...p,
            retentionPrice: RETENTION_PRICES[i + 1],
            retentionSlot: i + 1,
          })),
          remainingBudget: STARTING_BUDGET - retentionCost,
          positionCount,
        };
      });

      // Create auction pool
      const retainedIds = new Set();
      newTeams.forEach(team => {
        team.retainedPlayers.forEach(player => {
          retainedIds.add(player.id);
        });
      });

      const auctionPool = state.allPlayers.filter(player => !retainedIds.has(player.id));
      const shuffledPool = weightedShuffleByRating(auctionPool);

      return {
        ...state,
        teams: newTeams,
        phase: 'auction',
        auctionPool: shuffledPool,
        currentPlayerIndex: 0,
        auctionRound: 1,
        retentionComplete: Object.fromEntries(teamsData.map(t => [t.id, true])),
      };
    }

    default:
      return state;
  }
}

// Helper to complete a sale (used by both normal sale and RTM)
function completeSale(state, winnerId, winningBid, player, wasRTM = false) {
  const positionCategory = player.positionCategory || getPositionCategory(player.position);

  const newTeams = state.teams.map(team => {
    if (team.id === winnerId) {
      return {
        ...team,
        auctionedPlayers: [
          ...team.auctionedPlayers,
          { ...player, purchasePrice: winningBid, wasRTM },
        ],
        remainingBudget: team.remainingBudget - winningBid,
        positionCount: {
          ...team.positionCount,
          [positionCategory]: (team.positionCount[positionCategory] || 0) + 1,
        },
      };
    }
    return team;
  });

  // Update AI auction state for elite purchases tracking
  let newAiAuctionState = state.aiAuctionState;
  const winningTeam = state.teams.find(t => t.id === winnerId);
  const isAITeam = winningTeam && !winningTeam.isUserControlled && !MULTIPLAYER_TEAMS.includes(winnerId);
  const isElitePlayer = player.rating >= ELITE_RATING_THRESHOLD;

  if (isAITeam && isElitePlayer) {
    const currentState = state.aiAuctionState[winnerId] || { elitePurchases: 0, totalSpentOnElite: 0 };
    newAiAuctionState = {
      ...state.aiAuctionState,
      [winnerId]: {
        elitePurchases: currentState.elitePurchases + 1,
        totalSpentOnElite: currentState.totalSpentOnElite + winningBid,
      },
    };
  }

  const soldPlayer = {
    ...player,
    soldTo: winnerId,
    soldFor: winningBid,
    wasRTM,
  };

  const newSoldPlayers = [...state.soldPlayers, soldPlayer];
  const nextPlayerIndex = state.currentPlayerIndex + 1;

  // Check if auction is complete
  const allTeamsFull = newTeams.every(team => getTeamSquadSize(team) >= MAX_SQUAD_SIZE);
  const noMorePlayers = nextPlayerIndex >= state.auctionPool.length;

  return {
    ...state,
    teams: newTeams,
    soldPlayers: newSoldPlayers,
    aiAuctionState: newAiAuctionState,
    currentAuction: null,
    bidHistory: [],
    passedTeams: [],
    currentPlayerIndex: nextPlayerIndex,
    phase: allTeamsFull || noMorePlayers ? 'complete' : state.phase,
  };
}

const AuctionContext = createContext(null);

export function AuctionProvider({ children }) {
  const [state, dispatch] = useReducer(auctionReducer, initialState, (initial) => {
    // In multiplayer mode, don't load from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only load if it was a single-player session
        if (parsed.phase && parsed.teams && parsed.allPlayers && !parsed.isMultiplayer) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved state:', e);
      }
    }
    return {
      ...initial,
      teams: initializeTeams(teamsData),
      allPlayers: initializePlayerPool(playersData),
    };
  });

  // Ref for multiplayer sync callback
  const syncCallbackRef = useRef(null);

  // Save to localStorage whenever state changes (only for single-player)
  useEffect(() => {
    if (!state.isMultiplayer) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // Sync state to multiplayer clients (host only)
  useEffect(() => {
    if (state.isMultiplayer && state.isHost && syncCallbackRef.current) {
      syncCallbackRef.current(state);
    }
  }, [state]);

  // Register sync callback for multiplayer
  const registerSyncCallback = useCallback((callback) => {
    syncCallbackRef.current = callback;
  }, []);

  // Check if auction should auto-end (all eligible teams passed)
  const checkAuctionEnd = useCallback(() => {
    if (!state.currentAuction) return;

    const eligibleTeams = state.teams.filter(team => {
      // Check if team can still bid
      const nextBid = state.currentAuction.highestBidder
        ? getNextBidAmount(state.currentAuction.currentBid)
        : state.currentAuction.currentBid;

      return (
        !state.passedTeams.includes(team.id) &&
        team.id !== state.currentAuction.highestBidder &&
        canTeamBid(team, nextBid, state.currentAuction.player)
      );
    });

    // If no eligible teams left (or only highest bidder)
    if (eligibleTeams.length === 0) {
      if (state.currentAuction.highestBidder) {
        // Sold to highest bidder
        dispatch({
          type: 'END_AUCTION',
          payload: {
            sold: true,
            winnerId: state.currentAuction.highestBidder,
            winningBid: state.currentAuction.currentBid,
          },
        });
      } else {
        // Unsold
        dispatch({
          type: 'END_AUCTION',
          payload: { sold: false },
        });
      }
    }
  }, [state.currentAuction, state.passedTeams, state.teams]);

  // AI bidding logic (only runs on host in multiplayer)
  const processAIBids = useCallback(() => {
    if (!state.currentAuction || state.phase !== 'auction') return;
    if (state.isMultiplayer && !state.isHost) return;

    // In multiplayer, AI controls all non-human teams
    const aiTeams = state.isMultiplayer
      ? state.teams.filter(t => !MULTIPLAYER_TEAMS.includes(t.id))
      : state.teams.filter(t => !t.isUserControlled);

    // Calculate auction progress (0-1 scale for back-loaded teams)
    const auctionProgress = state.auctionPool.length > 0
      ? state.currentPlayerIndex / state.auctionPool.length
      : 0.5;

    // Find AI team that wants to bid
    for (const team of aiTeams) {
      if (state.passedTeams.includes(team.id)) continue;
      if (team.id === state.currentAuction.highestBidder) continue;

      const shouldBid = shouldAIBid(
        team,
        state.currentAuction.player,
        state.currentAuction.currentBid,
        state.aiAuctionState,
        auctionProgress,
        state.currentAuction.highestBidder
      );

      if (shouldBid) {
        const bidAmount = getAIBidAmount(
          team,
          state.currentAuction.player,
          state.currentAuction.currentBid,
          state.aiAuctionState,
          auctionProgress,
          state.currentAuction.highestBidder
        );
        if (bidAmount) {
          setTimeout(() => {
            dispatch({ type: 'PLACE_BID', payload: { teamId: team.id, amount: bidAmount } });
          }, getAIBidDelay(team.id));
          return;
        }
      }

      // AI passes
      setTimeout(() => {
        dispatch({ type: 'PASS', payload: { teamId: team.id } });
      }, getAIBidDelay(team.id) * 0.5);
      return;
    }

    // All AI teams processed, check for auction end
    checkAuctionEnd();
  }, [state.currentAuction, state.phase, state.teams, state.passedTeams, state.isMultiplayer, state.isHost, state.aiAuctionState, state.auctionPool.length, state.currentPlayerIndex, checkAuctionEnd]);

  // AI RTM logic (only runs on host in multiplayer)
  const processAIRTM = useCallback(() => {
    if (!state.pendingRTM || state.phase !== 'rtm') return;
    if (state.isMultiplayer && !state.isHost) return;

    const rtmTeam = state.teams.find(t => t.id === state.pendingRTM.rtmTeam);
    if (!rtmTeam) return;

    // Check if this is a human-controlled team (either in multiplayer or single-player)
    const isHumanTeam = state.isMultiplayer
      ? MULTIPLAYER_TEAMS.includes(rtmTeam.id)
      : rtmTeam.isUserControlled;
    if (isHumanTeam) return; // Let the human decide

    // AI decides whether to use RTM (but AI teams can't use RTM anymore, so this won't trigger)
    setTimeout(() => {
      if (shouldAIUseRTM(rtmTeam, state.pendingRTM.player, state.pendingRTM.winningBid)) {
        dispatch({ type: 'USE_RTM', payload: { teamId: rtmTeam.id } });
      } else {
        dispatch({ type: 'DECLINE_RTM' });
      }
    }, getAIBidDelay());
  }, [state.pendingRTM, state.phase, state.teams, state.isMultiplayer, state.isHost]);

  // Export functions
  const handleExportCSV = useCallback(() => {
    const csv = exportToCSV(state.teams);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'super-league-season4-teams.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.teams]);

  const handleExportJSON = useCallback(() => {
    const json = exportToJSON(state.teams, state.soldPlayers);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'super-league-season4-teams.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.teams, state.soldPlayers]);

  // Auto-complete auction
  const autoCompleteAuction = useCallback(() => {
    dispatch({ type: 'AUTO_COMPLETE_AUCTION' });
  }, []);

  const value = {
    state,
    dispatch,
    processAIBids,
    processAIRTM,
    checkAuctionEnd,
    autoCompleteAuction,
    exportToCSV: handleExportCSV,
    exportToJSON: handleExportJSON,
    registerSyncCallback,

    // Helper functions
    getTeamById: (id) => state.teams.find(t => t.id === id),
    getUserTeams: () => {
      if (state.isMultiplayer) {
        // In multiplayer, only return the local team
        return state.teams.filter(t => t.id === state.localTeamId);
      }
      return state.teams.filter(t => t.isUserControlled);
    },
    getAITeams: () => {
      if (state.isMultiplayer) {
        return state.teams.filter(t => !MULTIPLAYER_TEAMS.includes(t.id));
      }
      return state.teams.filter(t => !t.isUserControlled);
    },
    getSelectedUserTeam: () => state.teams.find(t => t.id === state.selectedUserTeam),

    canTeamBid: (teamId, amount) => {
      const team = state.teams.find(t => t.id === teamId);
      if (!team || !state.currentAuction) return false;
      return canTeamBid(team, amount, state.currentAuction.player);
    },

    getTeamSquadCount: (teamId) => {
      const team = state.teams.find(t => t.id === teamId);
      return team ? getTeamSquadSize(team) : 0;
    },

    getAvailableRetentionPlayers: (teamId) => {
      return state.allPlayers.filter(p => p.realClub === teamId);
    },

    getMaxRetentionsForTeam: (teamId) => {
      return getMaxRetentions(teamId, state.careerSeasonNumber || 1);
    },

    getRetentionPriceForSlot: (slot, playerRating) => {
      return getRetentionPrice(slot, playerRating);
    },

    validateRetention: (teamId, players) => {
      const team = state.teams.find(t => t.id === teamId);
      if (!team) return { valid: false, error: 'Team not found' };
      return validateRetentionAffordability(team, players, team.budget || STARTING_BUDGET);
    },

    getTotalRounds: () => state.auctionPool.length,
    getCurrentRound: () => state.currentPlayerIndex + 1,

    isAllUserRetentionComplete: () => {
      if (state.isMultiplayer) {
        // In multiplayer, only check the local team
        return state.localTeamId ? state.retentionComplete[state.localTeamId] : false;
      }
      const userTeams = state.teams.filter(t => t.isUserControlled);
      return userTeams.every(t => state.retentionComplete[t.id]);
    },

    // Multiplayer helpers
    isLocalTeam: (teamId) => state.localTeamId === teamId,
    isPlayableTeam: (teamId) => MULTIPLAYER_TEAMS.includes(teamId),
    MULTIPLAYER_TEAMS,

    formatCurrency,
  };

  return (
    <AuctionContext.Provider value={value}>
      {children}
    </AuctionContext.Provider>
  );
}

export function useAuction() {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within AuctionProvider');
  }
  return context;
}
