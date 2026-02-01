/**
 * Youth Academy / Wonderkid Generation Engine
 * Generates new wonderkids for the draft each season
 */

import { generatePotential, generatePeakAgeRange } from './playerProgression';

// Wonderkid generation configuration
export const WONDERKID_CONFIG = {
  MIN_PER_SEASON: 5,
  MAX_PER_SEASON: 10,

  // Age range
  MIN_AGE: 17,
  MAX_AGE: 20,

  // Rating range
  MIN_RATING: 72,
  MAX_RATING: 80,

  // Potential range
  MIN_POTENTIAL: 85,
  MAX_POTENTIAL: 95,

  // Position distribution
  POSITION_DISTRIBUTION: {
    GK: 0.08,   // 8%
    DEF: 0.30,  // 30%
    MID: 0.35,  // 35%
    FWD: 0.27,  // 27%
  },
};

// First names pool (diverse nationalities)
const FIRST_NAMES = [
  // Spanish
  'Pablo', 'Carlos', 'Diego', 'Alejandro', 'Sergio', 'Alvaro', 'Iker', 'Raul',
  // English
  'James', 'Harry', 'Jack', 'Charlie', 'Oliver', 'George', 'Thomas', 'William',
  // French
  'Lucas', 'Hugo', 'Nathan', 'Mathis', 'Ethan', 'Noah', 'Jules', 'Theo',
  // German
  'Lukas', 'Felix', 'Leon', 'Maximilian', 'Paul', 'Jonas', 'Elias', 'Ben',
  // Italian
  'Marco', 'Luca', 'Matteo', 'Francesco', 'Alessandro', 'Andrea', 'Lorenzo', 'Gabriele',
  // Brazilian
  'Gabriel', 'Rafael', 'Lucas', 'Vinicius', 'Bruno', 'Pedro', 'Matheus', 'Gustavo',
  // Portuguese
  'Diogo', 'Tiago', 'Ruben', 'Bernardo', 'Andre', 'Joao', 'Miguel', 'Goncalo',
  // Dutch
  'Daan', 'Sem', 'Milan', 'Luuk', 'Thijs', 'Tim', 'Stijn', 'Ruben',
  // Argentine
  'Thiago', 'Matias', 'Facundo', 'Nicolas', 'Julian', 'Franco', 'Agustin', 'Enzo',
  // African names
  'Moussa', 'Ibrahima', 'Amadou', 'Sadio', 'Ismaila', 'Youssef', 'Mohamed', 'Omar',
];

// Last names pool
const LAST_NAMES = [
  // Spanish
  'Garcia', 'Martinez', 'Rodriguez', 'Lopez', 'Hernandez', 'Gonzalez', 'Perez', 'Sanchez',
  'Fernandez', 'Torres', 'Ruiz', 'Diaz', 'Moreno', 'Alvarez', 'Munoz', 'Romero',
  // English
  'Smith', 'Jones', 'Williams', 'Taylor', 'Brown', 'Davies', 'Evans', 'Wilson',
  'Thomas', 'Johnson', 'Roberts', 'Walker', 'Wright', 'Thompson', 'Hughes', 'Edwards',
  // French
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand',
  'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David',
  // German
  'Muller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker',
  'Schulz', 'Hoffmann', 'Schaefer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf',
  // Italian
  'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci',
  'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa',
  // Portuguese/Brazilian
  'Silva', 'Santos', 'Oliveira', 'Pereira', 'Costa', 'Ferreira', 'Almeida', 'Ribeiro',
  'Carvalho', 'Gomes', 'Lopes', 'Mendes', 'Sousa', 'Marques', 'Neves', 'Vieira',
  // Dutch
  'De Jong', 'Jansen', 'De Vries', 'Van den Berg', 'Van Dijk', 'Bakker', 'Visser', 'Smit',
  // African
  'Diallo', 'Toure', 'Dembele', 'Traore', 'Koulibaly', 'Diop', 'Sylla', 'Camara',
];

