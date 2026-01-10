import { db } from "../db/connection.js";
import {
  userAchievements,
  achievements,
  studentExams,
  results,
  questions,
  answers,
  exams,
} from "../db/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";

/**
 * Check immediate achievements after exam submission
 */
export const checkImmediateAchievements = async (
  studentId,
  examSessionId,
  examScore = 0,
  examRank = null
) => {
  try {
    const earnedAchievements = [];

    // Get the specific exam session data
    const [session] = await db
      .select({
        timeSpent: studentExams.timeSpent,
        examId: studentExams.examId,
        examDuration: exams.duration,
        submittedAt: studentExams.submittedAt,
      })
      .from(studentExams)
      .innerJoin(exams, eq(studentExams.examId, exams.id))
      .where(
        and(
          eq(studentExams.id, examSessionId),
          eq(studentExams.studentId, studentId)
        )
      );

    if (!session) {
      return { success: true, data: { newlyEarned: [] } };
    }

    // Get all achievements
    const allAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.isActive, true));

    // Get user's existing achievements
    const userEarned = await db
      .select({
        achievementId: userAchievements.achievementId,
        earnedAt: userAchievements.earnedAt,
      })
      .from(userAchievements)
      .where(eq(userAchievements.userId, studentId));

    const earnedAchievementIds = new Set(
      userEarned.filter((ua) => ua.earnedAt).map((ua) => ua.achievementId)
    );

    // Get student's exam statistics for ALL achievements
    const studentStats = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT se.id) as total_exams,
        COUNT(CASE WHEN r.score = 100 THEN 1 END) as perfect_scores,
        COUNT(CASE WHEN r.score >= 80 THEN 1 END) as high_scores,
        SUM(se.time_spent) as total_study_time,
        COUNT(CASE WHEN r.rank <= 3 AND r.rank IS NOT NULL THEN 1 END) as top_rank_count
      FROM student_exams se
      LEFT JOIN results r ON se.id = r.student_exam_id
      WHERE se.student_id = ${studentId} 
        AND se.submitted_at IS NOT NULL
    `);

    const stats = studentStats[0][0] || {};
    const totalExams = parseInt(stats.total_exams) || 0;
    const perfectScores = parseInt(stats.perfect_scores) || 0;
    const highScores = parseInt(stats.high_scores) || 0;
    const totalStudyTime = parseInt(stats.total_study_time) || 0;
    const topRankCount = parseInt(stats.top_rank_count) || 0;

    // Check quick_learner (for this specific exam)
    const isQuickLearner = session.timeSpent <= session.examDuration / 2;

    // Check subject_master (for this specific exam)
    // We need to check if any subject in this exam has ≥90% accuracy
    let subjectMasterData = null;
    if (examScore > 0) {
      // Get subject accuracy for this specific exam
      const subjectAccuracy = await db.execute(sql`
        SELECT 
          q.subject,
          COUNT(*) as total_questions,
          SUM(CASE WHEN a.is_correct = true THEN 1 ELSE 0 END) as correct_answers,
          ROUND((SUM(CASE WHEN a.is_correct = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as accuracy
        FROM answers a
        JOIN questions q ON a.question_id = q.id
        WHERE a.student_exam_id = ${examSessionId}
          AND a.is_correct IS NOT NULL
          AND q.subject IS NOT NULL
        GROUP BY q.subject
        HAVING COUNT(*) >= 5
      `);

      if (subjectAccuracy[0] && subjectAccuracy[0].length > 0) {
        const masterSubject = subjectAccuracy[0].find((s) => s.accuracy >= 90);
        if (masterSubject) {
          subjectMasterData = {
            subject: masterSubject.subject,
            accuracy: masterSubject.accuracy,
          };
        }
      }
    }

    // Check consistent_performer (we need current exam score)
    // If this exam score is ≥80, add to count
    const currentHighScore = examScore >= 80 ? 1 : 0;
    const totalHighScores = highScores + currentHighScore;

    for (const achievement of allAchievements) {
      if (earnedAchievementIds.has(achievement.id)) continue;

      let shouldAward = false;
      let progress = 0;
      let metadata = {};

      switch (achievement.code) {
        case "first_exam":
          if (totalExams >= 1) {
            shouldAward = true;
            progress = 100;
            metadata = { examsCompleted: totalExams };
          }
          break;

        case "marathon_runner":
          if (totalStudyTime >= 300) {
            shouldAward = true;
            progress = 100;
            metadata = { totalMinutes: totalStudyTime };
          } else {
            progress = Math.min(100, Math.round((totalStudyTime / 300) * 100));
            metadata = { totalMinutes: totalStudyTime };
          }
          break;

        case "exam_enthusiast":
          if (totalExams >= 10) {
            shouldAward = true;
            progress = 100;
            metadata = { examsCompleted: totalExams };
          } else {
            progress = Math.min(100, Math.round((totalExams / 10) * 100));
            metadata = { examsCompleted: totalExams };
          }
          break;

        case "quick_learner":
          if (isQuickLearner) {
            shouldAward = true;
            progress = 100;
            metadata = {
              timeSpent: session.timeSpent,
              duration: session.examDuration,
            };
          }
          break;

        case "perfect_score":
          // Check both: historical perfect scores AND current exam score
          const hasPerfectScore = perfectScores > 0 || examScore === 100;
          if (hasPerfectScore) {
            shouldAward = true;
            progress = 100;
            metadata = {
              perfectScores: perfectScores + (examScore === 100 ? 1 : 0),
              currentScore: examScore,
            };
          }
          break;

        case "top_ranker":
          // Check both: historical top ranks AND current exam rank
          const hasTopRank =
            topRankCount > 0 || (examRank !== null && examRank <= 3);
          if (hasTopRank) {
            shouldAward = true;
            progress = 100;
            metadata = {
              timesInTop3: topRankCount + (examRank <= 3 ? 1 : 0),
              currentRank: examRank,
            };
          }
          break;

        case "consistent_performer":
          if (totalHighScores >= 3) {
            shouldAward = true;
            progress = 100;
            metadata = { highScores: totalHighScores, currentScore: examScore };
          } else {
            progress = Math.min(100, Math.round((totalHighScores / 3) * 100));
            metadata = { highScores: totalHighScores, currentScore: examScore };
          }
          break;

        case "subject_master":
          // Check if we have subject mastery data from current exam (with 5+ questions)
          if (subjectMasterData) {
            shouldAward = true;
            progress = 100;
            metadata = {
              subject: subjectMasterData.subject,
              accuracy: subjectMasterData.accuracy,
              examId: session.examId,
            };
          } else {
            // Calculate progress based on best subject accuracy across all exams (with 5+ questions)
            const allSubjectMastery = await getSubjectMasteryAcrossAllExams(
              studentId
            );

            if (allSubjectMastery && allSubjectMastery.length > 0) {
              const bestSubject = allSubjectMastery.reduce(
                (best, current) =>
                  current.accuracy > (best?.accuracy || 0) ? current : best,
                null
              );

              if (bestSubject) {
                // Show progress as accuracy percentage
                progress = Math.min(100, Math.round(bestSubject.accuracy));
                metadata = {
                  bestSubject: bestSubject.subject,
                  bestAccuracy: bestSubject.accuracy,
                  totalQuestions: bestSubject.totalQuestions,
                  subjectsAnalyzed: allSubjectMastery.length,
                };

                // Check if this qualifies for earning (≥90% accuracy)
                if (bestSubject.accuracy >= 90) {
                  shouldAward = true;
                  progress = 100;
                }
              } else {
                progress = 0;
                metadata = { subjectsAnalyzed: 0 };
              }
            } else {
              // No subject with 5+ questions yet
              progress = 0;
              metadata = { subjectsAnalyzed: 0 };
            }
          }
          break;
      }

      if (shouldAward) {
        // Award the achievement
        await db.insert(userAchievements).values({
          userId: studentId,
          achievementId: achievement.id,
          progress: progress,
          metadata: JSON.stringify(metadata),
          earnedAt: new Date(),
        });

        earnedAchievements.push({
          ...achievement,
          earned: true,
          earnedAt: new Date().toISOString(),
          progress,
          metadata,
        });
      } else if (progress > 0) {
        // Update progress tracking
        await updateAchievementProgress(
          studentId,
          achievement.id,
          progress,
          metadata
        );
      }
    }

    return {
      success: true,
      data: {
        newlyEarned: earnedAchievements,
        totalEarned: earnedAchievementIds.size + earnedAchievements.length,
      },
    };
  } catch (error) {
    // console.error("Check immediate achievements error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
/**
 * Get subject mastery across all exams for a student
 */
const getSubjectMasteryAcrossAllExams = async (studentId) => {
  try {
    const subjectMastery = await db
      .select({
        subject: questions.subject,
        totalQuestions: sql`COUNT(*)`,
        correctAnswers: sql`SUM(CASE WHEN ${answers.isCorrect} = true THEN 1 ELSE 0 END)`,
        accuracy: sql`ROUND((SUM(CASE WHEN ${answers.isCorrect} = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2)`,
      })
      .from(answers)
      .innerJoin(questions, eq(answers.questionId, questions.id))
      .innerJoin(studentExams, eq(answers.studentExamId, studentExams.id))
      .where(
        and(
          eq(studentExams.studentId, studentId),
          sql`${answers.isCorrect} IS NOT NULL`,
          sql`${questions.subject} IS NOT NULL`
        )
      )
      .groupBy(questions.subject)
      .having(sql`COUNT(*) >= 5`); // Include all subjects, even with 5+ question

    return subjectMastery;
  } catch (error) {
    // console.error("Get subject mastery across all exams error:", error);
    return [];
  }
};

/**
 * Check delayed achievements after results are calculated
 */
export const checkDelayedAchievements = async (studentId) => {
  try {
    const earnedAchievements = [];

    // Get all achievements
    const allAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.isActive, true));

    // Get user's existing achievements
    const userEarned = await db
      .select({
        achievementId: userAchievements.achievementId,
        earnedAt: userAchievements.earnedAt,
      })
      .from(userAchievements)
      .where(eq(userAchievements.userId, studentId));

    const earnedAchievementIds = new Set(
      userEarned.filter((ua) => ua.earnedAt).map((ua) => ua.achievementId)
    );

    // Check perfect_score (needs results)
    const perfectScoresResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(
        and(eq(studentExams.studentId, studentId), eq(results.score, 100))
      );
    const perfectScores = parseInt(perfectScoresResult[0]?.count || 0);

    // Check consistent_performer (needs results)
    const highScoresResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(
        and(eq(studentExams.studentId, studentId), sql`${results.score} >= 80`)
      );
    const highScores = parseInt(highScoresResult[0]?.count || 0);

    // Check top_ranker (needs results)
    const topRanksResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(results)
      .innerJoin(studentExams, eq(results.studentExamId, studentExams.id))
      .where(
        and(
          eq(studentExams.studentId, studentId),
          sql`${results.rank} <= 3`,
          sql`${results.rank} IS NOT NULL`
        )
      );
    const topRanks = parseInt(topRanksResult[0]?.count || 0);

    // Check subject_master (needs answers correctness) - USING DRIZZLE QUERY BUILDER INSTEAD
    const subjectMastery = await db
      .select({
        subject: questions.subject,
        totalQuestions: sql`COUNT(*)`,
        correctAnswers: sql`SUM(CASE WHEN ${answers.isCorrect} = true THEN 1 ELSE 0 END)`,
        accuracy: sql`ROUND((SUM(CASE WHEN ${answers.isCorrect} = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2)`,
      })
      .from(answers)
      .innerJoin(questions, eq(answers.questionId, questions.id))
      .innerJoin(studentExams, eq(answers.studentExamId, studentExams.id))
      .where(
        and(
          eq(studentExams.studentId, studentId),
          sql`${answers.isCorrect} IS NOT NULL`,
          sql`${questions.subject} IS NOT NULL`
        )
      )
      .groupBy(questions.subject)
      .having(sql`COUNT(*) >= 5`);

    for (const achievement of allAchievements) {
      if (earnedAchievementIds.has(achievement.id)) continue;

      let shouldAward = false;
      let progress = 0;
      let metadata = {};

      switch (achievement.code) {
        case "perfect_score":
          if (perfectScores >= 1) {
            shouldAward = true;
            progress = 100;
            metadata = { perfectScores };
          }
          break;

        case "consistent_performer":
          if (highScores >= 3) {
            shouldAward = true;
            progress = 100;
            metadata = { highScores };
          } else {
            progress = Math.min(100, Math.round((highScores / 3) * 100));
            metadata = { highScores };
          }
          break;

        case "top_ranker":
          if (topRanks >= 1) {
            shouldAward = true;
            progress = 100;
            metadata = { timesInTop3: topRanks };
          }
          break;

        case "subject_master":
          if (subjectMastery && subjectMastery.length > 0) {
            const masterSubject = subjectMastery.find((s) => s.accuracy >= 90);
            if (masterSubject) {
              shouldAward = true;
              progress = 100;
              metadata = {
                subject: masterSubject.subject,
                accuracy: masterSubject.accuracy,
              };
            } else {
              // Calculate best subject progress
              const bestSubject = subjectMastery.reduce(
                (best, current) =>
                  current.accuracy > (best?.accuracy || 0) ? current : best,
                null
              );
              progress = bestSubject
                ? Math.min(100, Math.round(bestSubject.accuracy))
                : 0;
              metadata = {
                bestSubject: bestSubject?.subject,
                bestAccuracy: bestSubject?.accuracy || 0,
                subjectsAnalyzed: subjectMastery.length,
              };
            }
          } else {
            progress = 0;
            metadata = { subjectsAnalyzed: 0 };
          }
          break;
      }

      if (shouldAward) {
        // Award the achievement
        await db.insert(userAchievements).values({
          userId: studentId,
          achievementId: achievement.id,
          progress: progress,
          metadata: JSON.stringify(metadata),
          earnedAt: new Date(),
        });

        earnedAchievements.push({
          ...achievement,
          earned: true,
          earnedAt: new Date().toISOString(),
          progress,
          metadata,
        });
      } else if (progress > 0) {
        // Update progress tracking
        await updateAchievementProgress(
          studentId,
          achievement.id,
          progress,
          metadata
        );
      }
    }

    return {
      success: true,
      data: {
        newlyEarned: earnedAchievements,
        totalEarned: earnedAchievementIds.size + earnedAchievements.length,
      },
    };
  } catch (error) {
    // console.error("Check delayed achievements error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update achievement progress (helper function)
 */
const updateAchievementProgress = async (
  userId,
  achievementId,
  progress,
  metadata
) => {
  try {
    const existing = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );

    if (existing.length > 0) {
      await db
        .update(userAchievements)
        .set({
          progress: progress,
          metadata: JSON.stringify(metadata),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementId, achievementId)
          )
        );
    } else {
      await db.insert(userAchievements).values({
        userId: userId,
        achievementId: achievementId,
        progress: progress,
        metadata: JSON.stringify(metadata),
        earnedAt: null, // Not earned yet
        createdAt: new Date(),
      });
    }
  } catch (error) {
    // console.error("Update achievement progress error:", error);
  }
};

/**
 * Comprehensive achievement check (for progress page)
 */
export const checkAndAwardAchievements = async (studentId) => {
  try {
    // Check immediate achievements (exam count, study time, etc.)
    const immediateResult = await checkImmediateAchievements(studentId, null);

    // Check delayed achievements (results-dependent)
    const delayedResult = await checkDelayedAchievements(studentId);

    const allNewlyEarned = [
      ...(immediateResult.data?.newlyEarned || []),
      ...(delayedResult.data?.newlyEarned || []),
    ];

    return {
      success: true,
      data: {
        newlyEarned: allNewlyEarned,
        immediateChecked: immediateResult.success,
        delayedChecked: delayedResult.success,
      },
    };
  } catch (error) {
    // console.error("Comprehensive achievement check error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get student's achievements with progress - FIXED SQL
 */
export const getStudentAchievements = async (studentId) => {
  try {
    // First do a quick check for any new achievements
    await checkAndAwardAchievements(studentId);

    // Get all achievements with user's progress
    const userAchievementsData = await db
      .select({
        id: achievements.id,
        code: achievements.code,
        title: achievements.title,
        description: achievements.description,
        icon: achievements.icon,
        points: achievements.points,
        type: achievements.type,
        earnedAt: userAchievements.earnedAt,
        progress: userAchievements.progress,
        metadata: userAchievements.metadata,
        // FIX: Use MySQL boolean true/false instead of 1/0
        earned:
          sql`CASE WHEN ${userAchievements.earnedAt} IS NOT NULL THEN TRUE ELSE FALSE END`.as(
            "earned"
          ),
      })
      .from(achievements)
      .leftJoin(
        userAchievements,
        and(
          eq(achievements.id, userAchievements.achievementId),
          eq(userAchievements.userId, studentId)
        )
      )
      .where(eq(achievements.isActive, true))
      .orderBy(
        sql`CASE WHEN ${userAchievements.earnedAt} IS NOT NULL THEN 0 ELSE 1 END`,
        desc(achievements.points)
      );

    const achievementsList = userAchievementsData.map((row) => {
      const metadata = row.metadata ? JSON.parse(row.metadata) : {};
      const isEarned = Boolean(row.earned);

      // For Subject Master, ensure progress is based on actual accuracy if not earned
      let displayProgress = row.progress || 0;

      if (row.code === "subject_master" && !isEarned) {
        // If we have best accuracy in metadata, use it for progress
        if (metadata.bestAccuracy) {
          displayProgress = Math.min(100, Math.round(metadata.bestAccuracy));
        } else if (metadata.currentScore) {
          // Fallback to current score if available
          displayProgress = Math.min(100, Math.round(metadata.currentScore));
        }
      }

      return {
        id: row.id,
        code: row.code,
        title: row.title,
        description: row.description,
        icon: row.icon,
        points: row.points,
        type: row.type,
        earned: isEarned,
        earnedAt: row.earnedAt,
        progress: displayProgress,
        metadata: metadata,
      };
    });

    // Calculate totals
    const earnedAchievements = achievementsList.filter((a) => a.earned);
    const totalPoints = earnedAchievements.reduce(
      (sum, a) => sum + (a.points || 0),
      0
    );

    return {
      success: true,
      data: {
        achievements: achievementsList,
        summary: {
          total: achievementsList.length,
          earned: earnedAchievements.length,
          points: totalPoints,
          progress:
            achievementsList.length > 0
              ? Math.round(
                  (earnedAchievements.length / achievementsList.length) * 100
                )
              : 0,
        },
      },
    };
  } catch (error) {
    // console.error("Get student achievements error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get top achievers - FIXED SQL
 */
export const getTopAchievers = async (limit = 5) => {
  try {
    const topAchievers = await db.execute(sql`
      SELECT 
        u.id as userId,
        p.full_name as fullName,
        p.profile_image_url as profileImage,
        COUNT(ua.id) as achievementCount,
        SUM(a.points) as totalPoints
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_achievements ua ON u.id = ua.user_id AND ua.earned_at IS NOT NULL
      LEFT JOIN achievements a ON ua.achievement_id = a.id
      WHERE u.role = 'STUDENT' AND u.is_active = true
      GROUP BY u.id, p.full_name, p.profile_image_url
      ORDER BY totalPoints DESC, achievementCount DESC
      LIMIT ${limit}
    `);

    return {
      success: true,
      data: {
        topAchievers:
          topAchievers[0]?.map((user, index) => ({
            rank: index + 1,
            userId: user.userId,
            name: user.fullName || "Unknown Student",
            profileImage: user.profileImage,
            achievements: parseInt(user.achievementCount) || 0,
            points: parseInt(user.totalPoints) || 0,
          })) || [],
      },
    };
  } catch (error) {
    // console.error("Top achievers error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Simple achievement check for exam submission
 * This can be called immediately after exam submission
 */
export const checkAchievementsAfterSubmission = async (
  studentId,
  examSessionId
) => {
  try {
    // Just check immediate achievements for now
    // Delayed achievements will be checked when user views progress page
    return await checkImmediateAchievements(studentId, examSessionId);
  } catch (error) {
    // console.error("Check achievements after submission error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
