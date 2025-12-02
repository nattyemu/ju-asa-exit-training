import { Router } from "express";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/users.js";
import examRouter from "./routes/exams.js";
const appRouter = Router();

// API routes
appRouter.use("/auth", authRouter);
appRouter.use("/user", userRouter);
appRouter.use("/exams", examRouter);

export default appRouter;
