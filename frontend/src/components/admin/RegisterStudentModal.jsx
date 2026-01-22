import { useState, useEffect } from "react";
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
  Trash2,
  AlertCircle,
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
    department: "Architecture", // Fixed for students
    university: "Jimma University", // Fixed
    year: currentYear,
    role: "STUDENT", // Always student
    profileImageUrl: "", // Store URL instead of file
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validation based on backend schemas
  const validateField = (name, value) => {
    switch (name) {
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Invalid email format";
        return "";

      case "password":
        if (!value.trim()) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return "";

      case "fullName":
        if (!value.trim()) return "Full name is required";
        if (value.length < 2) return "Full name must be at least 2 characters";
        if (value.length > 255) return "Full name cannot exceed 255 characters";
        return "";

      case "year":
        if (!value) return "Year is required";
        if (value < minYear || value > maxYear) {
          return `Year must be between ${minYear} and ${maxYear}`;
        }
        return "";

      case "department":
        if (!value.trim()) return "Department is required";
        if (value.length < 2) return "Department must be at least 2 characters";
        if (value.length > 255)
          return "Department cannot exceed 255 characters";
        return "";

      case "university":
        if (!value.trim()) return "University is required";
        if (value.length < 2) return "University must be at least 2 characters";
        if (value.length > 255)
          return "University cannot exceed 255 characters";
        return "";

      default:
        return "";
    }
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};

    // Validate all required fields
    Object.keys(formData).forEach((field) => {
      if (field !== "profileImageUrl" && field !== "role") {
        // Skip optional fields
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update validation on form change
  useEffect(() => {
    const formIsValid = validateForm();
    setIsValid(formIsValid);
  }, [formData]);

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

    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach((field) => {
      if (field !== "profileImageUrl" && field !== "role") {
        allTouched[field] = true;
      }
    });
    setTouched(allTouched);

    if (!validateForm()) {
      const firstError = Object.values(errors).find((error) => error);
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload image first if selected
      let profileImageUrl = formData.profileImageUrl;

      if (selectedImageFile) {
        setIsUploadingImage(true);
        try {
          const uploadResponse =
            await profileService.uploadProfileImage(selectedImageFile);
          if (uploadResponse.success && uploadResponse.url) {
            profileImageUrl = uploadResponse.url;
          } else {
            toast.error("Failed to upload image");
            return;
          }
        } catch (uploadError) {
          toast.error("Failed to upload image. Please try again.");
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Prepare registration data with fixed values
      const registrationData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        department: "Architecture", // Always Architecture for students
        university: "Jimma University", // Always Jimma University
        year: formData.year,
        role: "STUDENT", // Always student for registration
        profileImageUrl: profileImageUrl || null,
      };

      await onSubmit(registrationData);
    } catch (error) {
      if (error.response?.data?.message?.includes("already registered")) {
        setErrors({ email: "Email already registered" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate field if it's been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validate the blurred field
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isSubmitDisabled = !isValid || isSubmitting || isUploadingImage;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-md my-auto">
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-white border-b border-border p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-text-primary">
                Register Student
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Create a new student account
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
              type="button"
              disabled={isSubmitting || isUploadingImage}
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto thin-scrollbar">
          <form onSubmit={handleSubmit} noValidate className="p-6">
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
                          <Trash2 className="w-3 h-3" />
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
                        isUploadingImage || isSubmitting
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
                  onBlur={() => handleBlur("email")}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                    errors.email && touched.email
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-border"
                  }`}
                  placeholder="student@jimma.edu.et"
                  disabled={isSubmitting}
                />
                {errors.email && touched.email && (
                  <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.email}</span>
                  </div>
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
                    onBlur={() => handleBlur("password")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pr-12 ${
                      errors.password && touched.password
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-border"
                    }`}
                    placeholder="At least 6 characters"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.password}</span>
                  </div>
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
                  onBlur={() => handleBlur("fullName")}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                    errors.fullName && touched.fullName
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-border"
                  }`}
                  placeholder="John Doe"
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-text-secondary">
                  {formData.fullName.length}/255 characters
                </p>
                {errors.fullName && touched.fullName && (
                  <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.fullName}</span>
                  </div>
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
                  onChange={(e) =>
                    handleChange("year", parseInt(e.target.value))
                  }
                  onBlur={() => handleBlur("year")}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                    errors.year && touched.year
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-border"
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
                {errors.year && touched.year && (
                  <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.year}</span>
                  </div>
                )}
                <p className="text-xs text-text-secondary mt-2">
                  Select the year the student was admitted
                </p>
              </div>
            </div>

            {/* Footer - Sticky */}
            <div className="sticky bottom-0 bg-white pt-6 border-t border-border mt-6 -mx-6 px-6 pb-6">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || isUploadingImage}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className={`px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center gap-2 transition-colors ${
                    isSubmitDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
