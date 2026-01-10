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

    // Convert availableUntil to Date object
    const availableUntilDate = new Date(availableUntil);

    // Calculate end time based on duration
    const endTimeByDuration = new Date(
      started.getTime() + durationMinutes * 60000
    );

    // Use whichever comes first: duration end or availability deadline
    const endTime =
      endTimeByDuration < availableUntilDate
        ? endTimeByDuration
        : availableUntilDate;

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
    // console.error("Error calculating remaining time:", error);
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
    // console.log("Current time (now):", now.toISOString());

    // If already submitted, no auto-submit needed
    if (studentExam.submittedAt) {
      // console.log("Already submitted, returning false");
      return false;
    }

    const startedAt = new Date(studentExam.startedAt);
    const availableUntilDate = new Date(exam.availableUntil);

    // console.log("Parsed dates:", {
    //   startedAt: startedAt.toISOString(),
    //   availableUntilDate: availableUntilDate.toISOString(),
    // });

    // Check if duration has expired
    const durationEnd = new Date(startedAt.getTime() + exam.duration * 60000);
    // console.log("Duration end:", durationEnd.toISOString());

    if (now >= durationEnd) {
      // console.log("Duration expired, returning true");
      return true;
    }

    // Check if availability deadline has passed
    if (now >= availableUntilDate) {
      // console.log("Availability deadline passed, returning true");
      return true;
    }

    // Check if abandoned
    if (studentExam.updatedAt) {
      const updatedAt = new Date(studentExam.updatedAt);
      const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);
      // console.log("Hours since update:", hoursSinceUpdate);
      if (hoursSinceUpdate >= 24) {
        // console.log("Abandoned (24h), returning true");
        return true;
      }
    }

    // console.log("No auto-submit conditions met, returning false");
    return false;
  } catch (error) {
    // console.error("Error checking auto-submit:", error);
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
    // console.error("Error calculating time spent:", error);
    return 0;
  }
};
