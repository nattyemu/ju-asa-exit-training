import React, { useState, useEffect } from "react";
import { X, Upload, User, Calendar, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { profileService } from "../../services/profileService";

const ProfileUpdateModal = ({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    year: "",
    profileImageUrl: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [yearOptions, setYearOptions] = useState([]);

  // Generate dynamic year options: current year, year+1, year+2, year+3
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = [
      currentYear.toString(),
      (currentYear + 1).toString(),
      (currentYear + 2).toString(),
      (currentYear + 3).toString(),
    ];
    setYearOptions(years);
  }, []);

  // Initialize form with user data
  useEffect(() => {
    if (userProfile) {
      const currentYear = new Date().getFullYear();
      const defaultYear = currentYear.toString();

      // If user has a year, use it; otherwise use current year
      let userYear = userProfile.year
        ? userProfile.year.toString()
        : defaultYear;

      // If user year is not in our options, set to current year
      if (!yearOptions.includes(userYear) && yearOptions.length > 0) {
        userYear = yearOptions[0];
      }

      setFormData({
        fullName: userProfile.fullName || "",
        year: userYear,
        profileImageUrl: userProfile.profileImageUrl || "",
      });

      if (userProfile.profileImageUrl) {
        const fullImageUrl = userProfile.profileImageUrl.startsWith("http")
          ? userProfile.profileImageUrl
          : `${import.meta.env.VITE_BACKEND_URL || ""}${
              userProfile.profileImageUrl
            }`;
        setImagePreview(fullImageUrl);
      } else {
        setImagePreview("");
      }
    }
  }, [userProfile, yearOptions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.match("image.*")) {
      toast.error("Please select an image file (JPEG, PNG, GIF)");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    setFormData((prev) => ({
      ...prev,
      profileImageUrl: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!formData.year) {
      toast.error("Please select your graduation year");
      return;
    }

    setLoading(true);

    try {
      // Prepare data - convert year to number
      const yearValue = parseInt(formData.year);

      // Get current user data for fields we're not changing
      const currentYear = new Date().getFullYear();

      // Send the data
      const updateData = {
        fullName: formData.fullName.trim(),
        year: yearValue, // This will be currentYear, currentYear+1, etc.
        profileImageUrl: formData.profileImageUrl,
        // Use existing values or defaults
        department: userProfile?.department || "Computer Science",
        university: userProfile?.university || "JU University",
      };

      // console.log("Updating profile with data:", updateData);

      // Call profile service
      const response = await profileService.updateProfile(
        updateData,
        selectedImage
      );

      if (response.success) {
        toast.success("Profile updated successfully!");
        onProfileUpdated(response.data);
        onClose();
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error) {
      // console.error("Profile update error:", error);
      // console.error("Error response:", error.response?.data);

      // Show detailed error message
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors?.length > 0) {
        // Show validation errors
        error.response.data.errors.forEach((err) => {
          toast.error(`${err.field}: ${err.message}`);
        });
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Update Profile
                </h2>
                <p className="text-sm text-gray-600">
                  Update your personal information
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Profile Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Profile Photo
              </label>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={loading}
                  />
                  <div className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Choose Photo</span>
                  </div>
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  JPEG, PNG or GIF (Max 5MB)
                </p>
              </div>
            </div>

            {/* Full Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>

            {/* Year Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Graduation Year
                </div>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {yearOptions.map((year) => (
                  <label
                    key={year}
                    className={`relative flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.year === year
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-gray-300 hover:border-primary hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="year"
                      value={year}
                      checked={formData.year === year}
                      onChange={handleInputChange}
                      className="sr-only"
                      disabled={loading}
                    />
                    <div className="text-center">
                      <div className="font-bold text-gray-900 text-lg">
                        {year}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Profile"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileUpdateModal;
