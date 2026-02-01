// Core Match Simulation Engine
import {
  Player,
  Team,
  MatchState,
  MatchEvent,
  SimulationConfig,
  ManagerNote,
  Commentary,
  Position,
} from './types';

const DEFAULT_CONFIG: SimulationConfig = {
  matchDurationMs: 60000, // 1 minute real time (2X speed)
  eventFrequency: 1.5, // Events per game minute
  injuryProbability: 0.02, // 2% chance per event
  cardProbability: 0.05, // 5% chance per foul
};

// Position weights for different actions
const POSITION_ATTACK_WEIGHTS: Record<Position, number> = {
  GK: 0.01,
  CB: 0.05,
  LB: 0.15,
  RB: 0.15,
  CDM: 0.2,
  CM: 0.4,
  CAM: 0.6,
  LW: 0.7,
  RW: 0.7,
  ST: 0.9,
};

const POSITION_DEFENSE_WEIGHTS: Record<Position, number> = {
  GK: 0.95,
  CB: 0.85,
  LB: 0.7,
  RB: 0.7,
  CDM: 0.75,
  CM: 0.5,
  CAM: 0.3,
  LW: 0.2,
  RW: 0.2,
  ST: 0.1,
};

export class MatchSimulationEngine {
  private state: MatchState;
  private config: SimulationConfig;
  private managerNotes: { home: ManagerNote[]; away: ManagerNote[] };
  private commentaries: Commentary[];
  private onStateChange?: (state: MatchState) => void;
  private onEvent?: (event: MatchEvent) => void;
  private onCommentary?: (commentary: Commentary) => void;
  private onManagerNote?: (team: 'home' | 'away', note: ManagerNote) => void;
  private intervalId?: NodeJS.Timeout;
  private lastEventMinute: number = 0;

  constructor(
    homeTeam: Team,
    awayTeam: Team,
    config: Partial<SimulationConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.managerNotes = { home: [], away: [] };
    this.commentaries = [];

    this.state = {
      homeTeam: this.initializeTeam(homeTeam),
      awayTeam: this.initializeTeam(awayTeam),
      homeScore: 0,
      awayScore: 0,
      currentMinute: 0,
      events: [],
      possession: { home: 50, away: 50 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      isHalfTime: false,
      isFullTime: false,
      isPaused: false,
      ballPosition: { x: 50, y: 50 },
    };
  }

  private initializeTeam(team: Team): Team {
    return {
      ...team,
      lineup: team.lineup.map((p) => ({
        ...p,
        stamina: 100,
        isInjured: false,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCard: false,
        isOnBench: false,
      })),
      bench: team.bench.map((p) => ({
        ...p,
        stamina: 100,
        isInjured: false,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCard: false,
        isOnBench: true,
      })),
      substitutionsMade: 0,
      maxSubstitutions: 5,
    };
  }

  // Calculate team strength based on player ratings
  private getTeamStrength(team: Team): number {
    const activePlayers = team.lineup.filter(
      (p) => !p.isInjured && !p.redCard
    );
    if (activePlayers.length === 0) return 0;

    const avgRating =
      activePlayers.reduce((sum, p) => sum + p.rating, 0) / activePlayers.length;
    const staminaFactor =
      activePlayers.reduce((sum, p) => sum + p.stamina, 0) /
      (activePlayers.length * 100);
    const playerCountFactor = activePlayers.length / 11;

    return avgRating * staminaFactor * playerCountFactor;
  }

  // Calculate attack strength
  private getAttackStrength(team: Team): number {
    const activePlayers = team.lineup.filter(
      (p) => !p.isInjured && !p.redCard
    );
    const weightedSum = activePlayers.reduce(
      (sum, p) =>
        sum + p.rating * POSITION_ATTACK_WEIGHTS[p.position] * (p.stamina / 100),
      0
    );
    return weightedSum / activePlayers.length;
  }

  // Calculate defense strength
  private getDefenseStrength(team: Team): number {
    const activePlayers = team.lineup.filter(
      (p) => !p.isInjured && !p.redCard
    );
    const weightedSum = activePlayers.reduce(
      (sum, p) =>
        sum +
        p.rating * POSITION_DEFENSE_WEIGHTS[p.position] * (p.stamina / 100),
      0
    );
    return weightedSum / activePlayers.length;
  }

  // Random helper with weighted probability
  private weightedRandom(weight: number): boolean {
    return Math.random() < weight;
  }

  // Select random player from team based on position weights for attack
  private selectAttacker(team: Team): Player {
    const activePlayers = team.lineup.filter(
      (p) => !p.isInjured && !p.redCard
    );
    const weights = activePlayers.map((p) => POSITION_ATTACK_WEIGHTS[p.position]);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < activePlayers.length; i++) {
      random -= weights[i];
      if (random <= 0) return activePlayers[i];
    }
    return activePlayers[activePlayers.length - 1];
  }

