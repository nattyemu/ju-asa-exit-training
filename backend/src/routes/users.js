import express from "express";
import {
  getMyProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUserRole,
  deactivateUser,
} from "../controllers/userController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
import {
  generalLimiter,
  changePasswordLimiter,
} from "../middleware/rateLimiter.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile management
router.get("/me", getMyProfile);
router.put("/profile", generalLimiter, updateProfile);
router.put("/change-password", changePasswordLimiter, changePassword);

// Admin only routes
router.get("/", authorize("ADMIN"), getAllUsers);
router.put("/:id/role", authorize("ADMIN"), updateUserRole);
router.put("/:id", authorize("ADMIN"), deactivateUser);

export default router;
