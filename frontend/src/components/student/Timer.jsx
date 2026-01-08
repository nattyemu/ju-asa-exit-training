import React, { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

export const Timer = ({
  initialTime,
  onTimeUp,
  isSubmitting,
  compact = false,
}) => {
  const [time, setTime] = useState(initialTime);
  const hasCalledTimeUp = useRef(false);
  const timerRef = useRef(null);

  // Reset when initialTime changes
  useEffect(() => {
    setTime(initialTime);
    hasCalledTimeUp.current = false;

    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [initialTime]);

  // Timer logic - SIMPLIFIED
  useEffect(() => {
    // Don't start timer if time is already 0 or submitting
    if (time <= 0 || isSubmitting || hasCalledTimeUp.current) return;

    // Call onTimeUp 5 seconds BEFORE time expires
    if (time <= 5 && onTimeUp && !hasCalledTimeUp.current) {
      console.log("Timer: 5 seconds left, calling onTimeUp");
      hasCalledTimeUp.current = true;
      onTimeUp();
      return;
    }

    // Start timer
    timerRef.current = setInterval(() => {
      setTime((prev) => {
        const newTime = prev - 1;

        // Check if we should trigger onTimeUp (5 seconds before)
        if (newTime <= 5 && onTimeUp && !hasCalledTimeUp.current) {
          console.log("Timer: 5 seconds left, calling onTimeUp");
          hasCalledTimeUp.current = true;
          setTimeout(() => {
            onTimeUp();
          }, 100);
        }

        // If time reaches 0, clear interval
        if (newTime <= 0) {
          clearInterval(timerRef.current);
          return 0;
        }

        return newTime;
      });
    }, 1000);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [time, isSubmitting, onTimeUp]);

  // Format time display
  const formatTime = (seconds) => {
    if (seconds < 0) return "00:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Color based on time remaining
  const getTimeColor = () => {
    if (time > 600) return "text-green-600";
    if (time > 300) return "text-yellow-600";
    if (time > 60) return "text-orange-600";
    return "text-red-600";
  };

  const timeColor = getTimeColor();

  // Compact view
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Clock className={`w-4 h-4 ${timeColor}`} />
        <span className={`font-mono font-bold ${timeColor}`}>
          {formatTime(time)}
        </span>
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Clock className={`w-5 h-5 ${timeColor}`} />
        <div className={`font-mono text-lg font-bold ${timeColor}`}>
          {formatTime(time)}
        </div>
      </div>

      {time <= 60 && (
        <div className="text-xs font-medium text-red-600 animate-pulse">
          Time almost up!
        </div>
      )}

      {/* Progress bar */}
      {initialTime > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              time > 600
                ? "bg-green-500"
                : time > 300
                ? "bg-yellow-500"
                : time > 60
                ? "bg-orange-500"
                : "bg-red-500"
            }`}
            style={{ width: `${(time / initialTime) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};
