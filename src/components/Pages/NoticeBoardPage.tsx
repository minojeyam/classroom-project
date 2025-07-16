import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Bell,
  AlertCircle,
  Calendar,
  Users,
  MapPin,
  BookOpen,
  Send,
  Filter,
  Search,
} from "lucide-react";
import DataTable from "../Common/DataTable";
import Modal from "../Common/Modal";
import { useAuth } from "../../contexts/AuthContext";

interface Notice {
  id: string;
  title: string;
  content: string;
  type: "general" | "urgent" | "event" | "academic" | "administrative";
  priority: "low" | "medium" | "high";
  targetAudience: "all" | "students" | "teachers" | "parents" | "staff";
  locationId?: string;
  locationName?: string;
  classId?: string;
  className?: string;
  isGlobal: boolean;
  requiresAcknowledgment: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  expiresAt?: string;
  status: "draft" | "published" | "expired";
  viewCount: number;
  acknowledgmentCount: number;
  totalTargetUsers: number;
}

const NoticeBoardPage: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "general",
    priority: "medium",
    targetAudience: "all",
    locationId: "",
    classId: "",
    isGlobal: true,
    requiresAcknowledgment: false,
    expiresAt: "",
    status: "published",
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      // Mock data
      const mockNotices: Notice[] = [
        {
          id: "1",
          title: "Parent-Teacher Meeting Scheduled",
          content:
            "Dear Parents and Teachers, we are pleased to announce that the quarterly parent-teacher meeting has been scheduled for March 20th, 2024. Please mark your calendars and prepare for productive discussions about student progress.",
          type: "event",
          priority: "high",
          targetAudience: "all",
          locationId: "1",
          locationName: "Nelliyadi Campus",
          isGlobal: false,
          requiresAcknowledgment: true,
          createdBy: "1",
          createdByName: "Admin User",
          createdAt: "2024-03-10T10:00:00.000Z",
          expiresAt: "2024-03-25T23:59:59.000Z",
          status: "published",
          viewCount: 145,
          acknowledgmentCount: 89,
          totalTargetUsers: 150,
        },
        {
          id: "2",
          title: "Mid-term Examination Schedule",
          content:
            "The mid-term examinations will commence from March 25th, 2024. Students are advised to prepare thoroughly and arrive 30 minutes before the scheduled time. Detailed timetables will be shared with individual classes.",
          type: "academic",
          priority: "high",
          targetAudience: "students",
          isGlobal: true,
          requiresAcknowledgment: true,
          createdBy: "2",
          createdByName: "Teacher User",
          createdAt: "2024-03-08T14:30:00.000Z",
          expiresAt: "2024-04-05T23:59:59.000Z",
          status: "published",
          viewCount: 234,
          acknowledgmentCount: 198,
          totalTargetUsers: 250,
        },
        {
          id: "3",
          title: "Library Hours Extended",
          content:
            "We are happy to announce that library hours have been extended. The library will now be open from 8:00 AM to 8:00 PM on weekdays and 9:00 AM to 5:00 PM on weekends.",
          type: "general",
          priority: "medium",
          targetAudience: "all",
          isGlobal: true,
          requiresAcknowledgment: false,
          createdBy: "1",
          createdByName: "Admin User",
          createdAt: "2024-03-05T09:15:00.000Z",
          status: "published",
          viewCount: 89,
          acknowledgmentCount: 0,
          totalTargetUsers: 400,
        },
        {
          id: "4",
          title: "Science Fair Registration Open",
          content:
            "Registration for the annual science fair is now open! Students interested in participating should submit their project proposals by March 30th. This is a great opportunity to showcase your scientific talents.",
          type: "event",
          priority: "medium",
          targetAudience: "students",
          classId: "1",
          className: "Advanced Mathematics",
          isGlobal: false,
          requiresAcknowledgment: false,
          createdBy: "2",
          createdByName: "Teacher User",
          createdAt: "2024-03-03T11:45:00.000Z",
          expiresAt: "2024-03-30T23:59:59.000Z",
          status: "published",
          viewCount: 67,
          acknowledgmentCount: 0,
          totalTargetUsers: 30,
        },
        {
          id: "5",
          title: "Emergency Contact Update Required",
          content:
            "All parents are requested to update their emergency contact information in the student portal. This is crucial for maintaining effective communication during emergencies.",
          type: "urgent",
          priority: "high",
          targetAudience: "parents",
          isGlobal: true,
          requiresAcknowledgment: true,
          createdBy: "1",
          createdByName: "Admin User",
          createdAt: "2024-03-01T16:20:00.000Z",
          status: "published",
          viewCount: 178,
          acknowledgmentCount: 134,
          totalTargetUsers: 200,
        },
      ];

      setNotices(mockNotices);
    } catch (err: any) {
      setError(err.message || "Failed to fetch notices");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await fetchNotices();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || "Failed to save notice");
    }
  };

  const handleEdit = (notice: Notice) => {
    setSelectedNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      type: notice.type,
      priority: notice.priority,
      targetAudience: notice.targetAudience,
      locationId: notice.locationId || "",
      classId: notice.classId || "",
      isGlobal: notice.isGlobal,
      requiresAcknowledgment: notice.requiresAcknowledgment,
      expiresAt: notice.expiresAt ? notice.expiresAt.split("T")[0] : "",
      status: notice.status,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this notice?")) {
      try {
        // Mock API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        await fetchNotices();
      } catch (err: any) {
        setError(err.message || "Failed to delete notice");
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedNotice(null);
    setFormData({
      title: "",
      content: "",
      type: "general",
      priority: "medium",
      targetAudience: "all",
      locationId: "",
      classId: "",
      isGlobal: true,
      requiresAcknowledgment: false,
      expiresAt: "",
      status: "published",
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "event":
        return "bg-blue-100 text-blue-800";
      case "academic":
        return "bg-green-100 text-green-800";
      case "administrative":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredNotices = notices.filter((notice) => {
    if (activeTab === "all") return true;
    if (activeTab === "my-notices" && user?.role === "admin")
      return notice.createdBy === user.id;
    if (activeTab === "urgent")
      return notice.type === "urgent" || notice.priority === "high";
    if (activeTab === "events") return notice.type === "event";
    return notice.type === activeTab;
  });

  const columns = [
    {
      key: "title",
      label: "Notice",
      sortable: true,
      render: (value: string, row: Notice) => (
        <div className="flex items-start space-x-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              row.type === "urgent"
                ? "bg-red-500"
                : row.type === "event"
                ? "bg-blue-500"
                : row.type === "academic"
                ? "bg-green-500"
                : "bg-gray-500"
            }`}
          >
            {row.type === "urgent" ? (
              <AlertCircle className="w-5 h-5 text-white" />
            ) : row.type === "event" ? (
              <Calendar className="w-5 h-5 text-white" />
            ) : (
              <Bell className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 line-clamp-2">{row.content}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                  row.type
                )}`}
              >
                {row.type.charAt(0).toUpperCase() + row.type.slice(1)}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                  row.priority
                )}`}
              >
                {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "targetAudience",
      label: "Audience",
      sortable: true,
      render: (value: string, row: Notice) => (
        <div>
          <p className="text-sm font-medium text-gray-900 capitalize">
            {value}
          </p>
          {row.locationName && (
            <p className="text-xs text-gray-500">{row.locationName}</p>
          )}
          {row.className && (
            <p className="text-xs text-gray-500">{row.className}</p>
          )}
        </div>
      ),
    },
    {
      key: "engagement",
      label: "Engagement",
      render: (value: any, row: Notice) => (
        <div className="text-sm">
          <div className="flex items-center space-x-2 mb-1">
            <Eye className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900">{row.viewCount} views</span>
          </div>
          {row.requiresAcknowledgment && (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">
                {row.acknowledgmentCount}/{row.totalTargetUsers} ack.
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (value: string, row: Notice) => (
        <div>
          <p className="text-sm text-gray-900">
            {new Date(value).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500">by {row.createdByName}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string, row: Notice) => {
        const isExpired = row.expiresAt && new Date(row.expiresAt) < new Date();
        const displayStatus = isExpired ? "expired" : value;

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              displayStatus === "published"
                ? "bg-green-100 text-green-800"
                : displayStatus === "draft"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (value: any, row: Notice) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800 transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const canCreateNotice = user?.role === "admin" || user?.role === "teacher";

  const actions = canCreateNotice ? (
    <button
      onClick={() => setIsModalOpen(true)}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
    >
      <Plus className="w-4 h-4" />
      <span>Create Notice</span>
    </button>
  ) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notice Board</h2>
          <p className="text-gray-600 mt-1">
            Manage announcements and communications
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Total Notices: </span>
            <span className="font-semibold text-gray-900">
              {notices.length}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Notices</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {notices.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Urgent Notices
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {
                  notices.filter(
                    (n) => n.type === "urgent" || n.priority === "high"
                  ).length
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Events</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {notices.filter((n) => n.type === "event").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Avg. Engagement
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {Math.round(
                  notices.reduce(
                    (acc, n) => acc + (n.viewCount / n.totalTargetUsers) * 100,
                    0
                  ) / notices.length
                )}
                %
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: "all", label: "All Notices" },
              { key: "urgent", label: "Urgent" },
              { key: "events", label: "Events" },
              { key: "academic", label: "Academic" },
              ...(canCreateNotice
                ? [{ key: "my-notices", label: "My Notices" }]
                : []),
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredNotices}
              title={`${
                activeTab.charAt(0).toUpperCase() +
                activeTab.slice(1).replace("-", " ")
              } (${filteredNotices.length})`}
              actions={actions}
              searchable={true}
              filterable={true}
              exportable={true}
            />
          )}
        </div>
      </div>

      {/* Create/Edit Notice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditMode ? "Edit Notice" : "Create New Notice"}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter notice title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="event">Event</option>
                <option value="academic">Academic</option>
                <option value="administrative">Administrative</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter notice content"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) =>
                  setFormData({ ...formData, targetAudience: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
                <option value="parents">Parents</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires At (Optional)
              </label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) =>
                  setFormData({ ...formData, expiresAt: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-4 pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.requiresAcknowledgment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requiresAcknowledgment: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Requires Acknowledgment
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isGlobal}
                  onChange={(e) =>
                    setFormData({ ...formData, isGlobal: e.target.checked })
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Global Notice</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              {isEditMode ? "Update Notice" : "Create Notice"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NoticeBoardPage;
