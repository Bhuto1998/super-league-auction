// Core types for the match simulation engine

export interface Player {
  id: string;
  name: string;
  position: Position;
  rating: number; // 1-99
  stamina: number; // 0-100, decreases during match
  isInjured: boolean;
  injuryMinute?: number;
  isOnBench: boolean;
  goals: number;
  assists: number;
  yellowCards: number;
  redCard: boolean;
}

export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  manager: string;
  lineup: Player[]; // 11 players on field
  bench: Player[]; // Substitutes
  formation: Formation;
  substitutionsMade: number;
  maxSubstitutions: number;
}

export type Formation = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1' | '5-3-2';

export interface MatchEvent {
  minute: number;
  type: EventType;
  team: 'home' | 'away';
  player?: Player;
  assistPlayer?: Player;
  replacedPlayer?: Player; // For substitutions
  description: string;
}

export type EventType =
  | 'goal'
  | 'shot_saved'
  | 'shot_missed'
  | 'foul'
  | 'yellow_card'
  | 'red_card'
  | 'injury'
  | 'substitution'
  | 'corner'
  | 'free_kick'
  | 'penalty'
  | 'penalty_saved'
  | 'offside'
  | 'half_time'
  | 'full_time'
  | 'kick_off'
  | 'chance_created'
  | 'tackle'
  | 'interception';

export interface MatchState {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  currentMinute: number;
  events: MatchEvent[];
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  isHalfTime: boolean;
  isFullTime: boolean;
  isPaused: boolean;
  ballPosition: { x: number; y: number }; // 0-100 percentage coordinates
  playerWithBall?: { team: 'home' | 'away'; player: Player };
}

export interface ManagerNote {
  minute: number;
  type: 'tactical' | 'injury' | 'performance' | 'substitution' | 'warning';
  message: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Commentary {
  minute: number;
  text: string;
  isHighlight: boolean;
}

export interface SimulationConfig {
  matchDurationMs: number; // Real-time duration (default 120000 = 2 mins)
  eventFrequency: number; // Average events per minute
  injuryProbability: number; // 0-1
  cardProbability: number; // 0-1
}
