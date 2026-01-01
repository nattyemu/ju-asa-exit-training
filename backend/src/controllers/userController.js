import { db } from "../db/connection.js";
import { sql } from "drizzle-orm";
import { users, profiles } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { hashPassword } from "../utils/auth.js";
import { count } from "drizzle-orm";
import {
  updateProfileSchema,
  changePasswordSchema,
  updateUserRoleSchema,
  formatZodError,
} from "../validations/userSchemas.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to extract filename from URL
const extractFilenameFromUrl = (imageUrl) => {
  if (!imageUrl) return null;
  const urlParts = imageUrl.split("/");
  return urlParts[urlParts.length - 1];
};

// Helper function to delete old profile image
const deleteOldProfileImage = async (imageUrl) => {
  if (
    !imageUrl ||
    imageUrl === "" ||
    imageUrl === "null" ||
    imageUrl === "undefined"
  ) {
    return { success: true, message: "No image to delete" };
  }

  try {
    const filename = extractFilenameFromUrl(imageUrl);
    if (!filename) {
      return { success: false, message: "Invalid image URL" };
    }

    const filePath = path.join(
      __dirname,
      "../../public/img/profiles",
      filename
    );

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      console.log(`⚠️ Profile image not found: ${filename}`);
      return { success: true, message: "Image already deleted" };
    }

    // Delete the file
    await fs.unlink(filePath);
    console.log(`✅ Successfully deleted old profile image: ${filename}`);
    return { success: true, message: "Image deleted successfully" };
  } catch (error) {
    console.error("Error deleting old profile image:", error);
    return {
      success: false,
      message: "Failed to delete old image",
      error: error.message,
    };
  }
};

