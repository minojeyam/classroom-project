import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  Eye,
  TrendingUp,
  AlertCircle,
  User,
  BookOpen,
} from "lucide-react";
import Modal from "../Common/Modal";
import DataTable from "../Common/DataTable";
import { classesAPI, usersAPI } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
  markedBy: string;
  markedAt: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  parentEmail?: string;
  enrollmentDate?: string;
  status: string;
}

interface Class {
  _id: string;
  title: string;
  level: string;
  subject: string;
  locationId: {
    _id: string;
    name: string;
  };
  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  };
  capacity: number;
  currentEnrollment: number;
  status: string;
}

interface MonthlyReport {
  studentId: string;
  studentName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isStudentDetailModalOpen, setIsStudentDetailModalOpen] =
    useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  ); // YYYY-MM format
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport[]>([]);

  // UI states
  const [activeTab, setActiveTab] = useState("mark-attendance");
  const [selectedStudentForReport, setSelectedStudentForReport] =
    useState<string>("");

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
    fetchTeacherClasses();
  }, [user]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents();
      fetchAttendanceRecords();
    }
  }, [selectedClass, selectedDate]);

  const fetchTeacherClasses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken") ?? undefined;
      const response = await classesAPI.getClasses(
        { teacher: user?.id },
        token
      );

      if (response.status === "success") {
        const teacherClasses = response.data.classes || [];
        setClasses(teacherClasses);
        if (teacherClasses.length > 0) {
          setSelectedClass(teacherClasses[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async () => {
    if (!selectedClass) return;

    try {
      const token = localStorage.getItem("accessToken") ?? undefined;

      const classResponse = await classesAPI.getClassById(
        selectedClass._id,
        token
      );

      if (classResponse.status === "success" && classResponse.data.class) {
        const classData = classResponse.data.class;

        if (
          classData.enrolledStudents &&
          classData.enrolledStudents.length > 0
        ) {
          // ✅ Extract only string IDs
          const studentIds: string[] = classData.enrolledStudents.map(
            (es: any) =>
              typeof es.studentId === "object" ? es.studentId._id : es.studentId
          );

          console.log("Fetching student details for IDs:", studentIds);

          const studentsResponse = await usersAPI.getUsers(
            {
              role: "student",
              ids: studentIds,
            },
            token
          );

          if (studentsResponse.status === "success") {
            setStudents(studentsResponse.data.users || []);
          } else {
            console.error("Failed to fetch students:", studentsResponse);
          }
        } else {
          setStudents([]);
        }
      }
    } catch (err: any) {
      console.error("Error fetching students:", err);
      setStudents([]);
    }
  };

  // const fetchAttendanceRecords = async () => {
  //   if (!selectedClass) return;

  //   try {
  //     // Mock attendance data - replace with actual API call
  //     const mockAttendance: AttendanceRecord[] = students.map((student) => ({
  //       id: `${student.id}-${selectedDate}`,
  //       studentId: student.id,
  //       studentName: `${student.firstName} ${student.lastName}`,
  //       classId: selectedClass._id,
  //       date: selectedDate,
  //       status:
  //         Math.random() > 0.2
  //           ? "present"
  //           : Math.random() > 0.5
  //           ? "absent"
  //           : "late",
  //       notes: "",
  //       markedBy: user?.id || "",
  //       markedAt: new Date().toISOString(),
  //     }));

  //     setAttendanceRecords(mockAttendance);
  //   } catch (err: any) {
  //     console.error("Error fetching attendance:", err);
  //   }
  // };

  // const markAttendance = async (
  //   studentId: string,
  //   status: "present" | "absent" | "late" | "excused",
  //   notes?: string
  // ) => {
  //   try {
  //     // Update local state immediately for better UX
  //     setAttendanceRecords((prev) =>
  //       prev.map((record) =>
  //         record.studentId === studentId
  //           ? {
  //               ...record,
  //               status,
  //               notes: notes || "",
  //               markedAt: new Date().toISOString(),
  //             }
  //           : record
  //       )
  //     );

  //     // Mock API call - replace with actual implementation
  //     await new Promise((resolve) => setTimeout(resolve, 500));
  //   } catch (err: any) {
  //     setError("Failed to mark attendance");
  //   }
  // };
  const fetchAttendanceRecords = async () => {
    if (!selectedClass) return;

    try {
      const token = localStorage.getItem("accessToken") ?? "";

      const res = await fetch(
        `http://localhost:5000/api/attendance?classId=${selectedClass._id}&date=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await res.json();
      if (result.status === "success") {
        const mapped = result.data.records.map((r: any) => ({
          id: r._id,
          studentId: r.studentId._id,
          studentName: `${r.studentId.firstName} ${r.studentId.lastName}`,
          classId: r.classId,
          date: r.date,
          status: r.status,
          notes: r.notes || "",
          markedBy: r.markedBy,
          markedAt: r.markedAt,
        }));
        setAttendanceRecords(mapped);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  const markAttendance = async (
    studentId: string,
    status: "present" | "absent" | "late" | "excused",
    notes?: string
  ) => {
    try {
      const token = localStorage.getItem("accessToken") ?? "";

      await fetch(`http://localhost:5000/api/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId,
          classId: selectedClass?._id,
          date: selectedDate,
          status,
          notes: notes || "",
        }),
      });

      setAttendanceRecords((prev) =>
        prev.map((record) =>
          record.studentId === studentId
            ? {
                ...record,
                status,
                notes: notes || "",
                markedAt: new Date().toISOString(),
              }
            : record
        )
      );
    } catch (err) {
      setError("Failed to mark attendance");
    }
  };

  const generateMonthlyReport = async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);

      // Mock monthly report data - replace with actual API call
      const mockReport: MonthlyReport[] = students.map((student) => {
        const totalDays = 22; // Working days in month
        const presentDays = Math.floor(Math.random() * 5) + 18; // 18-22 days
        const absentDays = Math.floor(Math.random() * 3);
        const lateDays = Math.floor(Math.random() * 2);
        const excusedDays = totalDays - presentDays - absentDays - lateDays;

        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays,
          attendancePercentage: Math.round((presentDays / totalDays) * 100),
        };
      });

      setMonthlyReport(mockReport);
      setIsReportModalOpen(true);
    } catch (err: any) {
      setError("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "late":
        return "bg-orange-100 text-orange-800";
      case "excused":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "absent":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "late":
        return <Clock className="w-4 h-4 text-orange-600" />;
      case "excused":
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const attendanceStats = {
    totalStudents: students.length,
    presentToday: attendanceRecords.filter((r) => r.status === "present")
      .length,
    absentToday: attendanceRecords.filter((r) => r.status === "absent").length,
    lateToday: attendanceRecords.filter((r) => r.status === "late").length,
    attendanceRate:
      students.length > 0
        ? Math.round(
            (attendanceRecords.filter((r) => r.status === "present").length /
              students.length) *
              100
          )
        : 0,
  };

  const reportColumns = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (value: string, row: MonthlyReport) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {value
                .split(" ")
                .map((n) => n.charAt(0))
                .join("")}
            </span>
          </div>
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      key: "totalDays",
      label: "Total Days",
      sortable: true,
    },
    {
      key: "presentDays",
      label: "Present",
      sortable: true,
      render: (value: number) => (
        <span className="text-green-600 font-medium">{value}</span>
      ),
    },
    {
      key: "absentDays",
      label: "Absent",
      sortable: true,
      render: (value: number) => (
        <span className="text-red-600 font-medium">{value}</span>
      ),
    },
    {
      key: "lateDays",
      label: "Late",
      sortable: true,
      render: (value: number) => (
        <span className="text-orange-600 font-medium">{value}</span>
      ),
    },
    {
      key: "attendancePercentage",
      label: "Attendance %",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                value >= 90
                  ? "bg-green-500"
                  : value >= 75
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${value}%` }}
            ></div>
          </div>
          <span
            className={`font-medium ${
              value >= 90
                ? "text-green-600"
                : value >= 75
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {value}%
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value: any, row: MonthlyReport) => (
        <button
          onClick={() => {
            const student = students.find((s) => s.id === row.studentId);
            if (student) {
              setSelectedStudent(student);
              setIsStudentDetailModalOpen(true);
            }
          }}
          className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  if (loading && classes.length === 0) {
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
            Attendance Management
          </h2>
          <p className="text-gray-600 mt-1">
            Mark attendance and generate reports for your classes
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedClass?._id || ""}
            onChange={(e) => {
              const classItem = classes.find((c) => c._id === e.target.value);
              setSelectedClass(classItem || null);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Class</option>
            {classes.map((classItem) => (
              <option key={classItem._id} value={classItem._id}>
                {classItem.title} - {classItem.level}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!selectedClass ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center h-64">
          <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Select a Class</h3>
          <p className="text-gray-500 mt-1">
            Choose a class to start marking attendance
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Students
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {attendanceStats.totalStudents}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Present Today
                  </p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {attendanceStats.presentToday}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Absent Today
                  </p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {attendanceStats.absentToday}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Late Today
                  </p>
                  <p className="text-2xl font-bold text-orange-600 mt-2">
                    {attendanceStats.lateToday}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Attendance Rate
                  </p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {attendanceStats.attendanceRate}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Class Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedClass.title}
                </h3>
                <p className="text-gray-600">
                  {selectedClass.subject} • {selectedClass.level}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {dayNames[selectedClass.schedule.dayOfWeek]}{" "}
                  {selectedClass.schedule.startTime} -{" "}
                  {selectedClass.schedule.endTime} •{" "}
                  {selectedClass.locationId.name}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={generateMonthlyReport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Monthly Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Attendance Marking */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Mark Attendance - {new Date(selectedDate).toLocaleDateString()}
              </h3>
            </div>
            <div className="p-6">
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">
                    No Students Enrolled
                  </h3>
                  <p className="text-gray-500 mt-1">
                    This class doesn't have any students enrolled yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {students.map((student) => {
                    const attendanceRecord = attendanceRecords.find(
                      (r) => r.studentId === student.id
                    );
                    const currentStatus = attendanceRecord?.status || "present";

                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {student.firstName.charAt(0)}
                              {student.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {student.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {["present", "absent", "late", "excused"].map(
                            (status) => (
                              <button
                                key={status}
                                onClick={() =>
                                  markAttendance(student.id, status as any)
                                }
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                                  currentStatus === status
                                    ? getStatusColor(status)
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                {getStatusIcon(status)}
                                <span className="capitalize">{status}</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Monthly Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={`Monthly Attendance Report - ${selectedClass?.title || "Class"}`}
        size="xl"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                // Export functionality
                const csvContent = monthlyReport
                  .map(
                    (row) =>
                      `${row.studentName},${row.totalDays},${row.presentDays},${row.absentDays},${row.lateDays},${row.attendancePercentage}%`
                  )
                  .join("\n");

                const blob = new Blob(
                  [
                    `Student Name,Total Days,Present,Absent,Late,Attendance %\n${csvContent}`,
                  ],
                  { type: "text/csv" }
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `attendance-report-${selectedMonth}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <DataTable
            columns={reportColumns}
            data={monthlyReport}
            title={`Attendance Report for ${new Date(
              selectedMonth
            ).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
            searchable={true}
            exportable={false}
          />
        </div>
      </Modal>

      {/* Student Detail Modal */}
      <Modal
        isOpen={isStudentDetailModalOpen}
        onClose={() => {
          setIsStudentDetailModalOpen(false);
          setSelectedStudent(null);
        }}
        title="Student Attendance Details"
        size="lg"
      >
        {selectedStudent && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-medium">
                  {selectedStudent.firstName.charAt(0)}
                  {selectedStudent.lastName.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <p className="text-gray-600">{selectedStudent.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Contact Information
                </h4>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Phone:</span>{" "}
                    {selectedStudent.phoneNumber || "Not provided"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Parent Email:</span>{" "}
                    {selectedStudent.parentEmail || "Not provided"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Enrollment Date:</span>{" "}
                    {selectedStudent.enrollmentDate
                      ? new Date(
                          selectedStudent.enrollmentDate
                        ).toLocaleDateString()
                      : "Not available"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Attendance Summary
                </h4>
                <div className="space-y-2">
                  {monthlyReport.find(
                    (r) => r.studentId === selectedStudent.id
                  ) && (
                    <>
                      <p className="text-sm">
                        <span className="font-medium">Present Days:</span>{" "}
                        <span className="text-green-600">
                          {
                            monthlyReport.find(
                              (r) => r.studentId === selectedStudent.id
                            )?.presentDays
                          }
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Absent Days:</span>{" "}
                        <span className="text-red-600">
                          {
                            monthlyReport.find(
                              (r) => r.studentId === selectedStudent.id
                            )?.absentDays
                          }
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Late Days:</span>{" "}
                        <span className="text-orange-600">
                          {
                            monthlyReport.find(
                              (r) => r.studentId === selectedStudent.id
                            )?.lateDays
                          }
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Attendance Rate:</span>{" "}
                        <span className="text-blue-600 font-semibold">
                          {
                            monthlyReport.find(
                              (r) => r.studentId === selectedStudent.id
                            )?.attendancePercentage
                          }
                          %
                        </span>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AttendancePage;