  // Select random player for assist
  private selectAssister(team: Team, scorer: Player): Player | undefined {
    const activePlayers = team.lineup.filter(
      (p) => !p.isInjured && !p.redCard && p.id !== scorer.id
    );
    if (activePlayers.length === 0 || Math.random() > 0.7) return undefined;

    const weights = activePlayers.map(
      (p) => POSITION_ATTACK_WEIGHTS[p.position] * 0.8 + 0.2
    );
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < activePlayers.length; i++) {
      random -= weights[i];
      if (random <= 0) return activePlayers[i];
    }
    return activePlayers[0];
  }

  // Simulate a single event
  private simulateEvent(): MatchEvent | null {
    const homeStrength = this.getTeamStrength(this.state.homeTeam);
    const awayStrength = this.getTeamStrength(this.state.awayTeam);
    const totalStrength = homeStrength + awayStrength;

    if (totalStrength === 0) return null;

    // Determine which team has the action
    const isHomeAction = Math.random() < homeStrength / totalStrength;
    const attackingTeam = isHomeAction ? this.state.homeTeam : this.state.awayTeam;
    const defendingTeam = isHomeAction ? this.state.awayTeam : this.state.homeTeam;
    const teamKey = isHomeAction ? 'home' : 'away';

    // Update possession
    this.updatePossession(isHomeAction);

    // Determine event type based on probabilities
    const attackStrength = this.getAttackStrength(attackingTeam);
    const defenseStrength = this.getDefenseStrength(defendingTeam);
    const chanceQuality = attackStrength / (attackStrength + defenseStrength);

    const eventRoll = Math.random();
    let event: MatchEvent | null = null;

    if (eventRoll < 0.15 * chanceQuality) {
      // Chance created - potential goal
      event = this.simulateChance(attackingTeam, defendingTeam, teamKey);
    } else if (eventRoll < 0.25) {
      // Foul
      event = this.simulateFoul(attackingTeam, defendingTeam, teamKey);
    } else if (eventRoll < 0.3) {
      // Corner
      event = this.simulateCorner(attackingTeam, teamKey);
    } else if (eventRoll < 0.35) {
      // Tackle/Interception
      event = this.simulateTackle(defendingTeam, isHomeAction ? 'away' : 'home');
    }

    // Check for injuries
    if (Math.random() < this.config.injuryProbability) {
      const injuryEvent = this.simulateInjury(
        Math.random() < 0.5 ? this.state.homeTeam : this.state.awayTeam,
        Math.random() < 0.5 ? 'home' : 'away'
      );
      if (injuryEvent) {
        this.addEvent(injuryEvent);
      }
    }

    // Update ball position
    this.updateBallPosition(isHomeAction, chanceQuality);

    // Decrease stamina
    this.decreaseStamina();

    return event;
  }

  private simulateChance(
    attackingTeam: Team,
    defendingTeam: Team,
    teamKey: 'home' | 'away'
  ): MatchEvent {
    const attacker = this.selectAttacker(attackingTeam);
    const goalkeeper = defendingTeam.lineup.find((p) => p.position === 'GK');

    const goalkeeperFactor = goalkeeper
      ? (goalkeeper.rating * (goalkeeper.stamina / 100)) / 100
      : 0.3;

    const shotQuality =
      (attacker.rating * (attacker.stamina / 100) +
        POSITION_ATTACK_WEIGHTS[attacker.position] * 30) /
      130;

    // Combine shot quality with goalkeeper factor
    const goalChance = shotQuality * (1 - goalkeeperFactor * 0.5);
    const shotRoll = Math.random();

    if (shotRoll < goalChance * 0.4) {
      // Goal!
      const assister = this.selectAssister(attackingTeam, attacker);
      attacker.goals++;
      if (assister) assister.assists++;

      if (teamKey === 'home') {
        this.state.homeScore++;
        this.state.shots.home++;
        this.state.shotsOnTarget.home++;
      } else {
        this.state.awayScore++;
        this.state.shots.away++;
        this.state.shotsOnTarget.away++;
      }

      const description = assister
        ? `GOAL! ${attacker.name} scores for ${attackingTeam.name}! Assisted by ${assister.name}.`
        : `GOAL! ${attacker.name} scores for ${attackingTeam.name}!`;

      this.addCommentary(description, true);
      this.addManagerNote(
        teamKey === 'home' ? 'away' : 'home',
        'tactical',
        `Conceded a goal. Consider defensive adjustments.`,
        'high'
      );

      return {
        minute: this.state.currentMinute,
        type: 'goal',
        team: teamKey,
        player: attacker,
        assistPlayer: assister,
        description,
      };
    } else if (shotRoll < shotQuality * 0.7) {
      // Shot saved
      if (teamKey === 'home') {
        this.state.shots.home++;
        this.state.shotsOnTarget.home++;
      } else {
        this.state.shots.away++;
        this.state.shotsOnTarget.away++;
      }

      const description = `Save! ${goalkeeper?.name || 'The goalkeeper'} denies ${attacker.name}'s effort.`;
      this.addCommentary(description, false);

      return {
        minute: this.state.currentMinute,
        type: 'shot_saved',
        team: teamKey,
        player: attacker,
        description,
      };
    } else {
      // Shot missed
      if (teamKey === 'home') {
        this.state.shots.home++;
      } else {
        this.state.shots.away++;
      }

      const description = `${attacker.name} shoots but it goes wide!`;
      this.addCommentary(description, false);

      return {
        minute: this.state.currentMinute,
        type: 'shot_missed',
        team: teamKey,
        player: attacker,
        description,
      };
    }
  }

  private simulateFoul(
    attackingTeam: Team,
    defendingTeam: Team,
    teamKey: 'home' | 'away'
  ): MatchEvent {
    const fouler = this.selectAttacker(defendingTeam);
    const fouled = this.selectAttacker(attackingTeam);
    const defenderTeamKey = teamKey === 'home' ? 'away' : 'home';

    if (defenderTeamKey === 'home') {
      this.state.fouls.home++;
    } else {
      this.state.fouls.away++;
    }

    let event: MatchEvent = {
      minute: this.state.currentMinute,
      type: 'foul',
      team: defenderTeamKey,
      player: fouler,
      description: `Foul by ${fouler.name} on ${fouled.name}.`,
    };

    // Check for card
    if (Math.random() < this.config.cardProbability) {
      if (fouler.yellowCards > 0 || Math.random() < 0.1) {
        // Red card
        fouler.redCard = true;
        event = {
          ...event,
          type: 'red_card',
          description: `RED CARD! ${fouler.name} is sent off!`,
        };
        this.addCommentary(event.description, true);
        this.addManagerNote(
          defenderTeamKey,
          'warning',
          `${fouler.name} has been sent off! You are down to ${defendingTeam.lineup.filter((p) => !p.redCard && !p.isInjured).length} players.`,
          'high'
        );
      } else {
        // Yellow card
        fouler.yellowCards++;
        event = {
          ...event,
          type: 'yellow_card',
          description: `Yellow card for ${fouler.name}.`,
        };
        this.addCommentary(event.description, false);
        if (fouler.yellowCards === 1) {
          this.addManagerNote(
            defenderTeamKey,
            'warning',
            `${fouler.name} is on a yellow card. Consider substitution to avoid red.`,
            'medium'
          );
        }
      }
    } else {
      this.addCommentary(event.description, false);
    }

    return event;
  }

  private simulateCorner(team: Team, teamKey: 'home' | 'away'): MatchEvent {
    if (teamKey === 'home') {
      this.state.corners.home++;
    } else {
      this.state.corners.away++;
    }

    const description = `Corner kick for ${team.name}.`;
    this.addCommentary(description, false);

    return {
      minute: this.state.currentMinute,
      type: 'corner',
      team: teamKey,
      description,
    };
  }

  private simulateTackle(team: Team, teamKey: 'home' | 'away'): MatchEvent {
    const defender = team.lineup.find(
      (p) =>
        !p.isInjured &&
        !p.redCard &&
        ['CB', 'CDM', 'LB', 'RB'].includes(p.position)
    );

    if (!defender) return this.simulateCorner(team, teamKey);

    const description = `Great tackle by ${defender.name}!`;
    this.addCommentary(description, false);

    return {
      minute: this.state.currentMinute,
      type: 'tackle',
      team: teamKey,
      player: defender,
      description,
    };
  }

  private simulateInjury(team: Team, teamKey: 'home' | 'away'): MatchEvent | null {
    const eligiblePlayers = team.lineup.filter(
      (p) => !p.isInjured && !p.redCard && p.stamina < 70
    );
    if (eligiblePlayers.length === 0) return null;

    const injuredPlayer =
      eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
    injuredPlayer.isInjured = true;
    injuredPlayer.injuryMinute = this.state.currentMinute;

    const description = `Injury concern! ${injuredPlayer.name} is down and may need to be substituted.`;
    this.addCommentary(description, true);
    this.addManagerNote(
      teamKey,
      'injury',
      `${injuredPlayer.name} is injured! Consider making a substitution.`,
      'high'
    );

    return {
      minute: this.state.currentMinute,
      type: 'injury',
      team: teamKey,
      player: injuredPlayer,
      description,
    };
  }

  private updatePossession(isHomeAction: boolean): void {
    const shift = Math.random() * 5;
    if (isHomeAction) {
      this.state.possession.home = Math.min(70, this.state.possession.home + shift);
      this.state.possession.away = 100 - this.state.possession.home;
    } else {
      this.state.possession.away = Math.min(70, this.state.possession.away + shift);
      this.state.possession.home = 100 - this.state.possession.away;
    }
  }

  private updateBallPosition(isHomeAttack: boolean, intensity: number): void {
    // More dynamic ball movement across the entire pitch
    const baseX = isHomeAttack ? 60 : 40;
    const xVariance = 35; // Ball can move more freely
    const targetX = baseX + (Math.random() - 0.5) * xVariance * 2;
    const targetY = 10 + Math.random() * 80; // Use more of the pitch vertically

    // Faster, more responsive ball movement
    const moveSpeed = 0.5 + intensity * 0.3;
    this.state.ballPosition.x +=
      (targetX - this.state.ballPosition.x) * moveSpeed;
    this.state.ballPosition.y +=
      (targetY - this.state.ballPosition.y) * moveSpeed;

    // Add some random jitter for more natural movement
    this.state.ballPosition.x += (Math.random() - 0.5) * 8;
    this.state.ballPosition.y += (Math.random() - 0.5) * 8;

    this.state.ballPosition.x = Math.max(5, Math.min(95, this.state.ballPosition.x));
    this.state.ballPosition.y = Math.max(5, Math.min(95, this.state.ballPosition.y));
  }

  private decreaseStamina(): void {
    const staminaDrain = 0.3 + Math.random() * 0.2;

    [...this.state.homeTeam.lineup, ...this.state.awayTeam.lineup].forEach(
      (player) => {
        if (!player.isInjured && !player.redCard) {
          player.stamina = Math.max(0, player.stamina - staminaDrain);

          // Notify manager about low stamina
          if (player.stamina < 30 && player.stamina > 29) {
            const teamKey = this.state.homeTeam.lineup.includes(player)
              ? 'home'
              : 'away';
            this.addManagerNote(
              teamKey,
              'performance',
              `${player.name} is running low on stamina (${Math.round(player.stamina)}%). Consider substitution.`,
              'medium'
            );
          }
        }
      }
    );
  }

  private addEvent(event: MatchEvent): void {
    this.state.events.push(event);
    this.onEvent?.(event);
  }

  private addCommentary(text: string, isHighlight: boolean): void {
    const commentary: Commentary = {
      minute: this.state.currentMinute,
      text,
      isHighlight,
    };
    this.commentaries.push(commentary);
    this.onCommentary?.(commentary);
  }

  private addManagerNote(
    team: 'home' | 'away',
    type: ManagerNote['type'],
    message: string,
    priority: ManagerNote['priority']
  ): void {
    const note: ManagerNote = {
      minute: this.state.currentMinute,
      type,
      message,
      priority,
    };
    this.managerNotes[team].push(note);
    this.onManagerNote?.(team, note);
  }

  // Public methods
  public start(): void {
    if (this.intervalId) return;

    // Kick off event
    const kickOffEvent: MatchEvent = {
      minute: 0,
      type: 'kick_off',
      team: 'home',
      description: `Kick off! ${this.state.homeTeam.name} vs ${this.state.awayTeam.name}`,
    };
    this.addEvent(kickOffEvent);
    this.addCommentary(kickOffEvent.description, true);

    // Immediately notify of state change after kick-off
    this.onStateChange?.(this.getState());

    const msPerMinute = this.config.matchDurationMs / 90;

    this.intervalId = setInterval(() => {
      if (this.state.isPaused) return;

      this.state.currentMinute++;

      // Half time at minute 45 - set flag and notify
      if (this.state.currentMinute === 45) {
        this.state.isHalfTime = true;
        const halfTimeEvent: MatchEvent = {
          minute: 45,
          type: 'half_time',
          team: 'home',
          description: `Half time! ${this.state.homeTeam.name} ${this.state.homeScore} - ${this.state.awayScore} ${this.state.awayTeam.name}`,
        };
        this.addEvent(halfTimeEvent);
        this.addCommentary(halfTimeEvent.description, true);

        // Manager notes at half time
        this.generateHalfTimeNotes();
      }

      // Second half kick-off at minute 46 - clear half time flag
      if (this.state.currentMinute === 46) {
        this.state.isHalfTime = false;
        const secondHalfEvent: MatchEvent = {
          minute: 46,
          type: 'kick_off',
          team: 'away',
          description: 'Second half kicks off!',
        };
        this.addEvent(secondHalfEvent);
        this.addCommentary('Second half kicks off!', true);
      }

      // Full time
      if (this.state.currentMinute >= 90) {
        this.state.isFullTime = true;
        const fullTimeEvent: MatchEvent = {
          minute: 90,
          type: 'full_time',
          team: 'home',
          description: `Full time! ${this.state.homeTeam.name} ${this.state.homeScore} - ${this.state.awayScore} ${this.state.awayTeam.name}`,
        };
        this.addEvent(fullTimeEvent);
        this.addCommentary(fullTimeEvent.description, true);
        this.stop();
        return;
      }

      // Simulate events
      const eventsThisMinute = Math.floor(
        Math.random() * this.config.eventFrequency + 0.5
      );
      for (let i = 0; i < eventsThisMinute; i++) {
        const event = this.simulateEvent();
        if (event) {
          this.addEvent(event);
        }
      }

      // Scheduled substitution windows - ensure all 5 subs are used
      // Each team makes subs at these windows: 55', 62', 70', 78', 85'
      const subWindows = [55, 62, 70, 78, 85];
      if (subWindows.includes(this.state.currentMinute)) {
        this.forceSubstitution('home');
        this.forceSubstitution('away');
      }

      // Final push: at minute 88-89, use ALL remaining subs
      if (this.state.currentMinute === 88 || this.state.currentMinute === 89) {
        // Force remaining subs for home team
        while (this.state.homeTeam.substitutionsMade < this.state.homeTeam.maxSubstitutions &&
               this.state.homeTeam.bench.length > 0) {
          this.forceSubstitution('home');
        }
        // Force remaining subs for away team
        while (this.state.awayTeam.substitutionsMade < this.state.awayTeam.maxSubstitutions &&
               this.state.awayTeam.bench.length > 0) {
          this.forceSubstitution('away');
        }
      }

      // Also check for emergency subs (injuries) at any time
      if (this.state.currentMinute > 45 && this.state.currentMinute % 5 === 0) {
        this.tryEmergencySubstitution('home');
        this.tryEmergencySubstitution('away');
      }

      this.onStateChange?.(this.getState());
    }, msPerMinute);
  }

  private generateHalfTimeNotes(): void {
    // Home team notes
    const homeLowStamina = this.state.homeTeam.lineup.filter(
      (p) => p.stamina < 50 && !p.isInjured && !p.redCard
    );
    if (homeLowStamina.length > 0) {
      this.addManagerNote(
        'home',
        'performance',
        `Players with low stamina: ${homeLowStamina.map((p) => p.name).join(', ')}. Consider substitutions.`,
        'medium'
      );
    }

    // Away team notes
    const awayLowStamina = this.state.awayTeam.lineup.filter(
      (p) => p.stamina < 50 && !p.isInjured && !p.redCard
    );
    if (awayLowStamina.length > 0) {
      this.addManagerNote(
        'away',
        'performance',
        `Players with low stamina: ${awayLowStamina.map((p) => p.name).join(', ')}. Consider substitutions.`,
        'medium'
      );
    }

    // Tactical notes based on score
    if (this.state.homeScore < this.state.awayScore) {
      this.addManagerNote(
        'home',
        'tactical',
        'You are behind. Consider a more attacking approach in the second half.',
        'high'
      );
    } else if (this.state.awayScore < this.state.homeScore) {
      this.addManagerNote(
        'away',
        'tactical',
        'You are behind. Consider a more attacking approach in the second half.',
        'high'
      );
    }
  }

  // Position priority mapping for substitutions
  private getPositionPriority(): Record<string, string[]> {
    return {
      GK: ['GK'],
      CB: ['CB', 'CDM', 'RB', 'LB'],
      LB: ['LB', 'LW', 'CB'],
      RB: ['RB', 'RW', 'CB'],
      CDM: ['CDM', 'CM', 'CB'],
      CM: ['CM', 'CDM', 'CAM'],
      CAM: ['CAM', 'CM', 'RW', 'LW'],
      LW: ['LW', 'CAM', 'ST', 'LB'],
      RW: ['RW', 'CAM', 'ST', 'RB'],
      ST: ['ST', 'CAM', 'RW', 'LW'],
      CF: ['CF', 'ST', 'CAM'],
    };
  }

  // Find the best substitute for a given player
  private findBestSubstitute(team: Team, playerOut: Player): Player | null {
    const positionPriority = this.getPositionPriority();
    const priorities = positionPriority[playerOut.position] || [playerOut.position];

    for (const pos of priorities) {
      const substitute = team.bench.find((p) => p.position === pos && !p.isInjured);
      if (substitute) return substitute;
    }

    // If no positional match, just get any available player
    return team.bench.find((p) => !p.isInjured) || null;
  }

  // Emergency substitutions for injured players only
  private tryEmergencySubstitution(teamKey: 'home' | 'away'): void {
    const team = teamKey === 'home' ? this.state.homeTeam : this.state.awayTeam;

    if (team.substitutionsMade >= team.maxSubstitutions) return;
    if (team.bench.length === 0) return;

    // Only look for injured players
    const injured = team.lineup.find((p) => p.isInjured && !p.redCard);
    if (!injured) return;

    const substitute = this.findBestSubstitute(team, injured);
    if (substitute) {
      this.makeSubstitution(teamKey, injured.id, substitute.id);
    }
  }

  // Force a substitution to ensure all 5 subs are used - MANDATORY
  private forceSubstitution(teamKey: 'home' | 'away'): void {
    const team = teamKey === 'home' ? this.state.homeTeam : this.state.awayTeam;

    // Check if team can still make substitutions
    if (team.substitutionsMade >= team.maxSubstitutions) return;
    if (team.bench.length === 0) return;

    // Get all outfield players who can be subbed (not GK, not red carded)
    const eligibleForSub = team.lineup.filter(
      (p) => !p.redCard && p.position !== 'GK'
    );

    if (eligibleForSub.length === 0) return;

    // Sort by priority: injured first, then low stamina, then yellow cards, then lowest stamina
    const sortedByPriority = eligibleForSub.sort((a, b) => {
      // Injured players first
      if (a.isInjured && !b.isInjured) return -1;
      if (!a.isInjured && b.isInjured) return 1;

      // Then players with yellow cards
      if (a.yellowCards > 0 && b.yellowCards === 0) return -1;
      if (a.yellowCards === 0 && b.yellowCards > 0) return 1;

      // Then by lowest stamina
      return a.stamina - b.stamina;
    });

    // Always pick the highest priority player to sub off
    const playerOut = sortedByPriority[0];

    // Find ANY available substitute from bench
    const substitute = team.bench.find((p) => !p.isInjured) || team.bench[0];

    if (playerOut && substitute) {
      this.makeSubstitution(teamKey, playerOut.id, substitute.id);
    }
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  public pause(): void {
    this.state.isPaused = true;
  }

  public resume(): void {
    this.state.isPaused = false;
  }

  public makeSubstitution(
    teamKey: 'home' | 'away',
    playerOutId: string,
    playerInId: string
  ): boolean {
    const team = teamKey === 'home' ? this.state.homeTeam : this.state.awayTeam;

    if (team.substitutionsMade >= team.maxSubstitutions) {
      return false;
    }

    const playerOut = team.lineup.find((p) => p.id === playerOutId);
    const playerIn = team.bench.find((p) => p.id === playerInId);

    if (!playerOut || !playerIn) return false;

    // Swap players
    const outIndex = team.lineup.indexOf(playerOut);
    team.lineup[outIndex] = { ...playerIn, isOnBench: false };
    team.bench = team.bench.filter((p) => p.id !== playerInId);
    team.bench.push({ ...playerOut, isOnBench: true });
    team.substitutionsMade++;

    const event: MatchEvent = {
      minute: this.state.currentMinute,
      type: 'substitution',
      team: teamKey,
      player: playerIn,
      replacedPlayer: playerOut,
      description: `Substitution for ${team.name}: ${playerIn.name} comes on for ${playerOut.name}.`,
    };

    this.addEvent(event);
    this.addCommentary(event.description, false);
    this.addManagerNote(
      teamKey,
      'substitution',
      `${playerIn.name} (${playerIn.position}, ${playerIn.rating}) replaces ${playerOut.name}.`,
      'low'
    );

    return true;
  }

  public getState(): MatchState {
    // Return a deep copy to ensure React detects state changes
    return {
      ...this.state,
      homeTeam: { ...this.state.homeTeam, lineup: [...this.state.homeTeam.lineup], bench: [...this.state.homeTeam.bench] },
      awayTeam: { ...this.state.awayTeam, lineup: [...this.state.awayTeam.lineup], bench: [...this.state.awayTeam.bench] },
      events: [...this.state.events],
      possession: { ...this.state.possession },
      shots: { ...this.state.shots },
      shotsOnTarget: { ...this.state.shotsOnTarget },
      corners: { ...this.state.corners },
      fouls: { ...this.state.fouls },
      ballPosition: { ...this.state.ballPosition },
    };
  }

  public getManagerNotes(team: 'home' | 'away'): ManagerNote[] {
    return [...this.managerNotes[team]];
  }

  public getCommentaries(): Commentary[] {
    return [...this.commentaries];
  }

  public onStateChangeCallback(callback: (state: MatchState) => void): void {
    this.onStateChange = callback;
  }

  public onEventCallback(callback: (event: MatchEvent) => void): void {
    this.onEvent = callback;
  }

  public onCommentaryCallback(callback: (commentary: Commentary) => void): void {
    this.onCommentary = callback;
  }

  public onManagerNoteCallback(
    callback: (team: 'home' | 'away', note: ManagerNote) => void
  ): void {
    this.onManagerNote = callback;
  }
}

// Helper function to create a player
export function createPlayer(
  id: string,
  name: string,
  position: Position,
  rating: number
): Player {
  return {
    id,
    name,
    position,
    rating,
    stamina: 100,
    isInjured: false,
    isOnBench: false,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCard: false,
  };
}

// Helper function to create a team
export function createTeam(
  id: string,
  name: string,
  shortName: string,
  color: string,
  manager: string,
  lineup: Player[],
  bench: Player[],
  formation: Team['formation'] = '4-3-3'
): Team {
  return {
    id,
    name,
    shortName,
    color,
    manager,
    lineup,
    bench,
    formation,
    substitutionsMade: 0,
    maxSubstitutions: 5,
  };
}