export const getMyProfile = async (req, res) => {
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
          profileImageUrl: profiles.profileImageUrl,
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

    return res.status(200).json({
      success: true,
      data: {
        user: userData[0],
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user data",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const validationResult = updateProfileSchema.safeParse({ body: req.body });

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      return res.status(400).json({
        success: false,
        message: errorMessage,
        // FIX: Check if errors array exists
        errors: validationResult.error.errors
          ? validationResult.error.errors.map((err) => ({
              field:
                err.path && err.path.length > 0
                  ? err.path.join(".")
                  : "unknown",
              message: err.message,
            }))
          : [],
      });
    }

    const validatedData = validationResult.data.body;

    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));

    const updateData = {};

    if (
      validatedData.fullName !== undefined &&
      validatedData.fullName.trim() !== ""
    ) {
      updateData.fullName = validatedData.fullName.trim();
    }

    if (
      validatedData.department !== undefined &&
      validatedData.department.trim() !== ""
    ) {
      updateData.department = validatedData.department.trim();
    }

    if (
      validatedData.university !== undefined &&
      validatedData.university.trim() !== ""
    ) {
      updateData.university = validatedData.university.trim();
    }

    if (validatedData.year !== undefined) {
      updateData.year = validatedData.year;
    }

    // Handle profile image URL
    if (validatedData.profileImageUrl !== undefined) {
      updateData.profileImageUrl = validatedData.profileImageUrl;

      // If updating profile image, delete the old one if it exists
      if (
        existingProfile &&
        existingProfile.profileImageUrl &&
        existingProfile.profileImageUrl !== validatedData.profileImageUrl
      ) {
        // Only delete if the new image is different from the old one
        const deleteResult = await deleteOldProfileImage(
          existingProfile.profileImageUrl
        );
        if (!deleteResult.success) {
          console.warn(
            "Failed to delete old profile image:",
            deleteResult.message
          );
        }
      }
    }

    // Handle profile image deletion (when set to empty string or null)
    if (
      validatedData.profileImageUrl === "" ||
      validatedData.profileImageUrl === null
    ) {
      updateData.profileImageUrl = null;

      // Delete old image if it exists
      if (existingProfile && existingProfile.profileImageUrl) {
        const deleteResult = await deleteOldProfileImage(
          existingProfile.profileImageUrl
        );
        if (!deleteResult.success) {
          console.warn(
            "Failed to delete old profile image:",
            deleteResult.message
          );
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid data provided for update",
      });
    }

    if (existingProfile) {
      await db
        .update(profiles)
        .set(updateData)
        .where(eq(profiles.userId, userId));
    } else {
      const hasFullName =
        validatedData.fullName && validatedData.fullName.trim() !== "";
      const hasDepartment =
        validatedData.department && validatedData.department.trim() !== "";
      const hasUniversity =
        validatedData.university && validatedData.university.trim() !== "";
      const hasYear = validatedData.year !== undefined;
      const hasImage =
        validatedData.profileImageUrl &&
        validatedData.profileImageUrl.trim() !== "";

      // Minimum requirements for new profile
      if (!hasFullName) {
        return res.status(400).json({
          success: false,
          message: "Full name is required for new profile",
        });
      }

      if (!hasDepartment && !hasUniversity) {
        return res.status(400).json({
          success: false,
          message:
            "Either department or university is required for new profile",
        });
      }

      const fullNameValue = hasFullName ? validatedData.fullName.trim() : "";
      const departmentValue = hasDepartment
        ? validatedData.department.trim()
        : "General Studies";
      const universityValue = hasUniversity
        ? validatedData.university.trim()
        : "University";
      const yearValue = hasYear ? validatedData.year : 1;
      const imageUrlValue = hasImage
        ? validatedData.profileImageUrl.trim()
        : null;

      try {
        await db.insert(profiles).values({
          userId: userId,
          fullName: fullNameValue,
          department: departmentValue,
          university: universityValue,
          year: yearValue,
          profileImageUrl: imageUrlValue,
        });
      } catch (sqlError) {
        console.error("SQL insert error:", sqlError);
        return res.status(500).json({
          success: false,
          message: "Failed to create profile",
          error:
            process.env.NODE_ENV === "development"
              ? sqlError.message
              : undefined,
        });
      }
    }

    const [updatedUser] = await db
      .select({
        user: {
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        },
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
      .where(eq(users.id, userId));

    return res.json({
      success: true,
      message: existingProfile
        ? "Profile updated successfully"
        : "Profile created successfully",
      data: {
        ...updatedUser.user,
        profile: updatedUser.profile,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    console.error("Error stack:", error.stack);

    if (error.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({
        success: false,
        message: "One or more fields exceed maximum length",
      });
    }

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Profile already exists for this user",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const validationResult = changePasswordSchema.safeParse(req);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: formatZodError(validationResult.error),
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userData[0];
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ password: hashedNewPassword })
      .where(eq(users.id, userId));

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Password change failed. Please try again.",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get users with profiles
    const usersList = await db
      .select({
        user: {
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          isActive: users.isActive,
        },
        profile: {
          fullName: profiles.fullName,
          department: profiles.department,
          university: profiles.university,
          year: profiles.year,
          profileImageUrl: profiles.profileImageUrl,
        },
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count using drizzle-orm count function
    const [totalCountResult] = await db.select({ count: count() }).from(users);

    const totalCount = totalCountResult.count || 0;

    return res.status(200).json({
      success: true,
      data: {
        users: usersList.map((item) => ({
          ...item.user,
          profile: item.profile,
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const validationResult = updateUserRoleSchema.safeParse(req);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: formatZodError(validationResult.error),
      });
    }

    const userId = parseInt(req.params.id);
    const { role } = req.body;
    const currentUserId = req.user.userId;

    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot change your own role",
      });
    }

    await db.update(users).set({ role }).where(eq(users.id, userId));

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("Update user role error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUserId = req.user.userId;

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID. Please provide a valid user ID.",
      });
    }

    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found. The specified user does not exist.",
      });
    }

    if (userId === currentUserId) {
      return res.status(403).json({
        success: false,
        message:
          "Cannot modify your own account status. Please contact another administrator.",
      });
    }

    // Get user's profile to check if there's an image to delete
    const [userProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));

    const isCurrentlyActive = userData.isActive;
    const newStatus = !isCurrentlyActive;

    // If deactivating user and they have a profile image, delete it
    if (!newStatus && userProfile && userProfile.profileImageUrl) {
      const deleteResult = await deleteOldProfileImage(
        userProfile.profileImageUrl
      );
      if (!deleteResult.success) {
        console.warn(
          "Failed to delete profile image during deactivation:",
          deleteResult.message
        );
      }

      // Also remove the image URL from the database
      await db
        .update(profiles)
        .set({
          profileImageUrl: null,
        })
        .where(eq(profiles.userId, userId));
    }

    await db
      .update(users)
      .set({
        isActive: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    const action = newStatus ? "activated" : "deactivated";

    return res.status(200).json({
      success: true,
      message: `User account has been ${action} successfully.`,
    });
  } catch (error) {
    console.error("Deactivate user error:", error);

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(404).json({
        success: false,
        message: "User not found or has been removed.",
      });
    }

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A conflict occurred while updating user status.",
      });
    }

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Invalid input data.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to process your request at this time. Please try again later.",
    });
  }
};

// Helper function to delete user profile and associated image
export const deleteUserProfile = async (userId) => {
  try {
    // Get user's profile to check if there's an image to delete
    const [userProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));

    if (userProfile && userProfile.profileImageUrl) {
      // Delete the profile image file
      const deleteResult = await deleteOldProfileImage(
        userProfile.profileImageUrl
      );
      if (!deleteResult.success) {
        console.warn("Failed to delete profile image:", deleteResult.message);
      }
    }

    // Delete the profile record
    await db.delete(profiles).where(eq(profiles.userId, userId));

    return { success: true, message: "Profile deleted successfully" };
  } catch (error) {
    console.error("Error deleting user profile:", error);
    return {
      success: false,
      message: "Failed to delete profile",
      error: error.message,
    };
  }
};
