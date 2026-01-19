/**
 * FACEIT Data API wrapper
 * Documentation: https://developers.faceit.com/
 */

const API_BASE = 'https://open.faceit.com/data/v4';

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, apiKey) {
  if (!apiKey) {
    throw new Error('API_KEY_REQUIRED');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('NOT_FOUND');
    }
    if (response.status === 401) {
      throw new Error('INVALID_API_KEY');
    }
    throw new Error(`API_ERROR_${response.status}`);
  }

  return response.json();
}

/**
 * Search player by nickname
 */
async function searchPlayer(nickname, apiKey) {
  const data = await apiRequest(`/players?nickname=${encodeURIComponent(nickname)}`, apiKey);
  return data;
}

/**
 * Get player details by ID
 */
async function getPlayerById(playerId, apiKey) {
  const data = await apiRequest(`/players/${playerId}`, apiKey);
  return data;
}

/**
 * Get player's CS2 stats
 */
async function getPlayerStats(playerId, apiKey) {
  try {
    const data = await apiRequest(`/players/${playerId}/stats/cs2`, apiKey);
    return data;
  } catch (e) {
    // CS2 stats might not be available
    return null;
  }
}

/**
 * Get player's match history
 */
async function getPlayerMatches(playerId, apiKey, limit = 5) {
  try {
    const data = await apiRequest(`/players/${playerId}/history?game=cs2&limit=${limit}`, apiKey);
    return data.items || [];
  } catch (e) {
    return [];
  }
}

/**
 * Get match details
 */
async function getMatchDetails(matchId, apiKey) {
  const data = await apiRequest(`/matches/${matchId}`, apiKey);
  return data;
}

/**
 * Parse player data into unified format
 */
function parsePlayerData(playerData, stats = null, matches = []) {
  const cs2Data = playerData.games?.cs2 || {};
  
  // Determine last match result
  let lastMatchResult = null;
  if (matches.length > 0) {
    const lastMatch = matches[0];
    const playerTeam = lastMatch.teams?.faction1?.players?.some(p => p.player_id === playerData.player_id)
      ? 'faction1' : 'faction2';
    const winnerTeam = lastMatch.results?.winner;
    lastMatchResult = playerTeam === winnerTeam ? 'win' : 'loss';
  }

  return {
    id: playerData.player_id,
    nickname: playerData.nickname,
    avatar: playerData.avatar || null,
    country: playerData.country || 'unknown',
    skillLevel: cs2Data.skill_level || 0,
    elo: cs2Data.faceit_elo || 0,
    lastMatchResult,
    lastMatchId: matches[0]?.match_id || null,
    status: 'unknown', // FACEIT API doesn't provide real-time status
    profileUrl: playerData.faceit_url?.replace('{lang}', 'en') || `https://www.faceit.com/en/players/${playerData.nickname}`
  };
}

/**
 * Fetch complete player info
 */
async function fetchPlayerInfo(nickname, apiKey) {
  // Search for player
  const playerData = await searchPlayer(nickname, apiKey);
  
  // Get match history
  const matches = await getPlayerMatches(playerData.player_id, apiKey, 1);
  
  // Get stats (optional)
  const stats = await getPlayerStats(playerData.player_id, apiKey);
  
  return parsePlayerData(playerData, stats, matches);
}

/**
 * Refresh player data by ID
 */
async function refreshPlayerInfo(playerId, apiKey) {
  const playerData = await getPlayerById(playerId, apiKey);
  const matches = await getPlayerMatches(playerId, apiKey, 1);
  const stats = await getPlayerStats(playerId, apiKey);
  
  return parsePlayerData(playerData, stats, matches);
}

// Export for ES modules
export {
  searchPlayer,
  getPlayerById,
  getPlayerStats,
  getPlayerMatches,
  getMatchDetails,
  fetchPlayerInfo,
  refreshPlayerInfo
};
