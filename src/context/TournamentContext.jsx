import React, { createContext, useContext, useReducer, useCallback } from 'react';
import {
  createGroups,
  generateGroupFixtures,
  organizeIntoMatchDays,
  calculateStandings,
  generateKnockoutFixtures,
  generateSemiFinalFixtures,
  generateFinalFixture,
  isBigThreeMatch,
  BIG_THREE,
} from '../engine/tournamentEngine';
import { quickSimulate } from '../engine/matchEngine';

const initialState = {
  // Tournament phase: 'idle' | 'draw' | 'groups' | 'qf' | 'sf' | 'final' | 'winner'
  phase: 'idle',

  // Teams from auction
  teams: [],
  teamsMap: {},

  // Draw state
  groups: { A: [], B: [] },
  drawAnimation: {
    isAnimating: false,
    currentStep: 0,
    revealed: [],
  },

  // Group Stage
  matchDay: 1,
  totalMatchDays: 8,
  allMatchDays: [], // Pre-organized fixtures for all 8 match days
  matchDayFixtures: [], // Current match day fixtures
  groupResults: { A: [], B: [] },
  standings: { A: [], B: [] },

  // Match simulation queue
  currentMatch: null, // Current match being visually simulated
  matchQueue: [], // Big 3 matches waiting for simulation
  pendingResults: [], // Results waiting to be processed

  // Knockouts - Two-legged ties for QF and SF, single leg final
  knockout: {
    qf: {
      ties: [], // Array of { home, away, leg1Result, leg2Result, winner, aggregate }
      currentTieIndex: 0,
      currentLeg: 1, // 1 or 2
    },
    sf: {
      ties: [],
      currentTieIndex: 0,
      currentLeg: 1,
    },
    final: {
      fixture: null,
      result: null,
      isNeutral: true, // No home advantage in final
    },
  },

  // Champion
  champion: null,
};

