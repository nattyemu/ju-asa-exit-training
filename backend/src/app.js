import { Router } from "express";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/users.js";
import examRouter from "./routes/exams.js";
import questionRoutes from "./routes/questions.js";
import examSessionRoutes from "./routes/examSession.js";
const appRouter = Router();

// API routes
appRouter.use("/auth", authRouter);
appRouter.use("/user", userRouter);
appRouter.use("/exams", examRouter);
appRouter.use("/questions", questionRoutes);
appRouter.use("/exam-session", examSessionRoutes);

export default appRouter;
