import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye, UserCheck, UserX } from "lucide-react";
import DataTable from "../Common/DataTable";
import Modal from "../Common/Modal";

const UsersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:5000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) return;

        const formattedUsers = data.data.users.map((user: any) => ({
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
          phoneNumber: user.phoneNumber,
          joinDate: new Date(user.enrollmentDate).toISOString().split("T")[0],
          locationName: user.locationId?.name || "N/A",
        }));
        setUsers(formattedUsers);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, [token]);

  const approveUser = async (userId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/users/${userId}/approve`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: "active" } : u))
        );
      }
    } catch (error) {
      console.error("Approve failed", error);
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/users/${userId}/reject`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (error) {
      console.error("Reject failed", error);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const columns = [
    {
      key: "firstName",
      label: "Name",
      sortable: true,
      render: (_: any, row: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {row.firstName.charAt(0)}
              {row.lastName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "admin"
              ? "bg-purple-100 text-purple-800"
              : value === "teacher"
              ? "bg-blue-100 text-blue-800"
              : value === "student"
              ? "bg-green-100 text-green-800"
              : "bg-orange-100 text-orange-800"
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "active"
              ? "bg-green-100 text-green-800"
              : value === "inactive"
              ? "bg-gray-100 text-gray-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    { key: "phoneNumber", label: "Phone", sortable: true },
    { key: "locationName", label: "Location", sortable: true },
    { key: "joinDate", label: "Join Date", sortable: true },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: any) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedUser(row);
              setIsModalOpen(true);
            }}
            className="text-teal-600 hover:text-teal-800"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            className="text-blue-600 hover:text-blue-800"
            onClick={() => {
              if (window.confirm("Edit this user?")) {
                // Edit logic here
              }
            }}
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            className="text-red-600 hover:text-red-800"
            onClick={() => {
              if (window.confirm("Delete this user?")) {
                deleteUser(row.id);
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {row.status === "pending" && (
            <>
              <button
                className="text-green-600 hover:text-green-800"
                onClick={() => {
                  if (window.confirm("Approve this user?")) {
                    approveUser(row.id);
                  }
                }}
              >
                <UserCheck className="w-4 h-4" />
              </button>
              <button
                className="text-red-600 hover:text-red-800"
                onClick={() => {
                  if (window.confirm("Reject this user?")) {
                    rejectUser(row.id);
                  }
                }}
              >
                <UserX className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const actions = (
    <button className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors duration-200 flex items-center space-x-2">
      <Plus className="w-4 h-4" />
      <span>Add User</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">
            Manage teachers, students, and parents
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Total Users: </span>
            <span className="font-semibold text-gray-900">{users.length}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Pending Approval: </span>
            <span className="font-semibold text-orange-600">
              {users.filter((u) => u.status === "pending").length}
            </span>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        title="All Users"
        actions={actions}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="User Details"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-medium">
                  {selectedUser.firstName.charAt(0)}
                  {selectedUser.lastName.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <p className="text-gray-600">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <p className="text-sm text-gray-900">{selectedUser.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <p className="text-sm text-gray-900">{selectedUser.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <p className="text-sm text-gray-900">
                  {selectedUser.phoneNumber}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <p className="text-sm text-gray-900">
                  {selectedUser.locationName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Join Date
                </label>
                <p className="text-sm text-gray-900">{selectedUser.joinDate}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 pt-4">
              <button className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
                Edit User
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                Delete User
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UsersPage;
