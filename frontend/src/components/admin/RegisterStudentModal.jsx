import { useState } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  GraduationCap,
  Building,
  Calendar,
  Eye,
  EyeOff,
  Upload,
  Loader2,
} from "lucide-react";
import { profileService } from "../../services/profileService";
import toast from "react-hot-toast";

export const RegisterStudentModal = ({ onClose, onSubmit }) => {
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 4;
  const minYear = currentYear;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    department: "Architecture",
    university: "Jimma University",
    year: currentYear,
    role: "STUDENT",
    profileImageUrl: "", // Store URL instead of file
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";

    if (!formData.password.trim()) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";

    // Validate year range
    if (!formData.year) newErrors.year = "Year is required";
    else if (formData.year < minYear || formData.year > maxYear) {
      newErrors.year = `Year must be between ${minYear} and ${maxYear}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = async (e) => {
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

    setSelectedImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImageFile(null);
    setImagePreview("");
    setFormData({ ...formData, profileImageUrl: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Upload image first if selected
      let profileImageUrl = formData.profileImageUrl;

      if (selectedImageFile) {
        setIsUploadingImage(true);
        try {
          const uploadResponse = await profileService.uploadProfileImage(
            selectedImageFile
          );
          if (uploadResponse.success && uploadResponse.url) {
            profileImageUrl = uploadResponse.url;
          } else {
            toast.error("Failed to upload image");
            return;
          }
        } catch (uploadError) {
          console.error("Failed to upload image:", uploadError);
          toast.error("Failed to upload image. Please try again.");
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Prepare registration data with image URL
      const registrationData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        department: formData.department,
        university: formData.university,
        year: formData.year,
        role: formData.role,
        profileImageUrl: profileImageUrl || null,
      };

      await onSubmit(registrationData);
    } catch (error) {
      console.error("Registration failed:", error);
      if (error.response?.data?.message?.includes("already registered")) {
        setErrors({ email: "Email already registered" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isSubmitDisabled = isSubmitting || isUploadingImage;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Register Student
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Create a new student account
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
              disabled={isSubmitDisabled}
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Profile Image Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-3">
                Profile Photo (Optional)
              </label>
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-xs"
                        disabled={isUploadingImage}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isUploadingImage || isSubmitting}
                  />
                  <div
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                      isUploadingImage
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                    }`}
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Choose Photo</span>
                      </>
                    )}
                  </div>
                </label>
                <p className="text-xs text-text-secondary mt-2">
                  JPEG, PNG or GIF (Max 5MB)
                </p>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </div>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  errors.email ? "border-red-300" : "border-border"
                }`}
                placeholder="student@jimma.edu.et"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password with show/hide */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password *
                </div>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pr-12 ${
                    errors.password ? "border-red-300" : "border-border"
                  }`}
                  placeholder="At least 6 characters"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </div>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  errors.fullName ? "border-red-300" : "border-border"
                }`}
                placeholder="John Doe"
                disabled={isSubmitting}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Fixed Department and University - Display only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Department
                  </div>
                </label>
                <div className="w-full px-4 py-3 border border-border rounded-lg bg-gray-50 text-text-primary">
                  Architecture
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    University
                  </div>
                </label>
                <div className="w-full px-4 py-3 border border-border rounded-lg bg-gray-50 text-text-primary">
                  Jimma University
                </div>
              </div>
            </div>

            {/* Year - Changed to actual year selection */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Admission Year *
                </div>
              </label>
              <select
                value={formData.year}
                onChange={(e) => handleChange("year", parseInt(e.target.value))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  errors.year ? "border-red-300" : "border-border"
                }`}
                disabled={isSubmitting}
              >
                {Array.from({ length: 4 }, (_, i) => {
                  const year = currentYear + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
              {errors.year && (
                <p className="mt-1 text-sm text-red-600">{errors.year}</p>
              )}
              <p className="text-xs text-text-secondary mt-2">
                Select the year the student was admitted
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitDisabled}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-70 flex items-center gap-2 transition-colors"
            >
              {isUploadingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading Image...
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Student"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
