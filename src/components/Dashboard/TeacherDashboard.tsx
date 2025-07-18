import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  BookOpen,
  Calendar,
  CheckCircle,
  AlertCircle,
  DollarSign,
  FileText,
} from "lucide-react";
import StatsCard from "./StatsCard";

const TeacherDashboard: React.FC = () => {
  const [stats, setStats] = useState([
    { title: "My Classes", value: "0", icon: BookOpen, color: "teal" },
    { title: "Total Students", value: "0", icon: Users, color: "coral" },
    { title: "Today's Classes", value: "0", icon: Calendar, color: "green" },
    {
      title: "Attendance Rate",
      value: "N/A",
      icon: CheckCircle,
      color: "blue",
    },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user") || "{}")?.tokens
          ?.accessToken;
        if (!token) return;

        // Fetch teacher's classes
        const classesRes = await axios.get(
          "http://localhost:5000/api/classes",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const classes = classesRes.data.data.classes || [];
        const today = new Date().getDay();

        const myClassCount = classes.length;
        const totalStudents = classes.reduce(
          (sum, cls) => sum + (cls.currentEnrollment || 0),
          0
        );
        const todaysClasses = classes.filter(
          (cls) => cls.schedule?.dayOfWeek === today
        ).length;

        // Fetch attendance rate
        const attendanceRes = await axios.get(
          "http://localhost:5000/api/attendance/teacher/overview",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const attendanceRate = attendanceRes.data.data.attendanceRate ?? "N/A";

        // Update stats state
        setStats([
          {
            title: "My Classes",
            value: `${myClassCount}`,
            icon: BookOpen,
            color: "teal",
          },
          {
            title: "Total Students",
            value: `${totalStudents}`,
            icon: Users,
            color: "coral",
          },
          {
            title: "Today's Classes",
            value: `${todaysClasses}`,
            icon: Calendar,
            color: "green",
          },
          {
            title: "Attendance Rate",
            value: `${attendanceRate}%`,
            icon: CheckCircle,
            color: "blue",
          },
        ]);
      } catch (err) {
        console.error("Error fetching teacher dashboard stats:", err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors duration-200">
            <CheckCircle className="w-8 h-8 text-teal-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">Mark Attendance</p>
          </button>
          <button className="p-4 bg-coral-50 rounded-lg hover:bg-red-100 transition-colors duration-200">
            <FileText className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-sm font-medium text-gray-900">Upload Material</p>
          </button>
          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200">
            <DollarSign className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">Record Payment</p>
          </button>
          <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200">
            <AlertCircle className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">Send Notice</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
