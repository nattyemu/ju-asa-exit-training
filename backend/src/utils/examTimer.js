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

    // Check if duration has expired
    const durationEnd = new Date(startedAt.getTime() + exam.duration * 60000);
    if (now >= durationEnd) return true;

    // Check if availability deadline has passed
    if (now >= availableUntil) return true;

    return false;
  } catch (error) {
    console.error("Error checking auto-submit:", error);
    return false;
  }
};
