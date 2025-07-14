import React, { useState, useEffect } from "react";
import { UserCheck, UserX, User } from "lucide-react";
import DataTable from "../Common/DataTable";

const PendingApprovalsPage: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showRejected, setShowRejected] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocation, selectedRole, usersPerPage, showRejected]);

  useEffect(() => {
    fetchUsers();
  }, [selectedLocation, selectedRole, currentPage, usersPerPage, showRejected]);

  const fetchLocations = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/locations");
      const data = await res.json();
      if (data.status === "success") {
        setLocations(data.data.locations);
      }
    } catch (error) {
      console.error("Failed to fetch locations");
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const queryParams = new URLSearchParams({
        status: showRejected ? "rejected" : "pending",
        ...(selectedLocation && { location: selectedLocation }),
        ...(selectedRole && { role: selectedRole }),
        page: currentPage.toString(),
        limit: usersPerPage.toString(),
      });

      const res = await fetch(
        `http://localhost:5000/api/users?${queryParams}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (data.status === "success") {
        setPendingUsers(data.data.users);
        setTotalPages(data.data.pagination.totalPages);
        setSelectedUsers([]);
      } else {
        throw new Error(data.message || "Failed to fetch users");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `http://localhost:5000/api/users/${userId}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (data.status === "success") {
        setPendingUsers((prev) => prev.filter((user) => user._id !== userId));
        alert("User approved successfully");
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to approve user");
    }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt("Enter rejection reason (optional):") || "";
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `http://localhost:5000/api/users/${userId}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );

      const data = await res.json();
      if (data.status === "success") {
        setPendingUsers((prev) => prev.filter((user) => user._id !== userId));
        alert("User rejected successfully");
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reject user");
    }
  };

  const handleBulkApprove = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      await Promise.all(
        selectedUsers.map((userId) =>
          fetch(`http://localhost:5000/api/users/${userId}/approve`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setPendingUsers((prev) =>
        prev.filter((user) => !selectedUsers.includes(user._id))
      );
      setSelectedUsers([]);
      alert("Selected users approved successfully");
    } catch (err: any) {
      setError("Bulk approval failed.");
    }
  };

  const columns = [
    {
      key: "select",
      label: "",
      render: (_: any, row: any) =>
        !showRejected && (
          <input
            type="checkbox"
            checked={selectedUsers.includes(row._id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedUsers([...selectedUsers, row._id]);
              } else {
                setSelectedUsers(selectedUsers.filter((id) => id !== row._id));
              }
            }}
          />
        ),
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (_: string, row: any) => (
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
            value === "teacher"
              ? "bg-blue-100 text-blue-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    { key: "phoneNumber", label: "Phone", sortable: true },
    {
      key: "locationId.name",
      label: "Location",
      sortable: true,
      render: (_: any, row: any) => row.locationId?.name || "-",
    },
    {
      key: "parentEmail",
      label: "Parent Email",
      sortable: true,
      render: (value: string) => value || "-",
    },
    {
      key: "createdAt",
      label: showRejected ? "Rejected On" : "Requested On",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    ...(showRejected
      ? [
          {
            key: "rejectionReason",
            label: "Rejection Reason",
            render: (_: any, row: any) =>
              row.rejectionReason || "No reason provided",
          },
          {
            key: "rejectedBy",
            label: "Rejected By",
            render: (_: any, row: any) =>
              row.rejectedBy?.firstName && row.rejectedBy?.lastName
                ? `${row.rejectedBy.firstName} ${row.rejectedBy.lastName}`
                : "Unknown",
          },
        ]
      : []),
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: any) =>
        showRejected ? (
          <div className="flex items-center">
            <button
              onClick={() => handleApprove(row._id)}
              className="p-1 bg-blue-50 rounded-md hover:bg-blue-100 text-blue-600 transition-colors duration-200"
              title="Re-approve"
            >
              <UserCheck className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleApprove(row._id)}
              className="p-1 bg-green-50 rounded-md hover:bg-green-100 text-green-600 transition-colors duration-200"
              title="Approve"
            >
              <UserCheck className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleReject(row._id)}
              className="p-1 bg-red-50 rounded-md hover:bg-red-100 text-red-600 transition-colors duration-200"
              title="Reject"
            >
              <UserX className="w-5 h-5" />
            </button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {showRejected ? "Rejected Users" : "Pending Approvals"}
          </h2>
          <p className="text-gray-600 mt-1">
            {showRejected
              ? "View users who were rejected"
              : "Review and approve new user registrations"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>
                {loc.name}
              </option>
            ))}
          </select>

          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
          </select>

          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={usersPerPage}
            onChange={(e) => {
              setUsersPerPage(parseInt(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>Show 10</option>
            <option value={20}>Show 20</option>
            <option value={50}>Show 50</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showRejected}
              onChange={() => {
                setShowRejected(!showRejected);
                setSelectedUsers([]);
                setCurrentPage(1);
              }}
            />
            Show Rejected
          </label>

          <button
            onClick={() => {
              setSelectedLocation("");
              setSelectedRole("");
              setCurrentPage(1);
              setUsersPerPage(20);
              setShowRejected(false);
            }}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            Clear Filters
          </button>

          {!showRejected && selectedUsers.length > 0 && (
            <button
              onClick={handleBulkApprove}
              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              Approve Selected ({selectedUsers.length})
            </button>
          )}

          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">
              {showRejected ? "Rejected Users:" : "Pending Users:"}
            </span>
            <span className="font-semibold text-gray-900">
              {pendingUsers.length}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center h-64">
          <User className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            No {showRejected ? "Rejected" : "Pending"} Users
          </h3>
          <p className="text-gray-500 mt-1">
            All user registrations have been processed
          </p>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={pendingUsers}
            title={
              showRejected ? "Rejected Users" : "Pending User Registrations"
            }
          />

          {totalPages > 1 && (
            <div className="flex justify-end mt-4 px-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PendingApprovalsPage;
