import React from "react";
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

const AdminDashboard: React.FC = () => {
  const stats = [
    {
      title: "Total Students",
      value: "1,247",
      icon: Users,
      color: "teal" as const,
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Total Teachers",
      value: "89",
      icon: UserCheck,
      color: "coral" as const,
      trend: { value: 5, isPositive: true },
    },
    {
      title: "Total Classes",
      value: "156",
      icon: BookOpen,
      color: "green" as const,
      trend: { value: 8, isPositive: true },
    },
    {
      title: "Locations",
      value: "12",
      icon: MapPin,
      color: "purple" as const,
      trend: { value: 2, isPositive: true },
    },
    {
      title: "Monthly Revenue",
      value: "$48,250",
      icon: DollarSign,
      color: "blue" as const,
      trend: { value: 15, isPositive: true },
    },
    {
      title: "Attendance Rate",
      value: "94.2%",
      icon: TrendingUp,
      color: "green" as const,
      trend: { value: 2, isPositive: true },
    },
    {
      title: "Pending Approvals",
      value: "23",
      icon: AlertCircle,
      color: "orange" as const,
      trend: { value: -10, isPositive: false },
    },
    {
      title: "Overdue Payments",
      value: "$12,450",
      icon: Calendar,
      color: "coral" as const,
      trend: { value: -5, isPositive: false },
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "approval",
      message: "New teacher registration pending approval",
      time: "5 min ago",
    },
    {
      id: 2,
      type: "payment",
      message: "Payment received from John Doe",
      time: "10 min ago",
    },
    {
      id: 3,
      type: "class",
      message: 'New class "Advanced Mathematics" created',
      time: "20 min ago",
    },
    {
      id: 4,
      type: "location",
      message: "Downtown location capacity updated",
      time: "35 min ago",
    },
    {
      id: 5,
      type: "attendance",
      message: "Attendance marked for Class 7A",
      time: "1 hour ago",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activities
            </h3>
            <button className="text-teal-600 hover:text-teal-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Upcoming Events
            </h3>
            <button className="text-teal-600 hover:text-teal-700 text-sm font-medium">
              View Calendar
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-teal-50 rounded-lg">
              <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Parent-Teacher Meeting
                </p>
                <p className="text-xs text-gray-500">Tomorrow at 2:00 PM</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Mid-term Exams
                </p>
                <p className="text-xs text-gray-500">Starting March 15</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  New Student Orientation
                </p>
                <p className="text-xs text-gray-500">March 20</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors duration-200">
            <Users className="w-8 h-8 text-teal-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">Add New User</p>
          </button>
          <button className="p-4 bg-coral-50 rounded-lg hover:bg-red-100 transition-colors duration-200">
            <BookOpen className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-sm font-medium text-gray-900">Create Class</p>
          </button>
          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200">
            <MapPin className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">Add Location</p>
          </button>
          <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200">
            <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">View Reports</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
