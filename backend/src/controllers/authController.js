import { db } from "../db/connection.js";
import { users, profiles } from "../db/schema.js";
import { and, eq, gt } from "drizzle-orm";
import { hashPassword, comparePassword, generateToken } from "../utils/auth.js";
import { registerSchema, loginSchema, forgetPassowd, confirmOtpSchema, newPasswordSchema } from "../validations/authSchemas.js";
import generateOTP from "../utils/generateOTP.js";
import { sendEmail } from "../utils/emailSender.js";

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

export const forgotPassword = async (req, res) => {
  try {
    const validationResult = forgetPassowd.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: formatZodError(validationResult.error),
      });
    }

    const { email } = validationResult.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If your email is registered, you will receive an OTP shortly.",
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Set expiration time (3 minutes from now)
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

    // Update user with OTP and expiration time
    await db
      .update(users)
      .set({ 
        resetPasswordOTP: otp,
        resetPasswordExpires: expirationTime 
      })
      .where(eq(users.email, email));

    // Send email with OTP
    const emailResult = await sendEmail(email, otp);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP has been sent to your email. It expires in 10 minutes.",
      data: {
        email: email,
      },
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};

export const confirmOtp = async (req, res) => {
  try {
    const validationResult = confirmOtpSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: formatZodError(validationResult.error),
      });
    }

    const { email, otp } = validationResult.data;

    // Find user with valid OTP (not expired)
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.resetPasswordOTP, otp),
          gt(users.resetPasswordExpires, new Date())
        )
      )
      .limit(1);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    // OTP is valid, we can proceed to password reset
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now reset your password.",
      data: {
        email,
        otp, // Include OTP for the next step
      },
    });
  } catch (error) {
    console.error("Confirm OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};

export const newPassword = async (req, res) => {
  try {
    const validationResult = newPasswordSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: formatZodError(validationResult.error),
      });
    }

    const { email, otp, password } = validationResult.data;

    // Verify OTP is still valid
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.resetPasswordOTP, otp),
          gt(users.resetPasswordExpires, new Date())
        )
      )
      .limit(1);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please start the process again.",
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password and clear OTP fields
    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetPasswordOTP: null,
        resetPasswordExpires: null,
      })
      .where(eq(users.email, email));

    // Send confirmation email
    await sendEmail(email, null, true); // true indicates password reset confirmation

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("New password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};