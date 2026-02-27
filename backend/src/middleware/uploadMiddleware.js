import { uploadProfileImage } from "../services/cloudinaryService.js";

// Re-export the Cloudinary upload middleware
export const upload = uploadProfileImage;

// You can keep file filter if needed (though Cloudinary also filters)
export const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed!"));
  }
};
