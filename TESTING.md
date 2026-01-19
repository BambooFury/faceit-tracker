# FACEITracker - Testing Instructions

## How to Test the Extension

### Installation
1. Download and unpack the extension files
2. Open your browser and go to `edge://extensions/` (for Edge) or `chrome://extensions/` (for Chrome)
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder

### Basic Features to Test

#### 1. Track Players
1. Go to https://www.faceit.com/
2. Click the FACEITracker icon in the browser toolbar
3. Navigate to the "Players" section (first icon in sidebar)
4. Enter a FACEIT player nickname (e.g., "s1mple", "NiKo", "donk")
5. Click "Add" button
6. The player should appear in the tracked players list with:
   - Avatar
   - Nickname
   - ELO rating
   - Skill level badge
   - Last 3 match results (W/L indicators)
   - Current status (Live/Offline)

#### 2. Live Match Detection
1. Add several players to your tracked list
2. The extension automatically checks if players are in a match every 2 minutes
3. When a player is in a match:
   - Status badge shows "Live" in red
   - Badge on extension icon shows count of players in matches
4. Click on a player card to open their FACEIT profile

#### 3. Blacklist Feature
1. Click the second icon in sidebar (circle with line)
2. Enter a player nickname
3. Add an optional note
4. Choose color (red or yellow)
5. Click "Add to Blacklist"
6. When you visit FACEIT match rooms, blacklisted players will be highlighted

#### 4. Refresh Players
1. In the Players section, click the refresh icon next to "Tracked Players"
2. The extension will update all player statuses and match history
3. Players are automatically sorted: live players first, then by most recent match

#### 5. Settings & Language
1. Click the gear icon in top right
2. Switch between English and Russian languages
3. Toggle "Show cover images" option

### Test Scenarios

#### Scenario 1: Add and Remove Players
- Add 3-5 different players
- Verify all information displays correctly
- Remove one player using the trash icon
- Verify player is removed from list

#### Scenario 2: Blacklist Management
- Add players to blacklist with different colors
- Add notes to some entries
- Visit a FACEIT match room to see highlighting
- Remove entries from blacklist

#### Scenario 3: Live Match Tracking
- Add players who are currently playing (check faceit.com for live matches)
- Wait for status update (or click refresh)
- Verify "Live" status appears
- Check that badge count updates

#### Scenario 4: Data Persistence
- Add several players and blacklist entries
- Close and reopen the browser
- Verify all data is still present

### API Usage
The extension uses the official FACEIT API:
- `https://open.faceit.com/data/v4/` - Player data and statistics
- `https://api.faceit.com/` - Match status and live data

No personal data is collected or transmitted. All user data (tracked players, notes, blacklist) is stored locally in browser storage.

### Known Limitations
- Match status updates every 2 minutes (to avoid API rate limits)
- Some players may have "Streamer Mode" enabled, which hides their live status
- Extension only works on faceit.com domain

### Support
For issues or questions, please contact through the extension's GitHub repository or support channels.
