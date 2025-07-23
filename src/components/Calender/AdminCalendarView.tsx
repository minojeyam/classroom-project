import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  Users,
  X,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Bell,
  User,
  BookOpen,
  Search,
} from "lucide-react";
import Modal from "../Common/Modal";
import DataTable from "../Common/DataTable";
import { useAuth } from "../../contexts/AuthContext";
import {
  classesAPI,
  locationsAPI,
  usersAPI,
  schedulesAPI,
} from "../../utils/api";

interface ScheduledClass {
  id: string;
  classId: string;
  className: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  locationId: string;
  locationName: string;
  studentCount: number;
  status: "scheduled" | "completed" | "cancelled";
  cancellationNote?: string;
  createdAt: string;
  createdBy: string;
}

interface ClassTemplate {
  _id: string;
  title: string;
  subject: string;
  level: string;
  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  locationId: {
    _id: string;
    name: string;
  };
  capacity: number;
  currentEnrollment: number;
}

const AdminCalendarView: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>(
    []
  );
  const [classTemplates, setClassTemplates] = useState<ClassTemplate[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState<"calendar" | "list">("calendar");

  // Filter states
  const [filterTeacher, setFilterTeacher] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedClassForEdit, setSelectedClassForEdit] =
    useState<ScheduledClass | null>(null);
  const [selectedClassForCancel, setSelectedClassForCancel] =
    useState<ScheduledClass | null>(null);

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    classId: "",
    teacherId: "",
    date: "",
    startTime: "09:00",
    endTime: "10:30",
    locationId: "",
    notes: "",
  });

  const [cancellationNote, setCancellationNote] = useState("");

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    fetchData();
    fetchScheduledClasses();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken") ?? undefined;

      const [classesResponse, teachersResponse, locationsResponse] =
        await Promise.all([
          classesAPI.getClasses({}, token),
          usersAPI.getAll({ role: "teacher" }),
          locationsAPI.getLocations({}, token),
        ]);

      if (classesResponse.status === "success") {
        setClassTemplates(classesResponse.data.classes || []);
      }

      if (teachersResponse.status === "success") {
        setTeachers(teachersResponse.data.users || []);
      }

      if (locationsResponse.status === "success") {
        setLocations(locationsResponse.data.locations || []);
      }

      // Fetch scheduled classes (mock data for now)
      await fetchScheduledClasses();
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledClasses = async () => {
    try {
      const response = await schedules.getAll();
      setScheduledClasses(response.data.classes); // Adjust if response structure differs
    } catch (err: any) {
      console.error("Error fetching scheduled classes:", err);
    }
  };

  const validateTimeConflict = (
    teacherId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): boolean => {
    const conflictingClasses = scheduledClasses.filter(
      (scheduledClass) =>
        scheduledClass.teacherId === teacherId &&
        scheduledClass.date === date &&
        scheduledClass.status === "scheduled" &&
        scheduledClass.id !== excludeId
    );

    for (const existingClass of conflictingClasses) {
      const existingStart = new Date(`${date}T${existingClass.startTime}`);
      const existingEnd = new Date(`${date}T${existingClass.endTime}`);
      const newStart = new Date(`${date}T${startTime}`);
      const newEnd = new Date(`${date}T${endTime}`);

      // Check for overlap
      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        return true; // Conflict found
      }
    }
    return false; // No conflict
  };

  const handleScheduleClass = async () => {
    if (
      !scheduleForm.classId ||
      !scheduleForm.locationId ||
      !scheduleForm.date ||
      !scheduleForm.startTime ||
      !scheduleForm.endTime
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      const payload = {
        classId: scheduleForm.classId,
        teacherId: user.id,
        locationId: scheduleForm.locationId,
        date: scheduleForm.date,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        duration: calculateDuration(
          scheduleForm.startTime,
          scheduleForm.endTime
        ),
      };

      await schedules.create(payload);
      // toast.success("Class scheduled successfully");
      setIsModalOpen(false);
      fetchScheduledClasses();
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error(
          err.response.data.message ||
            "Time conflict. Please choose a different time."
        );
      } else {
        toast.error("Failed to schedule class");
      }
    }
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClassForEdit) return;

    try {
      // Validate time conflict (excluding current class)
      if (
        validateTimeConflict(
          scheduleForm.teacherId,
          scheduleForm.date,
          scheduleForm.startTime,
          scheduleForm.endTime,
          selectedClassForEdit.id
        )
      ) {
        setError(
          "Time conflict detected! The selected teacher already has a class scheduled at this time."
        );
        return;
      }

      const selectedClass = classTemplates.find(
        (c) => c._id === scheduleForm.classId
      );
      const selectedTeacher = teachers.find(
        (t) => t.id === scheduleForm.teacherId
      );
      const selectedLocation = locations.find(
        (l) => l.id === scheduleForm.locationId
      );

      if (!selectedClass || !selectedTeacher || !selectedLocation) {
        setError("Please select valid class, teacher, and location");
        return;
      }

      const updatedClass: ScheduledClass = {
        ...selectedClassForEdit,
        classId: scheduleForm.classId,
        className: selectedClass.title,
        subject: selectedClass.subject,
        teacherId: scheduleForm.teacherId,
        teacherName: `${selectedTeacher.firstName} ${selectedTeacher.lastName}`,
        date: scheduleForm.date,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        duration: calculateDuration(
          scheduleForm.startTime,
          scheduleForm.endTime
        ),
        locationId: scheduleForm.locationId,
        locationName: selectedLocation.name,
        studentCount: selectedClass.currentEnrollment,
      };

      setScheduledClasses((prev) =>
        prev.map((c) => (c.id === selectedClassForEdit.id ? updatedClass : c))
      );
      setIsEditModalOpen(false);
      setSelectedClassForEdit(null);
      setError("");

      alert("Class updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update class");
    }
  };

  const handleBulkSchedule = async () => {
    if (
      !bulkScheduleForm.classId ||
      !bulkScheduleForm.locationId ||
      !bulkScheduleForm.startDate ||
      !bulkScheduleForm.endDate ||
      !bulkScheduleForm.startTime ||
      !bulkScheduleForm.endTime
    ) {
      toast.error("Please fill in all required fields for bulk scheduling.");
      return;
    }

    const start = new Date(bulkScheduleForm.startDate);
    const end = new Date(bulkScheduleForm.endDate);
    const selectedDay = parseInt(bulkScheduleForm.dayOfWeek, 10);
    const createdSchedules = [];

    while (start <= end) {
      if (start.getDay() === selectedDay) {
        createdSchedules.push({
          classId: bulkScheduleForm.classId,
          teacherId: user.id,
          locationId: bulkScheduleForm.locationId,
          date: start.toISOString().split("T")[0],
          startTime: bulkScheduleForm.startTime,
          endTime: bulkScheduleForm.endTime,
          duration: calculateDuration(
            bulkScheduleForm.startTime,
            bulkScheduleForm.endTime
          ),
        });
      }
      start.setDate(start.getDate() + 1);
    }

    try {
      await Promise.all(
        createdSchedules.map((schedule) => schedules.create(schedule))
      );
      toast.success("Bulk classes scheduled successfully");
      setIsBulkModalOpen(false);
      fetchScheduledClasses();
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error(
          err.response.data.message ||
            "Some classes conflicted. Please review your schedule."
        );
      } else {
        toast.error("Failed to schedule bulk classes");
      }
    }
  };

  const handleCancelClass = async () => {
    if (!selectedClassForCancel?.id || !cancellationNote.trim()) {
      toast.error("Please provide a reason for cancellation.");
      return;
    }

    try {
      await schedules.update(selectedClassForCancel.id, {
        status: "cancelled",
        cancellationNote,
      });

      // toast.success("Class cancelled successfully");
      setIsCancelModalOpen(false);
      setCancellationNote("");
      fetchScheduledClasses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel class");
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete this scheduled class?"
      )
    ) {
      try {
        setScheduledClasses((prev) => prev.filter((c) => c.id !== classId));
        alert("Class deleted successfully!");
      } catch (err: any) {
        setError(err.message || "Failed to delete class");
      }
    }
  };

  const sendCancellationNotifications = async (
    scheduledClass: ScheduledClass,
    note: string
  ) => {
    // Mock notification system
    console.log("Sending cancellation notifications:", {
      class: scheduledClass.className,
      teacher: scheduledClass.teacherName,
      date: scheduledClass.date,
      time: `${scheduledClass.startTime} - ${scheduledClass.endTime}`,
      note: note,
      recipients: ["teacher", "students", "admin"],
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    return (end.getTime() - start.getTime()) / (1000 * 60);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getClassesForDate = (date: Date): ScheduledClass[] => {
    const dateString = date.toISOString().split("T")[0];
    return scheduledClasses.filter((scheduledClass) => {
      const teacherMatch =
        filterTeacher === "all" || scheduledClass.teacherId === filterTeacher;
      const locationMatch =
        filterLocation === "all" ||
        scheduledClass.locationId === filterLocation;
      const statusMatch =
        filterStatus === "all" || scheduledClass.status === filterStatus;
      const searchMatch =
        searchTerm === "" ||
        scheduledClass.className
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        scheduledClass.teacherName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        scheduledClass.subject.toLowerCase().includes(searchTerm.toLowerCase());

      return (
        scheduledClass.date === dateString &&
        teacherMatch &&
        locationMatch &&
        statusMatch &&
        searchMatch
      );
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredScheduledClasses = scheduledClasses.filter((scheduledClass) => {
    const teacherMatch =
      filterTeacher === "all" || scheduledClass.teacherId === filterTeacher;
    const locationMatch =
      filterLocation === "all" || scheduledClass.locationId === filterLocation;
    const statusMatch =
      filterStatus === "all" || scheduledClass.status === filterStatus;
    const searchMatch =
      searchTerm === "" ||
      scheduledClass.className
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      scheduledClass.teacherName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      scheduledClass.subject.toLowerCase().includes(searchTerm.toLowerCase());

    return teacherMatch && locationMatch && statusMatch && searchMatch;
  });

  const listColumns = [
    {
      key: "className",
      label: "Class",
      sortable: true,
      render: (value: string, row: ScheduledClass) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p
              className={`font-medium ${
                row.status === "cancelled"
                  ? "text-red-600 line-through"
                  : "text-gray-900"
              }`}
            >
              {value}
            </p>
            <p className="text-sm text-gray-500">{row.subject}</p>
          </div>
        </div>
      ),
    },
    {
      key: "teacherName",
      label: "Teacher",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date & Time",
      sortable: true,
      render: (value: string, row: ScheduledClass) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {new Date(value).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500">
            {row.startTime} - {row.endTime}
          </p>
        </div>
      ),
    },
    {
      key: "locationName",
      label: "Location",
      sortable: true,
      render: (value: string, row: ScheduledClass) => (
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{row.studentCount} students</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            value
          )}`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value: any, row: ScheduledClass) => (
        <div className="flex items-center space-x-2">
          {row.status === "scheduled" && (
            <>
              <button
                onClick={() => {
                  setSelectedClassForEdit(row);
                  setScheduleForm({
                    classId: row.classId,
                    teacherId: row.teacherId,
                    date: row.date,
                    startTime: row.startTime,
                    endTime: row.endTime,
                    locationId: row.locationId,
                    notes: "",
                  });
                  setIsEditModalOpen(true);
                }}
                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-200"
                title="Edit Class"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedClassForCancel(row);
                  setIsCancelModalOpen(true);
                }}
                className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded transition-colors duration-200"
                title="Cancel Class"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => handleDeleteClass(row.id)}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200"
            title="Delete Class"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const stats = [
    {
      title: "Total Scheduled",
      value: scheduledClasses.length.toString(),
      icon: Calendar,
      color: "blue",
    },
    {
      title: "This Month",
      value: scheduledClasses
        .filter(
          (c) =>
            new Date(c.date).getMonth() === currentDate.getMonth() &&
            new Date(c.date).getFullYear() === currentDate.getFullYear()
        )
        .length.toString(),
      icon: Clock,
      color: "green",
    },
    {
      title: "Active Classes",
      value: scheduledClasses
        .filter((c) => c.status === "scheduled")
        .length.toString(),
      icon: CheckCircle,
      color: "teal",
    },
    {
      title: "Cancelled",
      value: scheduledClasses
        .filter((c) => c.status === "cancelled")
        .length.toString(),
      icon: AlertCircle,
      color: "red",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Calendar</h2>
          <p className="text-gray-600 mt-1">
            Manage all scheduled classes across the system
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView("calendar")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeView === "calendar"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveView("list")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeView === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Class</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.color === "blue"
                    ? "bg-blue-500"
                    : stat.color === "green"
                    ? "bg-green-500"
                    : stat.color === "teal"
                    ? "bg-teal-500"
                    : "bg-red-500"
                }`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">
              Teacher:
            </label>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Teachers</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.firstName} {teacher.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Location:
            </label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
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
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search classes, teachers, subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {(filterTeacher !== "all" ||
            filterLocation !== "all" ||
            filterStatus !== "all" ||
            searchTerm) && (
            <button
              onClick={() => {
                setFilterTeacher("all");
                setFilterLocation("all");
                setFilterStatus("all");
                setSearchTerm("");
              }}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Calendar or List View */}
      {activeView === "calendar" ? (
        <>
          {/* Calendar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {monthNames[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateMonth("prev")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateMonth("next")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-sm font-medium text-gray-500"
                  >
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map((day, index) => {
                  if (!day) {
                    return <div key={index} className="h-24"></div>;
                  }

                  const dayClasses = getClassesForDate(day);
                  const isToday =
                    day.toDateString() === new Date().toDateString();
                  const isSelected =
                    selectedDate?.toDateString() === day.toDateString();

                  return (
                    <div
                      key={index}
                      className={`h-24 border border-gray-200 rounded-lg p-1 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                        isToday ? "bg-blue-50 border-blue-200" : ""
                      } ${isSelected ? "bg-blue-100 border-blue-300" : ""}`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sm font-medium ${
                            isToday ? "text-blue-600" : "text-gray-900"
                          }`}
                        >
                          {day.getDate()}
                        </span>
                        {dayClasses.length > 0 && (
                          <span className="text-xs bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                            {dayClasses.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {dayClasses.slice(0, 2).map((scheduledClass) => (
                          <div
                            key={scheduledClass.id}
                            className={`text-xs p-1 rounded truncate ${
                              scheduledClass.status === "cancelled"
                                ? "bg-red-100 text-red-700 line-through"
                                : scheduledClass.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                            title={`${scheduledClass.className} - ${scheduledClass.teacherName} - ${scheduledClass.startTime}`}
                          >
                            {scheduledClass.startTime}{" "}
                            {scheduledClass.className}
                          </div>
                        ))}
                        {dayClasses.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayClasses.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Classes on {selectedDate.toLocaleDateString()}
                </h3>
              </div>
              <div className="p-6">
                {getClassesForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No classes scheduled for this date
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getClassesForDate(selectedDate).map((scheduledClass) => (
                      <div
                        key={scheduledClass.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4
                              className={`font-medium ${
                                scheduledClass.status === "cancelled"
                                  ? "text-red-600 line-through"
                                  : "text-gray-900"
                              }`}
                            >
                              {scheduledClass.className}
                            </h4>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                scheduledClass.status
                              )}`}
                            >
                              {scheduledClass.status.charAt(0).toUpperCase() +
                                scheduledClass.status.slice(1)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>{scheduledClass.teacherName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                {scheduledClass.startTime} -{" "}
                                {scheduledClass.endTime}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>{scheduledClass.locationName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4" />
                              <span>
                                {scheduledClass.studentCount} students
                              </span>
                            </div>
                          </div>

                          {scheduledClass.cancellationNote && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <p className="text-sm text-red-700">
                                <strong>Cancellation Note:</strong>{" "}
                                {scheduledClass.cancellationNote}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {scheduledClass.status === "scheduled" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedClassForEdit(scheduledClass);
                                  setScheduleForm({
                                    classId: scheduledClass.classId,
                                    teacherId: scheduledClass.teacherId,
                                    date: scheduledClass.date,
                                    startTime: scheduledClass.startTime,
                                    endTime: scheduledClass.endTime,
                                    locationId: scheduledClass.locationId,
                                    notes: "",
                                  });
                                  setIsEditModalOpen(true);
                                }}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                title="Edit Class"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedClassForCancel(scheduledClass);
                                  setIsCancelModalOpen(true);
                                }}
                                className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                                title="Cancel Class"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteClass(scheduledClass.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Delete Class"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        /* List View */
        <DataTable
          columns={listColumns}
          data={filteredScheduledClasses}
          title="All Scheduled Classes"
          searchable={false}
          filterable={false}
          exportable={true}
        />
      )}

      {/* Schedule/Edit Class Modal */}
      <Modal
        isOpen={isScheduleModalOpen || isEditModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedClassForEdit(null);
          setScheduleForm({
            classId: "",
            teacherId: "",
            date: "",
            startTime: "09:00",
            endTime: "10:30",
            locationId: "",
            notes: "",
          });
        }}
        title={isEditModalOpen ? "Edit Scheduled Class" : "Schedule Class"}
        size="lg"
      >
        <form
          onSubmit={isEditModalOpen ? handleEditClass : handleScheduleClass}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class *
              </label>
              <select
                required
                value={scheduleForm.classId}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, classId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Class</option>
                {classTemplates.map((classTemplate) => (
                  <option key={classTemplate._id} value={classTemplate._id}>
                    {classTemplate.title} - {classTemplate.level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teacher *
              </label>
              <select
                required
                value={scheduleForm.teacherId}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    teacherId: e.target.value,
                  })
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
                Date *
              </label>
              <input
                type="date"
                required
                value={scheduleForm.date}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={scheduleForm.startTime}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    startTime: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                type="time"
                required
                value={scheduleForm.endTime}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, endTime: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              value={scheduleForm.locationId}
              onChange={(e) =>
                setScheduleForm({ ...scheduleForm, locationId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Use Default Location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsScheduleModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              {isEditModalOpen ? "Update Class" : "Schedule Class"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Class Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedClassForCancel(null);
          setCancellationNote("");
        }}
        title="Cancel Class"
        size="md"
      >
        {selectedClassForCancel && (
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">
                {selectedClassForCancel.className}
              </h4>
              <div className="text-sm text-red-700 space-y-1">
                <p>Teacher: {selectedClassForCancel.teacherName}</p>
                <p>
                  Date:{" "}
                  {new Date(selectedClassForCancel.date).toLocaleDateString()}
                </p>
                <p>
                  Time: {selectedClassForCancel.startTime} -{" "}
                  {selectedClassForCancel.endTime}
                </p>
                <p>Location: {selectedClassForCancel.locationName}</p>
                <p>Students: {selectedClassForCancel.studentCount}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cancellation Note *
              </label>
              <textarea
                required
                value={cancellationNote}
                onChange={(e) => setCancellationNote(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Please provide a reason for cancelling this class. This note will be sent to the teacher, all students, and administrators."
              />
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <Bell className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Notification will be sent to:</p>
                  <ul className="mt-1 list-disc list-inside">
                    <li>Teacher: {selectedClassForCancel.teacherName}</li>
                    <li>
                      All {selectedClassForCancel.studentCount} enrolled
                      students
                    </li>
                    <li>System administrators</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                Keep Class
              </button>
              <button
                onClick={handleCancelClass}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                Cancel Class
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminCalendarView;