// Nationalities with distribution weights
const NATIONALITIES = [
  { name: 'Spain', weight: 10 },
  { name: 'England', weight: 10 },
  { name: 'France', weight: 10 },
  { name: 'Germany', weight: 10 },
  { name: 'Italy', weight: 8 },
  { name: 'Brazil', weight: 10 },
  { name: 'Portugal', weight: 6 },
  { name: 'Netherlands', weight: 6 },
  { name: 'Argentina', weight: 8 },
  { name: 'Belgium', weight: 5 },
  { name: 'Croatia', weight: 3 },
  { name: 'Denmark', weight: 3 },
  { name: 'Sweden', weight: 3 },
  { name: 'Norway', weight: 3 },
  { name: 'Poland', weight: 3 },
  { name: 'Senegal', weight: 4 },
  { name: 'Nigeria', weight: 4 },
  { name: 'Morocco', weight: 4 },
  { name: 'USA', weight: 3 },
  { name: 'Japan', weight: 2 },
  { name: 'South Korea', weight: 2 },
  { name: 'Turkey', weight: 3 },
  { name: 'Switzerland', weight: 2 },
  { name: 'Austria', weight: 2 },
];

// Position details
const POSITIONS = {
  GK: ['GK'],
  DEF: ['CB', 'CB', 'CB', 'LB', 'RB', 'LWB', 'RWB'], // CBs more common
  MID: ['CDM', 'CM', 'CM', 'CAM', 'LM', 'RM'],
  FWD: ['ST', 'ST', 'LW', 'RW', 'CF'], // STs more common
};

/**
 * Generate a random nationality based on weights
 * @returns {string} Nationality name
 */
function getRandomNationality() {
  const totalWeight = NATIONALITIES.reduce((sum, n) => sum + n.weight, 0);
  let random = Math.random() * totalWeight;

  for (const nat of NATIONALITIES) {
    random -= nat.weight;
    if (random <= 0) {
      return nat.name;
    }
  }

  return NATIONALITIES[0].name;
}

/**
 * Generate a random position category based on distribution
 * @returns {string} Position category (GK, DEF, MID, FWD)
 */
function getRandomPositionCategory() {
  const random = Math.random();
  let cumulative = 0;

  for (const [category, probability] of Object.entries(WONDERKID_CONFIG.POSITION_DISTRIBUTION)) {
    cumulative += probability;
    if (random < cumulative) {
      return category;
    }
  }

  return 'MID'; // Default fallback
}

/**
 * Generate a specific position from category
 * @param {string} category - Position category
 * @returns {string} Specific position
 */
function getRandomPosition(category) {
  const positions = POSITIONS[category];
  return positions[Math.floor(Math.random() * positions.length)];
}

/**
 * Generate a random player name
 * @returns {string} Full player name
 */
function generatePlayerName() {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

/**
 * Generate a single wonderkid
 * @param {number} season - Current season number
 * @param {number} index - Index of this wonderkid in the season's batch
 * @returns {Object} Wonderkid player object
 */
export function generateWonderkid(season, index) {
  const positionCategory = getRandomPositionCategory();
  const position = getRandomPosition(positionCategory);
  const nationality = getRandomNationality();
  const name = generatePlayerName();

  // Generate age (17-20, skewed toward 18-19)
  const ageRoll = Math.random();
  let age;
  if (ageRoll < 0.20) age = 17;
  else if (ageRoll < 0.55) age = 18;
  else if (ageRoll < 0.85) age = 19;
  else age = 20;

  // Generate rating (72-80)
  const rating = Math.floor(
    Math.random() * (WONDERKID_CONFIG.MAX_RATING - WONDERKID_CONFIG.MIN_RATING + 1) +
    WONDERKID_CONFIG.MIN_RATING
  );

  // Generate potential (85-95, higher for higher base rating)
  const basePotential = WONDERKID_CONFIG.MIN_POTENTIAL;
  const potentialRange = WONDERKID_CONFIG.MAX_POTENTIAL - WONDERKID_CONFIG.MIN_POTENTIAL;
  const ratingBonus = (rating - WONDERKID_CONFIG.MIN_RATING) / (WONDERKID_CONFIG.MAX_RATING - WONDERKID_CONFIG.MIN_RATING);
  const potential = Math.floor(basePotential + potentialRange * (0.3 + ratingBonus * 0.7 + Math.random() * 0.3));

  // Generate peak age range
  const peakRange = generatePeakAgeRange(positionCategory);

  // Create unique ID
  const id = `wonderkid-s${season}-${index}`;

  return {
    id,
    name,
    position,
    positionCategory,
    nationality,
    rating,
    age,
    potential: Math.min(WONDERKID_CONFIG.MAX_POTENTIAL, potential),
    peakAgeStart: peakRange.peakAgeStart,
    peakAgeEnd: peakRange.peakAgeEnd,
    realClub: 'youth-academy',
    basePrice: 5000000, // Base auction price
    isWonderkid: true,
    generatedSeason: season,
    form: { current: 0, trend: 'stable' },
  };
}

/**
 * Generate all wonderkids for a season
 * @param {number} season - Current season number
 * @returns {Array} Array of wonderkid player objects
 */
export function generateWonderkids(season) {
  // Determine how many wonderkids (5-10)
  const count = Math.floor(
    Math.random() * (WONDERKID_CONFIG.MAX_PER_SEASON - WONDERKID_CONFIG.MIN_PER_SEASON + 1) +
    WONDERKID_CONFIG.MIN_PER_SEASON
  );

  const wonderkids = [];

  // Track position counts to ensure variety
  const positionCounts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };

  for (let i = 0; i < count; i++) {
    let wonderkid = generateWonderkid(season, i);

    // Ensure we get at least one of each position (except maybe GK)
    // if we have 7+ wonderkids
    if (count >= 7 && i < 4) {
      const positions = ['DEF', 'MID', 'FWD', 'DEF'];
      const forcedCategory = positions[i];
      if (wonderkid.positionCategory !== forcedCategory) {
        const position = getRandomPosition(forcedCategory);
        wonderkid = {
          ...wonderkid,
          position,
          positionCategory: forcedCategory,
        };
      }
    }

    positionCounts[wonderkid.positionCategory]++;
    wonderkids.push(wonderkid);
  }

  // Sort by rating (highest first) for draft display
  wonderkids.sort((a, b) => b.rating - a.rating);

  return wonderkids;
}

