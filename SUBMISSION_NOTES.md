# FACEITracker - Submission Notes for Microsoft Edge Add-ons

## Extension Overview

FACEITracker is a browser extension that helps FACEIT CS2 players track their favorite professional and amateur players. It displays real-time match status, player statistics, and ELO ratings using the official FACEIT public API.

## How to Test

### Prerequisites
- No account or API key required for basic testing
- Extension works on faceit.com domain

### Testing Steps

1. **Install the Extension**
   - Load unpacked extension in Edge
   - Click the FACEITracker icon in toolbar

2. **Add Players to Track**
   - Click "Players" section (first icon)
   - Enter a FACEIT nickname (suggestions: "s1mple", "NiKo", "donk", "m0NESY")
   - Click "Add"
   - Player appears with avatar, ELO, level, and recent matches

3. **View Live Status**
   - Extension checks player status every 2 minutes
   - Click refresh icon for manual update
   - "Live" badge appears when player is in a match
   - Extension icon badge shows count of live players

4. **Blacklist Feature**
   - Click second icon (blacklist)
   - Add player nickname with optional note
   - Choose color (red/yellow)
   - Visit FACEIT match rooms to see highlighting

5. **Settings**
   - Click gear icon
   - Switch language (English/Russian)
   - Toggle cover images

### Test Accounts
You can test with any public FACEIT player. Popular examples:
- s1mple (professional player)
- NiKo (professional player)
- donk (professional player)
- m0NESY (professional player)

These are public profiles visible to anyone on faceit.com.

## Privacy & Data

### What Data We Store (Locally Only)
- Player nicknames you choose to track
- Player statistics from FACEIT API
- Your personal notes on blacklist entries
- Extension preferences

### What We DON'T Do
- ❌ No user accounts or login required
- ❌ No personal data collection
- ❌ No external servers (except FACEIT API)
- ❌ No tracking or analytics
- ❌ No data sharing with third parties

### API Usage
- Uses official FACEIT public API: https://open.faceit.com/data/v4/
- All data is publicly available on faceit.com
- No authentication required for public endpoints
- Respects FACEIT rate limits

## Technical Information

### Permissions Justification

1. **storage**
   - Purpose: Store tracked players list locally
   - Scope: Local storage only, no sync

2. **alarms**
   - Purpose: Periodic status updates (every 2 minutes)
   - Scope: Background updates for live match detection

### Host Permissions

1. **https://open.faceit.com/***
   - Purpose: Fetch player statistics and match data
   - Official FACEIT API endpoint

2. **https://api.faceit.com/***
   - Purpose: Check live match status
   - Official FACEIT API endpoint

3. **https://faceitracker-default-rtdb.europe-west1.firebasedatabase.app/***
   - Purpose: Fetch API key for public endpoints
   - Read-only access to shared API key

### Content Script
- Runs on: https://*.faceit.com/*
- Purpose: Highlight blacklisted players on match pages
- Scope: Only modifies visual appearance, no data collection

## Privacy Policy

Full privacy policy available at: [Include your hosted privacy.html URL here]

Key points:
- All data stored locally in browser
- No personal information collected
- Uses only public FACEIT data
- No third-party data sharing
- User has full control to delete data

## Support & Contact

- GitHub: [Your GitHub URL]
- Support Email: [Your email]
- Documentation: See README.md and TESTING.md

## Compliance

- ✅ No personal data collection
- ✅ Privacy policy provided
- ✅ Uses only public APIs
- ✅ Local storage only
- ✅ No tracking or analytics
- ✅ Open source code available
- ✅ Detailed testing instructions provided

## Additional Notes

### Why This Extension is Useful
- FACEIT doesn't provide native player tracking
- Users want to know when their favorite players are playing
- Helps community members follow professional players
- Useful for team managers tracking their players

### Target Audience
- FACEIT CS2 players
- Esports fans
- Team managers and coaches
- Content creators covering CS2

### Similar Extensions
This extension is similar to:
- Twitch Now (tracks Twitch streamers)
- Steam Status (tracks Steam friends)
- Discord Status (tracks Discord users)

But specifically designed for FACEIT platform.

## Version History

- 1.6.1: Current version with refresh feature and improved sorting
- 1.5.2: Initial release with basic tracking and blacklist

Thank you for reviewing FACEITracker!
