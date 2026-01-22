import React, { useState, useEffect } from "react";
import { X, Upload, User, Calendar, Loader2, AlertCircle } from "lucide-react";
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
  const [errors, setErrors] = useState({
    fullName: "",
    year: "",
    profileImageUrl: "",
  });
  const [touched, setTouched] = useState({
    fullName: false,
    year: false,
    profileImageUrl: false,
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [yearOptions, setYearOptions] = useState([]);
  const [isValid, setIsValid] = useState(false);

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

  // Validation rules based on backend schema
  const validateField = (name, value, imageFile = null) => {
    switch (name) {
      case "fullName":
        if (!value.trim()) return "Full name is required";
        if (value.trim().length < 2)
          return "Name must be at least 2 characters";
        if (value.trim().length > 100)
          return "Name must be less than 100 characters";
        if (!/^[a-zA-Z\s.'-]+$/.test(value.trim()))
          return "Name can only contain letters, spaces, and basic punctuation";
        return "";

      case "year":
        if (!value) return "Graduation year is required";
        const currentYear = new Date().getFullYear();
        const yearNum = parseInt(value);
        if (yearNum < currentYear) return "Year cannot be in the past";
        if (yearNum > currentYear + 3)
          return "Year must be within 3 years from now";
        return "";

      case "profileImageUrl":
        // Only validate if there's a selected image
        if (imageFile) {
          if (!imageFile.type.match(/^image\/(jpeg|png|gif|jpg|webp)$/)) {
            return "Only JPEG, PNG, GIF, and WebP images are allowed";
          }
          if (imageFile.size > 5 * 1024 * 1024) {
            return "Image size must be less than 5MB";
          }
        }
        return "";

      default:
        return "";
    }
  };

  // Validate entire form
  const validateForm = () => {
    const fullNameError = validateField("fullName", formData.fullName);
    const yearError = validateField("year", formData.year);
    const imageError = validateField(
      "profileImageUrl",
      formData.profileImageUrl,
      selectedImage,
    );

    setErrors({
      fullName: fullNameError,
      year: yearError,
      profileImageUrl: imageError,
    });

    return !fullNameError && !yearError && !imageError;
  };

  // Update validation on form change
  useEffect(() => {
    setIsValid(validateForm());
  }, [formData, selectedImage]);

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

      const initialData = {
        fullName: userProfile.fullName || "",
        year: userYear,
        profileImageUrl: userProfile.profileImageUrl || "",
      };

      setFormData(initialData);

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

      // Validate initial data
      validateForm();
    }
  }, [userProfile, yearOptions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate field if it's been touched
    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }
  };

  const handleYearChange = (year) => {
    setFormData((prev) => ({
      ...prev,
      year,
    }));

    if (touched.year) {
      setErrors((prev) => ({
        ...prev,
        year: validateField("year", year),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate the blurred field
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, formData[name]),
    }));
  };

  const handleYearBlur = () => {
    setTouched((prev) => ({ ...prev, year: true }));
    setErrors((prev) => ({
      ...prev,
      year: validateField("year", formData.year),
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate image
    const imageError = validateField("profileImageUrl", "", file);
    if (imageError) {
      toast.error(imageError);
      return;
    }

    setSelectedImage(file);
    setTouched((prev) => ({ ...prev, profileImageUrl: true }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Clear any previous image error
    setErrors((prev) => ({
      ...prev,
      profileImageUrl: "",
    }));
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    setFormData((prev) => ({
      ...prev,
      profileImageUrl: "",
    }));
    setTouched((prev) => ({ ...prev, profileImageUrl: true }));
    setErrors((prev) => ({
      ...prev,
      profileImageUrl: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      fullName: true,
      year: true,
      profileImageUrl: true,
    });

    // Validate form
    if (!validateForm()) {
      const firstError = Object.values(errors).find((error) => error);
      if (firstError) {
        toast.error(firstError);
      }
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
        year: yearValue,
        profileImageUrl: formData.profileImageUrl,
        // Use existing values or defaults
        department: userProfile?.department || "Computer Science",
        university: userProfile?.university || "JU University",
      };

      // Call profile service
      const response = await profileService.updateProfile(
        updateData,
        selectedImage,
      );

      if (response.success) {
        toast.success("Profile updated successfully!");
        onProfileUpdated(response.data);
        onClose();
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors?.length > 0) {
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
          <form onSubmit={handleSubmit} noValidate className="p-6">
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
                        disabled={loading}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`w-32 h-32 rounded-full flex items-center justify-center border-4 ${
                        errors.profileImageUrl && touched.profileImageUrl
                          ? "border-red-300 bg-red-50"
                          : "border-white bg-gradient-to-br from-gray-200 to-gray-300"
                      }`}
                    >
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
                  <div
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      loading
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-primary text-white hover:bg-primary-dark cursor-pointer"
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose Photo</span>
                  </div>
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  JPEG, PNG or GIF (Max 5MB)
                </p>
                {errors.profileImageUrl && touched.profileImageUrl && (
                  <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.profileImageUrl}</span>
                  </div>
                )}
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
                onBlur={handleBlur}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors ${
                  errors.fullName && touched.fullName
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300"
                }`}
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
              {errors.fullName && touched.fullName && (
                <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.fullName}</span>
                </div>
              )}
            </div>

            {/* Year Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Graduation Year
                </div>
              </label>
              <div className="grid grid-cols-4 gap-3" onBlur={handleYearBlur}>
                {yearOptions.map((year) => (
                  <label
                    key={year}
                    className={`relative flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.year === year
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-gray-300 hover:border-primary hover:bg-gray-50"
                    } ${
                      errors.year && touched.year
                        ? "border-red-300 hover:border-red-400"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="year"
                      value={year}
                      checked={formData.year === year}
                      onChange={() => handleYearChange(year)}
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
              {errors.year && touched.year && (
                <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.year}</span>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || loading}
                className={`flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium flex items-center justify-center gap-2 ${
                  !isValid ? "opacity-50 cursor-not-allowed" : ""
                }`}
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
