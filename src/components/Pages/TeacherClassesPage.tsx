import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  Eye,
  Phone,
  Mail,
  User,
  MapPin,
  GraduationCap,
  Award,
  TrendingUp,
} from "lucide-react";
import Modal from "../Common/Modal";
import { classesAPI, usersAPI } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";

interface Class {
  _id: string;
  title: string;
  level: string;
  subject: string;
  description?: string;
  locationId: {
    _id: string;
    name: string;
    address: any;
  };
  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    duration: number;
  };
  capacity: number;
  currentEnrollment: number;
  monthlyFee: {
    amount: number;
    currency: string;
  };
  fees?: any[];
  status: string;
  startDate: string;
  endDate: string;
  enrolledStudents?: EnrolledStudent[];
}

interface EnrolledStudent {
  studentId: string;
  enrollmentDate: string;
  status: string;
}

interface StudentDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  parentEmail?: string;
  locationId?: string;
  locationName?: string;
  enrollmentDate?: string;
  status: string;
  attendanceRate?: number;
  lastGrade?: string;
  createdAt: string;
  enrollmentStatus?: string;
}

const TeacherClassesPage: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classStudents, setClassStudents] = useState<StudentDetails[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(
    null
  );
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [isStudentDetailModalOpen, setIsStudentDetailModalOpen] =
    useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

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

  const fetchTeacherClasses = async () => {
    try {
      setLoading(true);
      // Fetch classes for the current teacher
      const response = await classesAPI.getClasses();
      if (response.status === "success") {
        setClasses(response.data.classes || []);
      } else {
        throw new Error(response.message || "Failed to fetch classes");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async (classId: string) => {
    try {
      setStudentsLoading(true);
      const token = localStorage.getItem("accessToken") ?? undefined;

      // Get class details with enrolled students
      const classResponse = await classesAPI.getClassById(classId);

      if (classResponse.status === "success" && classResponse.data.class) {
        const classData = classResponse.data.class;

        // If there are enrolled students, fetch their details
        if (
          classData.enrolledStudents &&
          classData.enrolledStudents.length > 0
        ) {
          const studentIds = classData.enrolledStudents.map(
            (es: any) => es.studentId?._id || es.studentId
          );

          // Fetch student details
          const studentsResponse = await usersAPI.getUsers({
            role: "student",
            ids: studentIds,
          });

          if (studentsResponse.status === "success") {
            // Merge enrollment data with student details
            const studentsWithEnrollment = studentsResponse.data.users.map(
              (student: any) => {
                const enrollment = classData.enrolledStudents.find(
                  (es: EnrolledStudent) => es.studentId === student.id
                );

                return {
                  ...student,
                  enrollmentDate: enrollment?.enrollmentDate,
                  enrollmentStatus: enrollment?.status,
                  attendanceRate: Math.floor(Math.random() * 20) + 80, // Mock data
                  lastGrade: ["A+", "A", "A-", "B+", "B", "B-"][
                    Math.floor(Math.random() * 6)
                  ],
                };
              }
            );

            setClassStudents(studentsWithEnrollment);
          }
        } else {
          setClassStudents([]);
        }
      }
    } catch (err: any) {
      console.error("Error fetching class students:", err);
      setClassStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleViewStudents = async (classItem: Class) => {
    setSelectedClass(classItem);
    setIsStudentsModalOpen(true);
    await fetchClassStudents(classItem._id);
  };

  const handleViewStudentDetails = (student: StudentDetails) => {
    setSelectedStudent(student);
    setIsStudentDetailModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEnrollmentStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "dropped":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900">My Classes</h2>
          <p className="text-gray-600 mt-1">
            View and manage your assigned classes and students
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Total Classes: </span>
            <span className="font-semibold text-gray-900">
              {classes.length}
            </span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Active Classes: </span>
            <span className="font-semibold text-green-600">
              {classes.filter((c) => c.status === "active").length}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center h-64">
          <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            No Classes Assigned
          </h3>
          <p className="text-gray-500 mt-1">
            You don't have any classes assigned yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <div
              key={classItem._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                {/* Class Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {classItem.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {classItem.subject} • {classItem.level}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      classItem.status
                    )}`}
                  >
                    {classItem.status.charAt(0).toUpperCase() +
                      classItem.status.slice(1)}
                  </span>
                </div>

                {/* Class Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{classItem.locationId?.name || "No Location"}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{dayNames[classItem.schedule.dayOfWeek]}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {classItem.schedule.startTime} -{" "}
                      {classItem.schedule.endTime}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>
                      {classItem.currentEnrollment} / {classItem.capacity}{" "}
                      students
                    </span>
                  </div>
                </div>

                {/* Enrollment Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Enrollment</span>
                    <span className="font-medium text-gray-900">
                      {Math.round(
                        (classItem.currentEnrollment / classItem.capacity) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (classItem.currentEnrollment / classItem.capacity) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Monthly Fee */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Monthly Fee</span>
                    <span className="font-semibold text-gray-900">
                      {(() => {
                        const tuitionFee = classItem.fees?.find(
                          (f) =>
                            f.frequency === "monthly" &&
                            f.category === "tuition" &&
                            typeof f.amount === "number"
                        );
                        return tuitionFee
                          ? `Rs ${tuitionFee.amount.toLocaleString()}`
                          : "Rs Not Set";
                      })()}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleViewStudents(classItem)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>View Students ({classItem.currentEnrollment})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Students List Modal */}
      <Modal
        isOpen={isStudentsModalOpen}
        onClose={() => {
          setIsStudentsModalOpen(false);
          setSelectedClass(null);
          setClassStudents([]);
        }}
        title={`Students in ${selectedClass?.title || "Class"}`}
        size="xl"
      >
        {selectedClass && (
          <div className="space-y-6">
            {/* Class Info Header */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">
                  {selectedClass.title}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    selectedClass.status
                  )}`}
                >
                  {selectedClass.status.charAt(0).toUpperCase() +
                    selectedClass.status.slice(1)}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Subject:</span>
                  <p className="font-medium">{selectedClass.subject}</p>
                </div>
                <div>
                  <span className="text-gray-600">Level:</span>
                  <p className="font-medium">{selectedClass.level}</p>
                </div>
                <div>
                  <span className="text-gray-600">Schedule:</span>
                  <p className="font-medium">
                    {dayNames[selectedClass.schedule.dayOfWeek]}{" "}
                    {selectedClass.schedule.startTime}-
                    {selectedClass.schedule.endTime}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Enrollment:</span>
                  <p className="font-medium">
                    {selectedClass.currentEnrollment}/{selectedClass.capacity}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Class Capacity</span>
                  <span className="font-medium">
                    {Math.round(
                      (selectedClass.currentEnrollment /
                        selectedClass.capacity) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${
                        (selectedClass.currentEnrollment /
                          selectedClass.capacity) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Students List */}
            {studentsLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : classStudents.length === 0 ? (
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
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {classStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
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
                        <p className="text-sm text-gray-500">{student.email}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">
                            Enrolled:{" "}
                            {student.enrollmentDate
                              ? new Date(
                                  student.enrollmentDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                          {student.attendanceRate && (
                            <span className="text-xs text-gray-500">
                              Attendance: {student.attendanceRate}%
                            </span>
                          )}
                          {student.lastGrade && (
                            <span className="text-xs text-gray-500">
                              Grade: {student.lastGrade}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getEnrollmentStatusColor(
                          student.enrollmentStatus || "active"
                        )}`}
                      >
                        {(student.enrollmentStatus || "active")
                          .charAt(0)
                          .toUpperCase() +
                          (student.enrollmentStatus || "active").slice(1)}
                      </span>
                      <button
                        onClick={() => handleViewStudentDetails(student)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Student Details Modal */}
      <Modal
        isOpen={isStudentDetailModalOpen}
        onClose={() => {
          setIsStudentDetailModalOpen(false);
          setSelectedStudent(null);
        }}
        title="Student Details"
        size="lg"
      >
        {selectedStudent && (
          <div className="space-y-6">
            {/* Student Header */}
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
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getEnrollmentStatusColor(
                    selectedStudent.status
                  )}`}
                >
                  {selectedStudent.status.charAt(0).toUpperCase() +
                    selectedStudent.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Student Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Information</span>
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">
                        {selectedStudent.email}
                      </p>
                    </div>
                  </div>

                  {selectedStudent.phoneNumber && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">
                          {selectedStudent.phoneNumber}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedStudent.parentEmail && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Parent Email</p>
                        <p className="font-medium text-gray-900">
                          {selectedStudent.parentEmail}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedStudent.locationName && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium text-gray-900">
                          {selectedStudent.locationName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>Academic Information</span>
                </h4>

                <div className="space-y-3">
                  {selectedStudent.enrollmentDate && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Enrollment Date</p>
                        <p className="font-medium text-gray-900">
                          {new Date(
                            selectedStudent.enrollmentDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedStudent.attendanceRate && (
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Attendance Rate</p>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">
                            {selectedStudent.attendanceRate}%
                          </p>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                selectedStudent.attendanceRate >= 90
                                  ? "bg-green-500"
                                  : selectedStudent.attendanceRate >= 75
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${selectedStudent.attendanceRate}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedStudent.lastGrade && (
                    <div className="flex items-center space-x-3">
                      <Award className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Last Grade</p>
                        <p className="font-medium text-gray-900">
                          {selectedStudent.lastGrade}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Joined</p>
                      <p className="font-medium text-gray-900">
                        {new Date(
                          selectedStudent.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Quick Actions
              </h4>
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200 flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
                <button className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200 flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Contact Parent</span>
                </button>
                <button className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors duration-200 flex items-center space-x-2">
                  <Award className="w-4 h-4" />
                  <span>View Grades</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeacherClassesPage;
