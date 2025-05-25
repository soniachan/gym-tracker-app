import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, BarChart2, TrendingUp } from 'lucide-react';
import DataStorageNotice from './DataStorageNotice';
import RadarChart from './RadarChart';

const GymTracker = () => {
  const [workouts, setWorkouts] = useState([]);
  const [view, setView] = useState('today'); // 'today', 'week', 'month', or 'analysis'
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDataInfo, setShowDataInfo] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');
  const [removingWorkoutId, setRemovingWorkoutId] = useState(null);
  const isInitialMount = useRef(true);
  const lastSaveTime = useRef(0);
  
  // IndexedDB Setup
  const DB_NAME = 'GymTrackerDB';
  const STORE_NAME = 'workouts';
  const DB_VERSION = 1;
  
  const openDatabase = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        reject('Error opening database: ' + event.target.error);
      };
    });
  };
  
  const saveToIndexedDB = useCallback(async (data, showStatus = false) => {
    try {
      lastSaveTime.current = Date.now(); // Track when we last saved
      
      const db = await openDatabase();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Clear existing data
      store.clear();
      
      // Store each workout separately - handle empty array case
      if (data.length === 0) {
        // If no workouts, we still want to clear the store (deletion case)
        console.log('Clearing all workouts from IndexedDB');
      } else {
        data.forEach(workout => {
          store.add(workout);
        });
      }
      
      transaction.oncomplete = () => {
        // Only show status messages when explicitly requested to reduce re-renders
        if (showStatus) {
          setBackupStatus(data.length === 0 ? 'Workout deleted' : 'Saved to device storage');
          setTimeout(() => setBackupStatus(''), 2000);
        }
        console.log(`Saved ${data.length} workouts to IndexedDB`); // Debug logging
      };
      
      transaction.onerror = (event) => {
        console.error('Error saving to IndexedDB:', event.target.error);
      };
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error);
    }
  }, []);
  
  const loadFromIndexedDB = useCallback(async () => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        if (request.result.length > 0) {
          setWorkouts(request.result);
          // Removed status update on load to prevent initial shaking
        }
      };
      
      request.onerror = (event) => {
        console.error('Error loading from IndexedDB:', event.target.error);
      };
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
    }
  }, []);
  
  // Load data on component mount
  useEffect(() => {
    loadFromIndexedDB();
  }, [loadFromIndexedDB]);

  // Auto backup to IndexedDB - separate effect to avoid dependency issues
  useEffect(() => {
    const autoBackupInterval = setInterval(() => {
      // Only auto-save if it's been more than 2 minutes since last manual save
      const timeSinceLastSave = Date.now() - lastSaveTime.current;
      if (timeSinceLastSave > 2 * 60 * 1000) { // 2 minutes
        console.log('Auto-backup triggered');
        saveToIndexedDB(workouts);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(autoBackupInterval);
  }, [workouts, saveToIndexedDB]); // Now properly includes workouts dependency
  
  // Save whenever workouts change, but debounce to prevent multiple rapid saves
  useEffect(() => {
    // Skip saving on initial mount to prevent unnecessary operations
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Save whether workouts array has items or is empty (important for deletions!)
    const timeoutId = setTimeout(() => {
      saveToIndexedDB(workouts);
    }, 500); // Reduced debounce to 500ms to ensure deletions are saved quickly
    
    return () => clearTimeout(timeoutId);
  }, [workouts, saveToIndexedDB]);
  

  
  const clearAllWorkouts = async () => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Clear all data
      store.clear();
      
      transaction.oncomplete = () => {
        setWorkouts([]);
        setShowResetModal(false);
        setBackupStatus('All data cleared');
        setTimeout(() => setBackupStatus(''), 2000);
      };
      
      transaction.onerror = (event) => {
        console.error('Error clearing data:', event.target.error);
        alert('Error clearing data. Please try again.');
      };
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Error clearing data. Please try again.');
    }
  };
  
  const bodyParts = useMemo(() => [
    { icon: 'biceps', name: 'Biceps', emoji: '💪' },
    { icon: 'triceps', name: 'Triceps', emoji: '🔥' },
    { icon: 'legs', name: 'Legs', emoji: '🦵' },
    { icon: 'cardio', name: 'Cardio', emoji: '🫀' },
    { icon: 'back', name: 'Back', emoji: '🏋️' },
    { icon: 'chest', name: 'Chest', emoji: '🍈' },
    { icon: 'glutes', name: 'Glutes', emoji: '🦴' },
    { icon: 'shoulders', name: 'Shoulders', emoji: '🤲' },
    { icon: 'abs', name: 'Abs', emoji: '🍫' }
  ], []);
  
  // Icon component for muscle groups
  const MuscleIcon = ({ type, size = 24 }) => {
    const icons = {
      biceps: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM8 8C8.6 8 9 8.4 9 9V11C9 12.1 9.9 13 11 13H13C14.1 13 15 12.1 15 11V9C15 8.4 15.4 8 16 8S17 8.4 17 9V11C17 13.2 15.2 15 13 15H11C8.8 15 7 13.2 7 11V9C7 8.4 7.4 8 8 8Z"/>
        </svg>
      ),
      triceps: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM7 8C7.6 8 8 8.4 8 9V15C8 16.1 8.9 17 10 17H14C15.1 17 16 16.1 16 15V9C16 8.4 16.4 8 17 8S18 8.4 18 9V15C18 17.2 16.2 19 14 19H10C7.8 19 6 17.2 6 15V9C6 8.4 6.4 8 7 8Z"/>
        </svg>
      ),
      legs: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 1C13.6 1 14 1.4 14 2V8C14 8.6 13.6 9 13 9H11C10.4 9 10 8.6 10 8V2C10 1.4 10.4 1 11 1H13ZM9 10H15C15.6 10 16 10.4 16 11V17C16 19.2 14.2 21 12 21S8 19.2 8 17V11C8 10.4 8.4 10 9 10ZM5 12C5.6 12 6 12.4 6 13V21C6 21.6 5.6 22 5 22S4 21.6 4 21V13C4 12.4 4.4 12 5 12ZM19 12C19.6 12 20 12.4 20 13V21C20 21.6 19.6 22 19 22S18 21.6 18 21V13C18 12.4 18.4 12 19 12Z"/>
        </svg>
      ),
      cardio: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"/>
        </svg>
      ),
      back: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM6 8C6.6 8 7 8.4 7 9V17C7 17.6 6.6 18 6 18S5 17.6 5 17V9C5 8.4 5.4 8 6 8ZM18 8C18.6 8 19 8.4 19 9V17C19 17.6 18.6 18 18 18S17 17.6 17 17V9C17 8.4 17.4 8 18 8ZM9 9C9.6 9 10 9.4 10 10V16C10 16.6 9.6 17 9 17S8 16.6 8 16V10C8 9.4 8.4 9 9 9ZM15 9C15.6 9 16 9.4 16 10V16C16 16.6 15.6 17 15 17S14 16.6 14 16V10C14 9.4 14.4 9 15 9Z"/>
        </svg>
      ),
      chest: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM8 8C8.6 8 9 8.4 9 9C9 9.6 8.6 10 8 10S7 9.6 7 9C7 8.4 7.4 8 8 8ZM16 8C16.6 8 17 8.4 17 9C17 9.6 16.6 10 16 10S15 9.6 15 9C15 8.4 15.4 8 16 8ZM10 12C10 11.4 10.4 11 11 11H13C13.6 11 14 11.4 14 12V18C14 19.1 13.1 20 12 20S10 19.1 10 18V12Z"/>
        </svg>
      ),
      glutes: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM8 9C8.6 9 9 9.4 9 10V14C9 15.7 10.3 17 12 17S15 15.7 15 14V10C15 9.4 15.4 9 16 9S17 9.4 17 10V14C17 16.8 14.8 19 12 19S7 16.8 7 14V10C7 9.4 7.4 9 8 9ZM6 15C6.6 15 7 15.4 7 16V20C7 20.6 6.6 21 6 21S5 20.6 5 20V16C5 15.4 5.4 15 6 15ZM18 15C18.6 15 19 15.4 19 16V20C19 20.6 18.6 21 18 21S17 20.6 17 20V16C17 15.4 17.4 15 18 15Z"/>
        </svg>
      ),
      shoulders: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM6 8C6.6 8 7 8.4 7 9V12C7 12.6 6.6 13 6 13S5 12.6 5 12V9C5 8.4 5.4 8 6 8ZM18 8C18.6 8 19 8.4 19 9V12C19 12.6 18.6 13 18 13S17 12.6 17 12V9C17 8.4 17.4 8 18 8ZM9 10C9.6 10 10 10.4 10 11V17C10 17.6 9.6 18 9 18S8 17.6 8 17V11C8 10.4 8.4 10 9 10ZM15 10C15.6 10 16 10.4 16 11V17C16 17.6 15.6 18 15 18S14 17.6 14 17V11C14 10.4 14.4 10 15 10Z"/>
        </svg>
      ),
      abs: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM10 8H14C14.6 8 15 8.4 15 9V19C15 19.6 14.6 20 14 20H10C9.4 20 9 19.6 9 19V9C9 8.4 9.4 8 10 8ZM11 10V12H13V10H11ZM11 13V15H13V13H11ZM11 16V18H13V16H11Z"/>
        </svg>
      )
    };
    
    return icons[type] || icons.biceps;
  };
  
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0); // Set to beginning of day for proper comparison
    return date;
  }, []);
  
  const addWorkout = useCallback((bodyPart) => {
    const workout = {
      id: Date.now() + Math.random(), // Ensure unique ID to prevent conflicts
      date: today.toISOString(),
      bodyPart,
      timestamp: new Date().toISOString(),
      sets: 1, // Initialize with 1 set
    };
    
    setWorkouts(prevWorkouts => [...prevWorkouts, workout]);
  }, [today]);
  
  const incrementSets = useCallback((id) => {
    setWorkouts(prevWorkouts => prevWorkouts.map(workout => 
      workout.id === id 
        ? { ...workout, sets: (workout.sets || 1) + 1 } 
        : workout
    ));
  }, []);
  
  const decrementSets = useCallback((id) => {
    setWorkouts(prevWorkouts => prevWorkouts.map(workout => 
      workout.id === id && workout.sets > 1
        ? { ...workout, sets: workout.sets - 1 } 
        : workout
    ));
  }, []);
  
  const removeWorkout = useCallback((id) => {
    setRemovingWorkoutId(id);
    // Add a small delay to allow fade animation
    setTimeout(() => {
      setWorkouts(prevWorkouts => {
        const updatedWorkouts = prevWorkouts.filter(workout => workout.id !== id);
        // Immediately save to IndexedDB after deletion to prevent data persistence issues
        setTimeout(() => {
          saveToIndexedDB(updatedWorkouts, true); // Show status to confirm deletion was saved
        }, 100);
        return updatedWorkouts;
      });
      setRemovingWorkoutId(null);
    }, 150);
  }, [saveToIndexedDB]);
  
  // Get workouts for today
  const todayWorkouts = workouts.filter(workout => {
    try {
      const workoutDate = new Date(workout.date);
      if (isNaN(workoutDate.getTime())) {
        return false;
      }
      workoutDate.setHours(0, 0, 0, 0);
      return workoutDate.getTime() === today.getTime();
    } catch (e) {
      return false;
    }
  });
  
  // Get workouts for current week
  const getStartOfWeek = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  };
  
  const startOfWeek = getStartOfWeek(today);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const weekWorkouts = workouts.filter(workout => {
    try {
      const workoutDate = new Date(workout.date);
      if (isNaN(workoutDate.getTime())) {
        return false;
      }
      return workoutDate >= startOfWeek && workoutDate <= endOfWeek;
    } catch (e) {
      return false;
    }
  });
  
  // Get workouts for current month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const monthWorkouts = workouts.filter(workout => {
    try {
      const workoutDate = new Date(workout.date);
      if (isNaN(workoutDate.getTime())) {
        return false;
      }
      return workoutDate >= startOfMonth && workoutDate <= endOfMonth;
    } catch (e) {
      return false;
    }
  });
  
  // Group workouts by date
  const groupWorkoutsByDate = (workoutList) => {
    const grouped = {};
    
    workoutList.forEach(workout => {
      // Extract date string from the workout date
      let dateKey;
      try {
        const date = new Date(workout.date);
        if (isNaN(date.getTime())) {
          // If date is invalid, use a current date string
          dateKey = new Date().toLocaleDateString();
        } else {
          dateKey = date.toLocaleDateString();
        }
      } catch (error) {
        // Fallback to current date if there's an error
        dateKey = new Date().toLocaleDateString();
        console.error('Error parsing date:', workout.date);
      }
      
      // Group the workout under this date key
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(workout);
    });
    
    return grouped;
  };
  
  const groupedWeekWorkouts = groupWorkoutsByDate(weekWorkouts);
  const groupedMonthWorkouts = groupWorkoutsByDate(monthWorkouts);
  

  
  // Count sets by body part
  const countSetsByBodyPart = useCallback((workoutList) => {
    const counts = {};
    bodyParts.forEach(part => {
      counts[part.name] = 0;
    });
    
    workoutList.forEach(workout => {
      counts[workout.bodyPart.name] += (workout.sets || 1);
    });
    
    return counts;
  }, [bodyParts]);
  
  // Calculate muscle group strength levels (like gaming stats)
  const calculateMuscleStats = useCallback(() => {
    if (workouts.length === 0) return {};
    
    const stats = {};
    const totalSets = countSetsByBodyPart(workouts);
    const maxSets = Math.max(...Object.values(totalSets));
    
    bodyParts.forEach(part => {
      const sets = totalSets[part.name] || 0;
      const percentage = maxSets > 0 ? (sets / maxSets) * 100 : 0;
      
      // Gaming-style level calculation
      let level = 1;
      let rank = "Beginner";
      let color = "#64748b"; // slate-500
      
      if (sets >= 50) {
        level = 5;
        rank = "Master";
        color = "#7c3aed"; // violet-600
      } else if (sets >= 30) {
        level = 4;
        rank = "Expert";
        color = "#dc2626"; // red-600
      } else if (sets >= 20) {
        level = 3;
        rank = "Advanced";
        color = "#ea580c"; // orange-600
      } else if (sets >= 10) {
        level = 2;
        rank = "Intermediate";
        color = "#16a34a"; // green-600
      }
      
      stats[part.name] = {
        sets,
        percentage,
        level,
        rank,
        color,
        icon: part.icon
      };
    });
    
    return stats;
  }, [workouts, bodyParts, countSetsByBodyPart]);
  
  const muscleStats = useMemo(() => calculateMuscleStats(), [calculateMuscleStats]);
  
  // Get recent activity summary (last 7 days)
  const getRecentActivity = useCallback(() => {
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const recentWorkouts = workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= sevenDaysAgo;
    });
    
    const activeDays = new Set(recentWorkouts.map(w => new Date(w.date).toDateString())).size;
    const totalSets = recentWorkouts.reduce((sum, w) => sum + (w.sets || 1), 0);
    
    return { activeDays, totalSets, totalWorkouts: recentWorkouts.length };
  }, [workouts, today]);
  
  const recentActivity = useMemo(() => getRecentActivity(), [getRecentActivity]);
  
  const weekSets = countSetsByBodyPart(weekWorkouts);
  const monthSets = countSetsByBodyPart(monthWorkouts);
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-50" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Data Storage Notice */}
      <DataStorageNotice workouts={workouts} />
      
      {/* Modern Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-slate-800">GymTracker</h1>
              
              {/* Recent Activity Widget */}
              {recentActivity.totalWorkouts > 0 && (
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-lg px-3 py-1 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">{recentActivity.activeDays}</span>
                  <span className="text-xs text-blue-600">active days (7d)</span>
                </div>
              )}
            </div>
            
            {backupStatus && (
              <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-medium border border-emerald-200">
                {backupStatus}
              </div>
            )}
          </div>
          
          {/* Professional Tab Navigation */}
          <div className="mt-4 flex justify-center">
            <div className="bg-slate-100 p-1 rounded-lg inline-flex">
              <button 
                onClick={() => setView('today')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  view === 'today' 
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Today
              </button>
              <button 
                onClick={() => setView('analysis')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
                  view === 'analysis' 
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Analysis
              </button>
              <button 
                onClick={() => setView('week')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
                  view === 'week' 
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Week
              </button>
              <button 
                onClick={() => setView('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
                  view === 'month' 
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <BarChart2 className="w-4 h-4 mr-2" />
                Month
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
      
        {view === 'today' && (
          <div className="space-y-8">
            {/* Page Title */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <p className="text-slate-600">Track your workout and build consistency</p>
            </div>

            {/* Today's Workouts - Primary Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-800">Today's Workouts</h3>
                
                {todayWorkouts.length > 1 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <span>
                        <span className="font-medium">First:</span> {new Date(
                          Math.min(...todayWorkouts.map(w => new Date(w.timestamp).getTime()))
                        ).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <span className="w-px h-4 bg-slate-300"></span>
                      <span>
                        <span className="font-medium">Duration:</span> {(() => {
                          const firstTime = Math.min(...todayWorkouts.map(w => new Date(w.timestamp).getTime()));
                          const lastTime = Math.max(...todayWorkouts.map(w => new Date(w.timestamp).getTime()));
                          const diffMs = lastTime - firstTime;
                          const diffMins = Math.floor(diffMs / 60000);
                          const hours = Math.floor(diffMins / 60);
                          const mins = diffMins % 60;
                          return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {todayWorkouts.length > 0 ? (
                <div className="space-y-3">
                  {todayWorkouts.map(workout => (
                    <div 
                      key={workout.id} 
                      className={`bg-slate-50 border border-slate-200 p-3 rounded-lg transition-all duration-200 ${
                        removingWorkoutId === workout.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-orange-100 border border-orange-200 rounded-lg flex items-center justify-center text-orange-600 flex-shrink-0">
                            <MuscleIcon type={workout.bodyPart.icon} size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-slate-800 truncate">{workout.bodyPart.name}</div>
                            <div className="text-sm text-slate-500">
                              {new Date(workout.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => removeWorkout(workout.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 ml-2"
                          title="Remove workout"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                          <button 
                            onClick={() => decrementSets(workout.id)}
                            className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-l-lg transition-colors"
                            disabled={workout.sets <= 1}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <div className="px-6 py-3 text-sm font-medium text-slate-700 min-w-[100px] text-center border-x border-slate-200">
                            {workout.sets || 1} {workout.sets === 1 ? 'set' : 'sets'}
                          </div>
                          <button 
                            onClick={() => incrementSets(workout.id)}
                            className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-r-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-medium">No workouts recorded today</p>
                  <p className="text-sm text-slate-400 mt-1">Add your first exercise below to get started</p>
                </div>
              )}
            </div>

            {/* Add Workout Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Add Exercise</h3>
              
              <div className="grid grid-cols-3 gap-3">
                {bodyParts.map(part => (
                  <button
                    key={part.name}
                    onClick={() => addWorkout(part)}
                    className="group flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="w-12 h-12 bg-white border border-slate-200 group-hover:border-orange-200 group-hover:bg-orange-100 rounded-lg flex items-center justify-center mb-3 transition-all duration-200">
                      <div className="text-slate-600 group-hover:text-orange-600">
                        <MuscleIcon type={part.icon} size={24} />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-800">{part.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {view === 'analysis' && (
          <div className="space-y-8">
            {/* Page Title */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Strength Analysis</h2>
              <p className="text-slate-600">Visualize your muscle group development and find areas to improve</p>
            </div>

            {workouts.length > 0 ? (
              <>
                {/* Radar Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                  <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">Muscle Group Distribution</h3>
                  <div className="flex justify-center">
                    <RadarChart 
                      data={bodyParts.map(part => ({
                        name: part.name,
                        sets: muscleStats[part.name]?.sets || 0,
                        percentage: muscleStats[part.name]?.percentage || 0,
                        color: muscleStats[part.name]?.color || '#64748b'
                      }))}
                      size={400}
                    />
                  </div>
                </div>

                {/* Gaming-Style Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {bodyParts.map(part => {
                    const stats = muscleStats[part.name] || { sets: 0, level: 1, rank: 'Beginner', color: '#64748b' };
                    return (
                      <div key={part.name} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                              <MuscleIcon type={part.icon} size={20} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800">{part.name}</h4>
                              <p className="text-sm text-slate-500">{stats.sets} total sets</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-1 mb-1">
                              <span 
                                className="text-lg font-bold"
                                style={{ color: stats.color }}
                              >
                                LV {stats.level}
                              </span>
                            </div>
                            <div 
                              className="text-xs font-medium px-2 py-1 rounded-full"
                              style={{ 
                                backgroundColor: `${stats.color}20`,
                                color: stats.color
                              }}
                            >
                              {stats.rank}
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Progress to next level</span>
                            <span>{Math.min(100, (stats.sets % 10) * 10)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${Math.min(100, (stats.sets % 10) * 10)}%`,
                                backgroundColor: stats.color
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recent Activity Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-xl font-semibold text-slate-800 mb-6">Recent Activity (Last 7 Days)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="text-3xl font-bold text-blue-600 mb-1">{recentActivity.activeDays}</div>
                      <div className="text-sm text-blue-700 font-medium">Active Days</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="text-3xl font-bold text-green-600 mb-1">{recentActivity.totalWorkouts}</div>
                      <div className="text-sm text-green-700 font-medium">Total Workouts</div>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-xl">
                      <div className="text-3xl font-bold text-orange-600 mb-1">{recentActivity.totalSets}</div>
                      <div className="text-sm text-orange-700 font-medium">Total Sets</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Data Yet</h3>
                <p className="text-slate-600 mb-6">Start tracking your workouts to see your strength analysis and progress visualization.</p>
                <button
                  onClick={() => setView('today')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Start Tracking
                </button>
              </div>
            )}
          </div>
        )}
      
        {view === 'week' && (
          <div className="space-y-8">
            {/* Week Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                <div className="flex items-center justify-center space-x-4">
                  <ChevronLeft className="w-6 h-6 text-slate-400" />
                  <span>
                    Week of {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <ChevronRight className="w-6 h-6 text-slate-400" />
                </div>
              </h2>
            </div>
            
            {/* Week Calendar - Mobile Optimized */}
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, index) => {
                const currentDate = new Date(startOfWeek);
                currentDate.setDate(startOfWeek.getDate() + index);
                const dateStr = currentDate.toLocaleDateString();
                const dayWorkouts = groupedWeekWorkouts[dateStr] || [];
                const isToday = dateStr === today.toLocaleDateString();
                
                return (
                  <div key={index} className={`bg-white rounded-xl shadow-sm border p-4 transition-all duration-200 ${
                    isToday ? 'ring-2 ring-orange-300 border-orange-200 bg-orange-50' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`text-center ${isToday ? 'text-orange-700' : 'text-slate-600'}`}>
                          <div className="text-sm font-medium">
                            {currentDate.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className={`text-xl font-bold ${isToday ? 'text-orange-800' : 'text-slate-800'}`}>
                            {currentDate.toLocaleDateString('en-US', { day: 'numeric' })}
                          </div>
                        </div>
                        
                        {dayWorkouts.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                              {dayWorkouts.length} {dayWorkouts.length === 1 ? 'workout' : 'workouts'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {dayWorkouts.reduce((sum, w) => sum + (w.sets || 1), 0)} sets
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {dayWorkouts.length > 1 && (
                        <div className="text-xs text-slate-500 bg-slate-100 rounded-md px-2 py-1">
                          {(() => {
                            const firstTime = Math.min(...dayWorkouts.map(w => new Date(w.timestamp).getTime()));
                            const lastTime = Math.max(...dayWorkouts.map(w => new Date(w.timestamp).getTime()));
                            const diffMs = lastTime - firstTime;
                            const diffMins = Math.floor(diffMs / 60000);
                            const hours = Math.floor(diffMins / 60);
                            const mins = diffMins % 60;
                            return `${hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}`;
                          })()}
                        </div>
                      )}
                    </div>
                    
                    {dayWorkouts.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(dayWorkouts.map(w => w.bodyPart.name))).map(partName => {
                          const part = bodyParts.find(p => p.name === partName);
                          const partWorkouts = dayWorkouts.filter(w => w.bodyPart.name === partName);
                          const totalSets = partWorkouts.reduce((sum, w) => sum + (w.sets || 1), 0);
                          
                          if (!part) return null;
                          return (
                            <div key={partName} className="flex items-center space-x-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                              <div className="w-5 h-5 text-orange-600">
                                <MuscleIcon type={part.icon} size={16} />
                              </div>
                              <span className="text-sm font-medium text-orange-700">{part.name}</span>
                              <span className="text-xs text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">
                                {totalSets}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="text-sm text-slate-400">No workouts</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Weekly Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-800">Weekly Summary</h3>
                
                {weekWorkouts.length > 1 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">Total time:</span> {(() => {
                        const workoutsByDay = {};
                        weekWorkouts.forEach(workout => {
                          const dateStr = new Date(workout.date).toLocaleDateString();
                          if (!workoutsByDay[dateStr]) {
                            workoutsByDay[dateStr] = [];
                          }
                          workoutsByDay[dateStr].push(workout);
                        });
                        
                        let totalMinutes = 0;
                        Object.values(workoutsByDay).forEach(dayWorkouts => {
                          if (dayWorkouts.length > 1) {
                            const firstTime = Math.min(...dayWorkouts.map(w => new Date(w.timestamp).getTime()));
                            const lastTime = Math.max(...dayWorkouts.map(w => new Date(w.timestamp).getTime()));
                            const diffMs = lastTime - firstTime;
                            const diffMins = Math.floor(diffMs / 60000);
                            totalMinutes += diffMins;
                          }
                        });
                        
                        const hours = Math.floor(totalMinutes / 60);
                        const mins = totalMinutes % 60;
                        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                      })()}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="text-3xl font-bold text-slate-800 mb-1">{Object.keys(groupedWeekWorkouts).length}</div>
                    <div className="text-sm text-slate-600">Active Days</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="text-3xl font-bold text-slate-800 mb-1">
                      {Object.values(weekSets).reduce((sum, count) => sum + count, 0)}
                    </div>
                    <div className="text-sm text-slate-600">Total Sets</div>
                  </div>
                </div>
              </div>
              
              {/* Muscle Groups Progress */}
              <div>
                <h4 className="text-lg font-medium text-slate-800 mb-4">Muscle Groups</h4>
                <div className="space-y-3">
                  {bodyParts.map(part => (
                    <div key={part.name} className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                        <MuscleIcon type={part.icon} size={18} />
                      </div>
                      <div className="flex-1 flex items-center space-x-3">
                        <span className="text-slate-700 font-medium w-20">{part.name}</span>
                        <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (weekSets[part.name] / 20) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-600 font-medium text-sm w-16 text-right">
                          {weekSets[part.name]} sets
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      
        {view === 'month' && (
          <div className="space-y-8">
            {/* Month Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                <div className="flex items-center justify-center space-x-4">
                  <ChevronLeft className="w-6 h-6 text-slate-400" />
                  <span>
                    {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <ChevronRight className="w-6 h-6 text-slate-400" />
                </div>
              </h2>
            </div>
            
            {/* Monthly Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-800">Monthly Summary</h3>
                
                {monthWorkouts.length > 1 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">Total time:</span> {(() => {
                        const workoutsByDay = {};
                        monthWorkouts.forEach(workout => {
                          const dateStr = new Date(workout.date).toLocaleDateString();
                          if (!workoutsByDay[dateStr]) {
                            workoutsByDay[dateStr] = [];
                          }
                          workoutsByDay[dateStr].push(workout);
                        });
                        
                        let totalMinutes = 0;
                        Object.values(workoutsByDay).forEach(dayWorkouts => {
                          if (dayWorkouts.length > 1) {
                            const firstTime = Math.min(...dayWorkouts.map(w => new Date(w.timestamp).getTime()));
                            const lastTime = Math.max(...dayWorkouts.map(w => new Date(w.timestamp).getTime()));
                            const diffMs = lastTime - firstTime;
                            const diffMins = Math.floor(diffMs / 60000);
                            totalMinutes += diffMins;
                          }
                        });
                        
                        const hours = Math.floor(totalMinutes / 60);
                        const mins = totalMinutes % 60;
                        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                      })()}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                    <div className="text-4xl font-bold text-slate-800 mb-2">{Object.keys(groupedMonthWorkouts).length}</div>
                    <div className="text-sm text-slate-600">Active Days</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                    <div className="text-4xl font-bold text-slate-800 mb-2">
                      {Object.values(monthSets).reduce((sum, count) => sum + count, 0)}
                    </div>
                    <div className="text-sm text-slate-600">Total Sets</div>
                  </div>
                </div>
              </div>
              
              {/* Muscle Groups Progress */}
              <div>
                <h4 className="text-lg font-medium text-slate-800 mb-4">Muscle Groups</h4>
                <div className="space-y-3">
                  {bodyParts.map(part => (
                    <div key={part.name} className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                        <MuscleIcon type={part.icon} size={18} />
                      </div>
                      <div className="flex-1 flex items-center space-x-3">
                        <span className="text-slate-700 font-medium w-20">{part.name}</span>
                        <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (monthSets[part.name] / 40) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-600 font-medium text-sm w-16 text-right">
                          {monthSets[part.name]} sets
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Monthly Calendar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-semibold text-slate-800 mb-6">Monthly Calendar</h3>
              
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">{day}</div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  const daysInMonth = lastDay.getDate();
                  const startOffset = firstDay.getDay();
                  const calendarCells = [];
                  
                  // Empty cells for days before the 1st
                  for (let i = 0; i < startOffset; i++) {
                    calendarCells.push(
                      <div key={`empty-${i}`} className="h-16"></div>
                    );
                  }
                  
                  // Days of the month
                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(today.getFullYear(), today.getMonth(), day);
                    const dateStr = date.toLocaleDateString();
                    const dayWorkouts = groupedMonthWorkouts[dateStr] || [];
                    const isToday = date.toLocaleDateString() === today.toLocaleDateString();
                    const uniqueBodyParts = Array.from(new Set(dayWorkouts.map(w => w.bodyPart.name)));
                    
                    calendarCells.push(
                      <div key={day} className={`h-16 p-2 rounded-lg border transition-all duration-200 ${
                        isToday 
                          ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-300' 
                          : dayWorkouts.length > 0 
                            ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' 
                            : 'border-slate-200 hover:bg-slate-50'
                      }`}>
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-orange-700' : dayWorkouts.length > 0 ? 'text-emerald-700' : 'text-slate-700'
                        }`}>
                          {day}
                        </div>
                        
                        {dayWorkouts.length > 0 && (
                          <div className="flex items-center justify-center">
                            <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">
                              {dayWorkouts.reduce((sum, w) => sum + (w.sets || 1), 0)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return calendarCells;
                })()}
              </div>
            </div>
          </div>
        )}
      
      </main>
      
      {/* Modern Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={() => setShowDataInfo(true)}
              className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-200"
              title="Learn about data storage"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
              </svg>
              Data Storage Info
            </button>
            
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-2">GymTracker © {new Date().getFullYear()}</p>
              <button 
                onClick={() => setShowResetModal(true)} 
                className="text-sm text-red-500 hover:text-red-600 transition-colors"
              >
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Data Storage Info Modal */}
      {showDataInfo && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200">
            <h3 className="text-xl font-semibold mb-6 text-center text-slate-800">How Your Data is Stored</h3>
            
            <div className="space-y-4 text-sm">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-blue-800">Local Storage</h4>
                </div>
                <p className="text-blue-700">Your workout data is stored locally on this device using IndexedDB, which keeps your information private and accessible offline.</p>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-amber-800">Browser Auto-Cleanup</h4>
                </div>
                <p className="text-amber-700">Safari, Chrome, and other browsers automatically remove app data that hasn't been used recently to free up storage space. This helps keep your device running smoothly.</p>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-emerald-800">Keep Your Streak!</h4>
                </div>
                <p className="text-emerald-700">To prevent data loss, visit your gym tracker regularly - even just checking your progress counts! Active use tells your browser to keep your data safe.</p>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-slate-600 text-xs">
                  <span className="font-semibold">💡 Pro Tip:</span> Add this page to your home screen or bookmark it for easy access. Regular visits (even weekly) help preserve your workout history.
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowDataInfo(false)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Data Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-slate-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Reset All Data</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-slate-600 text-center">
                Are you sure you want to delete all your workout data? This action cannot be undone and you'll lose your streak and progress.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={clearAllWorkouts}
                  className="py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  Reset Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymTracker;