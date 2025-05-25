# 🏋️ GymTracker

A modern, professional gym workout tracking app built with React. Track your exercises, visualize your strength development, and maintain consistent training habits with gaming-style progression.

![GymTracker Screenshot](https://via.placeholder.com/800x400/2563eb/ffffff?text=GymTracker+App)

## ✨ Features

### 📱 **Mobile-First Design**
- Responsive layout optimized for mobile devices
- Touch-friendly interface with proper button sizing
- Clean, professional UI following modern design principles

### 🎯 **Smart Workout Tracking**
- **9 Muscle Groups**: Biceps, Triceps, Legs, Cardio, Back, Chest, Glutes, Shoulders, Abs
- **Set-Based Tracking**: Record exercises with customizable set counts
- **Timestamp Logging**: Automatic time tracking for workout duration
- **Quick Add/Remove**: Easy exercise management with intuitive controls

### 📊 **Advanced Analytics**
- **Gaming-Style Progression**: Level up muscle groups (Beginner → Master)
- **Radar Chart Visualization**: See strength distribution across all muscle groups
- **Recent Activity Tracking**: 7-day activity summary
- **Progress Visualization**: Color-coded progress bars and level indicators

### 📅 **Multi-View Calendar**
- **Today View**: Focus on current workout with exercise adding interface
- **Weekly View**: Mobile-optimized daily breakdown with workout summaries
- **Monthly View**: Calendar overview with set count indicators
- **Analysis View**: Comprehensive strength analysis and gaming stats

### 💾 **Reliable Data Storage**
- **Local Storage**: Uses IndexedDB for offline-first functionality
- **Auto-Backup**: Automatic saving with 5-minute intervals
- **Data Persistence**: Smart browser storage management
- **Privacy-First**: All data stays on your device

### 🎮 **Gaming Elements**
- **Level System**: 5 levels per muscle group based on total sets
- **Rank Progression**: Beginner → Intermediate → Advanced → Expert → Master
- **Color-Coded Stats**: Visual feedback for different achievement levels
- **Progress Tracking**: XP-style progress bars for next level advancement

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gym-tracker.git
   cd gym-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` to use the app

### Building for Production

```bash
npm run build
# or
yarn build
```

The built app will be in the `build` folder, ready for deployment.

## 🎨 Design System

### Color Palette
- **Primary**: Deep slate tones (#334155) for professional look
- **Accent**: Orange (#f97316) for active states and progress
- **Success**: Emerald green for completed actions
- **Warning**: Amber for notifications and alerts
- **Error**: Red for destructive actions

### Typography
- **Font Family**: Inter (system fallback: -apple-system, sans-serif)
- **Hierarchy**: Clear font weights and sizes for different content types
- **Readability**: Optimized for both desktop and mobile viewing

### Icons
- **Custom SVG Icons**: Professional vector icons for all muscle groups
- **Consistent Style**: Unified design language across all interface elements
- **Scalable**: Icons work at multiple sizes (14px - 24px)

## 📱 Mobile Optimization

### Responsive Design
- **Mobile-First**: Designed primarily for mobile use
- **Touch Targets**: Minimum 44px tap targets for accessibility
- **Readable Text**: Appropriate font sizes for mobile screens
- **Optimized Layouts**: Content adapts beautifully to different screen sizes

### Key Mobile Features
- **Vertical Week View**: Easy-to-read daily workout summaries
- **Large Set Controls**: Big +/- buttons for adjusting exercise sets
- **Clear Visual Hierarchy**: Important information stands out
- **Smooth Animations**: 60fps transitions and micro-interactions

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 with Hooks
- **Styling**: Tailwind CSS for utility-first styling
- **Icons**: Lucide React for UI icons + custom SVG muscle icons
- **Storage**: IndexedDB for local data persistence
- **Charting**: Custom radar chart component

### Key Components
```
src/
├── components/
│   ├── GymTracker.js          # Main app component
│   ├── DataStorageNotice.js   # Privacy notice component
│   └── RadarChart.js          # Custom chart visualization
├── index.js                   # App entry point
└── index.css                  # Global styles
```

### Data Structure
```javascript
// Workout Object
{
  id: timestamp + random,      // Unique identifier
  date: "2024-05-25",         // ISO date string
  bodyPart: {                 // Muscle group object
    name: "Biceps",
    icon: "biceps",
    emoji: "💪"
  },
  timestamp: "2024-05-25T...", // Full timestamp
  sets: 3                     // Number of sets completed
}
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
REACT_APP_VERSION=1.0.0
REACT_APP_NAME=GymTracker
```

### Customization
- **Muscle Groups**: Edit the `bodyParts` array in `GymTracker.js`
- **Level Thresholds**: Modify the level calculation in `calculateMuscleStats`
- **Colors**: Update the Tailwind classes or add custom CSS
- **Auto-backup Interval**: Change the interval in the `useEffect` hook

## 📊 Data Management

### Local Storage
- **Technology**: IndexedDB for robust local storage
- **Capacity**: Can handle thousands of workout records
- **Offline-First**: Works without internet connection
- **Auto-Cleanup**: Browsers may remove unused data (users are informed)

### Data Export/Import
Currently stores data locally only. Future versions may include:
- CSV export functionality
- Cloud sync options
- Backup/restore features

## 🎯 User Experience

### Workout Flow
1. **Select Today Tab**: Access the main workout interface
2. **Add Exercise**: Tap muscle group buttons to log exercises
3. **Adjust Sets**: Use +/- controls to set the correct number of sets
4. **Track Progress**: View weekly/monthly summaries and analysis

### Motivation System
- **Visual Progress**: See strength development through charts
- **Achievement Levels**: Gaming-style progression keeps users engaged
- **Consistent Tracking**: Weekly activity goals encourage regular use
- **Data Insights**: Analysis view reveals training patterns and gaps

## 🔒 Privacy & Security

### Data Privacy
- **Local-Only Storage**: No data leaves your device
- **No Tracking**: No analytics or user tracking
- **No Accounts**: No sign-up or personal information required

### Browser Storage Info
- Users are informed about browser auto-cleanup behavior
- Clear guidance on maintaining data persistence
- Transparent about how local storage works

## 🚢 Deployment

### Static Hosting
The app can be deployed to any static hosting service:

- **Netlify**: Drag and drop the `build` folder
  ```bash
  npm run build
  # Upload build folder to Netlify
  ```

- **Vercel**: Connect your GitHub repository
  ```bash
  npm run build
  vercel --prod
  ```

- **GitHub Pages**: Use the gh-pages package
  ```bash
  npm install --save-dev gh-pages
  npm run build
  npm run deploy
  ```

### PWA Features
The app includes basic PWA capabilities:
- Offline functionality
- App-like experience on mobile
- Can be added to home screen

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
1. **Mobile-First**: Always design for mobile screens first
2. **Accessibility**: Ensure proper contrast and touch targets
3. **Performance**: Keep the app fast and responsive
4. **User Experience**: Prioritize intuitive, clean interfaces

### Reporting Issues
Please use the GitHub Issues tab to report bugs or request features.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

- **Design Inspiration**: Modern fitness apps and gaming interfaces
- **Icons**: Custom SVG icons for muscle groups
- **UI Framework**: Tailwind CSS for rapid development
- **React Community**: For excellent tooling and documentation

---

**Built with ❤️ for fitness enthusiasts who want a simple, effective workout tracker.**

*Start tracking your workouts today and watch your strength levels grow!* 💪
