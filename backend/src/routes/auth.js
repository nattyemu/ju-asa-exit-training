import express from "express";
import { register, login, forgotPassword, confirmOtp, newPassword  } from "../controllers/authController.js";
import { authorize, authenticate } from "../middleware/authenticate.js";
import { authLimiter } from "../middleware/rateLimiter.js";
const router = express.Router();

router.post("/login", authLimiter, login);
router.post("/register", authenticate, authorize("ADMIN"), register);

router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/confirm-otp", authLimiter, confirmOtp);
router.post("/new-password", authLimiter, newPassword);

export default router;
