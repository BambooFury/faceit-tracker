/**
 * Storage utility for chrome.storage.local
 * Handles players list, settings, and cache
 */

const STORAGE_KEYS = {
  PLAYERS: 'trackedPlayers',
  API_KEY: 'faceitApiKey',
  AUTO_REFRESH: 'autoRefresh',
  REFRESH_INTERVAL: 'refreshInterval',
  CACHE: 'dataCache',
  LANGUAGE: 'language'
};

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

/**
 * Get data from storage
 */
async function get(key) {
  const result = await chrome.storage.local.get(key);
  return result[key];
}

/**
 * Set data to storage
 */
async function set(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

/**
 * Get all tracked players
 */
async function getPlayers() {
  const players = await get(STORAGE_KEYS.PLAYERS);
  return players || [];
}

/**
 * Add a player to tracked list
 */
async function addPlayer(player) {
  const players = await getPlayers();
  const exists = players.some(p => p.id === player.id);
  if (exists) return false;
  
  players.push({
    ...player,
    addedAt: Date.now()
  });
  await set(STORAGE_KEYS.PLAYERS, players);
  return true;
}

/**
 * Remove a player from tracked list
 */
async function removePlayer(playerId) {
  const players = await getPlayers();
  const filtered = players.filter(p => p.id !== playerId);
  await set(STORAGE_KEYS.PLAYERS, filtered);
  // Also remove from cache
  await removeCachedData(playerId);
}

/**
 * Update player data
 */
async function updatePlayer(playerId, data) {
  const players = await getPlayers();
  const index = players.findIndex(p => p.id === playerId);
  if (index !== -1) {
    players[index] = { ...players[index], ...data, updatedAt: Date.now() };
    await set(STORAGE_KEYS.PLAYERS, players);
  }
}

/**
 * Get API key
 */
async function getApiKey() {
  return await get(STORAGE_KEYS.API_KEY);
}

/**
 * Set API key
 */
async function setApiKey(key) {
  await set(STORAGE_KEYS.API_KEY, key);
}

/**
 * Get auto-refresh settings
 */
async function getAutoRefreshSettings() {
  const enabled = await get(STORAGE_KEYS.AUTO_REFRESH);
  const interval = await get(STORAGE_KEYS.REFRESH_INTERVAL);
  return {
    enabled: enabled ?? false,
    interval: interval ?? 10
  };
}

/**
 * Set auto-refresh settings
 */
async function setAutoRefreshSettings(enabled, interval) {
  await set(STORAGE_KEYS.AUTO_REFRESH, enabled);
  await set(STORAGE_KEYS.REFRESH_INTERVAL, interval);
}

/**
 * Get cached data for a player
 */
async function getCachedData(playerId) {
  const cache = await get(STORAGE_KEYS.CACHE) || {};
  const cached = cache[playerId];
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

/**
 * Set cached data for a player
 */
async function setCachedData(playerId, data) {
  const cache = await get(STORAGE_KEYS.CACHE) || {};
  cache[playerId] = {
    data,
    timestamp: Date.now()
  };
  await set(STORAGE_KEYS.CACHE, cache);
}

/**
 * Remove cached data for a player
 */
async function removeCachedData(playerId) {
  const cache = await get(STORAGE_KEYS.CACHE) || {};
  delete cache[playerId];
  await set(STORAGE_KEYS.CACHE, cache);
}

/**
 * Clear all cache
 */
async function clearCache() {
  await set(STORAGE_KEYS.CACHE, {});
}

/**
 * Get language preference
 */
async function getLanguage() {
  const lang = await get(STORAGE_KEYS.LANGUAGE);
  return lang || chrome.i18n.getUILanguage().split('-')[0] || 'en';
}

/**
 * Set language preference
 */
async function setLanguage(lang) {
  await set(STORAGE_KEYS.LANGUAGE, lang);
}

// Export for ES modules
export {
  STORAGE_KEYS,
  get,
  set,
  getPlayers,
  addPlayer,
  removePlayer,
  updatePlayer,
  getApiKey,
  setApiKey,
  getAutoRefreshSettings,
  setAutoRefreshSettings,
  getCachedData,
  setCachedData,
  removeCachedData,
  clearCache,
  getLanguage,
  setLanguage
};
