import {
  mysqlTable,
  int,
  varchar,
  text,
  datetime,
  boolean,
  float,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("STUDENT"),
  createdAt: datetime("created_at").default(new Date()),
  isActive: boolean("is_active").notNull().default(true),
});

export const profiles = mysqlTable(
  "profiles",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").notNull().unique(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    department: varchar("department", { length: 255 }).notNull(),
    university: varchar("university", { length: 255 }).notNull(),
    year: int("year").notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
  })
);

export const exams = mysqlTable("exams", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  availableFrom: datetime("available_from").notNull(),
  availableUntil: datetime("available_until").notNull(),
  duration: int("duration").notNull(),
  isActive: boolean("is_active").default(false),
  totalQuestions: int("total_questions").notNull(),
  passingScore: float("passing_score").default(50.0),
  createdAt: datetime("created_at").default(new Date()),
  updatedAt: datetime("updated_at").default(new Date()),
});

export const questions = mysqlTable(
  "questions",
  {
    id: int("id").primaryKey().autoincrement(),
    examId: int("exam_id").notNull(),
    questionText: text("question_text").notNull(),
    optionA: varchar("option_a", { length: 500 }).notNull(),
    optionB: varchar("option_b", { length: 500 }).notNull(),
    optionC: varchar("option_c", { length: 500 }).notNull(),
    optionD: varchar("option_d", { length: 500 }).notNull(),
    correctAnswer: varchar("correct_answer", { length: 1 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    difficulty: varchar("difficulty", { length: 50 }).default("MEDIUM"),
    explanation: text("explanation"),
  },
  (table) => ({
    examIdx: index("exam_idx").on(table.examId),
  })
);

export const studentExams = mysqlTable(
  "student_exams",
  {
    id: int("id").primaryKey().autoincrement(),
    studentId: int("student_id").notNull(),
    examId: int("exam_id").notNull(),
    startedAt: datetime("started_at").notNull(),
    submittedAt: datetime("submitted_at"),
    timeSpent: int("time_spent"),
  },
  (table) => ({
    studentExamIdx: uniqueIndex("student_exam_idx").on(
      table.studentId,
      table.examId
    ),
    studentIdx: index("student_idx").on(table.studentId),
    examIdx: index("exam_student_idx").on(table.examId),
  })
);

export const answers = mysqlTable(
  "answers",
  {
    id: int("id").primaryKey().autoincrement(),
    studentExamId: int("student_exam_id").notNull(),
    questionId: int("question_id").notNull(),
    chosenAnswer: varchar("chosen_answer", { length: 1 }).notNull(),
    isCorrect: boolean("is_correct"),
  },
  (table) => ({
    studentExamIdx: index("student_exam_answer_idx").on(table.studentExamId),
    questionIdx: index("question_answer_idx").on(table.questionId),
  })
);

export const results = mysqlTable(
  "results",
  {
    id: int("id").primaryKey().autoincrement(),
    studentExamId: int("student_exam_id").notNull().unique(),
    score: float("score").notNull(),
    correctAnswers: int("correct_answers").notNull(),
    totalQuestions: int("total_questions").notNull(),
    rank: int("rank"),
    timeSpent: int("time_spent").notNull(),
    submittedAt: datetime("submitted_at").default(new Date()),
  },
  (table) => ({
    studentExamIdx: index("result_student_exam_idx").on(table.studentExamId),
  })
);

export const studentNotes = mysqlTable(
  "student_notes",
  {
    id: int("id").primaryKey().autoincrement(),
    studentId: int("student_id").notNull(),
    questionId: int("question_id").notNull(),
    noteText: text("note_text").notNull(),
    createdAt: datetime("created_at").default(new Date()),
    updatedAt: datetime("updated_at").default(new Date()),
  },
  (table) => ({
    studentIdx: index("note_student_idx").on(table.studentId),
    questionIdx: index("note_question_idx").on(table.questionId),
  })
);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  exams: many(studentExams),
  results: many(results),
  notes: many(studentNotes),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const examsRelations = relations(exams, ({ many }) => ({
  questions: many(questions),
  studentExams: many(studentExams),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  exam: one(exams, {
    fields: [questions.examId],
    references: [exams.id],
  }),
  answers: many(answers),
  notes: many(studentNotes),
}));

export const studentExamsRelations = relations(
  studentExams,
  ({ one, many }) => ({
    student: one(users, {
      fields: [studentExams.studentId],
      references: [users.id],
    }),
    exam: one(exams, {
      fields: [studentExams.examId],
      references: [exams.id],
    }),
    answers: many(answers),
    result: one(results, {
      fields: [studentExams.id],
      references: [results.studentExamId],
    }),
  })
);

export const answersRelations = relations(answers, ({ one }) => ({
  studentExam: one(studentExams, {
    fields: [answers.studentExamId],
    references: [studentExams.id],
  }),
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  studentExam: one(studentExams, {
    fields: [results.studentExamId],
    references: [studentExams.id],
  }),
  user: one(users, {
    fields: [results.studentExamId],
    references: [users.id],
  }),
}));

export const studentNotesRelations = relations(studentNotes, ({ one }) => ({
  student: one(users, {
    fields: [studentNotes.studentId],
    references: [users.id],
  }),
  question: one(questions, {
    fields: [studentNotes.questionId],
    references: [questions.id],
  }),
}));
