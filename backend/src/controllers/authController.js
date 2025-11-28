import { db } from "../db/connection.js";
import { users, profiles } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, generateToken } from "../utils/auth.js";
import { validateUserInput } from "../utils/validation.js";

export const register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      fullName,
      department,
      university,
      year,
      role = "STUDENT",
    } = req.body;

    const validation = validateUserInput(email, password);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await hashPassword(password);

    const [user] = await db.insert(users).values({
      email,
      password: hashedPassword,
      role,
    });

    await db.insert(profiles).values({
      userId: user.insertId,
      fullName,
      department,
      university,
      year: parseInt(year),
    });

    const [completeUser] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        profile: {
          id: profiles.id,
          fullName: profiles.fullName,
          department: profiles.department,
          university: profiles.university,
          year: profiles.year,
        },
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(users.id, user.insertId));

    const token = generateToken(user.insertId, role);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: completeUser,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const validation = validateUserInput(email, password);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const userData = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
        role: users.role,
        createdAt: users.createdAt,
        profile: {
          id: profiles.id,
          fullName: profiles.fullName,
          department: profiles.department,
          university: profiles.university,
          year: profiles.year,
        },
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(users.email, email))
      .limit(1);

    if (userData.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = userData[0];
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user.id, user.role);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const userData = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        profile: {
          id: profiles.id,
          fullName: profiles.fullName,
          department: profiles.department,
          university: profiles.university,
          year: profiles.year,
        },
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(users.id, req.user.userId))
      .limit(1);

    if (userData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        user: userData[0],
      },
    });
  } catch (error) {
    next(error);
  }
};
