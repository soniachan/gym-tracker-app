# Gym Tracker App

A React-based progressive web app for tracking your gym workouts on mobile devices.

## Features

- Track workouts by muscle group
- Record sets for each workout
- View daily, weekly, and monthly statistics
- Offline data storage using IndexedDB
- Mobile-friendly design optimized for iOS
- Import/export functionality for data backup

## Setup Instructions

### Installation

1. Make sure you have Node.js and npm installed on your computer
2. Open a terminal in the project directory
3. Run `npm install` to install all dependencies

### Development

Run `npm start` to start the development server.

### Deploying to iPhone

#### Method 1: Use as a Progressive Web App (PWA)
1. Run `npm run build` to create a production build
2. Deploy the build folder to a web server
3. On your iPhone, open Safari and navigate to your deployed web app
4. Tap the "Share" icon (box with arrow pointing up)
5. Scroll down and tap "Add to Home Screen"
6. Give your app a name and tap "Add"
7. The app will now appear on your home screen with an icon

#### Method 2: Use during development
1. Make sure your iPhone and computer are on the same Wi-Fi network
2. Run `npm start` to start the development server
3. Find your computer's local IP address (Settings > Network or run `ipconfig` on Windows / `ifconfig` on Mac)
4. On your iPhone, open Safari and go to http://YOUR_COMPUTER_IP:3000
5. You can use the app directly in Safari or add it to your home screen as described above

## Accessing from iPhone

- Once added to your home screen, the app will open in fullscreen mode without Safari's interface
- All data is stored locally on your device in IndexedDB
- No internet connection is required after the initial installation

## Data Management

- Your workout data is automatically saved to your device
- Use the export/import feature to backup your data or transfer it to another device
- The "Reset All Data" button at the bottom of the screen will permanently delete all workout data