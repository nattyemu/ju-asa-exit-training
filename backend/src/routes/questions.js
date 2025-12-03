import express from "express";
import { authenticate, authorize } from "../middleware/authenticate.js";
import {
  addQuestion,
  getExamQuestions,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions,
  getQuestionStats,
} from "../controllers/questionController.js";

const router = express.Router();

router.use(authenticate);
router.get("/exam/:examId", getExamQuestions); // /api/questions/exam/:examId
router.use(authorize("ADMIN"));

// Question routes with examId as query param or route param
router.post("/", addQuestion); // examId in body
router.get("/stats/:examId", getQuestionStats); // /api/questions/stats/:examId
router.put("/:id", updateQuestion); // questionId in URL, examId in body
router.delete("/:id", deleteQuestion); // questionId in URL, examId in body
router.post("/bulk", bulkImportQuestions); // examId in body

export default router;
