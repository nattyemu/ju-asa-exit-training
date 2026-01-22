import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  GraduationCap,
  Building,
  Calendar,
  Upload,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export const EditUserModal = ({ user, onClose, onSubmit }) => {
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 4;
  const minYear = currentYear;

  const [formData, setFormData] = useState({
    fullName: "",
    department: "",
    university: "Jimma University",
    year: currentYear,
    profileImageUrl: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  // Validation based on backend updateProfileSchema
  const validateField = (name, value) => {
    switch (name) {
      case "fullName":
        if (value === "" || value === null || value === undefined) {
          return "Full name is required for update";
        }
        if (value.length < 2) return "Full name must be at least 2 characters";
        if (value.length > 255) return "Full name cannot exceed 255 characters";
        return "";

      case "department":
        if (value === "" || value === null || value === undefined) {
          return ""; // Empty is allowed for edit mode (optional field)
        }
        if (value.length < 2) return "Department must be at least 2 characters";
        if (value.length > 255)
          return "Department cannot exceed 255 characters";
        return "";

      case "university":
        if (value === "" || value === null || value === undefined) {
          return ""; // Empty is allowed for edit mode (optional field)
        }
        if (value.length < 2) return "University must be at least 2 characters";
        if (value.length > 255)
          return "University cannot exceed 255 characters";
        return "";

      case "year":
        if (value === "" || value === null || value === undefined) {
          return ""; // Empty is allowed for edit mode (optional field)
        }
        if (value < currentYear) return `Year must be at least ${currentYear}`;
        if (value > currentYear + 10)
          return `Year cannot exceed ${currentYear + 10}`;
        return "";

      default:
        return "";
    }
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};

    // Validate only fields that have values (update schema allows optional fields)
    Object.keys(formData).forEach((field) => {
      if (field !== "profileImageUrl") {
        // Skip profileImageUrl for validation
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
        }
      }
    });

    // Check if at least one non-empty field is provided (updateProfileSchema requirement)
    const hasValidData = Object.keys(formData).some((key) => {
      if (key === "profileImageUrl") return false; // Skip profileImageUrl check
      const value = formData[key];
      if (typeof value === "string") {
        return value !== undefined && value !== null && value.trim() !== "";
      }
      return value !== undefined && value !== null;
    });

    if (!hasValidData && Object.keys(newErrors).length === 0) {
      newErrors.form = "At least one field must be provided for update";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form has changes
  const checkForChanges = () => {
    if (!originalData) return false;

    const changedFields = Object.keys(formData).filter((field) => {
      const currentValue = formData[field];
      const originalValue = originalData[field];

      // Special handling for profileImageUrl (file vs URL)
      if (field === "profileImageUrl") {
        const currentIsEmpty = !currentValue || currentValue === "";
        const originalIsEmpty = !originalValue || originalValue === "";

        if (currentIsEmpty && originalIsEmpty) return false;
        if (selectedImageFile) return true; // New file selected

        return currentValue !== originalValue;
      }

      // Default comparison for other fields
      return currentValue !== originalValue;
    });

    return changedFields.length > 0;
  };

  // Update validation and change detection on form change
  useEffect(() => {
    const formIsValid = validateForm();
    const changesExist = checkForChanges();
    setIsValid(formIsValid);
    setHasChanges(changesExist);
  }, [formData, selectedImageFile]);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      const initialData = {
        fullName: user.profile?.fullName || "",
        department: user.profile?.department || "Architecture",
        university: user.profile?.university || "Jimma University",
        year: user.profile?.year || currentYear,
        profileImageUrl: user.profile?.profileImageUrl || "",
      };

      setOriginalData(initialData);
      setFormData(initialData);

      // Initialize touched state for all fields
      const initialTouched = {};
      Object.keys(initialData).forEach((field) => {
        initialTouched[field] = false;
      });
      setTouched(initialTouched);

      if (user.profile?.profileImageUrl) {
        const backendUrl =
          import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const imageUrl = user.profile.profileImageUrl.startsWith("http")
          ? user.profile.profileImageUrl
          : backendUrl +
            (user.profile.profileImageUrl.startsWith("/") ? "" : "/") +
            user.profile.profileImageUrl;
        setImagePreview(imageUrl);
      }
    }
  }, [user]);

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
    setFormData((prev) => ({ ...prev, profileImageUrl: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach((field) => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) {
      const firstError = Object.values(errors).find(
        (error) =>
          error && error !== "At least one field must be provided for update",
      );
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    // Check if there are actual changes
    if (!hasChanges) {
      toast.success("No changes detected. User profile is up to date.");
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine department based on role
      const finalDepartment =
        user.role === "ADMIN" ? "Administrator" : "Architecture";

      // Create update object with only changed fields
      const updateData = {};
      Object.keys(formData).forEach((field) => {
        if (formData[field] !== originalData[field]) {
          updateData[field] = formData[field];
        }
      });

      // Add department override
      updateData.department = finalDepartment;

      // Only submit if there are changes
      if (Object.keys(updateData).length > 1 || selectedImageFile) {
        // More than just department
        await onSubmit(updateData);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user");
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

  // Disable submit button when form is invalid or submitting/uploading
  const isSubmitDisabled = !isValid || isSubmitting || isUploadingImage;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-md my-auto">
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-white border-b border-border p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-text-primary truncate">
                Edit User Profile
              </h2>
              <p className="text-sm text-text-secondary mt-1 truncate">
                {user?.email}
              </p>
              <div
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                  user?.role === "ADMIN"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {user?.role}
              </div>
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

        {/* Form Content */}
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
                          <span>Change Photo</span>
                        </>
                      )}
                    </div>
                  </label>
                  <p className="text-xs text-text-secondary mt-2">
                    JPEG, PNG or GIF (Max 5MB)
                  </p>
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </div>
                </label>
                <div className="w-full px-4 py-3 border border-border rounded-lg bg-gray-50 text-text-primary">
                  {user?.email}
                </div>
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
                  {formData.fullName.length}/255 characters (required)
                </p>
                {errors.fullName && touched.fullName && (
                  <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.fullName}</span>
                  </div>
                )}
              </div>

              {/* Department (Read-only, based on role) */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Department
                  </div>
                </label>
                <div className="w-full px-4 py-3 border border-border rounded-lg bg-gray-50 text-text-primary">
                  {user?.role === "ADMIN" ? "Administrator" : "Architecture"}
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  Department is automatically set based on user role
                </p>
              </div>

              {/* University (Fixed) */}
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

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Admission Year
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
                  Select the year the student was admitted (optional)
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
                      Updating...
                    </>
                  ) : (
                    "Update Profile"
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
