// Sample teams for testing the simulation engine
import { Team, Player } from './types';
import { createPlayer, createTeam } from './simulation-engine';

// Barcelona Squad
const barcelonaLineup: Player[] = [
  createPlayer('bar-1', 'Ter Stegen', 'GK', 88),
  createPlayer('bar-2', 'Kounde', 'RB', 85),
  createPlayer('bar-3', 'Araujo', 'CB', 86),
  createPlayer('bar-4', 'Christensen', 'CB', 82),
  createPlayer('bar-5', 'Balde', 'LB', 81),
  createPlayer('bar-6', 'Pedri', 'CM', 88),
  createPlayer('bar-7', 'De Jong', 'CDM', 85),
  createPlayer('bar-8', 'Gavi', 'CM', 83),
  createPlayer('bar-9', 'Yamal', 'RW', 81),
  createPlayer('bar-10', 'Lewandowski', 'ST', 89),
  createPlayer('bar-11', 'Raphinha', 'LW', 84),
];

const barcelonaBench: Player[] = [
  createPlayer('bar-12', 'Inaki Pena', 'GK', 76),
  createPlayer('bar-13', 'Eric Garcia', 'CB', 78),
  createPlayer('bar-14', 'Sergi Roberto', 'RB', 77),
  createPlayer('bar-15', 'Ferran Torres', 'RW', 80),
  createPlayer('bar-16', 'Ansu Fati', 'LW', 78),
];

export const barcelona = createTeam(
  'barcelona',
  'FC Barcelona',
  'BAR',
  '#A50044',
  'Pep Guardiola',
  barcelonaLineup,
  barcelonaBench,
  '4-3-3'
);

// Real Madrid Squad
const realMadridLineup: Player[] = [
  createPlayer('rma-1', 'Courtois', 'GK', 89),
  createPlayer('rma-2', 'Carvajal', 'RB', 85),
  createPlayer('rma-3', 'Rudiger', 'CB', 87),
  createPlayer('rma-4', 'Alaba', 'CB', 84),
  createPlayer('rma-5', 'Mendy', 'LB', 83),
  createPlayer('rma-6', 'Valverde', 'CM', 87),
  createPlayer('rma-7', 'Tchouameni', 'CDM', 85),
  createPlayer('rma-8', 'Bellingham', 'CAM', 90),
  createPlayer('rma-9', 'Rodrygo', 'RW', 85),
  createPlayer('rma-10', 'Mbappe', 'ST', 93),
  createPlayer('rma-11', 'Vinicius Jr', 'LW', 91),
];

const realMadridBench: Player[] = [
  createPlayer('rma-12', 'Lunin', 'GK', 80),
  createPlayer('rma-13', 'Militao', 'CB', 84),
  createPlayer('rma-14', 'Camavinga', 'CM', 83),
  createPlayer('rma-15', 'Modric', 'CM', 86),
  createPlayer('rma-16', 'Joselu', 'ST', 79),
];

export const realMadrid = createTeam(
  'real-madrid',
  'Real Madrid',
  'RMA',
  '#FFFFFF',
  'Jose Mourinho',
  realMadridLineup,
  realMadridBench,
  '4-3-3'
);

// Bayern Munich Squad
const bayernLineup: Player[] = [
  createPlayer('bay-1', 'Neuer', 'GK', 88),
  createPlayer('bay-2', 'Kimmich', 'RB', 88),
  createPlayer('bay-3', 'Upamecano', 'CB', 83),
  createPlayer('bay-4', 'Kim Min-jae', 'CB', 85),
  createPlayer('bay-5', 'Davies', 'LB', 84),
  createPlayer('bay-6', 'Goretzka', 'CM', 84),
  createPlayer('bay-7', 'Musiala', 'CAM', 87),
  createPlayer('bay-8', 'Sane', 'RW', 85),
  createPlayer('bay-9', 'Muller', 'CAM', 84),
  createPlayer('bay-10', 'Kane', 'ST', 91),
  createPlayer('bay-11', 'Coman', 'LW', 82),
];

const bayernBench: Player[] = [
  createPlayer('bay-12', 'Ulreich', 'GK', 75),
  createPlayer('bay-13', 'De Ligt', 'CB', 83),
  createPlayer('bay-14', 'Laimer', 'CM', 80),
  createPlayer('bay-15', 'Tel', 'ST', 76),
  createPlayer('bay-16', 'Gnabry', 'RW', 82),
];

export const bayernMunich = createTeam(
  'bayern',
  'Bayern Munich',
  'BAY',
  '#DC052D',
  'Hansi Flick',
  bayernLineup,
  bayernBench,
  '4-2-3-1'
);

// Manchester City Squad
const manCityLineup: Player[] = [
  createPlayer('mci-1', 'Ederson', 'GK', 88),
  createPlayer('mci-2', 'Walker', 'RB', 83),
  createPlayer('mci-3', 'Dias', 'CB', 87),
  createPlayer('mci-4', 'Stones', 'CB', 84),
  createPlayer('mci-5', 'Gvardiol', 'LB', 84),
  createPlayer('mci-6', 'Rodri', 'CDM', 91),
  createPlayer('mci-7', 'De Bruyne', 'CAM', 90),
  createPlayer('mci-8', 'Bernardo', 'CM', 87),
  createPlayer('mci-9', 'Foden', 'RW', 88),
  createPlayer('mci-10', 'Haaland', 'ST', 92),
  createPlayer('mci-11', 'Grealish', 'LW', 83),
];

const manCityBench: Player[] = [
  createPlayer('mci-12', 'Ortega', 'GK', 82),
  createPlayer('mci-13', 'Akanji', 'CB', 83),
  createPlayer('mci-14', 'Kovacic', 'CM', 83),
  createPlayer('mci-15', 'Doku', 'LW', 81),
  createPlayer('mci-16', 'Alvarez', 'ST', 84),
];

export const manchesterCity = createTeam(
  'man-city',
  'Manchester City',
  'MCI',
  '#6CABDD',
  'Pep Guardiola',
  manCityLineup,
  manCityBench,
  '4-3-3'
);

// All sample teams
export const sampleTeams: Team[] = [
  barcelona,
  realMadrid,
  bayernMunich,
  manchesterCity,
];

export function getTeamById(id: string): Team | undefined {
  return sampleTeams.find((t) => t.id === id);
}
