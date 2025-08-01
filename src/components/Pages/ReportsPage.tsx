import React, { useState, useEffect } from 'react';
import { Download, Filter, Calendar, TrendingUp, Users, DollarSign, BookOpen, BarChart3, PieChart, FileText, Eye, RefreshCw, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { classesAPI, usersAPI, locationsAPI, attendanceAPI, feesAPI } from '../../utils/api';

interface ReportData {
  id: string;
  name: string;
  description: string;
  category:
    | "academic"
    | "financial"
    | "attendance"
    | "enrollment"
    | "performance";
  type: "summary" | "detailed" | "analytics";
  lastGenerated: string;
  size: string;
  format: "pdf" | "excel" | "csv";
}

interface ClassOverviewData {
  classId: string;
  className: string;
  subject: string;
  level: string;
  teacherName: string;
  locationName: string;
  totalStudents: number;
  activeStudents: number;
  averageAttendance: number;
  totalRevenue: number;
  pendingFees: number;
}

interface AttendanceData {
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  attendanceRate: number;
}

interface FeeCollectionData {
  studentId: string;
  studentName: string;
  className: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  lastPaymentDate: string;
  paymentStatus: "paid" | "partial" | "pending" | "overdue";
}

interface EnrollmentData {
  locationId: string;
  locationName: string;
  totalClasses: number;
  totalStudents: number;
  newEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  enrollmentTrend: number;
}


interface FeeTotals {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  collectionRate: number;
  overdueCount: number;
}


interface StudentPaymentDetail {
  studentId: string;
  studentName: string;
  email: string;
  phoneNumber?: string;
  parentEmail?: string;
  monthlyFee: number;
  paidAmount: number;
  pendingAmount: number;
  lastPaymentDate?: string;
  paymentStatus: "paid" | "partial" | "pending" | "overdue";
  paymentMethod?: string;
}

interface LocationRevenue {
  locationId: string;
  locationName: string;
  totalClasses: number;
  totalStudents: number;
  monthlyRevenue: number;
  receivedAmount: number;
  pendingAmount: number;
  collectionRate: number;
  classes: ClassRevenue[];
}
interface ClassRevenue {
  classId: string;
  className: string;
  subject: string;
  level: string;
  teacherName: string;
  studentCount: number;
  monthlyFee: number;
  totalRevenue: number;
  receivedAmount: number;
  pendingAmount: number;
  collectionRate: number;
  students: StudentPaymentDetail[];
}



const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  
  // Data states
  const [classOverviewData, setClassOverviewData] = useState<
    ClassOverviewData[]
  >([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [feeCollectionData, setFeeCollectionData] = useState<FeeCollectionData[]>([]);
  const [feeTotals, setFeeTotals] = useState({
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    collectionRate: 0,
    overdueCount: 0,
    
  });
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData[]>([]);

  // Filter states
  const [filters, setFilters] = useState({
    dateRange: "month",
    startDate: new Date().toISOString().slice(0, 7), // YYYY-MM
    endDate: new Date().toISOString().slice(0, 7),
    locationId: 'all',
    classId: 'all',
    teacherId: 'all',
    studentId: 'all',
    status: 'all',
    role: 'all'
  });

  // Reference data
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [approvedStudentsCount, setApprovedStudentsCount] = useState(0);
  const [attendanceSummary, setAttendanceSummary] = useState<any[]>([]);
  const [locationRevenue, setLocationRevenue] = useState<LocationRevenue[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<any[]>([]);



  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [chartView, setChartView] = useState<"table" | "chart">("table");

  useEffect(() => {
    fetchReferenceData();
    fetchUserRegistrations();
  }, []);


  useEffect(() => {
    if (selectedReport) {
      fetchReportData();
      fetchLocations()
      fetchFeeCollectionData();
    }
  }, [selectedReport, filters]);

    // attendace Summary 
    useEffect(() => {
      if (classes.length > 0 && attendanceSummary.length > 0) {
        generateClassOverviewData();
      }
    }, [classes, attendanceSummary, filters]);

  
    const fetchFeeCollectionData = async () => {
      try {
        const token = localStorage.getItem("token") || undefined;
        const response = await feesAPI.getStructures(token); // <-- Your API call
    
        if (response.status === "success") {
          // ---- Map response data ----
          const mapped = response.data.map((f: any) => {
            const pending = f.amount - (f.paidAmount || 0);
            return {
              studentName: f.studentName,
              className: f.className,
              totalAmount: f.amount,
              paidAmount: f.paidAmount || 0,
              pendingAmount: pending,
              paymentStatus:
                f.status === "paid"
                  ? "paid"
                  : pending === 0
                  ? "paid"
                  : f.status === "pending" && new Date(f.dueDate) < new Date()
                  ? "overdue"
                  : "pending",
              lastPaymentDate: f.paidDate || f.dueDate
            };
          });
    
          // ---- Calculate Totals ----
          const totalCollected = mapped.reduce((sum: any, f: { paidAmount: any; }) => sum + f.paidAmount, 0);
          const totalPending = mapped.reduce((sum: any, f: { pendingAmount: any; }) => sum + f.pendingAmount, 0);
          const totalExpected = totalCollected + totalPending;
          const collectionRate = totalExpected
            ? Math.round((totalCollected / totalExpected) * 100)
            : 0;
          const overdueCount = mapped.filter((f: { paymentStatus: string; }) => f.paymentStatus === "overdue").length;
    
          // ---- Update States ----
          setFeeCollectionData(mapped);
          setFeeTotals({
            totalExpected,
            totalCollected,
            totalPending,
            collectionRate,
            overdueCount
          });
        }
      } catch (error) {
        console.error("Error fetching fee data:", error);
      }
    };
    
    const fetchUserRegistrations = async () => {
      try {
        const token = localStorage.getItem("token") ?? undefined;
        const res = await usersAPI.getUsers({ page: 1, limit: 50 }, token);
        if (res.status === "success") {
          const usersWithLocation = res.data.users.map((user: any) => ({
            ...user,
            locationName: user.locationId?.name || "Unknown Location",
            registrationDate: user.registrationDate || user.createdAt, // fallback
            lastLogin: user.lastLogin || null,
            classesAssigned: user.classesAssigned || 0,
            classesEnrolled: user.classesEnrolled || 0,
            childrenCount: user.childrenCount || 0
          }));
          setUserRegistrations(usersWithLocation);
        }
      } catch (error) {
        console.error("Error fetching user registrations", error);
      }
    };

  const fetchLocations = async () => {
    const token = localStorage.getItem("token") || undefined;
    try {
      const locationResponse = await feesAPI.getLocationFromClasses(token);

      if (locationResponse.status !== "success") {
        throw new Error(locationResponse.message || "Failed to fetch location revenue");
      }

      const mappedLocationRevenue: LocationRevenue[] = locationResponse.data.locations.map(
        (loc: any) => ({
          locationId: loc.location,
          locationName: loc.location,
          totalClasses: loc.totalClasses,
          totalStudents: 0,
          monthlyRevenue: loc.totalFee,
          receivedAmount: loc.totalFee,
          pendingAmount: 0,
          collectionRate: 100,
          classes: loc.classes.map((cls: any) => ({
            classId: cls.classId,
            className: cls.title,
            subject: "",
            level: "",
            teacherName: "",
            studentCount: 0,
            monthlyFee: cls.feeTotal,
            totalRevenue: cls.feeTotal,
            receivedAmount: cls.feeTotal,
            pendingAmount: 0,
            collectionRate: 100,
            students: [],
          })),
        })
      );

      setLocationRevenue(mappedLocationRevenue);

    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const token = localStorage.getItem('accessToken') ?? undefined;

      const [classesResponse, teachersResponse, locationsResponse, studentsResponse, attendanceResponse] = await Promise.all([
        classesAPI.getClasses({}, token),
        usersAPI.getUsers({ role: 'teacher' }, token),
        locationsAPI.getLocations({}, token),
        usersAPI.getUsers({ role: 'student' }, token),
        attendanceAPI.getRecords({}, token) // 
      ]);

      if (classesResponse.status === 'success') {
        setClasses(classesResponse.data.classes || []);
      }

      if (teachersResponse.status === 'success') {
        setTeachers(teachersResponse.data.users || []);
      }

      if (locationsResponse.status === 'success') {
        setLocations(locationsResponse.data.locations || []);
      }

      if (studentsResponse.status === 'success') {
        setStudents(studentsResponse.data.users || []);
      }

      if (attendanceResponse.status === 'success') {
        // Convert API response into your AttendanceData[] structure
        const formatted = attendanceResponse.data.records.map((r: any) => ({
          studentId: r.studentId._id,
          studentName: `${r.studentId.firstName} ${r.studentId.lastName}`,
          className: r.classId?.title || 'Unknown',
          date: r.date,
          status: r.status,
          attendanceRate: 100 // For now, API does not return rate → use default or calculate separately
        }));
        setAttendanceData(formatted);
      }

    } catch (err: any) {
      setError(err.message || "Failed to fetch reference data");
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Mock data generation based on selected report
      switch (selectedReport) {
        case "class-overview":
          await generateClassOverviewData();
          break;
        case "attendance":
          await generateAttendanceData();
          break;
        case "fee-collection":
          await generateFeeCollectionData();
          break;
        case "enrollment":
          await generateEnrollmentData();
          break;
        default:
          break;
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const generateClassOverviewData = async () => {
    // Filter classes based on filters
    const filteredClasses = classes
      .filter(c => filters.locationId === "all" || c.locationId._id === filters.locationId)
      .filter(c => filters.teacherId === "all" || c.teacherId._id === filters.teacherId);

    // Map each class to your overview structure
    const overview = filteredClasses.map((classItem) => {
      // Find attendance for this class from summary
      const attendanceForClass = attendanceSummary.find(
        (a: any) => a.classId === classItem._id
      );

      // Calculate averageAttendance from attendance data if available
      const totalMarked = attendanceForClass?.totalStudentsMarked || 0;
      const presentCountObj = attendanceForClass?.counts?.find((c: any) => c.status === "present");
      const presentCount = presentCountObj ? presentCountObj.count : 0;

      const averageAttendance =
        totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

      // Calculate revenue and pending fees (replace with your real data logic)
      const monthlyFeeAmount = classItem.monthlyFee?.amount || 4500;
      const totalStudents = classItem.currentEnrollment;
      const totalRevenue = totalStudents * monthlyFeeAmount;
      const pendingFees = Math.floor(totalStudents * 0.1) * monthlyFeeAmount;

      return {
        classId: classItem._id,
        className: classItem.title,
        subject: classItem.subject,
        level: classItem.level,
        teacherName: `${classItem.teacherId.firstName} ${classItem.teacherId.lastName}`,
        locationName: classItem.locationId.name,
        totalStudents: totalStudents,
        activeStudents: Math.floor(totalStudents * 0.95), // or calculate real active students if you have data
        averageAttendance,
        totalRevenue,
        pendingFees,
      };
    });

    setClassOverviewData(overview);
  };

  const generateAttendanceData = async () => {
    try {
      const token = localStorage.getItem("accessToken") ?? undefined;

      // Pass filters if needed (classId, date, etc.)
      const res = await attendanceAPI.getRecords(
        {
          classId: filters.classId !== "all" ? filters.classId : undefined,
          date: filters.startDate, // optional: or use range logic
        },
        token
      );

      if (res.status === "success") {
        // Convert backend data to AttendanceData[]
        const formatted: AttendanceData[] = res.data.records.map((r: any) => ({
          studentId: r.studentId._id,
          studentName: `${r.studentId.firstName} ${r.studentId.lastName}`,
          className: r.classId?.title || "Unknown",
          date: r.date,
          status: r.status,
          attendanceRate: 100 // If you need actual rate, add summary API
        }));

        setAttendanceData(formatted);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };


  const generateFeeCollectionData = async () => {
    try {
      const token = localStorage.getItem("accessToken") ?? undefined;
      const res = await feesAPI.getStudentFees(token);

      if (res.status === "success") {
        const formatted = res.data.map((r: any) => ({
          studentId: r.studentId,
          studentName: r.studentName,
          className: r.className,
          totalAmount: r.amount,
          paidAmount: r.paidAmount || 0,
          pendingAmount: r.amount - (r.paidAmount || 0),
          lastPaymentDate: r.paidDate || null,
          paymentStatus: r.status || "pending",
        }));

        setFeeCollectionData(formatted);
      } else {
        setFeeCollectionData([]);
      }
    } catch (err) {
      console.error("Error fetching fee collection data:", err);
      setFeeCollectionData([]);
    }
  };

  const generateEnrollmentData = async () => {
    // Mock enrollment data 
    const mockData: EnrollmentData[] = locations.map(location => {
      const locationClasses = classes.filter(c => c.locationId._id === location.id);
      const totalStudents = locationClasses.reduce((sum, c) => sum + c.currentEnrollment, 0);

      return {
        locationId: location.id,
        locationName: location.name,
        totalClasses: locationClasses.length,
        totalStudents,
        newEnrollments: Math.floor(totalStudents * 0.1),
        activeEnrollments: Math.floor(totalStudents * 0.95),
        completedEnrollments: Math.floor(totalStudents * 0.05),
        enrollmentTrend: Math.floor(Math.random() * 20) - 10,
      };
    });

    setEnrollmentData(mockData);
  };

  const exportReport = (data: any[], filename: string) => {
    if (!data.length) return;

    const headers = Object.keys(data[0]).join(',');
    const csvData = data.map(row => Object.values(row).join(',')).join('\n');

    const blob = new Blob([headers + '\n' + csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getReportTitle = () => {
    switch (selectedReport) {
      case 'class-overview':
        return 'Class Overview Report';
      // case 'attendance':
      //   return 'Attendance Report';
      case 'fee-collection':
        return 'Fee Collection Report';
      case 'enrollment':
        return 'Student Enrollment Report';
      case 'revenue-summary':
        return 'Revenue Summary Report';
      case 'user-registration':
        return 'User Registration & Approval Report';
      default:
        return "Report";
    }
  };

  const renderReportContent = () => {
    if (!selectedReport) {
      return (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select a Report
          </h3>
          <p className="text-gray-600">
            Choose a report type from the sidebar to view data
          </p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    switch (selectedReport) {
      case "class-overview":
        return renderClassOverviewReport();
      // case 'attendance':
      //   return renderAttendanceReport();
      case 'fee-collection':
        return renderFeeCollectionReport();
      case "enrollment":
        return renderEnrollmentReport();
      case "revenue-summary":
        return renderRevenueSummaryReport();
      case "user-registration":
        return renderUserRegistrationReport();
      case "schedule-summary":
        return renderScheduleSummaryReport();
      default:
        return <div>Report data will be displayed here</div>;
    }
  };

  const renderClassOverviewReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Classes</p>
              <p className="text-2xl font-bold text-blue-900">
                {classOverviewData.length}
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">
                Total Students
              </p>
              <p className="text-2xl font-bold text-green-900">
                {approvedStudentsCount}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">
                Avg Attendance
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {Math.round(
                  classOverviewData.reduce(
                    (sum, c) => sum + c.averageAttendance,
                    0
                  ) / classOverviewData.length || 0
                )}
                %
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-orange-900">
                LKR
                {classOverviewData
                  .reduce((sum, c) => sum + c.totalRevenue, 0)
                  .toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Chart/Table Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Class Performance Overview
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setChartView('table')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${chartView === 'table' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Table View
          </button>
          <button
            onClick={() => setChartView('chart')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${chartView === 'chart' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Chart View
          </button>
        </div>
      </div>

      {classOverviewData.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No data available for the selected filters.
        </div>
      ) : chartView === 'table' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classOverviewData.map((classData) => (
                  <tr key={classData.classId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {classData.className}
                        </p>
                        <p className="text-sm text-gray-500">
                          {classData.subject} • {classData.level}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {classData.teacherName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {classData.locationName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {classData.activeStudents}/{classData.totalStudents}
                        </span>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${
                                (classData.activeStudents /
                                  classData.totalStudents) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${classData.averageAttendance >= 90 ? 'text-green-600' :
                        classData.averageAttendance >= 75 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {classData.averageAttendance}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ₹{classData.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                      ₹{classData.pendingFees.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">
                Attendance Rates by Class
              </h4>
              <div className="space-y-3">
                {classOverviewData.map((classData) => (
                  <div
                    key={classData.classId}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {classData.className}
                    </span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${classData.averageAttendance >= 90 ? 'bg-green-500' :
                            classData.averageAttendance >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                          style={{ width: `${classData.averageAttendance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {classData.averageAttendance}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">
                Revenue by Class
              </h4>
              <div className="space-y-3">
                {classOverviewData.map((classData) => (
                  <div
                    key={classData.classId}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {classData.className}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        ₹{classData.totalRevenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-orange-600">
                        ₹{classData.pendingFees.toLocaleString()} pending
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // const renderAttendanceReport = () => (
  //   <div className="space-y-6">
  //     {/* Summary Cards */}
  //     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  //       <div className="bg-green-50 p-6 rounded-lg">
  //         <div className="flex items-center justify-between">
  //           <div>
  //             <p className="text-green-600 text-sm font-medium">Present</p>
  //             <p className="text-2xl font-bold text-green-900">
  //               {attendanceData.filter(a => a.status === 'present').length}
  //             </p>
  //           </div>
  //           <Users className="w-8 h-8 text-green-500" />
  //         </div>
  //       </div>
  //       <div className="bg-red-50 p-6 rounded-lg">
  //         <div className="flex items-center justify-between">
  //           <div>
  //             <p className="text-red-600 text-sm font-medium">Absent</p>
  //             <p className="text-2xl font-bold text-red-900">
  //               {attendanceData.filter(a => a.status === 'absent').length}
  //             </p>
  //           </div>
  //           <Users className="w-8 h-8 text-red-500" />
  //         </div>
  //       </div>
  //       <div className="bg-orange-50 p-6 rounded-lg">
  //         <div className="flex items-center justify-between">
  //           <div>
  //             <p className="text-orange-600 text-sm font-medium">Late</p>
  //             <p className="text-2xl font-bold text-orange-900">
  //               {attendanceData.filter(a => a.status === 'late').length}
  //             </p>
  //           </div>
  //           <Users className="w-8 h-8 text-orange-500" />
  //         </div>
  //       </div>
  //       <div className="bg-blue-50 p-6 rounded-lg">
  //         <div className="flex items-center justify-between">
  //           <div>
  //             <p className="text-blue-600 text-sm font-medium">Overall Rate</p>
  //             <p className="text-2xl font-bold text-blue-900">
  //               {Math.round((attendanceData.filter(a => a.status === 'present').length / attendanceData.length) * 100 || 0)}%
  //             </p>
  //           </div>
  //           <TrendingUp className="w-8 h-8 text-blue-500" />
  //         </div>
  //       </div>
  //     </div>

  //     {/* Attendance Table */}

  //     <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
  //       <div className="px-6 py-4 border-b border-gray-200">
  //         <h3 className="text-lg font-semibold text-gray-900">Daily Attendance Records</h3>
  //       </div>
  //       <div className="overflow-x-auto">
  //         {attendanceData.length === 0 ? (
  //           <div className="p-6 text-center text-gray-500">
  //             No attendance records available.
  //           </div>
  //         ) : (
  //           <table className="min-w-full divide-y divide-gray-200">
  //             <thead className="bg-gray-50">
  //               <tr>
  //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
  //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
  //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
  //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
  //                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Rate</th>
  //               </tr>
  //             </thead>
  //             <tbody className="bg-white divide-y divide-gray-200">
  //               {attendanceData.slice(0, 50).map((record, index) => (
  //                 <tr key={index} className="hover:bg-gray-50">
  //                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
  //                     {record.studentName}
  //                   </td>
  //                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  //                     {record.className}
  //                   </td>
  //                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  //                     {new Date(record.date).toLocaleDateString()}
  //                   </td>
  //                   <td className="px-6 py-4 whitespace-nowrap">
  //                     <span
  //                       className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === "present"
  //                         ? "bg-green-100 text-green-800"
  //                         : record.status === "absent"
  //                           ? "bg-red-100 text-red-800"
  //                           : record.status === "late"
  //                             ? "bg-orange-100 text-orange-800"
  //                             : "bg-blue-100 text-blue-800"
  //                         }`}
  //                     >
  //                       {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
  //                     </span>
  //                   </td>
  //                   <td className="px-6 py-4 whitespace-nowrap">
  //                     <div className="flex items-center space-x-2">
  //                       <div className="w-16 bg-gray-200 rounded-full h-2">
  //                         <div
  //                           className={`h-2 rounded-full ${record.attendanceRate >= 90
  //                             ? "bg-green-500"
  //                             : record.attendanceRate >= 75
  //                               ? "bg-yellow-500"
  //                               : "bg-red-500"
  //                             }`}
  //                           style={{ width: `${record.attendanceRate}%` }}
  //                         ></div>
  //                       </div>
  //                       <span className="text-sm text-gray-600">{record.attendanceRate}%</span>
  //                     </div>
  //                   </td>
  //                 </tr>
  //               ))}
  //             </tbody>
  //           </table>
  //         )}
  //       </div>
  //     </div>

  //   </div>
  // );

  const renderFeeCollectionReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">
                Total Collected
              </p>
              <p className="text-2xl font-bold text-green-900">
                ₹{feeTotals.totalCollected}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-orange-900">
                ₹
                {feeCollectionData
                  .reduce((sum, f) => sum + f.pendingAmount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">
                Collection Rate
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {Math.round(
                  (feeCollectionData.filter((f) => f.paymentStatus === "paid")
                    .length /
                    feeCollectionData.length) *
                    100 || 0
                )}
                %
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Overdue</p>
              <p className="text-2xl font-bold text-red-900">
                {
                  feeCollectionData.filter((f) => f.paymentStatus === "overdue")
                    .length
                }
              </p>
            </div>
            <Users className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Fee Collection Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Student-wise Fee Collection
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Payment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feeCollectionData.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-4 text-sm text-gray-500"
                  >
                    No fee collection records available
                  </td>
                </tr>
              ) : (
                feeCollectionData.map((fee, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {fee.studentName || "No Name"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fee.className || "No Classes"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{fee.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ₹{fee.paidAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                      ₹{fee.pendingAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${fee.paymentStatus === "paid"
                          ? "bg-green-100 text-green-800"
                          : fee.paymentStatus === "partial"
                            ? "bg-orange-100 text-orange-800"
                            : fee.paymentStatus === "overdue"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {fee.paymentStatus.charAt(0).toUpperCase() +
                          fee.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(fee.lastPaymentDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );

  const renderEnrollmentReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">
                Total Students
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {enrollmentData.reduce((sum, e) => sum + e.totalStudents, 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">
                New Enrollments
              </p>
              <p className="text-2xl font-bold text-green-900">
                {enrollmentData.reduce((sum, e) => sum + e.newEnrollments, 0)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">
                Active Students
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {enrollmentData.reduce(
                  (sum, e) => sum + e.activeEnrollments,
                  0
                )}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">
                Total Classes
              </p>
              <p className="text-2xl font-bold text-orange-900">
                {enrollmentData.reduce((sum, e) => sum + e.totalClasses, 0)}
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Enrollment by Location */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Enrollment by Location
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Students</th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Enrollments</th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {enrollmentData.map((enrollment) => (
                <tr key={enrollment.locationId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {enrollment.locationName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.totalClasses}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {enrollment.totalStudents}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    +{enrollment.newEnrollments}
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.activeEnrollments}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${enrollment.enrollmentTrend >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {enrollment.enrollmentTrend >= 0 ? '+' : ''}{enrollment.enrollmentTrend}%
                    </span>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRevenueSummaryReport = () => {
    // Mock revenue summary data
    const revenueSummaryData = user?.role === 'admin' ? locationRevenue.map(loc => ({
      locationId: loc.locationId,
      locationName: loc.locationName,
      currentMonth: loc.monthlyRevenue ?? 0,
      lastMonth: 0, // API doesn't provide → put default or calculate if needed
      currentQuarter: (loc.monthlyRevenue ?? 0) * 3,
      receivedCurrent: loc.receivedAmount ?? 0,
      pendingCurrent: loc.pendingAmount ?? 0
    })) : [
      {
        classId: '1',
        className: 'Advanced Mathematics',
        currentMonth: 112500,
        lastMonth: 108000,
        currentQuarter: 337500,
        lastQuarter: 324000,
        receivedCurrent: 108000,
        pendingCurrent: 4500,
        studentCount: 25
      },
      {
        classId: '2',
        className: 'Physics Fundamentals',
        currentMonth: 114400,
        lastMonth: 109200,
        currentQuarter: 343200,
        lastQuarter: 327600,
        receivedCurrent: 109200,
        pendingCurrent: 5200,
        studentCount: 22
      }
    ];

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">
                  Current Month
                </p>
                <p className="text-2xl font-bold text-green-900">
                  ₹{user?.role === 'admin'
                    ? revenueSummaryData.reduce((sum: number, item: any) => sum + item.currentMonth, 0).toLocaleString()
                    : revenueSummaryData.reduce((sum: number, item: any) => sum + item.currentMonth, 0).toLocaleString()
                  }
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Last Month</p>
                <p className="text-2xl font-bold text-blue-900">
                  ₹{user?.role === 'admin'
                    ? revenueSummaryData.reduce((sum: number, item: any) => sum + item.lastMonth, 0).toLocaleString()
                    : revenueSummaryData.reduce((sum: number, item: any) => sum + item.lastMonth, 0).toLocaleString()
                  }
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">
                  Current Quarter
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  ₹{user?.role === 'admin'
                    ? revenueSummaryData.reduce((sum: number, item: any) => sum + item.currentQuarter, 0).toLocaleString()
                    : revenueSummaryData.reduce((sum: number, item: any) => sum + item.currentQuarter, 0).toLocaleString()
                  }
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-orange-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">
                  Collection Rate
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {user?.role === 'admin'
                    ? Math.round((revenueSummaryData.reduce((sum: number, item: any) => sum + item.receivedCurrent, 0) /
                      revenueSummaryData.reduce((sum: number, item: any) => sum + item.currentMonth, 0)) * 100)
                    : Math.round((revenueSummaryData.reduce((sum: number, item: any) => sum + item.receivedCurrent, 0) /
                      revenueSummaryData.reduce((sum: number, item: any) => sum + item.currentMonth, 0)) * 100)
                  }%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Revenue Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {user?.role === "admin"
                ? "Location-wise Revenue Summary"
                : "Class-wise Revenue Summary"}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {user?.role === "admin" ? "Location" : "Class"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Quarter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collection Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenueSummaryData.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">
                          {user?.role === "admin"
                            ? item.locationName
                            : item.className}
                        </p>
                        {user?.role === "teacher" && (
                          <p className="text-sm text-gray-500">
                            {item.studentCount} students
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{item.currentMonth.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{item.lastMonth.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{item.currentQuarter.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ₹{item.receivedCurrent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                      ₹{item.pendingCurrent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${
                                (item.receivedCurrent / item.currentMonth) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(
                            (item.receivedCurrent / item.currentMonth) * 100
                          )}
                          %
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderUserRegistrationReport = () => {
    // Apply filters
    const filteredData = userRegistrations.filter(user => {
      const roleMatch = filters.role === 'all' || user.role === filters.role;
      const statusMatch = filters.status === 'all' || user.status === filters.status;
      const locationMatch = filters.locationId === 'all' || user.locationId === filters.locationId;
      return roleMatch && statusMatch && locationMatch;
    });

    return (
      <div className="space-y-6">
    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-blue-50 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-600 text-sm font-medium">Total Users</p>
            <p className="text-2xl font-bold text-blue-900">{filteredData.length}</p>
          </div>
          <Users className="w-8 h-8 text-blue-500" />
        </div>
      </div>
      <div className="bg-green-50 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-600 text-sm font-medium">Active Users</p>
            <p className="text-2xl font-bold text-green-900">
              {filteredData.filter(u => u.status === 'active').length}
            </p>
          </div>
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
      </div>
      <div className="bg-orange-50 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-600 text-sm font-medium">Pending Approval</p>
            <p className="text-2xl font-bold text-orange-900">
              {filteredData.filter(u => u.status === 'pending').length}
            </p>
          </div>
          <Clock className="w-8 h-8 text-orange-500" />
        </div>
      </div>
      <div className="bg-purple-50 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-600 text-sm font-medium">This Month</p>
            <p className="text-2xl font-bold text-purple-900">
              {filteredData.filter(u =>
                new Date(u.registrationDate).getMonth() === new Date().getMonth()
              ).length}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-purple-500" />
        </div>
      </div>
    </div>

    {/* User Registration Table */}
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">User Registration Details</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'student' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                    }`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800' :
                    user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.locationName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.role === 'teacher' && `${user.classesAssigned} classes`}
                  {user.role === 'student' && `${user.classesEnrolled} classes`}
                  {user.role === 'parent' && `${user.childrenCount} children`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
    );
  };

  const renderScheduleSummaryReport = () => {
    // Mock schedule summary data for teachers
    const scheduleSummaryData = [
      {
        classId: "1",
        className: "Advanced Mathematics",
        totalScheduled: 20,
        completed: 18,
        cancelled: 1,
        upcoming: 1,
        attendanceRate: 94.5,
        avgStudentsPresent: 23.6,
      },
      {
        classId: "2",
        className: "Physics Fundamentals",
        totalScheduled: 18,
        completed: 16,
        cancelled: 0,
        upcoming: 2,
        attendanceRate: 96.2,
        avgStudentsPresent: 21.2,
      },
    ];

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">
                  Total Scheduled
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {scheduleSummaryData.reduce(
                    (sum, item) => sum + item.totalScheduled,
                    0
                  )}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-900">
                  {scheduleSummaryData.reduce(
                    (sum, item) => sum + item.completed,
                    0
                  )}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-red-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Cancelled</p>
                <p className="text-2xl font-bold text-red-900">
                  {scheduleSummaryData.reduce(
                    (sum, item) => sum + item.cancelled,
                    0
                  )}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">
                  Avg Attendance
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {Math.round(
                    scheduleSummaryData.reduce(
                      (sum, item) => sum + item.attendanceRate,
                      0
                    ) / scheduleSummaryData.length
                  )}
                  %
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Schedule Summary Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Monthly Class Schedule Summary
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Scheduled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cancelled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upcoming
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Students Present
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduleSummaryData.map((schedule) => (
                  <tr key={schedule.classId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900">
                        {schedule.className}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {schedule.totalScheduled}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {schedule.completed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {schedule.cancelled}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {schedule.upcoming}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${schedule.attendanceRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {schedule.attendanceRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {schedule.avgStudentsPresent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Get available reports based on user role
  const getAvailableReports = () => {
    if (user?.role === "admin") {
      return [
        { id: 'class-overview', name: 'Class Overview Report', icon: BookOpen },
        // { id: 'attendance', name: 'Attendance Report', icon: Users },
        { id: 'fee-collection', name: 'Fee Collection Report', icon: DollarSign },
        { id: 'enrollment', name: 'Student Enrollment Report', icon: TrendingUp },
        { id: 'revenue-summary', name: 'Revenue Summary Report', icon: BarChart3 },
        { id: 'user-registration', name: 'User Registration & Approval Report', icon: FileText }
      ];
    } else if (user?.role === "teacher") {
      return [
        { id: "class-overview", name: "Class Overview Report", icon: BookOpen },
        {
          id: "attendance",
          name: "Attendance Report - Per Student",
          icon: Users,
        },
        {
          id: "fee-collection",
          name: "Fee Collection Report - Student Wise",
          icon: DollarSign,
        },
        {
          id: "revenue-summary",
          name: "Class-wise Revenue Summary",
          icon: BarChart3,
        },
        {
          id: "schedule-summary",
          name: "Monthly Class Schedule Summary",
          icon: Calendar,
        },
      ];
    }

    return [
      { id: "class-overview", name: "Class Overview Report", icon: BookOpen },
      { id: "attendance", name: "Attendance Report", icon: Users },
      { id: "fee-collection", name: "Fee Collection Report", icon: DollarSign },
    ];
  };

  const availableReports = getAvailableReports();

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Reports & Analytics
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Generate comprehensive reports
          </p>
        </div>

        {/* Report Types */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {availableReports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${selectedReport === report.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <report.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{report.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        {selectedReport && (
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
            >
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </div>
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showFilters && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) =>
                      setFilters({ ...filters, dateRange: e.target.value })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {filters.dateRange === "custom" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        From
                      </label>
                      <input
                        type="month"
                        value={filters.startDate}
                        onChange={(e) =>
                          setFilters({ ...filters, startDate: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        To
                      </label>
                      <input
                        type="month"
                        value={filters.endDate}
                        onChange={(e) =>
                          setFilters({ ...filters, endDate: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {user?.role === "admin" && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <select
                        value={filters.locationId}
                        onChange={(e) =>
                          setFilters({ ...filters, locationId: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">All Locations</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Teacher
                      </label>
                      <select
                        value={filters.teacherId}
                        onChange={(e) =>
                          setFilters({ ...filters, teacherId: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">All Teachers</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.firstName} {teacher.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <select
                    value={filters.classId}
                    onChange={(e) =>
                      setFilters({ ...filters, classId: e.target.value })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Classes</option>
                    {classes.map((classItem) => (
                      <option key={classItem._id} value={classItem._id}>
                        {classItem.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedReport === 'user-registration' && user?.role === 'admin' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={filters.role || 'all'}
                        onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="teacher">Teacher</option>
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={filters.status || 'all'}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedReport === "fee-collection" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Payment Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="pending">Pending</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        {selectedReport && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {getReportTitle()}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Generated on {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => fetchReportData()}
                  disabled={loading}
                  className="px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => {
                    switch (selectedReport) {
                      case "class-overview":
                        exportReport(classOverviewData, "class-overview");
                        break;
                      // case 'attendance':
                      //   exportReport(attendanceData, 'attendance-report');
                      //   break;
                      case 'fee-collection':
                        exportReport(feeCollectionData, 'fee-collection');
                        break;
                      case "enrollment":
                        exportReport(enrollmentData, "enrollment-report");
                        break;
                      case 'revenue-summary':
                        exportReport(locationRevenue, 'revenue-summary');
                        break;
                      case 'user-registration':
                        exportReport(userRegistrations, 'user-registration-report');
                        break;
                      case "schedule-summary":
                        exportReport([], "schedule-summary");
                        break;
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {renderReportContent()}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
