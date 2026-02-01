/**
 * Career Storage Utility
 * Handles saving and loading career mode data to/from localStorage
 */

const STORAGE_KEY_PREFIX = 'super-league-career-';
const CAREERS_INDEX_KEY = 'super-league-careers-index';
const CURRENT_CAREER_KEY = 'super-league-current-career';

/**
 * Generate a unique career ID
 * @returns {string} Unique career ID
 */
function generateCareerIdInternal() {
  return `career-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all career IDs from the index
 * @returns {Array} Array of career IDs
 */
function getCareerIndex() {
  try {
    const index = localStorage.getItem(CAREERS_INDEX_KEY);
    return index ? JSON.parse(index) : [];
  } catch (e) {
    console.error('Failed to load career index:', e);
    return [];
  }
}

/**
 * Save career index
 * @param {Array} index - Array of career IDs
 */
function saveCareerIndex(index) {
  try {
    localStorage.setItem(CAREERS_INDEX_KEY, JSON.stringify(index));
  } catch (e) {
    console.error('Failed to save career index:', e);
  }
}

/**
 * Save a career to localStorage
 * @param {Object} careerState - Full career state object
 * @param {string} careerId - Optional existing career ID (for updates)
 * @returns {Object} { success, careerId, error }
 */
export function saveCareer(careerState, careerId = null) {
  try {
    const id = careerId || generateCareerIdInternal();
    const storageKey = STORAGE_KEY_PREFIX + id;

    // Create save data with metadata
    const saveData = {
      id,
      savedAt: new Date().toISOString(),
      version: '2.0',
      metadata: {
        currentSeason: careerState.currentSeason || 1,
        seasonPhase: careerState.seasonPhase || 'pre-season',
        humanTeams: careerState.humanTeams || ['real-madrid', 'barcelona', 'bayern'],
        lastPlayed: new Date().toISOString(),
      },
      state: careerState,
    };

    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify(saveData));

    // Update index if new career
    if (!careerId) {
      const index = getCareerIndex();
      index.push(id);
      saveCareerIndex(index);
    }

    // Set as current career
    localStorage.setItem(CURRENT_CAREER_KEY, id);

    return { success: true, careerId: id, error: null };
  } catch (e) {
    console.error('Failed to save career:', e);
    return { success: false, careerId: null, error: e.message };
  }
}

/**
 * Load a career from localStorage
 * @param {string} careerId - Career ID to load
 * @returns {Object|null} Career state or null if not found
 */
export function loadCareer(careerId) {
  try {
    const storageKey = STORAGE_KEY_PREFIX + careerId;
    const data = localStorage.getItem(storageKey);

    if (!data) {
      console.warn(`Career not found: ${careerId}`);
      return null;
    }

    const saveData = JSON.parse(data);

    // Update last played time
    saveData.metadata.lastPlayed = new Date().toISOString();
    localStorage.setItem(storageKey, JSON.stringify(saveData));

    // Set as current career
    localStorage.setItem(CURRENT_CAREER_KEY, careerId);

    return saveData.state;
  } catch (e) {
    console.error('Failed to load career:', e);
    return null;
  }
}

/**
 * Load the most recently played career
 * @returns {Object|null} Career state or null if none found
 */
export function loadCurrentCareer() {
  try {
    const currentId = localStorage.getItem(CURRENT_CAREER_KEY);
    if (currentId) {
      return loadCareer(currentId);
    }
    return null;
  } catch (e) {
    console.error('Failed to load current career:', e);
    return null;
  }
}

/**
 * Get the current career ID
 * @returns {string|null} Current career ID or null
 */
export function getCurrentCareerId() {
  return localStorage.getItem(CURRENT_CAREER_KEY);
}

/**
 * List all saved careers with metadata
 * @returns {Array} Array of career summaries
 */
export function listCareers() {
  try {
    const index = getCareerIndex();
    const careers = [];

    for (const careerId of index) {
      const storageKey = STORAGE_KEY_PREFIX + careerId;
      const data = localStorage.getItem(storageKey);

      if (data) {
        try {
          const saveData = JSON.parse(data);
          careers.push({
            id: careerId,
            savedAt: saveData.savedAt,
            version: saveData.version,
            ...saveData.metadata,
          });
        } catch (e) {
          console.warn(`Failed to parse career ${careerId}:`, e);
        }
      }
    }

    // Sort by last played (most recent first)
    careers.sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed));

    return careers;
  } catch (e) {
    console.error('Failed to list careers:', e);
    return [];
  }
}

/**
 * Delete a career from localStorage
 * @param {string} careerId - Career ID to delete
 * @returns {Object} { success, error }
 */
export function deleteCareer(careerId) {
  try {
    const storageKey = STORAGE_KEY_PREFIX + careerId;

    // Remove from storage
    localStorage.removeItem(storageKey);

    // Update index
    const index = getCareerIndex();
    const newIndex = index.filter(id => id !== careerId);
    saveCareerIndex(newIndex);

    // Clear current career if it was the deleted one
    const currentId = localStorage.getItem(CURRENT_CAREER_KEY);
    if (currentId === careerId) {
      localStorage.removeItem(CURRENT_CAREER_KEY);
    }

    return { success: true, error: null };
  } catch (e) {
    console.error('Failed to delete career:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Check if a career exists
 * @param {string} careerId - Career ID to check
 * @returns {boolean} True if career exists
 */
export function careerExists(careerId) {
  const storageKey = STORAGE_KEY_PREFIX + careerId;
  return localStorage.getItem(storageKey) !== null;
}

/**
 * Get career metadata without loading full state
 * @param {string} careerId - Career ID
 * @returns {Object|null} Career metadata or null
 */
export function getCareerMetadata(careerId) {
  try {
    const storageKey = STORAGE_KEY_PREFIX + careerId;
    const data = localStorage.getItem(storageKey);

    if (!data) return null;

    const saveData = JSON.parse(data);
    return {
      id: careerId,
      savedAt: saveData.savedAt,
      version: saveData.version,
      ...saveData.metadata,
    };
  } catch (e) {
    console.error('Failed to get career metadata:', e);
    return null;
  }
}

/**
 * Export career to JSON file (downloadable)
 * @param {string} careerId - Career ID to export
 * @returns {Object} { success, data, error }
 */
export function exportCareer(careerId) {
  try {
    const storageKey = STORAGE_KEY_PREFIX + careerId;
    const data = localStorage.getItem(storageKey);

    if (!data) {
      return { success: false, data: null, error: 'Career not found' };
    }

    return { success: true, data, error: null };
  } catch (e) {
    console.error('Failed to export career:', e);
    return { success: false, data: null, error: e.message };
  }
}

/**
 * Import career from JSON data
 * @param {string} jsonData - JSON string of career data
 * @returns {Object} { success, careerId, error }
 */
export function importCareer(jsonData) {
  try {
    const saveData = JSON.parse(jsonData);

    // Validate structure
    if (!saveData.state || !saveData.metadata) {
      return { success: false, careerId: null, error: 'Invalid career data structure' };
    }

    // Generate new ID for imported career
    const newId = generateCareerIdInternal();
    const storageKey = STORAGE_KEY_PREFIX + newId;

    // Update metadata
    saveData.id = newId;
    saveData.savedAt = new Date().toISOString();
    saveData.metadata.lastPlayed = new Date().toISOString();

    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify(saveData));

    // Update index
    const index = getCareerIndex();
    index.push(newId);
    saveCareerIndex(index);

    return { success: true, careerId: newId, error: null };
  } catch (e) {
    console.error('Failed to import career:', e);
    return { success: false, careerId: null, error: e.message };
  }
}

/**
 * Clear all career data (use with caution!)
 * @returns {Object} { success, deletedCount, error }
 */
export function clearAllCareers() {
  try {
    const index = getCareerIndex();
    let deletedCount = 0;

    for (const careerId of index) {
      const storageKey = STORAGE_KEY_PREFIX + careerId;
      localStorage.removeItem(storageKey);
      deletedCount++;
    }

    // Clear index and current career
    localStorage.removeItem(CAREERS_INDEX_KEY);
    localStorage.removeItem(CURRENT_CAREER_KEY);

    return { success: true, deletedCount, error: null };
  } catch (e) {
    console.error('Failed to clear careers:', e);
    return { success: false, deletedCount: 0, error: e.message };
  }
}

/**
 * Get storage usage for careers
 * @returns {Object} { totalBytes, careerCount, bytesPerCareer }
 */
export function getStorageUsage() {
  try {
    const index = getCareerIndex();
    let totalBytes = 0;

    for (const careerId of index) {
      const storageKey = STORAGE_KEY_PREFIX + careerId;
      const data = localStorage.getItem(storageKey);
      if (data) {
        totalBytes += data.length * 2; // UTF-16 encoding = 2 bytes per char
      }
    }

    return {
      totalBytes,
      careerCount: index.length,
      bytesPerCareer: index.length > 0 ? Math.round(totalBytes / index.length) : 0,
      formattedSize: formatBytes(totalBytes),
    };
  } catch (e) {
    console.error('Failed to get storage usage:', e);
    return { totalBytes: 0, careerCount: 0, bytesPerCareer: 0, formattedSize: '0 B' };
  }
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate a career ID (exported for external use)
 */
export const generateCareerId = generateCareerIdInternal;
