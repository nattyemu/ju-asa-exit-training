import { db } from "../db/connection.js";
import { users, profiles } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, generateToken } from "../utils/auth.js";
import { registerSchema, loginSchema } from "../validations/authSchemas.js";

const formatZodError = (error) => {
  if (error.issues && error.issues.length > 0) {
    const fields = new Set();

    error.issues.forEach((issue) => {
      const field = issue.path[0];
      if (field) {
        const fieldName =
          field === "fullName"
            ? "Full name"
            : field === "year"
            ? "Year"
            : field.charAt(0).toUpperCase() + field.slice(1);
        fields.add(fieldName);
      }
    });

    const fieldList = Array.from(fields).join(", ");
    return `Please check ${fieldList} inputs`;
  }
  return "Please check your input and try again";
};

export const register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role = "STUDENT",
      university,
      year,
      department,
      profileImageUrl = null, // Get URL from request body
    } = req.body;

    const validationResult = registerSchema.safeParse({
      email,
      password,
      fullName,
      department,
      university,
      year: parseInt(year),
      role,
    });

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: formatZodError(validationResult.error),
      });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await hashPassword(password);

    const [user] = await db.insert(users).values({
      email,
      isActive: true,
      password: hashedPassword,
      role,
    });

    // Insert profile with optional image URL
    await db.insert(profiles).values({
      userId: user.insertId,
      fullName,
      department,
      university,
      year: parseInt(year),
      profileImageUrl,
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
          profileImageUrl: profiles.profileImageUrl,
        },
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(users.id, user.insertId));

    const token = generateToken(user.insertId, role);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: completeUser,
        token,
      },
    });
  } catch (error) {
    // console.error("Registration error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: formatZodError(validationResult.error),
      });
    }

    const userData = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        profile: {
          id: profiles.id,
          fullName: profiles.fullName,
          department: profiles.department,
          university: profiles.university,
          year: profiles.year,
          profileImageUrl: profiles.profileImageUrl,
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
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated. Contact admin.",
      });
    }
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user.id, user.role);

    const { password: _, isActive: _is, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    // console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};
