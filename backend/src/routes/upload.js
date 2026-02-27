import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import { deleteImage } from "../services/cloudinaryService.js";

const router = express.Router();

// Upload image
router.post("/:type", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Cloudinary returns file info
    const imageUrl = req.file.path; // Cloudinary URL
    const publicId = req.file.filename; // Cloudinary public ID

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      url: imageUrl,
      publicId: publicId,
      filename: publicId, // Keep for backward compatibility
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading image",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Update image - delete old and upload new
router.put("/:type", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { oldPublicId } = req.body; // Now expecting publicId instead of filename

    // Delete old image from Cloudinary if provided
    if (oldPublicId && oldPublicId !== "undefined" && oldPublicId !== "null") {
      try {
        await deleteImage(oldPublicId);
        console.log(`✅ Deleted old image: ${oldPublicId}`);
      } catch (error) {
        console.log(
          `⚠️ Error deleting old image: ${oldPublicId}`,
          error.message,
        );
        // Continue with upload even if deletion fails
      }
    }

    // New image info
    const imageUrl = req.file.path;
    const publicId = req.file.filename;

    res.status(200).json({
      success: true,
      message: "Image updated successfully",
      url: imageUrl,
      publicId: publicId,
      filename: publicId, // Keep for backward compatibility
      oldPublicId: oldPublicId || null,
    });
  } catch (error) {
    console.error("Error updating image:", error);
    res.status(500).json({
      success: false,
      message: "Error updating image",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Delete image by publicId
router.delete("/:type/:publicId", async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId || publicId === "undefined" || publicId === "null") {
      return res.status(400).json({
        success: false,
        message: "Valid publicId is required",
      });
    }

    // Delete from Cloudinary
    const result = await deleteImage(publicId);

    if (result.result === "ok") {
      res.status(200).json({
        success: true,
        message: "Image deleted successfully",
        publicId: publicId,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Image not found in Cloudinary",
      });
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting image",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Delete image by URL (extract publicId from URL)
router.delete("/:type/url/:imageUrl", async (req, res) => {
  try {
    const { imageUrl } = req.params;

    if (!imageUrl || imageUrl === "undefined" || imageUrl === "null") {
      return res.status(400).json({
        success: false,
        message: "Valid image URL is required",
      });
    }

    // Extract publicId from Cloudinary URL
    // Cloudinary URL format: https://res.cloudinary.com/cloudname/image/upload/v12345/folder/publicId.jpg
    const urlParts = decodeURIComponent(imageUrl).split("/");
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.split(".")[0];
    const fullPublicId = `exit-platform/profiles/${publicId}`;

    const result = await deleteImage(fullPublicId);

    if (result.result === "ok") {
      res.status(200).json({
        success: true,
        message: "Image deleted successfully",
        publicId: fullPublicId,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Image not found in Cloudinary",
      });
    }
  } catch (error) {
    console.error("Error deleting image by URL:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting image",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
