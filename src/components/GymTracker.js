import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';

const GymTracker = () => {
  const [workouts, setWorkouts] = useState([]);
  const [view, setView] = useState('today'); // 'today', 'week', or 'month'
  const [showResetModal, setShowResetModal] = useState(false);
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
  
  const bodyParts = [
    { emoji: '💪', name: 'Biceps' },
    { emoji: '🔥', name: 'Triceps' },
    { emoji: '🦵', name: 'Legs' },
    { emoji: '🫀', name: 'Cardio' },
    { emoji: '🏋️', name: 'Back' },
    { emoji: '🍈', name: 'Chest' },
    { emoji: '🦴', name: 'Core' },
    { emoji: '🤲', name: 'Shoulders' },
    { emoji: '🍫', name: 'Abs' }
  ];
  
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
  const countSetsByBodyPart = (workoutList) => {
    const counts = {};
    bodyParts.forEach(part => {
      counts[part.name] = 0;
    });
    
    workoutList.forEach(workout => {
      counts[workout.bodyPart.name] += (workout.sets || 1);
    });
    
    return counts;
  };
  
  const weekSets = countSetsByBodyPart(weekWorkouts);
  const monthSets = countSetsByBodyPart(monthWorkouts);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 p-4">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">GYM TRACKER</h1>
        
        <div className="flex justify-center mt-2 items-center">
          {backupStatus && (
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              {backupStatus}
            </span>
          )}
        </div>
        
        <div className="flex justify-center mt-4 space-x-4">
          <button 
            onClick={() => setView('today')}
            className={`px-3 py-1 rounded-full ${view === 'today' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Today
          </button>
          <button 
            onClick={() => setView('week')}
            className={`px-3 py-1 rounded-full ${view === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Week
            </span>
          </button>
          <button 
            onClick={() => setView('month')}
            className={`px-3 py-1 rounded-full ${view === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            <span className="flex items-center">
              <BarChart2 className="w-4 h-4 mr-1" />
              Month
            </span>
          </button>
        </div>
      </header>
      
      {view === 'today' && (
        <div className="flex-grow">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            {bodyParts.map(part => (
              <button
                key={part.name}
                onClick={() => addWorkout(part)}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <span className="text-3xl mb-2">{part.emoji}</span>
                <span className="text-sm text-gray-600">{part.name}</span>
              </button>
            ))}
          </div>
          
          {todayWorkouts.length > 0 ? (
            <div className="bg-white rounded-lg shadow p-4 workout-container">
              <h3 className="font-semibold mb-2 text-gray-700">Today's Workouts</h3>
              
              {todayWorkouts.length > 1 && (
                <div className="mb-3 text-xs text-gray-500 bg-gray-50 rounded p-2 flex justify-between items-center">
                  <div>
                    <span className="font-medium">First workout:</span> {new Date(
                      Math.min(...todayWorkouts.map(w => new Date(w.timestamp).getTime()))
                    ).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div>
                    <span className="font-medium">Last workout:</span> {new Date(
                      Math.max(...todayWorkouts.map(w => new Date(w.timestamp).getTime()))
                    ).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div>
                    <span className="font-medium">Total time:</span> {(() => {
                      const firstTime = Math.min(...todayWorkouts.map(w => new Date(w.timestamp).getTime()));
                      const lastTime = Math.max(...todayWorkouts.map(w => new Date(w.timestamp).getTime()));
                      const diffMs = lastTime - firstTime;
                      const diffMins = Math.floor(diffMs / 60000);
                      const hours = Math.floor(diffMins / 60);
                      const mins = diffMins % 60;
                      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                    })()}
                  </div>
                </div>
              )}
              
              <div className="workout-list">
                {todayWorkouts.map(workout => (
                  <div 
                    key={workout.id} 
                    className={`flex items-center justify-between bg-gray-50 p-3 rounded mb-2 transition-opacity duration-150 ${
                      removingWorkoutId === workout.id ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    <span className="flex items-center">
                      <span className="text-xl mr-2">{workout.bodyPart.emoji}</span>
                      <span className="text-gray-700">{workout.bodyPart.name}</span>
                    </span>
                    <span className="flex items-center space-x-3">
                      <div className="flex items-center border rounded px-1 bg-white">
                        <button 
                          onClick={() => decrementSets(workout.id)}
                          className="text-gray-500 hover:text-gray-700 px-1"
                          disabled={workout.sets <= 1}
                        >
                          -
                        </button>
                        <span className="mx-2 text-sm font-medium">
                          {workout.sets || 1} {workout.sets === 1 ? 'set' : 'sets'}
                        </span>
                        <button 
                          onClick={() => incrementSets(workout.id)}
                          className="text-gray-500 hover:text-gray-700 px-1"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(workout.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <button 
                        onClick={() => removeWorkout(workout.id)}
                        className="text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-white rounded-lg shadow">
              <p className="text-gray-500">No workouts recorded today</p>
              <p className="text-sm text-gray-400 mt-1">Tap an emoji above to start tracking</p>
            </div>
          )}
        </div>
      )}
      
      {view === 'week' && (
        <div className="flex-grow">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
            <div className="flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-gray-400" />
              <span>
                Week of {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 mb-6">
            {Array.from({ length: 7 }).map((_, index) => {
              const currentDate = new Date(startOfWeek);
              currentDate.setDate(startOfWeek.getDate() + index);
              const dateStr = currentDate.toLocaleDateString();
              const dayWorkouts = groupedWeekWorkouts[dateStr] || [];
              
              return (
                <div key={index} className={`bg-white rounded-lg shadow p-3 ${dateStr === today.toLocaleDateString() ? 'ring-2 ring-blue-500' : ''}`}>
                  <h3 className="font-semibold text-gray-700 text-center mb-2 text-sm">
                    <div>{currentDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div>{currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </h3>
                  
                  {dayWorkouts.length > 0 ? (
                    <div>
                      <div className="flex flex-wrap gap-1 justify-center mb-2">
                        {Array.from(new Set(dayWorkouts.map(w => w.bodyPart.name))).map(partName => {
                          const part = bodyParts.find(p => p.name === partName);
                          if (!part) return null;
                          return (
                            <span key={partName} className="text-lg" title={partName}>
                              {part.emoji}
                            </span>
                          );
                        })}
                      </div>
                      
                      {dayWorkouts.length > 1 && (
                        <div className="text-xs text-center text-gray-500 bg-gray-50 rounded p-1">
                          {(() => {
                            const firstTime = Math.min(...dayWorkouts.map(w => new Date(w.timestamp).getTime()));
                            const lastTime = Math.max(...dayWorkouts.map(w => new Date(w.timestamp).getTime()));
                            const diffMs = lastTime - firstTime;
                            const diffMins = Math.floor(diffMs / 60000);
                            const hours = Math.floor(diffMins / 60);
                            const mins = diffMins % 60;
                            return `⏱️ ${hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}`;
                          })()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-xs text-gray-400">No workouts</div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-3 flex justify-between items-center">
              <span>Weekly Summary</span>
              {weekWorkouts.length > 1 && (
                <span className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                  {(() => {
                    // Calculate total workout time across the week
                    const workoutsByDay = {};
                    weekWorkouts.forEach(workout => {
                      const dateStr = new Date(workout.date).toLocaleDateString();
                      if (!workoutsByDay[dateStr]) {
                        workoutsByDay[dateStr] = [];
                      }
                      workoutsByDay[dateStr].push(workout);
                    });
                    
                    // Calculate duration for each day
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
                    return `Total workout time: ${hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}`;
                  })()}
                </span>
              )}
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Workout Frequency</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-3xl font-bold text-blue-500 mb-1">{Object.keys(groupedWeekWorkouts).length}</div>
                  <div className="text-xs text-gray-500">days this week</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Total Sets</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-3xl font-bold text-blue-500 mb-1">
                    {Object.values(weekSets).reduce((sum, count) => sum + count, 0)}
                  </div>
                  <div className="text-xs text-gray-500">sets completed</div>
                </div>
              </div>
            </div>
            
            <h4 className="text-sm font-medium text-gray-700 mb-2">Muscle Groups</h4>
            <div className="space-y-2">
              {bodyParts.map(part => (
                <div key={part.name} className="flex items-center">
                  <span className="text-xl mr-2">{part.emoji}</span>
                  <span className="text-gray-700 w-20">{part.name}</span>
                  <div className="flex-grow bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-blue-500 h-4 rounded-full" 
                      style={{ width: `${Math.min(100, (weekSets[part.name] / 20) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-gray-600 w-12 text-right">{weekSets[part.name]} sets</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {view === 'month' && (
        <div className="flex-grow">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
            <div className="flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-gray-400" />
              <span>
                {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </h2>
          
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 flex justify-between items-center">
              <span>Monthly Summary</span>
              {monthWorkouts.length > 1 && (
                <span className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                  {(() => {
                    // Calculate total workout time across the month
                    const workoutsByDay = {};
                    monthWorkouts.forEach(workout => {
                      const dateStr = new Date(workout.date).toLocaleDateString();
                      if (!workoutsByDay[dateStr]) {
                        workoutsByDay[dateStr] = [];
                      }
                      workoutsByDay[dateStr].push(workout);
                    });
                    
                    // Calculate duration for each day
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
                    return `Total workout time: ${hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}`;
                  })()}
                </span>
              )}
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Workout Frequency</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-3xl font-bold text-blue-500 mb-1">{Object.keys(groupedMonthWorkouts).length}</div>
                  <div className="text-xs text-gray-500">days this month</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Total Sets</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-3xl font-bold text-blue-500 mb-1">
                    {Object.values(monthSets).reduce((sum, count) => sum + count, 0)}
                  </div>
                  <div className="text-xs text-gray-500">sets completed</div>
                </div>
              </div>
            </div>
            
            <h4 className="text-sm font-medium text-gray-700 mb-2">Muscle Groups</h4>
            <div className="space-y-3">
              {bodyParts.map(part => (
                <div key={part.name} className="flex items-center">
                  <span className="text-xl mr-2">{part.emoji}</span>
                  <span className="text-gray-700 w-20">{part.name}</span>
                  <div className="flex-grow bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-blue-500 h-4 rounded-full" 
                      style={{ width: `${Math.min(100, (monthSets[part.name] / 40) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-gray-600 w-12 text-right">{monthSets[part.name]} sets</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Monthly Calendar</h3>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs font-medium text-gray-500">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                const daysInMonth = lastDay.getDate();
                
                // Calculate the starting offset for the first day of the month
                const startOffset = firstDay.getDay();
                
                // Generate all the calendar cells
                const calendarCells = [];
                
                // Add empty cells for days before the 1st of the month
                for (let i = 0; i < startOffset; i++) {
                  calendarCells.push(
                    <div key={`empty-${i}`} className="h-12 p-1"></div>
                  );
                }
                
                // Add cells for each day of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(today.getFullYear(), today.getMonth(), day);
                  const dateStr = date.toLocaleDateString();
                  const dayWorkouts = groupedMonthWorkouts[dateStr] || [];
                  const isToday = date.toLocaleDateString() === today.toLocaleDateString();
                  
                  // Get unique muscle groups worked
                  const uniqueBodyParts = Array.from(
                    new Set(dayWorkouts.map(w => w.bodyPart.emoji))
                  );
                  
                  calendarCells.push(
                    <div key={day} className={`h-12 p-1 text-center border ${isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-100'}`}>
                      <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                        {day}
                      </div>
                      {dayWorkouts.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1">
                          {uniqueBodyParts.map((emoji, i) => (
                            <span key={i} className="text-sm">{emoji}</span>
                          ))}
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
      
      <footer className="mt-8 text-center text-xs text-gray-400">
        <p className="mb-2">Gym Tracker App • {new Date().getFullYear()}</p>
        <button 
          onClick={() => setShowResetModal(true)} 
          className="text-red-400 text-xs hover:text-red-500"
        >
          Reset All Data
        </button>
      </footer>
      
      {/* Reset Data Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-center">Reset Data</h3>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete all your workout data? This action cannot be undone.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex items-center justify-center bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                
                <button
                  onClick={clearAllWorkouts}
                  className="flex items-center justify-center bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                >
                  Reset All Data
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