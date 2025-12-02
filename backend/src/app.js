import { Router } from "express";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/users.js";
const appRouter = Router();

// API routes
appRouter.use("/auth", authRouter);
appRouter.use("/user", userRouter);

export default appRouter;
