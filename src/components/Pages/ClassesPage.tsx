import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, BookOpen, Eye } from "lucide-react";
import DataTable from "../Common/DataTable";
import Modal from "../Common/Modal";
import { classesAPI, locationsAPI, usersAPI } from "../../utils/api";
import AssignStudentsModal from "../Classes/AssignStudentsModal";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import ConfirmModal from "../Common/ConfirmModal";

export type Frequency = "monthly" | "semester" | "annual" | "one-time";

export type Category =
  | "tuition"
  | "lab"
  | "library"
  | "sports"
  | "transport"
  | "exam"
  | "other";

export interface Fee {
  name: string;
  amount: number;
  frequency: Frequency;
  category: Category;
}

export interface Class {
  _id: string;
  title: string;
  level: string;
  subject: string;
  description?: string;

  locationId: {
    _id: string;
    name: string;
    address: any; // Consider defining a structured Address type later
  };

  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  schedule: {
    dayOfWeek: number; // 0 = Sunday, 6 = Saturday
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    duration: number; // in minutes
  };

  capacity: number;
  currentEnrollment: number;

  monthlyFee: {
    amount: number;
    currency: string;
  };

  fees?: Fee[]; // Optional; used only in UI for form inputs

  status: "active" | "inactive" | "completed" | "cancelled";

  startDate: string; // ISO string
  endDate: string; // ISO string
}


interface FormData {
  title: string;
  level: string;
  subject: string;
  description: string;
  locationId: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  fees: Fee[];
  status: "active" | "inactive" | "completed" | "cancelled";
  startDate: string;
  endDate: string;
}

const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [formData, setFormData] = useState<FormData>({
    title: "",
    level: "",
    subject: "",
    description: "",
    locationId: "",
    teacherId: "",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:30",
    capacity: 30,
    fees: [
      {
        name: "Monthly tuition",
        amount: 450,
        frequency: "monthly",
        category: "tuition",
      },
    ],
    status: "active",
    startDate: "",
    endDate: "",
  });
// confirmation Model 
const [confirmDelete, setConfirmDelete] = useState<{
  isOpen: boolean;
  classId: string | null;
}>({ isOpen: false, classId: null });

