import { useState, useEffect } from "react";
import { X, User, Mail, GraduationCap, Building, Calendar } from "lucide-react";

export const EditStudentModal = ({ user, onClose, onSubmit }) => {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    fullName: "",
    department: "",
    university: "",
    year: currentYear, // Changed to current year as default
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      // Convert academic year (1-6) to admission year for display
      // If user has year 1-6, calculate admission year
      let admissionYear = currentYear;
      if (
        user.profile?.year &&
        user.profile.year >= 1 &&
        user.profile.year <= 6
      ) {
        // Assuming year 1 means admitted this year or recent years
        // This is a simplification - adjust based on your logic
        admissionYear = currentYear - (user.profile.year - 1);
      } else if (user.profile?.year) {
        // If it's already an admission year, use it
        admissionYear = user.profile.year;
      }

      setFormData({
        fullName: user.profile?.fullName || "",
        department: user.profile?.department || "",
        university: user.profile?.university || "",
        year: admissionYear,
      });
    }
  }, [user, currentYear]);

  const validateForm = () => {
    const newErrors = {};

    // Allow empty strings but validate if provided
    if (formData.fullName !== undefined && formData.fullName.trim() === "") {
      newErrors.fullName = "Full name cannot be empty if provided";
    }

    if (
      formData.department !== undefined &&
      formData.department.trim() === ""
    ) {
      newErrors.department = "Department cannot be empty if provided";
    }

    if (
      formData.university !== undefined &&
      formData.university.trim() === ""
    ) {
      newErrors.university = "University cannot be empty if provided";
    }

    // Validate year if provided (admission year from current to +4 years)
    if (formData.year !== undefined) {
      if (isNaN(formData.year)) {
        newErrors.year = "Year must be a valid number";
      } else if (
        formData.year < currentYear ||
        formData.year > currentYear + 4
      ) {
        newErrors.year = `Admission year must be between ${currentYear} and ${
          currentYear + 4
        }`;
      }
    }

    // Check that at least one field is provided (as per backend schema)
    const hasValidData = Object.keys(formData).some((key) => {
      const value = formData[key];
      if (key === "userId") return false; // Skip userId
      if (typeof value === "string") {
        return value !== undefined && value.trim() !== "";
      }
      return value !== undefined;
    });

    if (!hasValidData) {
      newErrors.general =
        "At least one non-empty field must be provided for update";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Convert admission year back to academic year (1-6) for backend
      const submissionData = {
        userId: user.id,
        ...Object.fromEntries(
          Object.entries(formData).filter(([key, value]) => {
            // Only include fields that have values
            if (key === "userId") return true;
            if (typeof value === "string") {
              return value !== undefined && value.trim() !== "";
            }
            return value !== undefined;
          })
        ),
      };

      // Convert admission year to academic year (1-6)
      if (submissionData.year !== undefined) {
        // Calculate academic year: currentYear - admissionYear + 1
        const academicYear = currentYear - submissionData.year + 1;
        // Ensure it's between 1 and 6
        submissionData.year = Math.max(1, Math.min(6, academicYear));
      }

      await onSubmit(submissionData);
    } catch (error) {
      // console.error("Failed to update user:", error);
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
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
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Edit Student
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Edit student information
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Email: {user?.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="space-y-4">
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
              <p className="text-xs text-text-secondary mt-2">
                Email cannot be changed
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </div>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  errors.fullName ? "border-red-300" : "border-border"
                }`}
                placeholder="Leave empty to keep current"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
              <p className="text-xs text-text-secondary mt-1">
                Leave empty to keep current value
              </p>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Department
                </div>
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleChange("department", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  errors.department ? "border-red-300" : "border-border"
                }`}
                placeholder="Leave empty to keep current"
              />
              {errors.department && (
                <p className="mt-1 text-sm text-red-600">{errors.department}</p>
              )}
            </div>

            {/* University */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  University
                </div>
              </label>
              <input
                type="text"
                value={formData.university}
                onChange={(e) => handleChange("university", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  errors.university ? "border-red-300" : "border-border"
                }`}
                placeholder="Leave empty to keep current"
              />
              {errors.university && (
                <p className="mt-1 text-sm text-red-600">{errors.university}</p>
              )}
            </div>

            {/* Year - Changed to Admission Year (same as Register modal) */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Admission Year
                </div>
              </label>
              <select
                value={formData.year}
                onChange={(e) => handleChange("year", parseInt(e.target.value))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  errors.year ? "border-red-300" : "border-border"
                }`}
              >
                {Array.from({ length: 5 }, (_, i) => {
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
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-70 flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? "Updating..." : "Update Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