function tournamentReducer(state, action) {
  switch (action.type) {
    case 'START_TOURNAMENT': {
      const { teams } = action.payload;

      // Create teams map
      const teamsMap = {};
      teams.forEach(t => {
        teamsMap[t.id] = t;
      });

      return {
        ...initialState,
        phase: 'draw',
        teams,
        teamsMap,
        drawAnimation: {
          isAnimating: false,
          currentStep: 0,
          revealed: [],
        },
      };
    }

    case 'START_DRAW_ANIMATION': {
      return {
        ...state,
        drawAnimation: {
          ...state.drawAnimation,
          isAnimating: true,
          currentStep: 0,
          revealed: [],
        },
      };
    }

    case 'REVEAL_NEXT_TEAM': {
      const { team, group } = action.payload;
      const newGroups = { ...state.groups };
      newGroups[group] = [...newGroups[group], team];

      return {
        ...state,
        groups: newGroups,
        drawAnimation: {
          ...state.drawAnimation,
          currentStep: state.drawAnimation.currentStep + 1,
          revealed: [...state.drawAnimation.revealed, { team, group }],
        },
      };
    }

    case 'COMPLETE_DRAW': {
      const { groupA, groupB } = action.payload;

      // Generate fixtures for both groups
      const fixturesA = generateGroupFixtures(groupA);
      const fixturesB = generateGroupFixtures(groupB);

      // Organize into match days (may be more than 8 if overflow)
      const allMatchDays = organizeIntoMatchDays(fixturesA, fixturesB);

      return {
        ...state,
        phase: 'groups',
        groups: { A: groupA, B: groupB },
        allMatchDays,
        totalMatchDays: allMatchDays.length, // Dynamic based on actual match days
        matchDay: 1,
        matchDayFixtures: allMatchDays[0] || [],
        drawAnimation: {
          isAnimating: false,
          currentStep: 10,
          revealed: state.drawAnimation.revealed,
        },
      };
    }

    case 'SKIP_DRAW': {
      // Immediately create groups without animation
      const { groupA, groupB } = createGroups(state.teams);

      // Generate fixtures for both groups
      const fixturesA = generateGroupFixtures(groupA);
      const fixturesB = generateGroupFixtures(groupB);

      // Organize into match days (may be more than 8 if overflow)
      const allMatchDays = organizeIntoMatchDays(fixturesA, fixturesB);

      return {
        ...state,
        phase: 'groups',
        groups: { A: groupA, B: groupB },
        allMatchDays,
        totalMatchDays: allMatchDays.length, // Dynamic based on actual match days
        matchDay: 1,
        matchDayFixtures: allMatchDays[0] || [],
        drawAnimation: {
          isAnimating: false,
          currentStep: 10,
          revealed: [],
        },
      };
    }

    case 'SIMULATE_MATCH_DAY': {
      const fixtures = state.matchDayFixtures;
      const bigThreeMatches = [];
      const quickResults = [];

      fixtures.forEach(fixture => {
        // Get full team data from teamsMap, fallback to fixture data
        const homeTeam = state.teamsMap[fixture.home.id] || fixture.home;
        const awayTeam = state.teamsMap[fixture.away.id] || fixture.away;

        // ALWAYS build players array from retainedPlayers + auctionedPlayers
        // This ensures we have players even if the players array wasn't set earlier
        const buildPlayersArray = (team) => {
          if (team.players && team.players.length > 0) {
            return team.players;
          }
          return [...(team.retainedPlayers || []), ...(team.auctionedPlayers || [])];
        };

        const homeWithPlayers = {
          ...homeTeam,
          players: buildPlayersArray(homeTeam),
        };
        const awayWithPlayers = {
          ...awayTeam,
          players: buildPlayersArray(awayTeam),
        };

        if (isBigThreeMatch(fixture.home.id, fixture.away.id)) {
          // Queue for visual simulation
          bigThreeMatches.push({
            ...fixture,
            homeTeam: homeWithPlayers,
            awayTeam: awayWithPlayers,
          });
        } else {
          // Quick simulate
          const result = quickSimulate(homeWithPlayers, awayWithPlayers);
          quickResults.push({
            ...result,
            group: fixture.group,
            showDetails: false,
          });
        }
      });

      // Update group results with quick sim results
      const newGroupResults = { ...state.groupResults };
      quickResults.forEach(result => {
        if (result.group === 'A') {
          newGroupResults.A = [...newGroupResults.A, result];
        } else {
          newGroupResults.B = [...newGroupResults.B, result];
        }
      });

      // Calculate updated standings
      const newStandings = {
        A: calculateStandings(state.groups.A, newGroupResults.A),
        B: calculateStandings(state.groups.B, newGroupResults.B),
      };

      return {
        ...state,
        groupResults: newGroupResults,
        standings: newStandings,
        matchQueue: bigThreeMatches,
        currentMatch: bigThreeMatches[0] || null,
      };
    }

    case 'START_LIVE_MATCH': {
      const { match } = action.payload;
      return {
        ...state,
        currentMatch: match,
      };
    }

    case 'COMPLETE_LIVE_MATCH': {
      const { result } = action.payload;
      const currentMatch = state.currentMatch;

      // Add to group results
      const newGroupResults = { ...state.groupResults };
      const matchResult = {
        ...result,
        group: currentMatch.group,
        showDetails: true,
      };

      if (currentMatch.group === 'A') {
        newGroupResults.A = [...newGroupResults.A, matchResult];
      } else {
        newGroupResults.B = [...newGroupResults.B, matchResult];
      }

      // Calculate updated standings
      const newStandings = {
        A: calculateStandings(state.groups.A, newGroupResults.A),
        B: calculateStandings(state.groups.B, newGroupResults.B),
      };

      // Move to next match in queue
      const remainingQueue = state.matchQueue.slice(1);

      return {
        ...state,
        groupResults: newGroupResults,
        standings: newStandings,
        matchQueue: remainingQueue,
        currentMatch: remainingQueue[0] || null,
      };
    }

    case 'ADVANCE_MATCH_DAY': {
      const nextDay = state.matchDay + 1;

      if (nextDay > state.totalMatchDays) {
        // Group stage complete - move to knockouts
        const { quarterFinals } = generateKnockoutFixtures(
          state.standings.A,
          state.standings.B
        );

        // Convert fixtures to two-legged ties
        const qfTies = quarterFinals.map(fixture => ({
          ...fixture,
          home: fixture.home,
          away: fixture.away,
          leg1Result: null,
          leg2Result: null,
          winner: null,
          aggregate: null,
        }));

        return {
          ...state,
          phase: 'qf',
          knockout: {
            ...state.knockout,
            qf: {
              ties: qfTies,
              currentTieIndex: 0,
              currentLeg: 1,
            },
          },
          currentMatch: null,
          matchQueue: [],
        };
      }

      return {
        ...state,
        matchDay: nextDay,
        matchDayFixtures: state.allMatchDays[nextDay - 1] || [],
        matchQueue: [],
        currentMatch: null,
      };
    }

    case 'SKIP_TO_KNOCKOUT': {
      // Simulate ALL remaining group stage matches at once
      // But first show the final group stage results before transitioning to knockout
      const buildPlayersArray = (team) => {
        if (team.players && team.players.length > 0) {
          return team.players;
        }
        return [...(team.retainedPlayers || []), ...(team.auctionedPlayers || [])];
      };

      // Ensure we have groups and fixtures
      let groups = state.groups;
      let allMatchDays = state.allMatchDays;

      // If groups are empty, create them from teams
      if (!groups.A || groups.A.length === 0) {
        const { groupA, groupB } = createGroups(state.teams);
        groups = { A: groupA, B: groupB };
      }

      // If allMatchDays is empty, generate fixtures
      if (!allMatchDays || allMatchDays.length === 0) {
        const fixturesA = generateGroupFixtures(groups.A);
        const fixturesB = generateGroupFixtures(groups.B);
        allMatchDays = organizeIntoMatchDays(fixturesA, fixturesB);
      }

      // Collect all results that have already been played
      const playedFixturesA = new Set(
        state.groupResults.A.map(r => `${r.homeTeam}-${r.awayTeam}`)
      );
      const playedFixturesB = new Set(
        state.groupResults.B.map(r => `${r.homeTeam}-${r.awayTeam}`)
      );

      // Simulate all remaining fixtures
      const newResultsA = [...state.groupResults.A];
      const newResultsB = [...state.groupResults.B];

      // Go through all match days and simulate unplayed fixtures
      for (const dayFixtures of allMatchDays) {
        for (const fixture of dayFixtures) {
          const fixtureKey = `${fixture.home.id}-${fixture.away.id}`;
          const isGroup = fixture.group;
          const playedSet = isGroup === 'A' ? playedFixturesA : playedFixturesB;

          if (!playedSet.has(fixtureKey)) {
            // Get full team data
            const homeTeam = state.teamsMap[fixture.home.id] || fixture.home;
            const awayTeam = state.teamsMap[fixture.away.id] || fixture.away;

            // Ensure teams have players
            const homeWithPlayers = {
              ...homeTeam,
              players: buildPlayersArray(homeTeam),
            };
            const awayWithPlayers = {
              ...awayTeam,
              players: buildPlayersArray(awayTeam),
            };

            // Quick simulate
            const result = quickSimulate(homeWithPlayers, awayWithPlayers);
            const matchResult = {
              ...result,
              group: fixture.group,
              showDetails: false,
            };

            if (fixture.group === 'A') {
              newResultsA.push(matchResult);
              playedFixturesA.add(fixtureKey);
            } else {
              newResultsB.push(matchResult);
              playedFixturesB.add(fixtureKey);
            }
          }
        }
      }

      // Calculate final standings
      const finalStandings = {
        A: calculateStandings(groups.A, newResultsA),
        B: calculateStandings(groups.B, newResultsB),
      };

      // Stay in 'groups_complete' phase to show final results
      // User will click "Start Knockout" to proceed
      return {
        ...state,
        phase: 'groups_complete',
        groups,
        allMatchDays,
        totalMatchDays: allMatchDays.length,
        matchDay: allMatchDays.length,
        groupResults: { A: newResultsA, B: newResultsB },
        standings: finalStandings,
        matchQueue: [],
        currentMatch: null,
      };
    }

    case 'START_KNOCKOUT_STAGE': {
      // Generate knockout fixtures from final standings
      const { quarterFinals } = generateKnockoutFixtures(
        state.standings.A,
        state.standings.B
      );

      // Convert fixtures to two-legged ties
      const qfTies = quarterFinals.map(fixture => ({
        ...fixture,
        home: fixture.home,
        away: fixture.away,
        leg1Result: null,
        leg2Result: null,
        winner: null,
        aggregate: null,
      }));

      return {
        ...state,
        phase: 'qf',
        knockout: {
          ...state.knockout,
          qf: {
            ties: qfTies,
            currentTieIndex: 0,
            currentLeg: 1,
          },
        },
      };
    }

    case 'START_KNOCKOUT_MATCH': {
      const { fixture, round, index } = action.payload;
      const homeTeamBase = state.teamsMap[fixture.home.id] || fixture.home;
      const awayTeamBase = state.teamsMap[fixture.away.id] || fixture.away;

      // ALWAYS build players array from retainedPlayers + auctionedPlayers
      const buildPlayersArray = (team) => {
        if (team.players && team.players.length > 0) {
          return team.players;
        }
        return [...(team.retainedPlayers || []), ...(team.auctionedPlayers || [])];
      };

      const homeTeam = {
        ...homeTeamBase,
        players: buildPlayersArray(homeTeamBase),
      };
      const awayTeam = {
        ...awayTeamBase,
        players: buildPlayersArray(awayTeamBase),
      };

      return {
        ...state,
        currentMatch: {
          ...fixture,
          homeTeam,
          awayTeam,
          round,
          index,
        },
      };
    }

    case 'COMPLETE_KNOCKOUT_MATCH': {
      const { result, round, tieIndex, leg, winner } = action.payload;

      const newKnockout = { ...state.knockout };

      if (round === 'qf' || round === 'sf') {
        const roundData = round === 'qf' ? newKnockout.qf : newKnockout.sf;
        const ties = [...roundData.ties];
        const tie = { ...ties[tieIndex] };

        if (leg === 1) {
          tie.leg1Result = result;
          ties[tieIndex] = tie;

          // Check if all leg 1s are complete
          const allLeg1Done = ties.every(t => t.leg1Result !== null);

          // Move to next tie's leg 1, or if all leg 1s done, start leg 2s
          const nextTieIndex = tieIndex + 1;
          const newRoundData = {
            ...roundData,
            ties,
            currentTieIndex: allLeg1Done ? 0 : (nextTieIndex < ties.length ? nextTieIndex : 0),
            currentLeg: allLeg1Done ? 2 : 1,
          };

          if (round === 'qf') {
            newKnockout.qf = newRoundData;
          } else {
            newKnockout.sf = newRoundData;
          }
        } else {
          // Leg 2 complete - determine winner
          tie.leg2Result = result;

          // IMPORTANT: Calculate aggregate ourselves from the two leg results
          // Don't rely on result.aggregateWinner which may not be set correctly
          //
          // Leg 1: tie.home (home) vs tie.away (away)
          // Leg 2: tie.away (home) vs tie.home (away) - teams swap venues
          //
          // So for aggregate:
          // tie.home's total goals = leg1 home goals + leg2 away goals
          // tie.away's total goals = leg1 away goals + leg2 home goals

          const leg1 = tie.leg1Result;
          const leg2 = result;

          const tieHomeAggregate = (leg1?.homeGoals || 0) + (leg2?.awayGoals || 0);
          const tieAwayAggregate = (leg1?.awayGoals || 0) + (leg2?.homeGoals || 0);

          tie.aggregate = {
            home: tieHomeAggregate,
            away: tieAwayAggregate
          };

          // Away goals for tie breaker:
          // tie.home's away goals = leg2.awayGoals (they were away in leg 2)
          // tie.away's away goals = leg1.awayGoals (they were away in leg 1)
          const tieHomeAwayGoals = leg2?.awayGoals || 0;
          const tieAwayAwayGoals = leg1?.awayGoals || 0;

          // Determine winner based on aggregate
          if (tieHomeAggregate > tieAwayAggregate) {
            tie.winner = tie.home;
            tie.decidedBy = 'aggregate';
          } else if (tieAwayAggregate > tieHomeAggregate) {
            tie.winner = tie.away;
            tie.decidedBy = 'aggregate';
          } else {
            // Aggregate is tied - check away goals rule
            if (tieHomeAwayGoals > tieAwayAwayGoals) {
              tie.winner = tie.home;
              tie.decidedBy = 'awayGoals';
            } else if (tieAwayAwayGoals > tieHomeAwayGoals) {
              tie.winner = tie.away;
              tie.decidedBy = 'awayGoals';
            } else {
              // Tied on aggregate AND away goals
              // Check if match result has extra time or penalties
              if (result.penalties) {
                // Penalty winner - need to map back to tie.home/tie.away
                // In leg 2: homeTeam = tie.away, awayTeam = tie.home
                if (result.penalties.winner === result.homeTeam?.id) {
                  tie.winner = tie.away;
                } else {
                  tie.winner = tie.home;
                }
                tie.decidedBy = 'penalties';
                tie.penaltyScore = {
                  home: result.penalties.homeScore,
                  away: result.penalties.awayScore,
                };
              } else if (result.extraTime) {
                // Extra time was played - recalculate with ET goals
                const etHomeGoals = result.extraTime.homeGoals || 0;
                const etAwayGoals = result.extraTime.awayGoals || 0;

                // Add ET goals to aggregate (leg 2 home = tie.away, leg 2 away = tie.home)
                const finalTieHomeAggregate = tieHomeAggregate + etAwayGoals;
                const finalTieAwayAggregate = tieAwayAggregate + etHomeGoals;

                tie.aggregate = {
                  home: finalTieHomeAggregate,
                  away: finalTieAwayAggregate
                };

                if (finalTieHomeAggregate > finalTieAwayAggregate) {
                  tie.winner = tie.home;
                } else if (finalTieAwayAggregate > finalTieHomeAggregate) {
                  tie.winner = tie.away;
                } else {
                  // Still tied after ET - should have gone to penalties
                  // Fallback: random winner (shouldn't happen)
                  tie.winner = Math.random() < 0.5 ? tie.home : tie.away;
                }
                tie.decidedBy = 'extraTime';
                tie.extraTime = result.extraTime;
              } else {
                // No ET/penalties in result but scores are tied
                // This means we need to simulate penalties here
                // For simplicity, random winner (this case shouldn't normally happen)
                tie.winner = Math.random() < 0.5 ? tie.home : tie.away;
                tie.decidedBy = 'penalties';
              }
            }
          }

          ties[tieIndex] = tie;

          // Move to next tie's leg 2 (stay on leg 2)
          const nextTieIndex = tieIndex + 1;
          if (round === 'qf') {
            newKnockout.qf = {
              ...roundData,
              ties,
              currentTieIndex: nextTieIndex < ties.length ? nextTieIndex : tieIndex,
              currentLeg: 2,
            };
          } else {
            newKnockout.sf = {
              ...roundData,
              ties,
              currentTieIndex: nextTieIndex < ties.length ? nextTieIndex : tieIndex,
              currentLeg: 2,
            };
          }
        }
      } else if (round === 'final') {
        newKnockout.final = {
          ...newKnockout.final,
          result: {
            ...result,
            winner,
          },
        };
      }

      return {
        ...state,
        knockout: newKnockout,
        currentMatch: null,
      };
    }

    case 'ADVANCE_TO_SF': {
      // Get winners from QF ties
      const qfWinners = state.knockout.qf.ties.map(tie => tie.winner).filter(Boolean);
      const sfFixtures = generateSemiFinalFixtures(qfWinners);

      // Convert to two-legged ties
      const sfTies = sfFixtures.map(fixture => ({
        ...fixture,
        home: fixture.home,
        away: fixture.away,
        leg1Result: null,
        leg2Result: null,
        winner: null,
        aggregate: null,
      }));

      return {
        ...state,
        phase: 'sf',
        knockout: {
          ...state.knockout,
          sf: {
            ties: sfTies,
            currentTieIndex: 0,
            currentLeg: 1,
          },
        },
      };
    }

    case 'ADVANCE_TO_FINAL': {
      // Get winners from SF ties
      const sfWinners = state.knockout.sf.ties.map(tie => tie.winner).filter(Boolean);
      const finalFixture = generateFinalFixture(sfWinners);

      return {
        ...state,
        phase: 'final',
        knockout: {
          ...state.knockout,
          final: {
            fixture: finalFixture,
            result: null,
            isNeutral: true, // Final is at neutral venue
          },
        },
      };
    }

    case 'SET_CHAMPION': {
      const { champion } = action.payload;

      return {
        ...state,
        phase: 'winner',
        champion,
      };
    }

    case 'SKIP_KNOCKOUT_ROUND': {
      // Simulate all remaining matches in current knockout round
      const buildPlayersArray = (team) => {
        if (team.players && team.players.length > 0) {
          return team.players;
        }
        return [...(team.retainedPlayers || []), ...(team.auctionedPlayers || [])];
      };

      const newKnockout = { ...state.knockout };

      if (state.phase === 'qf' || state.phase === 'sf') {
        const roundKey = state.phase;
        const roundData = roundKey === 'qf' ? newKnockout.qf : newKnockout.sf;
        const ties = roundData.ties.map(tie => {
          // Skip if already has winner
          if (tie.winner) return tie;

          const homeTeamBase = state.teamsMap[tie.home?.id] || tie.home;
          const awayTeamBase = state.teamsMap[tie.away?.id] || tie.away;
          const homeTeam = { ...homeTeamBase, players: buildPlayersArray(homeTeamBase) };
          const awayTeam = { ...awayTeamBase, players: buildPlayersArray(awayTeamBase) };

          // Simulate leg 1 if needed
          let leg1Result = tie.leg1Result;
          if (!leg1Result) {
            leg1Result = quickSimulate(homeTeam, awayTeam);
          }

          // Simulate leg 2 if needed (swap home/away)
          let leg2Result = tie.leg2Result;
          if (!leg2Result) {
            leg2Result = quickSimulate(awayTeam, homeTeam);
          }

          // Calculate aggregate
          const tieHomeAggregate = (leg1Result?.homeGoals || 0) + (leg2Result?.awayGoals || 0);
          const tieAwayAggregate = (leg1Result?.awayGoals || 0) + (leg2Result?.homeGoals || 0);

          // Away goals for tie breaker
          const tieHomeAwayGoals = leg2Result?.awayGoals || 0;
          const tieAwayAwayGoals = leg1Result?.awayGoals || 0;

          // Determine winner
          let winner, decidedBy;
          if (tieHomeAggregate > tieAwayAggregate) {
            winner = tie.home;
            decidedBy = 'aggregate';
          } else if (tieAwayAggregate > tieHomeAggregate) {
            winner = tie.away;
            decidedBy = 'aggregate';
          } else if (tieHomeAwayGoals > tieAwayAwayGoals) {
            winner = tie.home;
            decidedBy = 'awayGoals';
          } else if (tieAwayAwayGoals > tieHomeAwayGoals) {
            winner = tie.away;
            decidedBy = 'awayGoals';
          } else {
            // Penalties
            winner = Math.random() < 0.5 ? tie.home : tie.away;
            decidedBy = 'penalties';
          }

          return {
            ...tie,
            leg1Result,
            leg2Result,
            aggregate: { home: tieHomeAggregate, away: tieAwayAggregate },
            winner,
            decidedBy,
          };
        });

        if (roundKey === 'qf') {
          newKnockout.qf = { ...roundData, ties, currentTieIndex: ties.length - 1, currentLeg: 2 };
        } else {
          newKnockout.sf = { ...roundData, ties, currentTieIndex: ties.length - 1, currentLeg: 2 };
        }
      } else if (state.phase === 'final') {
        // Simulate final if not done
        if (!newKnockout.final.result) {
          const fixture = newKnockout.final.fixture;
          const homeTeamBase = state.teamsMap[fixture.home?.id] || fixture.home;
          const awayTeamBase = state.teamsMap[fixture.away?.id] || fixture.away;
          const homeTeam = { ...homeTeamBase, players: buildPlayersArray(homeTeamBase) };
          const awayTeam = { ...awayTeamBase, players: buildPlayersArray(awayTeamBase) };

          const result = quickSimulate(homeTeam, awayTeam);
          let winner;
          if (result.homeGoals > result.awayGoals) {
            winner = homeTeam;
          } else if (result.awayGoals > result.homeGoals) {
            winner = awayTeam;
          } else {
            winner = Math.random() < 0.5 ? homeTeam : awayTeam;
            result.penaltyWinner = winner.shortName || winner.name;
          }

          newKnockout.final = {
            ...newKnockout.final,
            result: { ...result, homeTeam, awayTeam, winner },
          };
        }
      }

      return {
        ...state,
        knockout: newKnockout,
        currentMatch: null,
      };
    }

    case 'RESET_TOURNAMENT': {
      return initialState;
    }

    default:
      return state;
  }
}

