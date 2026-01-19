/**
 * Service Worker for FACEIT Pro Tracker
 * Handles background tasks and auto-refresh alarms
 */

import * as storage from '../utils/storage.js';
import { refreshPlayerInfo } from '../utils/api.js';

const ALARM_NAME = 'autoRefreshPlayers';

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('FACEIT Pro Tracker installed');
  await setupAlarm();
});

/**
 * Handle alarm events
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await refreshAllPlayers();
  }
});

/**
 * Setup or update the auto-refresh alarm
 */
async function setupAlarm() {
  const settings = await storage.getAutoRefreshSettings();
  
  // Clear existing alarm
  await chrome.alarms.clear(ALARM_NAME);
  
  if (settings.enabled) {
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: settings.interval
    });
    console.log(`Auto-refresh alarm set for every ${settings.interval} minutes`);
  }
}

/**
 * Refresh all tracked players
 */
async function refreshAllPlayers() {
  const apiKey = await storage.getApiKey();
  if (!apiKey) {
    console.log('No API key, skipping refresh');
    return;
  }

  const players = await storage.getPlayers();
  console.log(`Refreshing ${players.length} players...`);

  for (const player of players) {
    try {
      const updatedData = await refreshPlayerInfo(player.id, apiKey);
      await storage.updatePlayer(player.id, updatedData);
      await storage.setCachedData(player.id, updatedData);
      console.log(`Refreshed: ${player.nickname}`);
    } catch (error) {
      console.error(`Failed to refresh ${player.nickname}:`, error);
    }
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Listen for messages from popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_ALARM') {
    setupAlarm().then(() => sendResponse({ success: true }));
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'REFRESH_ALL') {
    refreshAllPlayers().then(() => sendResponse({ success: true }));
    return true;
  }
});

// Initial alarm setup
setupAlarm();
