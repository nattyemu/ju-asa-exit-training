import { Router } from "express";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/users.js";
import examRouter from "./routes/exams.js";
import questionRoutes from "./routes/questions.js";
import examSessionRoutes from "./routes/examSession.js";
import submissionRoutes from "./routes/submission.js";
import resultRoutes from "./routes/results.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import notificationRoutes from "./routes/notifications.js";
import progressRoutes from "./routes/progress.js";
import uploadRouter from "./routes/upload.js";
import { scheduleNotificationJobs } from "./jobs/reminderJobs.js";

const appRouter = Router();

// API routes
appRouter.use("/auth", authRouter);
appRouter.use("/user", userRouter);
appRouter.use("/exams", examRouter);
appRouter.use("/questions", questionRoutes);
appRouter.use("/exam-session", examSessionRoutes);
appRouter.use("/submission", submissionRoutes);
appRouter.use("/results", resultRoutes);
appRouter.use("/analytics", analyticsRoutes);
appRouter.use("/notifications", notificationRoutes);
appRouter.use("/progress", progressRoutes);
appRouter.use("/upload", uploadRouter);

// if (process.env.NODE_ENV !== "test") {
//   scheduleNotificationJobs();
// }
export default appRouter;