const TournamentContext = createContext(null);

export function TournamentProvider({ children }) {
  const [state, dispatch] = useReducer(tournamentReducer, initialState);

  // Start tournament with teams from auction
  const startTournament = useCallback((teams) => {
    // Build complete team objects with players
    const completeTeams = teams.map(team => ({
      ...team,
      players: [...(team.retainedPlayers || []), ...(team.auctionedPlayers || [])],
    }));

    dispatch({ type: 'START_TOURNAMENT', payload: { teams: completeTeams } });
  }, []);

  // Start animated draw
  const startDraw = useCallback(() => {
    dispatch({ type: 'START_DRAW_ANIMATION' });

    // Create groups first
    const { groupA, groupB } = createGroups(state.teams);

    // Animate revealing teams one by one
    let step = 0;
    const allTeams = [];

    // Interleave teams from each group
    for (let i = 0; i < 5; i++) {
      if (groupA[i]) allTeams.push({ team: groupA[i], group: 'A' });
      if (groupB[i]) allTeams.push({ team: groupB[i], group: 'B' });
    }

    const interval = setInterval(() => {
      if (step < allTeams.length) {
        dispatch({
          type: 'REVEAL_NEXT_TEAM',
          payload: allTeams[step],
        });
        step++;
      } else {
        clearInterval(interval);
        // Complete the draw
        dispatch({
          type: 'COMPLETE_DRAW',
          payload: { groupA, groupB },
        });
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [state.teams]);

  // Skip draw animation
  const skipDraw = useCallback(() => {
    dispatch({ type: 'SKIP_DRAW' });
  }, []);

  // Simulate current match day
  const simulateMatchDay = useCallback(() => {
    dispatch({ type: 'SIMULATE_MATCH_DAY' });
  }, []);

  // Complete live match with result
  const completeLiveMatch = useCallback((result) => {
    dispatch({ type: 'COMPLETE_LIVE_MATCH', payload: { result } });
  }, []);

  // Advance to next match day
  const advanceMatchDay = useCallback(() => {
    dispatch({ type: 'ADVANCE_MATCH_DAY' });
  }, []);

  // Skip to knockout - simulates all remaining group matches
  const skipToKnockout = useCallback(() => {
    dispatch({ type: 'SKIP_TO_KNOCKOUT' });
  }, []);

  // Start the knockout stage (after viewing group results)
  const startKnockoutStage = useCallback(() => {
    dispatch({ type: 'START_KNOCKOUT_STAGE' });
  }, []);

  // Start a knockout match
  const startKnockoutMatch = useCallback((fixture, round, index) => {
    dispatch({ type: 'START_KNOCKOUT_MATCH', payload: { fixture, round, index } });
  }, []);

  // Complete a knockout match
  const completeKnockoutMatch = useCallback((result, round, tieIndex, leg, winner) => {
    dispatch({ type: 'COMPLETE_KNOCKOUT_MATCH', payload: { result, round, tieIndex, leg, winner } });
  }, []);

  // Skip current knockout round - simulates all remaining matches
  const skipKnockoutRound = useCallback(() => {
    dispatch({ type: 'SKIP_KNOCKOUT_ROUND' });
  }, []);

  // Advance knockout stages
  const advanceToSF = useCallback(() => {
    dispatch({ type: 'ADVANCE_TO_SF' });
  }, []);

  const advanceToFinal = useCallback(() => {
    dispatch({ type: 'ADVANCE_TO_FINAL' });
  }, []);

  // Set champion
  const setChampion = useCallback((champion) => {
    dispatch({ type: 'SET_CHAMPION', payload: { champion } });
  }, []);

  // Reset tournament
  const resetTournament = useCallback(() => {
    dispatch({ type: 'RESET_TOURNAMENT' });
  }, []);

  // Check if all match day matches are complete
  const isMatchDayComplete = useCallback(() => {
    const totalFixtures = state.matchDayFixtures.length;
    const completedA = state.groupResults.A.filter(r =>
      state.matchDayFixtures.some(f =>
        f.home.id === r.homeTeam && f.away.id === r.awayTeam
      )
    ).length;
    const completedB = state.groupResults.B.filter(r =>
      state.matchDayFixtures.some(f =>
        f.home.id === r.homeTeam && f.away.id === r.awayTeam
      )
    ).length;

    return (completedA + completedB) >= totalFixtures && state.matchQueue.length === 0;
  }, [state.matchDayFixtures, state.groupResults, state.matchQueue]);

  // Get number of pending Big 3 matches
  const getPendingBigThreeCount = useCallback(() => {
    return state.matchQueue.length + (state.currentMatch ? 1 : 0);
  }, [state.matchQueue, state.currentMatch]);

  const value = {
    state,
    dispatch,

    // Actions
    startTournament,
    startDraw,
    skipDraw,
    simulateMatchDay,
    completeLiveMatch,
    advanceMatchDay,
    skipToKnockout,
    startKnockoutStage,
    startKnockoutMatch,
    completeKnockoutMatch,
    skipKnockoutRound,
    advanceToSF,
    advanceToFinal,
    setChampion,
    resetTournament,

    // Helpers
    isMatchDayComplete,
    getPendingBigThreeCount,
    isBigThreeMatch,
    BIG_THREE,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within TournamentProvider');
  }
  return context;
}
