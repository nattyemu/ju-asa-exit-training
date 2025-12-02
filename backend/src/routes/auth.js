import express from "express";
import { register, login } from "../controllers/authController.js";
import { authorize } from "../middleware/authenticate.js";
import { authLimiter } from "../middleware/rateLimiter.js";
const router = express.Router();

router.post("/login", authLimiter, login);
router.post("/register", authorize("ADMIN"), register);

export default router;
