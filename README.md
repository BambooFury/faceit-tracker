# FACEITracker - FACEIT Player Tracker

A browser extension for tracking your favorite FACEIT CS2 players in real-time.

## 🎯 Features

- **Track Players** - Add any FACEIT player by nickname
- **Live Status** - See when players are in a match
- **Player Stats** - View ELO, skill level, and recent match results
- **Blacklist** - Mark and highlight specific players with custom notes
- **Auto-Refresh** - Automatic status updates every 2 minutes
- **Multi-Language** - English and Russian support
- **Dark Theme** - Modern UI with FACEIT orange accents

## 📦 Installation

### For Users

#### Chrome Web Store / Edge Add-ons
*Coming soon - Extension is currently under review*

#### Manual Installation (Developer Mode)
1. Download the latest release
2. Open your browser extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

### For Reviewers

Please see [TESTING.md](TESTING.md) for detailed testing instructions.

## 🚀 Quick Start

1. Install the extension
2. Click the FACEITracker icon in your browser toolbar
3. Add players by entering their FACEIT nickname
4. The extension will automatically track their status and stats

## 🔒 Privacy

FACEITracker respects your privacy:
- **No data collection** - All data is stored locally on your device
- **No tracking** - We don't track your browsing activity
- **No external servers** - Only communicates with FACEIT's public API
- **Open source** - Code is available for review

See our [Privacy Policy](privacy.html) for full details.

## 🛠 Technical Details

- **Manifest Version**: 3
- **Permissions**: 
  - `storage` - Store tracked players locally
  - `alarms` - Periodic status updates
- **API**: Uses official FACEIT public API
- **Storage**: Chrome Storage API (local)

## 📋 How It Works

1. You add FACEIT player nicknames to track
2. Extension fetches public data from FACEIT API
3. Data is cached locally to minimize API requests
4. Status updates automatically every 2 minutes
5. Badge shows count of players currently in matches

## 🌐 Supported Platforms

- ✅ Google Chrome
- ✅ Microsoft Edge
- ✅ Brave
- ✅ Any Chromium-based browser

## 📝 Changelog

### Version 1.6.1
- Added refresh button for manual player updates
- Improved player sorting (live players first)
- Fixed UI bugs
- Enhanced performance

### Version 1.5.2
- Initial release
- Player tracking
- Blacklist feature
- Live match detection

## 🤝 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact through extension support page

## 📄 License

This extension is provided as-is for personal use. Not affiliated with FACEIT.

## 🙏 Credits

- FACEIT for their public API
- Icons and design inspired by FACEIT platform
