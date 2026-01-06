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
  const lastCheckRef = useRef(Date.now());

  useEffect(() => {
    setTime(initialTime);
    hasCalledTimeUp.current = false;

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [initialTime]);

  useEffect(() => {
    if (time <= 0 || isSubmitting || hasCalledTimeUp.current) return;

    timerRef.current = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (onTimeUp && !hasCalledTimeUp.current) {
            hasCalledTimeUp.current = true;
            console.log("Timer: Time is up");
            onTimeUp(); // This should trigger only ONCE
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [time, isSubmitting, onTimeUp]);

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

  const getTimeColor = () => {
    if (time > 600) return "text-green-600"; // More than 10 minutes
    if (time > 300) return "text-yellow-600"; // 5-10 minutes
    if (time > 60) return "text-orange-600"; // 1-5 minutes
    return "text-red-600"; // Less than 1 minute
  };

  const getTimeWarning = () => {
    if (time > 600) return null;
    if (time > 300) return "Time is running out!";
    if (time > 60) return "Hurry up!";
    return "Time almost up!";
  };

  const warning = getTimeWarning();
  const timeColor = getTimeColor();

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

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Clock className={`w-5 h-5 ${timeColor}`} />
        <div className={`font-mono text-lg font-bold ${timeColor}`}>
          {formatTime(time)}
        </div>
      </div>

      {warning && (
        <div className="text-xs font-medium text-red-600 animate-pulse">
          {warning}
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