/**
 * Get wonderkid display summary
 * @param {Array} wonderkids - Array of wonderkids
 * @returns {Object} Summary statistics
 */
export function getWonderkidSummary(wonderkids) {
  const summary = {
    total: wonderkids.length,
    byPosition: { GK: 0, DEF: 0, MID: 0, FWD: 0 },
    avgRating: 0,
    avgPotential: 0,
    avgAge: 0,
    highestRated: null,
    highestPotential: null,
  };

  if (wonderkids.length === 0) return summary;

  let totalRating = 0;
  let totalPotential = 0;
  let totalAge = 0;

  wonderkids.forEach(wk => {
    summary.byPosition[wk.positionCategory]++;
    totalRating += wk.rating;
    totalPotential += wk.potential;
    totalAge += wk.age;

    if (!summary.highestRated || wk.rating > summary.highestRated.rating) {
      summary.highestRated = wk;
    }
    if (!summary.highestPotential || wk.potential > summary.highestPotential.potential) {
      summary.highestPotential = wk;
    }
  });

  summary.avgRating = Math.round(totalRating / wonderkids.length * 10) / 10;
  summary.avgPotential = Math.round(totalPotential / wonderkids.length * 10) / 10;
  summary.avgAge = Math.round(totalAge / wonderkids.length * 10) / 10;

  return summary;
}

/**
 * Get wonderkid display card data
 * @param {Object} wonderkid - Wonderkid player object
 * @returns {Object} Display-ready data
 */
export function getWonderkidCardData(wonderkid) {
  return {
    ...wonderkid,
    potentialLabel: getPotentialLabel(wonderkid.potential),
    potentialColor: getPotentialColor(wonderkid.potential),
    ratingColor: getRatingColor(wonderkid.rating),
  };
}

/**
 * Get label for potential value
 * @param {number} potential - Player potential
 * @returns {string} Label
 */
function getPotentialLabel(potential) {
  if (potential >= 94) return 'Generational';
  if (potential >= 92) return 'World Class';
  if (potential >= 90) return 'Elite';
  if (potential >= 88) return 'Excellent';
  return 'Promising';
}

/**
 * Get color class for potential
 * @param {number} potential - Player potential
 * @returns {string} Tailwind color class
 */
function getPotentialColor(potential) {
  if (potential >= 94) return 'text-yellow-400';
  if (potential >= 92) return 'text-purple-400';
  if (potential >= 90) return 'text-green-400';
  if (potential >= 88) return 'text-blue-400';
  return 'text-slate-300';
}

/**
 * Get color class for rating
 * @param {number} rating - Player rating
 * @returns {string} Tailwind color class
 */
function getRatingColor(rating) {
  if (rating >= 79) return 'text-green-400';
  if (rating >= 76) return 'text-yellow-400';
  if (rating >= 74) return 'text-orange-400';
  return 'text-slate-300';
}
