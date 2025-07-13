import React, { useEffect, useState } from "react";
import {
  Users,
  MapPin,
  BookOpen,
  DollarSign,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Calendar,
} from "lucide-react";
import StatsCard from "./StatsCard";

// Type definitions
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  locationId?: {
    _id: string;
    name: string;
  };
}

interface Location {
  _id: string;
  name: string;
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: "teal" | "orange" | "green" | "purple" | "blue";
  trend: {
    value: number;
    isPositive: boolean;
  };
}

const AdminDashboard: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const token = localStorage.getItem("token");

  const stats: StatsCardProps[] = [
    {
      title: "Total Students",
      value: "1,247",
      icon: Users,
      color: "teal",
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Total Teachers",
      value: "89",
      icon: UserCheck,
      color: "orange",
      trend: { value: 5, isPositive: true },
    },
    {
      title: "Total Classes",
      value: "156",
      icon: BookOpen,
      color: "green",
      trend: { value: 8, isPositive: true },
    },
    {
      title: "Locations",
      value: "12",
      icon: MapPin,
      color: "purple",
      trend: { value: 2, isPositive: true },
    },
    {
      title: "Monthly Revenue",
      value: "$48,250",
      icon: DollarSign,
      color: "blue",
      trend: { value: 15, isPositive: true },
    },
    {
      title: "Attendance Rate",
      value: "94.2%",
      icon: TrendingUp,
      color: "green",
      trend: { value: 2, isPositive: true },
    },
    {
      title: "Pending Approvals",
      value: pendingUsers.length.toString(),
      icon: AlertCircle,
      color: "orange",
      trend: { value: -10, isPositive: false },
    },
    {
      title: "Overdue Payments",
      value: "$12,450",
      icon: Calendar,
      color: "orange",
      trend: { value: -5, isPositive: false },
    },
  ];

  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/pending", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setPendingUsers(data.data?.pendingUsers || []);
      })
      .catch((err) => console.error("❌ Pending fetch error:", err));

    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => setLocations(data.data.locations));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let url = "/api/users?status=active";
    if (selectedLocation) url += `&location=${selectedLocation}`;
    if (selectedRole) url += `&role=${selectedRole}`;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setActiveUsers(data.data?.users || []);
      })
      .catch((err) => console.error("❌ Active users fetch error:", err));
  }, [selectedLocation, selectedRole, token]);

  const handleApprove = async (id: string) => {
    await fetch(`/api/users/${id}/approve`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setPendingUsers((prev) => prev.filter((user) => user._id !== id));
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/users/${id}/reject`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setPendingUsers((prev) => prev.filter((user) => user._id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pending Approvals ({pendingUsers.length})
        </h3>
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div
              key={user._id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {user.email} - {user.role}
                </p>
                {user.locationId?.name && (
                  <p className="text-xs text-gray-500">
                    Location: {user.locationId.name}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded"
                  onClick={() => handleApprove(user._id)}
                >
                  Approve
                </button>
                <button
                  className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded"
                  onClick={() => handleReject(user._id)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Active Users by Location & Role
          </h3>
          <div className="flex gap-4">
            <select
              className="border rounded px-2 py-1"
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
              className="border rounded px-2 py-1"
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeUsers.map((user) => (
            <div key={user._id} className="p-4 border rounded-lg bg-gray-50">
              <p className="text-sm font-semibold text-gray-800">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500">
                {user.email} - {user.role}
              </p>
              {user.locationId?.name && (
                <p className="text-xs text-gray-500">
                  Location: {user.locationId.name}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
