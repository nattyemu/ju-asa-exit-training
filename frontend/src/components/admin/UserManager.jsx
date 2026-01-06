import { useState, useEffect } from "react";
import {
  UserPlus,
  Edit,
  UserCheck,
  UserX,
  Mail,
  GraduationCap,
  Building,
  Calendar,
  Shield,
  Search,
  Filter,
  Key,
} from "lucide-react";
import { format } from "date-fns";
import { adminService } from "../../services/adminService";
import { authService } from "../../services/authService"; // ADD THIS IMPORT
import { LoadingSpinner } from "../common/LoadingSpinner";
import { RegisterStudentModal } from "./RegisterStudentModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { ImageModal } from "../common/ImageModal";
import { EditUserModal } from "./EditUserModal";
import { PasswordVerificationModal } from "./PasswordVerificationModal"; // ADD THIS IMPORT
import toast from "react-hot-toast";

export const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false); // NEW
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordAction, setPasswordAction] = useState(null); // NEW: "make-admin" or "make-student"
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: null,
    alt: "",
  });

  useEffect(() => {
    loadUsers();
  }, [pagination.page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllUsers(
        pagination.page,
        pagination.limit
      );

      if (response.data && response.data.success) {
        setUsers(response.data.data.users || []);
        setPagination(
          response.data.data.pagination || {
            page: pagination.page,
            limit: pagination.limit,
            total: response.data.data.users?.length || 0,
            pages: 1,
          }
        );
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error(error.response?.data?.message || "Failed to load users");
      setUsers([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStudent = async (studentData) => {
    try {
      await adminService.registerStudent(studentData);
      toast.success("Student registered successfully");
      loadUsers();
      setShowRegisterModal(false);
    } catch (error) {
      console.error("Failed to register student:", error);
      toast.error(
        error.response?.data?.message || "Failed to register student"
      );
    }
  };

  const handleChangePassword = (user) => {
    setSelectedUser(user);
    setShowChangePasswordModal(true);
  };

  const handleUpdatePassword = async (passwordData) => {
    try {
      toast.success("Password changed successfully");
      setShowChangePasswordModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to change password:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    }
  };

  // REMOVE OLD handleUpdateRole FUNCTION

  // NEW: Handle role change with password verification
  const handleRoleChangeClick = (user, action) => {
    setSelectedUser(user);
    setPasswordAction(action);
    setShowPasswordModal(true);
  };

  const handleVerifiedRoleChange = async (adminPassword) => {
    try {
      const newRole = passwordAction === "make-admin" ? "ADMIN" : "STUDENT";

      // Prepare role data
      const roleData = {
        role: newRole,
        adminPassword: adminPassword,
      };

      // Only add department when changing to STUDENT
      if (newRole === "STUDENT") {
        roleData.department = "Architecture";
      }

      await adminService.updateUserRole(selectedUser.id, roleData);

      loadUsers();
      setShowPasswordModal(false);
      setSelectedUser(null);
      setPasswordAction(null);
    } catch (error) {
      console.error("Failed to update role:", error);

      throw error; // Re-throw to let modal handle error
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await adminService.deactivateUser(userId);
      const action = currentStatus ? "deactivated" : "activated";
      toast.success(`User ${action} successfully`);
      loadUsers();
    } catch (error) {
      console.error("Failed to toggle status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update user status"
      );
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (userData) => {
    try {
      await adminService.updateUserProfile(editingUser.id, userData);
      toast.success("User profile updated successfully");
      loadUsers();
      setShowEditModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error(
        error.response?.data?.message || "Failed to update user profile"
      );
    }
  };

  // Get profile image URL function
  const getProfileImageUrl = (imageUrl) => {
    if (!imageUrl) return null;

    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("blob:")) return imageUrl;

    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    if (!imageUrl.startsWith("/")) {
      imageUrl = "/" + imageUrl;
    }

    return backendUrl + imageUrl;
  };

  const handleImageError = (e) => {
    e.target.style.display = "none";
    const fallbackElement = e.target.nextElementSibling;
    if (fallbackElement) {
      fallbackElement.style.display = "flex";
    }
  };

  const openImageModal = (imageUrl, altText) => {
    setImageModal({
      isOpen: true,
      imageUrl: getProfileImageUrl(imageUrl),
      alt: altText,
    });
  };

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      imageUrl: null,
      alt: "",
    });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile?.fullName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.profile?.department
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesRole = !selectedRole || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    const colors = {
      ADMIN: "bg-purple-100 text-purple-800",
      STUDENT: "bg-blue-100 text-blue-800",
      INSTRUCTOR: "bg-green-100 text-green-800",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          colors[role] || "bg-gray-100 text-gray-800"
        }`}
      >
        <Shield className="w-3 h-3" />
        {role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-text-secondary">Loading users...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Image Modal Component */}
      <ImageModal
        isOpen={imageModal.isOpen}
        imageUrl={imageModal.imageUrl}
        alt={imageModal.alt}
        onClose={closeImageModal}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            User Management
          </h2>
          <p className="text-sm text-text-secondary">
            Manage students, admins, and user accounts
          </p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Register Student
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Users</p>
              <p className="text-2xl font-bold text-text-primary">
                {pagination.total}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Students</p>
              <p className="text-2xl font-bold text-text-primary">
                {users.filter((u) => u.role === "STUDENT").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Admins</p>
              <p className="text-2xl font-bold text-text-primary">
                {users.filter((u) => u.role === "ADMIN").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="w-4 h-4 text-text-secondary" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users by name, email, or department..."
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="STUDENT">Student</option>
            </select>

            <button
              className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors text-sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedRole("");
              }}
            >
              <Filter className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">
                  User
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">
                  Role
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">
                  Department
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">
                  University
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">
                  Year
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">
                  Joined
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border hover:bg-gray-50"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 cursor-pointer hover:scale-105 transition-transform duration-200"
                          onClick={() => {
                            if (user.profile?.profileImageUrl) {
                              openImageModal(
                                user.profile.profileImageUrl,
                                user.profile?.fullName || user.email
                              );
                            }
                          }}
                        >
                          {user.profile?.profileImageUrl ? (
                            <>
                              <img
                                src={getProfileImageUrl(
                                  user.profile.profileImageUrl
                                )}
                                alt={user.profile.fullName}
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                              />
                              <div className="hidden w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full items-center justify-center text-white font-bold">
                                {user.profile?.fullName?.charAt(0) || "U"}
                              </div>
                            </>
                          ) : (
                            <div
                              className="w-full h-full bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-bold cursor-pointer"
                              onClick={() =>
                                openImageModal(
                                  null,
                                  user.profile?.fullName || user.email
                                )
                              }
                            >
                              {user.profile?.fullName?.charAt(0) ||
                                user.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">
                          {user.profile?.fullName || "No Name"}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-text-secondary">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">{getRoleBadge(user.role)}</td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-text-primary">
                      {user.profile?.department || "Not specified"}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-text-primary">
                      {user.profile?.university || "Not specified"}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-text-primary">
                      {user.profile?.year || "Not specified"}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <UserCheck className="w-3 h-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX className="w-3 h-3" />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1 text-sm text-text-secondary">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditUser(user)}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>

                      {/* Change Password Button */}
                      <button
                        onClick={() => handleChangePassword(user)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                      >
                        <Key className="w-3 h-3" />
                        Password
                      </button>

                      {/* Make Admin Button (only for non-admins) */}
                      {user.role !== "ADMIN" ? (
                        <button
                          onClick={() =>
                            handleRoleChangeClick(user, "make-admin")
                          }
                          className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
                        >
                          Make Admin
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleRoleChangeClick(user, "make-student")
                          }
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                        >
                          Make Student
                        </button>
                      )}

                      {/* Activate/Deactivate Button */}
                      <button
                        onClick={() =>
                          handleToggleStatus(user.id, user.isActive)
                        }
                        className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                          user.isActive
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <UserX className="w-3 h-3" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3" />
                            Activate
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">
              No users found
            </h3>
            <p className="text-text-secondary">
              {searchTerm || selectedRole
                ? "Try adjusting your filters"
                : "Register students to get started"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-secondary">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} users
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Register Modal */}
      {showRegisterModal && (
        <RegisterStudentModal
          onClose={() => setShowRegisterModal(false)}
          onSubmit={handleRegisterStudent}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          onSubmit={handleUpdateUser}
        />
      )}

      {/* Password Verification Modal */}
      {showPasswordModal && selectedUser && passwordAction && (
        <PasswordVerificationModal
          user={selectedUser}
          action={passwordAction}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
            setPasswordAction(null);
          }}
          onVerified={handleVerifiedRoleChange}
        />
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && selectedUser && (
        <ChangePasswordModal
          user={selectedUser}
          onClose={() => {
            setShowChangePasswordModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleUpdatePassword}
        />
      )}
    </div>
  );
};
