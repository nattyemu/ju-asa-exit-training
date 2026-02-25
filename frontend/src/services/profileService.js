import api from "./api";

export const profileService = {
  // Update profile (name, year, image)
  updateProfile: async (profileData, imageFile = null) => {
    try {
      let imageUrl = profileData.profileImageUrl || "";
      let publicId = profileData.publicId || "";

      // Upload new image if provided
      if (imageFile && imageFile instanceof File) {
        try {
          const formData = new FormData();
          formData.append("image", imageFile);

          const uploadResponse = await api.post(`/upload/profiles`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          if (uploadResponse.data.success && uploadResponse.data.url) {
            imageUrl = uploadResponse.data.url;
            publicId = uploadResponse.data.publicId; // Cloudinary publicId

            // If there was an old image, delete it using publicId
            if (profileData.publicId && profileData.publicId !== publicId) {
              try {
                await api.delete(`/upload/profiles/${profileData.publicId}`);
              } catch (deleteError) {
                // Ignore delete errors
              }
            }
          }
        } catch (uploadError) {
          console.error("Failed to upload image:", uploadError);
        }
      }

      // Prepare data with updated image URL and publicId
      const requestData = {
        ...profileData,
        profileImageUrl: imageUrl || profileData.profileImageUrl || null,
        publicId: publicId || profileData.publicId || null, // Store publicId for future deletions
      };

      const response = await api.put("/user/profile", requestData);
      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  // Delete profile image - UPDATED to use publicId
  deleteProfileImage: async (publicId) => {
    try {
      if (!publicId) {
        return { success: true, message: "No image to delete" };
      }

      const response = await api.delete(`/upload/profiles/${publicId}`);
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

  // Upload profile image only - already working
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
