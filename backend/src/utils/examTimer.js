/**
 * Calculate remaining time for an exam session
 */
export const calculateRemainingTime = (
  startedAt,
  durationMinutes,
  availableUntil
) => {
  try {
    const now = new Date();
    const started = new Date(startedAt);

    // Calculate end time based on duration
    const endTimeByDuration = new Date(
      started.getTime() + durationMinutes * 60000
    );

    // Use whichever comes first: duration end or availability deadline
    const endTime =
      endTimeByDuration < availableUntil ? endTimeByDuration : availableUntil;

    const totalRemainingMs = endTime - now;

    // If time has expired, return 0
    if (totalRemainingMs <= 0) {
      return {
        total: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        hasExpired: true,
        endTime: endTime.toISOString(),
      };
    }

    const hours = Math.floor(totalRemainingMs / (1000 * 60 * 60));
    const minutes = Math.floor(
      (totalRemainingMs % (1000 * 60 * 60)) / (1000 * 60)
    );
    const seconds = Math.floor((totalRemainingMs % (1000 * 60)) / 1000);

    return {
      total: totalRemainingMs,
      hours,
      minutes,
      seconds,
      hasExpired: false,
      endTime: endTime.toISOString(),
    };
  } catch (error) {
    console.error("Error calculating remaining time:", error);
    return {
      total: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      hasExpired: true,
      endTime: new Date().toISOString(),
    };
  }
};

/**
 * Check if exam should be auto-submitted
 */
export const shouldAutoSubmit = (studentExam, exam) => {
  try {
    const now = new Date();

    // If already submitted, no auto-submit needed
    if (studentExam.submittedAt) return false;

    const startedAt = new Date(studentExam.startedAt);
    const availableUntil = new Date(exam.availableUntil);

    // Check if duration has expired (using exam.duration from database)
    const durationEnd = new Date(startedAt.getTime() + exam.duration * 60000);
    if (now >= durationEnd) return true;

    // Check if availability deadline has passed
    if (now >= availableUntil) return true;

    // Check if abandoned (no activity for 24 hours)
    if (studentExam.updatedAt) {
      const updatedAt = new Date(studentExam.updatedAt);
      const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);
      if (hoursSinceUpdate >= 24) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking auto-submit:", error);
    return false;
  }
};

/**
 * Format time for display
 * @param {number} hours
 * @param {number} minutes
 * @param {number} seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (hours, minutes, seconds) => {
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Calculate time spent in minutes
 * @param {Date} startedAt - When exam was started
 * @param {Date} submittedAt - When exam was submitted (optional)
 * @returns {number} Time spent in minutes
 */
export const calculateTimeSpent = (startedAt, submittedAt = new Date()) => {
  try {
    const started = new Date(startedAt);
    const submitted = new Date(submittedAt);
    const timeSpentMs = submitted - started;
    return Math.floor(timeSpentMs / (1000 * 60)); // Convert to minutes
  } catch (error) {
    console.error("Error calculating time spent:", error);
    return 0;
  }
};
