import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  FileText,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import StatsCard from "./StatsCard";

const StudentDashboard: React.FC = () => {
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState("0%");
  const [feesDue, setFeesDue] = useState("$0");

  const token = JSON.parse(localStorage.getItem("user") || "{}")?.tokens
    ?.accessToken;

  // Enrolled Classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/classes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.status === "success") {
          setEnrolledCount(data.data.classes.length);
        }
      } catch (err) {
        console.error("Failed to fetch classes:", err);
      }
    };
    fetchClasses();
  }, [token]);

  // Attendance Rate
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/attendance/student-summary",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (data.status === "success") {
          setAttendanceRate(data.data.attendanceRate || "0%");
        }
      } catch (err) {
        console.error("Failed to fetch attendance:", err);
      }
    };
    fetchAttendance();
  }, [token]);

  // Fees Due
  useEffect(() => {
    const fetchFees = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/fees/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.status === "success") {
          setFeesDue(data.data.totalOutstanding || "LKR 0");
        }
      } catch (err) {
        console.error("Failed to fetch fees:", err);
      }
    };
    fetchFees();
  }, [token]);

  const stats = [
    {
      title: "Enrolled Classes",
      value: enrolledCount.toString(),
      icon: BookOpen,
      color: "teal" as const,
    },
    {
      title: "Attendance Rate",
      value: attendanceRate,
      icon: CheckCircle,
      color: "green" as const,
    },
    {
      title: "Fees Due",
      value: feesDue,
      icon: DollarSign,
      color: "red" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors duration-200">
            <Calendar className="w-8 h-8 text-teal-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">Contact Teacher</p>
          </button>
          <button className="p-4 bg-coral-50 rounded-lg hover:bg-red-100 transition-colors duration-200">
            <FileText className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-sm font-medium text-gray-900">Study Materials</p>
          </button>
          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200">
            <DollarSign className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">Pay Fees</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
