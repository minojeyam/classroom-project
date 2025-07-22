import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Filter,
  Download,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { classesAPI } from "../../utils/api";

interface ScheduledClass {
  id: string;
  classId: string;
  className: string;
  subject: string;
  teacherName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  locationName: string;
  status: "scheduled" | "completed" | "cancelled";
  cancellationNote?: string;
}

interface EnrolledClass {
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
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  };
}

const StudentCalendarView: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>(
    []
  );
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

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
    fetchStudentSchedule();
  }, [user]);

  const fetchStudentSchedule = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken") ?? undefined;

      // Fetch enrolled classes
      const classesResponse = await classesAPI.getClasses({}, token);

      if (classesResponse.status === "success") {
        // Filter classes where student is enrolled
        const studentClasses =
          classesResponse.data.classes?.filter((classItem: any) =>
            classItem.enrolledStudents?.some(
              (enrollment: any) => enrollment.studentId === user?.id
            )
          ) || [];

        setEnrolledClasses(studentClasses);

        // Generate scheduled classes from enrolled classes (mock data)
        generateScheduledClasses(studentClasses);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch schedule");
    } finally {
      setLoading(false);
    }
  };

  const generateScheduledClasses = (classes: EnrolledClass[]) => {
    const scheduled: ScheduledClass[] = [];
    const today = new Date();

    // Generate classes for the next 3 months
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      classes.forEach((classItem) => {
        // Check if this day matches the class schedule
        if (date.getDay() === classItem.schedule.dayOfWeek) {
          const dateString = date.toISOString().split("T")[0];

          // Add some randomness for cancelled classes (5% chance)
          const isCancelled = Math.random() < 0.05;

          scheduled.push({
            id: `${classItem._id}-${dateString}`,
            classId: classItem._id,
            className: classItem.title,
            subject: classItem.subject,
            teacherName: `${classItem.teacherId.firstName} ${classItem.teacherId.lastName}`,
            date: dateString,
            startTime: classItem.schedule.startTime,
            endTime: classItem.schedule.endTime,
            duration: calculateDuration(
              classItem.schedule.startTime,
              classItem.schedule.endTime
            ),
            locationName: classItem.locationId.name,
            status: isCancelled
              ? "cancelled"
              : date < today
              ? "completed"
              : "scheduled",
            cancellationNote: isCancelled
              ? "Teacher unavailable due to emergency"
              : undefined,
          });
        }
      });
    }

    setScheduledClasses(scheduled);
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

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getClassesForDate = (date: Date): ScheduledClass[] => {
    const dateString = date.toISOString().split("T")[0];
    return scheduledClasses.filter((scheduledClass) => {
      const subjectMatch =
        filterSubject === "all" || scheduledClass.subject === filterSubject;
      const statusMatch =
        filterStatus === "all" || scheduledClass.status === filterStatus;
      return scheduledClass.date === dateString && subjectMatch && statusMatch;
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

  const exportSchedule = () => {
    const csvHeaders =
      "Date,Class,Subject,Teacher,Time,Duration,Location,Status,Notes";
    const csvData = scheduledClasses
      .filter((scheduledClass) => {
        const classDate = new Date(scheduledClass.date);
        return (
          classDate.getMonth() === currentDate.getMonth() &&
          classDate.getFullYear() === currentDate.getFullYear()
        );
      })
      .map(
        (scheduledClass) =>
          `${scheduledClass.date},${scheduledClass.className},${
            scheduledClass.subject
          },${scheduledClass.teacherName},${scheduledClass.startTime}-${
            scheduledClass.endTime
          },${scheduledClass.duration}min,${scheduledClass.locationName},${
            scheduledClass.status
          },${scheduledClass.cancellationNote || ""}`
      )
      .join("\n");

    const blob = new Blob([csvHeaders + "\n" + csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-schedule-${currentDate.getFullYear()}-${
      currentDate.getMonth() + 1
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueSubjects = [...new Set(scheduledClasses.map((c) => c.subject))];

  const stats = [
    {
      title: "Enrolled Classes",
      value: enrolledClasses.length.toString(),
      icon: BookOpen,
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
      icon: Calendar,
      color: "green",
    },
    {
      title: "Upcoming",
      value: scheduledClasses
        .filter(
          (c) => new Date(c.date) >= new Date() && c.status === "scheduled"
        )
        .length.toString(),
      icon: Clock,
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
          <h2 className="text-2xl font-bold text-gray-900">
            My Class Schedule
          </h2>
          <p className="text-gray-600 mt-1">
            View your upcoming classes and schedule
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportSchedule}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Schedule</span>
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
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">
              Subject:
            </label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
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

          <div className="flex items-center space-x-2 ml-auto">
            {(filterSubject !== "all" || filterStatus !== "all") && (
              <button
                onClick={() => {
                  setFilterSubject("all");
                  setFilterStatus("all");
                }}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
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
              const isToday = day.toDateString() === new Date().toDateString();
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
                            ? "bg-red-100 text-red-700 opacity-60"
                            : scheduledClass.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                        title={`${scheduledClass.className} - ${
                          scheduledClass.startTime
                        } ${
                          scheduledClass.status === "cancelled"
                            ? "(Cancelled)"
                            : ""
                        }`}
                      >
                        {scheduledClass.startTime} {scheduledClass.subject}
                        {scheduledClass.status === "cancelled" && " ❌"}
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
                    className={`p-4 rounded-lg border-2 ${
                      scheduledClass.status === "cancelled"
                        ? "bg-red-50 border-red-200 opacity-75"
                        : scheduledClass.status === "completed"
                        ? "bg-green-50 border-green-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4
                          className={`font-semibold text-lg ${
                            scheduledClass.status === "cancelled"
                              ? "text-red-700 line-through"
                              : "text-gray-900"
                          }`}
                        >
                          {scheduledClass.className}
                        </h4>
                        <p className="text-gray-600">
                          {scheduledClass.subject}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          scheduledClass.status
                        )}`}
                      >
                        {scheduledClass.status.charAt(0).toUpperCase() +
                          scheduledClass.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-700">Time</p>
                          <p className="text-gray-600">
                            {scheduledClass.startTime} -{" "}
                            {scheduledClass.endTime}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-700">Teacher</p>
                          <p className="text-gray-600">
                            {scheduledClass.teacherName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-700">Location</p>
                          <p className="text-gray-600">
                            {scheduledClass.locationName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-700">Duration</p>
                          <p className="text-gray-600">
                            {scheduledClass.duration} minutes
                          </p>
                        </div>
                      </div>
                    </div>

                    {scheduledClass.cancellationNote && (
                      <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-red-800">
                              Class Cancelled
                            </p>
                            <p className="text-red-700 mt-1">
                              {scheduledClass.cancellationNote}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Classes Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Upcoming Classes
          </h3>
        </div>
        <div className="p-6">
          {scheduledClasses
            .filter(
              (c) => new Date(c.date) >= new Date() && c.status === "scheduled"
            )
            .slice(0, 5)
            .map((scheduledClass) => (
              <div
                key={scheduledClass.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3 last:mb-0"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {scheduledClass.className}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {scheduledClass.teacherName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(scheduledClass.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {scheduledClass.startTime} - {scheduledClass.endTime}
                  </p>
                </div>
              </div>
            ))}

          {scheduledClasses.filter(
            (c) => new Date(c.date) >= new Date() && c.status === "scheduled"
          ).length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming classes scheduled</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCalendarView;