const handleDeleteClick = (id: string) => {
  setConfirmDelete({ isOpen: true, classId: id });
};


  // Extract unique grades from classes for filter
  const uniqueGrades = [...new Set(classes.map((c) => c.level))].sort();

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token =
          JSON.parse(localStorage.getItem("user") || "{}")?.tokens
            ?.accessToken ?? "";

        const [classesResponse, locationsResponse, usersResponse] =
          await Promise.all([
            classesAPI.getClasses({}, token),
            locationsAPI.getLocations({},token),
            usersAPI.getUsers({ role: "teacher" }, token),
          ]);

        setClasses(classesResponse.data.classes || []);
        setLocations(locationsResponse.data.locations || []);
        setTeachers(usersResponse.data.users || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const handleOpenAssignModal = (classId: string) => {
    const classData = classes.find((cls) => cls._id === classId);
    if (!classData || classData.status === "inactive") {
      toast.warning("This class is inactive. Cannot assign students.");
      return;
    }
    setSelectedClassId(classId);
    setShowAssignModal(true);
  };

  // Refreshes the class list by refetching from the server
  const refreshClasses = async () => {
    try {
      setLoading(true);
      const token =
        JSON.parse(localStorage.getItem("user") || "{}")?.tokens?.accessToken ??
        "";

      const [classesResponse, locationsResponse, usersResponse] =
        await Promise.all([
          classesAPI.getClasses({}, token),
          locationsAPI.getLocations({},token),
          usersAPI.getUsers({ role: "teacher" }, token),
        ]);

      setClasses(classesResponse.data.classes || []);
      setLocations(locationsResponse.data.locations || []);
      setTeachers(usersResponse.data.users || []);
    } catch (err: any) {
      setError(err.message || "Failed to refresh classes");
    } finally {
      setLoading(false);
    }
  };

  // Closes the modal and resets the form to initial state
  const onClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedClass(null);
    setFormData({
      title: "",
      level: "",
      subject: "",
      description: "",
      locationId: "",
      teacherId: "",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:30",
      capacity: 30,
      fees: [
        {
          name: "Monthly tuition",
          amount: 450,
          frequency: "monthly" as Frequency,
          category: "tuition" as Category,
        },
      ],
      status: "active",
      startDate: "",
      endDate: "",
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.fees.length === 0) {
        toast.error("Please add at least one fee");
        return;
      }

      const token = JSON.parse(localStorage.getItem("user") || "{}")?.tokens?.accessToken ?? "";

      const classData = {
        ...formData, currency: "LKR", schedule: {
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
          duration: calculateDuration(formData.startTime, formData.endTime)
        }
      };

      if (isEditMode && selectedClass) {
        await classesAPI.updateClass(selectedClass._id, classData, token);
        toast.success("Class updated");
      } else {
        await classesAPI.createClass(classData, token);
        toast.success("Class created");
      }

      handleCloseModal();
      refreshClasses();
    } catch (err: any) {
      console.error("Submission error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to save class");
    }
  };


  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    return (end.getTime() - start.getTime()) / (1000 * 60); // Duration in minutes
  };

  const handleEdit = (classItem: Class) => {
    setSelectedClass(classItem);
    setFormData({
      title: classItem.title,
      level: classItem.level,
      subject: classItem.subject,
      description: classItem.description || "",
      locationId: classItem.locationId._id,
      teacherId: classItem.teacherId._id,
      dayOfWeek: classItem.schedule.dayOfWeek,
      startTime: classItem.schedule.startTime,
      endTime: classItem.schedule.endTime,
      capacity: classItem.capacity,
      fees: classItem.fees || [
        {
          name: "Monthly tuition",
          amount: 450,
          frequency: "monthly",
          category: "tuition",
        },
      ],
      status: classItem.status,
      startDate: classItem.startDate.split("T")[0],
      endDate: classItem.endDate.split("T")[0],
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken") ?? undefined;

      const [classesResponse, locationsResponse, usersResponse] =
        await Promise.all([
          classesAPI.getClasses({}, token),
          locationsAPI.getLocations({},token),
          usersAPI.getUsers({ role: "teacher" }, token),
        ]);

      setClasses(classesResponse.data.classes || []);
      setLocations(locationsResponse.data.locations || []);
      setTeachers(usersResponse.data.users || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (id: string) => {
    const token =
      JSON.parse(localStorage.getItem("user") || "{}")?.tokens?.accessToken ??
      "";

    try {
      const res = await fetch(
        `http://localhost:5000/api/classes/${id}/disable`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Class disabled");
        await fetchData(); // Refresh list
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to disable class");
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.classId) return;
  
    try {
      const token =
        JSON.parse(localStorage.getItem("user") || "{}")?.tokens?.accessToken ??
        "";
      await classesAPI.deleteClass(confirmDelete.classId, token);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to delete class");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedClass(null);
    setFormData({
      title: "",
      level: "",
      subject: "",
      description: "",
      locationId: "",
      teacherId: "",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:30",
      capacity: 30,
      fees: [
        {
          name: "Monthly Tuition",
          amount: 450,
          frequency: "monthly",
          category: "tuition",
        },
      ],
      status: "active",
      startDate: "",
      endDate: "",
    });
  };

  // Filter classes based on selected location and grade
  const filteredClasses = classes.filter((classItem) => {
    const locationMatch =
      selectedLocation === "all" ||
      classItem.locationId._id === selectedLocation;
    const gradeMatch =
      selectedGrade === "all" || classItem.level === selectedGrade;
    return locationMatch && gradeMatch;
  });

  const columns = [
    {
      key: "title",
      label: "Class",
      sortable: true,
      render: (value: string, row: Class) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">
              {row.subject} • {row.level}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "teacher",
      label: "Teacher",
      render: (value: any, row: Class) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {row.teacherId?.firstName
              ? `${row.teacherId.firstName} ${row.teacherId.lastName}`
              : "Not Assigned"}
          </p>
          <p className="text-sm text-gray-500">
            {row.locationId?.name || "No Location"}
          </p>
        </div>
      ),
    },
    {
      key: "schedule",
      label: "Schedule",
      render: (value: any, row: Class) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {dayNames[row.schedule.dayOfWeek]}
          </p>
          <p className="text-sm text-gray-500">
            {row.schedule.startTime} - {row.schedule.endTime}
          </p>
        </div>
      ),
    },
    {
      key: "enrollment",
      label: "Enrollment",
      render: (value: any, row: Class) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {row.currentEnrollment} / {row.capacity}
          </p>
          <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{
                width: `${(row.currentEnrollment / row.capacity) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      key: "fees",
      label: "Fees",
      sortable: true,
      render: (value: any, row: Class) => (
        <div>
          {row.fees && row.fees.length > 0 ? (
            <div className="space-y-1">
              {row.fees.slice(0, 2).map((fee, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium text-gray-900">
                    LKR{fee.amount}
                  </span>
                  <span className="text-gray-500 ml-1">({fee.frequency})</span>
                </div>
              ))}
              {row.fees.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{row.fees.length - 2} more
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-500">No fees set</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${value === "active"
              ? "bg-green-100 text-green-800"
              : value === "inactive"
                ? "bg-gray-100 text-gray-800"
                : value === "completed"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-red-100 text-red-800"
            }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value: any, row: Class) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDisable(row._id)}
            className="text-yellow-600 hover:text-yellow-800"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(row._id)}
            className="text-red-600 hover:text-red-800 transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
    {
      key: "assign",
      label: "Add Students",
      render: (_: any, row: Class) => (
        <button
          onClick={() => handleOpenAssignModal(row._id)}
          disabled={row.status === "inactive"}
          className={`px-3 py-1 rounded text-sm ${row.status === "inactive"
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-teal-600 text-white hover:bg-teal-700"
            }`}
        >
          Assign
        </button>
      ),
    },
  ];

  const actions = (
    <button
      onClick={() => setIsModalOpen(true)}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
    >
      <Plus className="w-4 h-4" />
      <span>Add Class</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Classes Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage classes, schedules, and enrollment
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Total Classes: </span>
            <span className="font-semibold text-gray-900">
              {filteredClasses.length}
            </span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Active Classes: </span>
            <span className="font-semibold text-green-600">
              {filteredClasses.filter((c) => c.status === "active").length}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Location:
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Grade/Level:
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Grades</option>
              {uniqueGrades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            <span className="text-sm text-gray-600">
              Showing {filteredClasses.length} of {classes.length} classes
            </span>
            {(selectedLocation !== "all" || selectedGrade !== "all") && (
              <button
                onClick={() => {
                  setSelectedLocation("all");
                  setSelectedGrade("all");
                }}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm"
              >
                Clear Filters
              </button>
            )}
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={filteredClasses}
            title="All Classes"
            actions={actions}
          />
          {showAssignModal && selectedClassId && (
            <AssignStudentsModal
              classId={selectedClassId}
              token={
                JSON.parse(localStorage.getItem("user") || "{}")?.tokens
                  ?.accessToken || ""
              }
              onClose={() => setShowAssignModal(false)}
            />
          )}
        </>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditMode ? "Edit Class" : "Add New Class"}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter class title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter subject"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level/Grade
              </label>
              <input
                type="text"
                required
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Grade 7, Beginner, Advanced"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as "active" | "inactive" | "completed" | "cancelled" })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter class description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                required
                value={formData.locationId}
                onChange={(e) =>
                  setFormData({ ...formData, locationId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teacher
              </label>
              <select
                required
                value={formData.teacherId}
                onChange={(e) =>
                  setFormData({ ...formData, teacherId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day of Week
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dayOfWeek: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {dayNames.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity
            </label>
            <input
              type="number"
              required
              min="1"
              max="100"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Maximum students"
            />
          </div>

          {/* Fees Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Class Fees
              </label>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    fees: [
                      ...formData.fees,
                      {
                        name: "",
                        amount: 0,
                        frequency: "monthly",
                        category: "tuition",
                      },
                    ],
                  });
                }}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm font-medium"
              >
                Add Fee
              </button>
            </div>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {formData.fees.map((fee: Fee, index: number) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <input
                      type="text"
                      placeholder="Fee name (eg: Monthly Tuition)"
                      value={fee.name}
                      onChange={(e) => {
                        const newFees = [...formData.fees];
                        newFees[index].name = e.target.value;
                        setFormData({ ...formData, fees: newFees });
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    {/* <div className="relative">
                      <span className="absolute left-2 top-1 text-sm text-gray-500">
                       LKR
                      </span>
                      <input
                        type="number"
                        placeholder="Amount in Rs"
                        min="0"
                        step="1"
                        value={fee.amount}
                        onChange={(e) => {
                          const newFees = [...formData.fees];
                          newFees[index].amount =
                            parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, fees: newFees });
                        }}
                        className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div> */}
                    <div className="relative w-full">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm select-none">
                        LKR
                      </span>
                      <input
                        type="number"
                        placeholder="Amount"
                        value={fee.amount}
                        onChange={(e) => {
                          const newFees = [...formData.fees];
                          newFees[index].amount = Number(e.target.value);
                          setFormData({ ...formData, fees: newFees });
                        }}
                        className="w-full px-10 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <select
                      value={fee.frequency}
                      onChange={(e) => {
                        const newFees = [...formData.fees];
                        const value = e.target.value as Frequency;
                        if (
                          [
                            "monthly",
                            "semester",
                            "annual",
                            "one-time",
                          ].includes(value)
                        ) {
                          newFees[index].frequency = value;
                        }
                        setFormData({ ...formData, fees: newFees });
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="semester">Semester</option>
                      <option value="annual">Annual</option>
                      <option value="one-time">One-time</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={fee.category}
                      onChange={(e) => {
                        const newFees = [...formData.fees];
                        const value = e.target.value as Category;
                        if (
                          [
                            "tuition",
                            "lab",
                            "library",
                            "sports",
                            "transport",
                            "exam",
                            "other",
                          ].includes(value)
                        ) {
                          newFees[index].category = value;
                        }
                        setFormData({ ...formData, fees: newFees });
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="tuition">Tuition</option>
                      <option value="lab">Lab</option>
                      <option value="library">Library</option>
                      <option value="sports">Sports</option>
                      <option value="transport">Transport</option>
                      <option value="exam">Exam</option>
                      <option value="other">Other</option>
                    </select>
                    {formData.fees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newFees = formData.fees.filter(
                            (_, i) => i !== index
                          );
                          setFormData({ ...formData, fees: newFees });
                        }}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
              {isEditMode ? "Update Class" : "Create Class"}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmModal
  isOpen={confirmDelete.isOpen}
  onClose={() => setConfirmDelete({ isOpen: false, classId: null })}
  onConfirm={handleConfirmDelete}
  title="Delete Class"
  message="Are you sure you want to delete this class? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
/>
    </div>



  );
};

export default ClassesPage;
