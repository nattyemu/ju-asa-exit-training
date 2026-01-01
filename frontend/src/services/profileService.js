import api from "./api";

export const profileService = {
  // Update profile (name, year, image)
  updateProfile: async (profileData, imageFile = null) => {
    try {
      let imageUrl = profileData.profileImageUrl || "";

      // Upload new image if provided
      if (imageFile && imageFile instanceof File) {
        try {
          console.log("Uploading profile image:", imageFile.name);
          const formData = new FormData();
          formData.append("image", imageFile);

          const uploadResponse = await api.post(`/upload/profiles`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          if (uploadResponse.data.success && uploadResponse.data.url) {
            imageUrl = uploadResponse.data.url;
            console.log(`Image uploaded successfully: ${imageUrl}`);

            // If there was an old image, delete it
            if (
              profileData.profileImageUrl &&
              profileData.profileImageUrl !== imageUrl
            ) {
              // Extract filename from old URL
              const oldFilename = profileData.profileImageUrl.split("/").pop();
              if (oldFilename && oldFilename !== "undefined") {
                try {
                  await api.delete(`/upload/profiles/${oldFilename}`);
                  console.log(`✅ Deleted old image: ${oldFilename}`);
                } catch (deleteError) {
                  console.warn(
                    `⚠️ Failed to delete old image: ${deleteError.message}`
                  );
                }
              }
            }
          } else {
            console.warn("Image upload failed:", uploadResponse.data.message);
          }
        } catch (uploadError) {
          console.error("Failed to upload image:", uploadError);
        }
      }

      // Prepare data with updated image URL
      const requestData = {
        ...profileData,
        profileImageUrl: imageUrl || profileData.profileImageUrl || null,
      };

      console.log("Sending profile update request with data:", requestData);

      const response = await api.put("/user/profile", requestData);
      console.log("Profile update response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  // Delete profile image
  deleteProfileImage: async (imageUrl) => {
    try {
      if (
        !imageUrl ||
        imageUrl === "" ||
        imageUrl === "null" ||
        imageUrl === "undefined"
      ) {
        return { success: true, message: "No image to delete" };
      }

      // Extract filename from URL
      const filename = imageUrl.split("/").pop();

      if (!filename || filename === "undefined" || filename === "null") {
        return { success: true, message: "Invalid filename" };
      }

      console.log(`Deleting profile image: ${filename}`);
      const response = await api.delete(`/upload/profiles/${filename}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting profile image:", error);
      return {
        success: false,
        message: "Failed to delete profile image",
        error: error.message,
      };
    }
  },

  // Upload profile image only
  uploadProfileImage: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await api.post("/upload/profiles", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error uploading profile image:", error);
      throw error;
    }
  },
};
