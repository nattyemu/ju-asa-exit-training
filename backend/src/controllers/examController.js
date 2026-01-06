import { db } from "../db/connection.js";
import { exams, studentExams, results } from "../db/schema.js";
import { eq, and, desc, asc, count, inArray, gte, lte } from "drizzle-orm";
import {
  createExamSchema,
  updateExamSchema,
  examStatusSchema,
  formatZodError,
} from "../validations/examSchemas.js";

export const createExam = async (req, res) => {
  try {
    // Validate request body
    const validationResult = createExamSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }

    const examData = validationResult.data;

    // Convert string dates to Date objects
    const examToCreate = {
      ...examData,
      availableFrom: new Date(examData.availableFrom),
      availableUntil: new Date(examData.availableUntil),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert exam using Drizzle
    const [newExam] = await db.insert(exams).values(examToCreate);

    return res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: {
        id: newExam.insertId || newExam.id,
        ...examData,
      },
    });
  } catch (error) {
    console.error("Create exam error:", error);

    // Handle specific database errors
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "An exam with similar details already exists",
      });
    }

    if (error.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({
        success: false,
        message: "One or more fields exceed maximum length",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create exam. Please try again.",
    });
  }
};
export const getAllExams = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get exams with statistics
    const examsList = await db
      .select({
        id: exams.id,
        title: exams.title,
        description: exams.description,
        availableFrom: exams.availableFrom,
        availableUntil: exams.availableUntil,
        duration: exams.duration,
        totalQuestions: exams.totalQuestions,
        passingScore: exams.passingScore,
        isActive: exams.isActive,
        createdAt: exams.createdAt,
        updatedAt: exams.updatedAt,
      })
      .from(exams)
      .orderBy(desc(exams.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalCountResult] = await db.select({ count: count() }).from(exams);

    const totalCount = totalCountResult.count || 0;

    return res.status(200).json({
      success: true,
      data: {
        exams: examsList,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all exams error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exams",
    });
  }
};

export const getAvailableExams = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const now = new Date();

    // Get all active exams (regardless of time window)
    const allActiveExams = await db
      .select({
        id: exams.id,
        title: exams.title,
        description: exams.description,
        availableFrom: exams.availableFrom,
        availableUntil: exams.availableUntil,
        duration: exams.duration,
        totalQuestions: exams.totalQuestions,
        passingScore: exams.passingScore,
        createdAt: exams.createdAt,
        isActive: exams.isActive,
      })
      .from(exams)
      .where(eq(exams.isActive, true))
      .orderBy(asc(exams.availableFrom));

    // Get student's exam attempts for these exams
    const examIds = allActiveExams.map((exam) => exam.id);

    let studentExamsList = [];
    if (examIds.length > 0) {
      studentExamsList = await db
        .select({
          examId: studentExams.examId,
          startedAt: studentExams.startedAt,
          submittedAt: studentExams.submittedAt,
          score: results.score,
          rank: results.rank,
        })
        .from(studentExams)
        .leftJoin(results, eq(studentExams.id, results.studentExamId))
        .where(
          and(
            eq(studentExams.studentId, studentId),
            inArray(studentExams.examId, examIds)
          )
        );
    }

    // Create a map for quick lookup
    const studentExamMap = new Map();
    studentExamsList.forEach((se) => {
      studentExamMap.set(se.examId, se);
    });

    // Format exams with status
    const formattedExams = allActiveExams.map((exam) => {
      const studentExam = studentExamMap.get(exam.id);
      const isCurrentlyAvailable =
        now >= new Date(exam.availableFrom) &&
        now <= new Date(exam.availableUntil);

      let status = "NOT_STARTED";
      let statusText = isCurrentlyAvailable ? "Available" : "Not Available";
      let canStart = isCurrentlyAvailable;

      if (studentExam) {
        if (studentExam.submittedAt) {
          status = "COMPLETED";
          statusText = "Completed";
          canStart = false;
        } else if (studentExam.startedAt) {
          status = "IN_PROGRESS";
          statusText = "In Progress";
          canStart = true; // Can continue
        }
      }

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        availableFrom: exam.availableFrom,
        availableUntil: exam.availableUntil,
        duration: exam.duration,
        totalQuestions: exam.totalQuestions,
        passingScore: exam.passingScore,
        status,
        statusText,
        canStart,
        isCurrentlyAvailable,
        // Calculate remaining time in minutes
        timeRemaining: isCurrentlyAvailable
          ? Math.max(
              0,
              Math.floor((new Date(exam.availableUntil) - now) / (1000 * 60))
            )
          : 0,
        // Include result if completed
        ...(studentExam?.submittedAt && {
          result: {
            score: studentExam.score,
            rank: studentExam.rank,
            submittedAt: studentExam.submittedAt,
          },
        }),
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        exams: formattedExams,
        count: formattedExams.length,
        currentTime: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Get available exams error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch available exams",
    });
  }
};
export const getExamById = async (req, res) => {
  try {
    const examId = parseInt(req.params.id);

    if (isNaN(examId) || examId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID",
      });
    }

    // Get exam details
    const [exam] = await db.select().from(exams).where(eq(exams.id, examId));

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    console.error("Get exam by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exam details",
    });
  }
};

