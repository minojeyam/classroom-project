import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "../Common/DataTable";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:5000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) return;

      const formattedUsers = data.data.users
        .filter((user: any) => user.status === "active")
        .map((user: any) => ({
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
          phoneNumber: user.phoneNumber,
          joinDate: new Date(user.enrollmentDate).toISOString().split("T")[0],
          locationName: user.locationId?.name || "N/A",
          locationId: user.locationId?._id || "",
        }));
      setUsers(formattedUsers);
    });

    fetch("http://localhost:5000/api/locations", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) return;
        setLocations(data.data.locations || []);
      })
      .catch((err) => console.error("Location fetch error:", err));
  }, [token]);

  const filteredUsers = users.filter((u) => {
    const matchLocation =
      selectedLocation === "all" || u.locationId === selectedLocation;
    const matchRole = selectedRole === "all" || u.role === selectedRole;
    return matchLocation && matchRole;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

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

      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold text-gray-800">All Users</div>
        <div className="flex gap-3 items-center text-sm text-gray-700">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="border px-3 py-2 rounded-md"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>
                {loc.name}
              </option>
            ))}
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border px-3 py-2 rounded-md"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>

          <button
            onClick={() => {
              setSelectedLocation("all");
              setSelectedRole("all");
            }}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={currentUsers}
        title="All Users"
        actions={actions}
      />

      <div className="flex justify-between items-center pt-4">
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <div className="space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal stays unchanged */}
    </div>
  );
};

export default UsersPage;
