import React, { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

export const Timer = ({
  initialTime, // Number of seconds remaining
  onTimeUp,
  isSubmitting,
  compact = false,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(initialTime || 0);
  const [hasExpired, setHasExpired] = useState(false);
  const timerRef = useRef(null);

  // Update timer when initialTime changes
  useEffect(() => {
    if (initialTime === undefined) return;

    setRemainingSeconds(initialTime);
    setHasExpired(initialTime <= 0);

    if (initialTime <= 0 && onTimeUp) {
      onTimeUp();
    }
  }, [initialTime]);

  // Start countdown
  useEffect(() => {
    if (initialTime === undefined || hasExpired || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        const newSeconds = prev - 1;

        if (newSeconds <= 0) {
          setHasExpired(true);
          clearInterval(timerRef.current);

          // Call onTimeUp
          if (onTimeUp) {
            onTimeUp();
          }

          return 0;
        }

        return newSeconds;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [initialTime, hasExpired, isSubmitting, onTimeUp]);

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
    if (remainingSeconds > 600) return "text-green-600";
    if (remainingSeconds > 300) return "text-yellow-600";
    if (remainingSeconds > 60) return "text-orange-600";
    return "text-red-600";
  };

  const timeColor = getTimeColor();

  // Compact view
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Clock className={`w-4 h-4 ${timeColor}`} />
        <span className={`font-mono font-bold ${timeColor}`}>
          {formatTime(remainingSeconds)}
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
          {formatTime(remainingSeconds)}
        </div>
      </div>

      {remainingSeconds <= 60 && (
        <div className="text-xs font-medium text-red-600 animate-pulse">
          Time almost up!
        </div>
      )}
    </div>
  );
};