export const updateExam = async (req, res) => {
  try {
    const examId = parseInt(req.params.id);

    if (isNaN(examId) || examId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID",
      });
    }

    // Validate request body
    const validationResult = updateExamSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }

    const updateData = validationResult.data;

    // Check if exam exists
    const [existingExam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, examId));

    if (!existingExam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Prepare data for update
    const dataToUpdate = { ...updateData, updatedAt: new Date() };

    // Convert dates if provided
    if (dataToUpdate.availableFrom) {
      dataToUpdate.availableFrom = new Date(dataToUpdate.availableFrom);
    }
    if (dataToUpdate.availableUntil) {
      dataToUpdate.availableUntil = new Date(dataToUpdate.availableUntil);
    }

    // Update exam
    await db.update(exams).set(dataToUpdate).where(eq(exams.id, examId));

    // Get updated exam
    const [updatedExam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, examId));

    return res.status(200).json({
      success: true,
      message: "Exam updated successfully",
      data: updatedExam,
    });
  } catch (error) {
    console.error("Update exam error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Exam update conflicts with existing data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update exam",
    });
  }
};

export const updateExamStatus = async (req, res) => {
  try {
    const examId = parseInt(req.params.id);

    if (isNaN(examId) || examId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID",
      });
    }

    // Validate request body
    const validationResult = examStatusSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }

    const { isActive } = validationResult.data;

    // Check if exam exists
    const [existingExam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, examId));

    if (!existingExam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Check if status is already the same
    if (existingExam.isActive === isActive) {
      const currentStatus = isActive ? "active" : "inactive";
      return res.status(400).json({
        success: false,
        error: `Exam is already ${currentStatus}`,
      });
    }

    // Update exam status
    await db
      .update(exams)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(exams.id, examId));

    const action = isActive ? "activated" : "deactivated";
    const status = isActive ? "active" : "inactive";

    return res.status(200).json({
      success: true,
      message: `Exam ${action} successfully`,
      data: {
        id: examId,
        previousStatus: existingExam.isActive ? "active" : "inactive",
        newStatus: status,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Update exam status error:", error);

    // Handle foreign key constraint errors
    if (
      error.code === "ER_ROW_IS_REFERENCED_2" ||
      error.code === "ER_NO_REFERENCED_ROW_2"
    ) {
      const action = req.body.isActive ? "activate" : "deactivate";
      return res.status(409).json({
        success: false,
        error: `Cannot ${action} exam due to data integrity constraints.`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update exam status",
    });
  }
};
export const getAdminDashboardStats = async (req, res) => {
  try {
    // Get active exams count
    const [activeExamsResult] = await db
      .select({ count: count() })
      .from(exams)
      .where(eq(exams.isActive, true));

    // Get total students count
    const [totalStudentsResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "STUDENT"));

    // Get total questions count
    const [totalQuestionsResult] = await db
      .select({ count: count() })
      .from(questions);

    // Get submissions today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [submissionsTodayResult] = await db
      .select({ count: count() })
      .from(studentExams)
      .where(
        and(
          gte(studentExams.submittedAt, today),
          lt(studentExams.submittedAt, tomorrow)
        )
      );

    return res.status(200).json({
      success: true,
      data: {
        activeExams: activeExamsResult.count || 0,
        totalStudents: totalStudentsResult.count || 0,
        totalQuestions: totalQuestionsResult.count || 0,
        submissionsToday: submissionsTodayResult.count || 0,
      },
    });
  } catch (error) {
    console.error("Get admin dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard stats",
    });
  }
};
