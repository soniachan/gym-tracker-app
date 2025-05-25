import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Smartphone, Clock, RefreshCw } from 'lucide-react';

const DataStorageNotice = ({ workouts = [] }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this notice before
    const dismissed = localStorage.getItem('dataStorageNotice_dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show notice if:
    // 1. User has some workout data (they're invested)
    // 2. It's been more than 3 days since they started using the app
    // 3. They haven't seen this notice recently
    
    const lastShown = localStorage.getItem('dataStorageNotice_lastShown');
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    // Show if user has workouts and either:
    // - Never seen the notice, OR
    // - Last shown more than 7 days ago
    if (workouts.length > 0 && (!lastShown || parseInt(lastShown) < sevenDaysAgo)) {
      // Only show if they have at least 3 days of workout history
      const workoutDates = [...new Set(workouts.map(w => new Date(w.date).toDateString()))];
      if (workoutDates.length >= 3) {
        setShouldShow(true);
      }
    }
  }, [workouts]);

  const handleDismiss = (permanent = false) => {
    setShouldShow(false);
    setIsDismissed(true);
    
    // Remember when we last showed this
    localStorage.setItem('dataStorageNotice_lastShown', Date.now().toString());
    
    if (permanent) {
      // Mark as permanently dismissed
      localStorage.setItem('dataStorageNotice_dismissed', 'true');
    }
  };

  if (!shouldShow || isDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
        <button
          onClick={() => handleDismiss(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 mr-3 mt-1">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Keep Your Workout Streak Going! 💪
            </h3>
          </div>
        </div>

        <div className="space-y-3 text-sm text-gray-600 mb-6">
          <div className="flex items-start">
            <Smartphone className="w-4 h-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
            <p>
              <strong>Your workout data is stored locally</strong> on this device in your browser's storage.
            </p>
          </div>

          <div className="flex items-start">
            <Clock className="w-4 h-4 mr-2 mt-0.5 text-amber-500 flex-shrink-0" />
            <p>
              <strong>Browsers automatically remove unused data</strong> after periods of inactivity to free up space. Safari and Chrome may clear your workout history if you don't use the app regularly.
            </p>
          </div>

          <div className="flex items-start">
            <RefreshCw className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
            <p>
              <strong>Stay active to keep your data!</strong> Regular use shows the browser that this app is important to you, helping preserve your workout history and progress.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Pro tip:</strong> Visit your gym tracker at least once a week, even just to check your progress. This tells your browser to keep your data safe!
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => handleDismiss(false)}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded text-sm hover:bg-gray-200 transition-colors"
          >
            Remind me later
          </button>
          <button
            onClick={() => handleDismiss(true)}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded text-sm hover:bg-blue-600 transition-colors"
          >
            Got it!
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-3">
          This notice helps you understand how browser storage works
        </p>
      </div>
    </div>
  );
};

export default DataStorageNotice;
