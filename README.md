🎵 Technics Master Audio Player
A high-fidelity audio player inspired by vintage Technics hardware design. This application features a sleek, dark interface and professional-grade audio controls.
🚀 Key Features
📁 File Management & Playlist
 * Eject/Open: Mechanically opens the drawer to select audio files from your computer.
 * Interactive Playlist: Access your loaded tracks by clicking the TRACK display or the dedicated PLAYLIST button.
 * Direct Play: Click any track within the playlist to start playback instantly.
 * Metadata Support: Automatically extracts title, artist, album, and cover art (ID3 Tags) using jsmediatags.
🕹️ Playback Controls
 * Numeric Keypad (0-9): Directly input a track number for instant access.
 * Smart Scanning: Hold the Next/Prev buttons to fast-forward or rewind through a track.
 * Time Jump: Dedicated -10S and +10S buttons for precise navigation.
 * Repeat Modes:
   * OFF: Normal playback.
   * REPEAT 1: Loops the current track.
   * REPEAT ALL: Loops the entire playlist.
 * Random Mode: Shuffles playback across the playlist.
 * A-B Loop: Define a start (A) and end (B) point to loop a specific sequence.
🎛️ Audio & Equalization
 * Tone Adjustments: Precise gain control for BASS and TREBLE (-10 to +10).
 * Tone Flat: Instant reset of all equalization settings to zero.
 * Volume & Mute: Smooth volume management with visual feedback on the central LCD.
📊 Visualization & Display
 * Dual VU Meters: Real-time stereo visualization (Left/Right) with reactive segments.
 * VU Sensitivity: Adjustable reactivity via VU- and VU+ buttons.
 * Time Modes: Toggle between elapsed time and remaining time by clicking the timer or the TIME button.
 * Central LCD Display: Temporary notifications for volume, VU sensitivity, and tone levels.
🎨 Personalization & Themes
 * Exclusively Dark: Interface optimized for low-light environments.
 * Aura & Background: Customize the backlight color (aura) and chassis background via the setup menu.
 * LCD Customization: Change the background color of the LCD screens.
 * Persistence: Automatically saves your theme preferences and settings to localStorage.
💻 Installation (PC & Mac)
The Technics Master Audio Player is a Progressive Web App (PWA). You can install it as a standalone application on your desktop:
On Windows / Linux (Chrome or Edge)
 * Open the application in your browser.
 * Click the Install icon (computer with an arrow) in the address bar.
 * Confirm the installation. The app will now appear in your Start menu and taskbar.
On macOS (Safari)
 * Open the application in Safari.
 * Click the Share button (square with an upward arrow) in the toolbar.
 * Select "Add to Dock".
 * The player will now function as a dedicated macOS app with its own window.
⌨️ Sub-controls Layout
Located inside the drawer (Numeric and bottom rows):
| Button | Function |
|---|---|
| 0 - 9 | Direct track selection |
| TIME | Toggle time display (Remaining/Elapsed) |
| PLAYLIST | Open/Close the file list |
| TONE FLAT | Reset Bass and Treble to 0 |
| +/- 10S | 10-second skip forward or backward |
| REPEAT | Cycle through repeat modes (1, All, Off) |
| RANDOM | Toggle shuffle mode |
🛠️ Technical Stack
 * Engine: JavaScript ES6+ (Web Audio API).
 * Styling: CSS3 with dynamic variables and Flexbox.
 * Libraries: jsmediatags for ID3 processing.
 * Language: English only.

