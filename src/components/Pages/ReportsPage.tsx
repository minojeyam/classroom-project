import React, { useState, useEffect } from 'react';
import { Download, Filter, Calendar, TrendingUp, Users, DollarSign, BookOpen, BarChart3, PieChart, FileText, Eye, RefreshCw, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { classesAPI, usersAPI, locationsAPI } from '../../utils/api';

interface ReportData {
  id: string;
  name: string;
  description: string;
  category: 'academic' | 'financial' | 'attendance' | 'enrollment' | 'performance';
  type: 'summary' | 'detailed' | 'analytics';
  lastGenerated: string;
  size: string;
  format: 'pdf' | 'excel' | 'csv';
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
  status: 'present' | 'absent' | 'late' | 'excused';
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
  paymentStatus: 'paid' | 'partial' | 'pending' | 'overdue';
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

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data states
  const [classOverviewData, setClassOverviewData] = useState<ClassOverviewData[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [feeCollectionData, setFeeCollectionData] = useState<FeeCollectionData[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData[]>([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    dateRange: 'month',
    startDate: new Date().toISOString().slice(0, 7), // YYYY-MM
    endDate: new Date().toISOString().slice(0, 7),
    locationId: 'all',
    classId: 'all',
    teacherId: 'all',
    studentId: 'all',
    status: 'all'
  });
  
  // Reference data
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [chartView, setChartView] = useState<'table' | 'chart'>('table');

  useEffect(() => {
    fetchReferenceData();
  }, []);

  useEffect(() => {
    if (selectedReport) {
      fetchReportData();
    }
  }, [selectedReport, filters]);

  const fetchReferenceData = async () => {
    try {
      const token = localStorage.getItem('accessToken') ?? undefined;
      
      const [classesResponse, teachersResponse, locationsResponse, studentsResponse] = await Promise.all([
        classesAPI.getClasses({}, token),
        usersAPI.getAll({ role: 'teacher' }),
        locationsAPI.getLocations({}, token),
        usersAPI.getAll({ role: 'student' })
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
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reference data');
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Mock data generation based on selected report
      switch (selectedReport) {
        case 'class-overview':
          await generateClassOverviewData();
          break;
        case 'attendance':
          await generateAttendanceData();
          break;
        case 'fee-collection':
          await generateFeeCollectionData();
          break;
        case 'enrollment':
          await generateEnrollmentData();
          break;
        default:
          break;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const generateClassOverviewData = async () => {
    // Mock class overview data
    const mockData: ClassOverviewData[] = classes
      .filter(c => filters.locationId === 'all' || c.locationId._id === filters.locationId)
      .filter(c => filters.teacherId === 'all' || c.teacherId._id === filters.teacherId)
      .map(classItem => ({
        classId: classItem._id,
        className: classItem.title,
        subject: classItem.subject,
        level: classItem.level,
        teacherName: `${classItem.teacherId.firstName} ${classItem.teacherId.lastName}`,
        locationName: classItem.locationId.name,
        totalStudents: classItem.currentEnrollment,
        activeStudents: Math.floor(classItem.currentEnrollment * 0.95),
        averageAttendance: Math.floor(Math.random() * 20) + 80,
        totalRevenue: classItem.currentEnrollment * (classItem.monthlyFee?.amount || 4500),
        pendingFees: Math.floor(classItem.currentEnrollment * 0.1) * (classItem.monthlyFee?.amount || 4500)
      }));
    
    setClassOverviewData(mockData);
  };

  const generateAttendanceData = async () => {
    // Mock attendance data
    const mockData: AttendanceData[] = [];
    const startDate = new Date(filters.startDate + '-01');
    const endDate = new Date(filters.endDate + '-31');
    
    classes.forEach(classItem => {
      for (let i = 0; i < classItem.currentEnrollment; i++) {
        const studentName = `Student ${i + 1}`;
        const attendanceRate = Math.floor(Math.random() * 20) + 80;
        
        // Generate daily attendance for the month
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          if (d.getDay() === classItem.schedule?.dayOfWeek) {
            const status = Math.random() > 0.1 ? 'present' : 
                         Math.random() > 0.5 ? 'absent' : 'late';
            
            mockData.push({
              studentId: `student-${i}`,
              studentName,
              className: classItem.title,
              date: d.toISOString().split('T')[0],
              status: status as any,
              attendanceRate
            });
          }
        }
      }
    });
    
    setAttendanceData(mockData);
  };

  const generateFeeCollectionData = async () => {
    // Mock fee collection data
    const mockData: FeeCollectionData[] = classes
      .filter(c => filters.classId === 'all' || c._id === filters.classId)
      .flatMap(classItem => 
        Array.from({ length: classItem.currentEnrollment }, (_, i) => {
          const totalAmount = classItem.monthlyFee?.amount || 4500;
          const paidAmount = Math.random() > 0.2 ? totalAmount : Math.floor(totalAmount * Math.random());
          
          return {
            studentId: `student-${i}`,
            studentName: `Student ${i + 1}`,
            className: classItem.title,
            totalAmount,
            paidAmount,
            pendingAmount: totalAmount - paidAmount,
            lastPaymentDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            paymentStatus: paidAmount === totalAmount ? 'paid' : 
                          paidAmount > 0 ? 'partial' : 
                          Math.random() > 0.8 ? 'overdue' : 'pending'
          } as FeeCollectionData;
        })
      );
    
    setFeeCollectionData(mockData);
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
        enrollmentTrend: Math.floor(Math.random() * 20) - 10
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
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getReportTitle = () => {
    switch (selectedReport) {
      case 'class-overview':
        return 'Class Overview Report';
      case 'attendance':
        return 'Attendance Report';
      case 'fee-collection':
        return 'Fee Collection Report';
      case 'enrollment':
        return 'Student Enrollment Report';
      case 'revenue-summary':
        return 'Revenue Summary Report';
      case 'user-registration':
        return 'User Registration & Approval Report';
      default:
        return 'Report';
    }
  };

  const renderReportContent = () => {
    if (!selectedReport) {
      return (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Report</h3>
          <p className="text-gray-600">Choose a report type from the sidebar to view data</p>
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
      case 'class-overview':
        return renderClassOverviewReport();
      case 'attendance':
        return renderAttendanceReport();
      case 'fee-collection':
        return renderFeeCollectionReport();
      case 'enrollment':
        return renderEnrollmentReport();
      case 'revenue-summary':
        return renderRevenueSummaryReport();
      case 'user-registration':
        return renderUserRegistrationReport();
      case 'schedule-summary':
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
              <p className="text-2xl font-bold text-blue-900">{classOverviewData.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total Students</p>
              <p className="text-2xl font-bold text-green-900">
                {classOverviewData.reduce((sum, c) => sum + c.totalStudents, 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Avg Attendance</p>
              <p className="text-2xl font-bold text-purple-900">
                {Math.round(classOverviewData.reduce((sum, c) => sum + c.averageAttendance, 0) / classOverviewData.length || 0)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-orange-900">
                ₹{classOverviewData.reduce((sum, c) => sum + c.totalRevenue, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Chart/Table Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Class Performance Overview</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setChartView('table')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              chartView === 'table' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setChartView('chart')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              chartView === 'chart' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Chart View
          </button>
        </div>
      </div>

      {chartView === 'table' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classOverviewData.map((classData) => (
                  <tr key={classData.classId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{classData.className}</p>
                        <p className="text-sm text-gray-500">{classData.subject} • {classData.level}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{classData.teacherName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{classData.locationName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{classData.activeStudents}/{classData.totalStudents}</span>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(classData.activeStudents / classData.totalStudents) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        classData.averageAttendance >= 90 ? 'text-green-600' :
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
              <h4 className="text-md font-semibold text-gray-900 mb-4">Attendance Rates by Class</h4>
              <div className="space-y-3">
                {classOverviewData.map((classData) => (
                  <div key={classData.classId} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{classData.className}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            classData.averageAttendance >= 90 ? 'bg-green-500' :
                            classData.averageAttendance >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${classData.averageAttendance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{classData.averageAttendance}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Revenue by Class</h4>
              <div className="space-y-3">
                {classOverviewData.map((classData) => (
                  <div key={classData.classId} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{classData.className}</span>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">₹{classData.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-orange-600">₹{classData.pendingFees.toLocaleString()} pending</p>
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

  const renderAttendanceReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Present</p>
              <p className="text-2xl font-bold text-green-900">
                {attendanceData.filter(a => a.status === 'present').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Absent</p>
              <p className="text-2xl font-bold text-red-900">
                {attendanceData.filter(a => a.status === 'absent').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Late</p>
              <p className="text-2xl font-bold text-orange-900">
                {attendanceData.filter(a => a.status === 'late').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Overall Rate</p>
              <p className="text-2xl font-bold text-blue-900">
                {Math.round((attendanceData.filter(a => a.status === 'present').length / attendanceData.length) * 100 || 0)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Daily Attendance Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceData.slice(0, 50).map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.studentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.className}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record.status === 'present' ? 'bg-green-100 text-green-800' :
                      record.status === 'absent' ? 'bg-red-100 text-red-800' :
                      record.status === 'late' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            record.attendanceRate >= 90 ? 'bg-green-500' :
                            record.attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${record.attendanceRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{record.attendanceRate}%</span>
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

  const renderFeeCollectionReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total Collected</p>
              <p className="text-2xl font-bold text-green-900">
                ₹{feeCollectionData.reduce((sum, f) => sum + f.paidAmount, 0).toLocaleString()}
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
                ₹{feeCollectionData.reduce((sum, f) => sum + f.pendingAmount, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Collection Rate</p>
              <p className="text-2xl font-bold text-blue-900">
                {Math.round((feeCollectionData.filter(f => f.paymentStatus === 'paid').length / feeCollectionData.length) * 100 || 0)}%
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
                {feeCollectionData.filter(f => f.paymentStatus === 'overdue').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Fee Collection Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Student-wise Fee Collection</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Payment</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feeCollectionData.map((fee, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {fee.studentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fee.className}
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      fee.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      fee.paymentStatus === 'partial' ? 'bg-orange-100 text-orange-800' :
                      fee.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {fee.paymentStatus.charAt(0).toUpperCase() + fee.paymentStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(fee.lastPaymentDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
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
              <p className="text-blue-600 text-sm font-medium">Total Students</p>
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
              <p className="text-green-600 text-sm font-medium">New Enrollments</p>
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
              <p className="text-purple-600 text-sm font-medium">Active Students</p>
              <p className="text-2xl font-bold text-purple-900">
                {enrollmentData.reduce((sum, e) => sum + e.activeEnrollments, 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Total Classes</p>
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
          <h3 className="text-lg font-semibold text-gray-900">Enrollment by Location</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Enrollments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    +{enrollment.newEnrollments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.activeEnrollments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      enrollment.enrollmentTrend >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {enrollment.enrollmentTrend >= 0 ? '+' : ''}{enrollment.enrollmentTrend}%
                    </span>
                  </td>
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
    const revenueSummaryData = user?.role === 'admin' ? [
      {
        locationId: '1',
        locationName: 'Nelliyadi Campus',
        currentMonth: 702000,
        lastMonth: 685000,
        currentQuarter: 2106000,
        lastQuarter: 1998000,
        receivedCurrent: 658800,
        pendingCurrent: 43200,
        classes: [
          { className: 'Advanced Mathematics', revenue: 112500, received: 108000, pending: 4500 },
          { className: 'Chemistry Lab', revenue: 108000, received: 102000, pending: 6000 }
        ]
      },
      {
        locationId: '2',
        locationName: 'Chavakacheri Campus',
        currentMonth: 558000,
        lastMonth: 542000,
        currentQuarter: 1674000,
        lastQuarter: 1598000,
        receivedCurrent: 520200,
        pendingCurrent: 37800,
        classes: [
          { className: 'Physics Fundamentals', revenue: 114400, received: 109200, pending: 5200 }
        ]
      }
    ] : [
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
                <p className="text-green-600 text-sm font-medium">Current Month</p>
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
                <p className="text-purple-600 text-sm font-medium">Current Quarter</p>
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
                <p className="text-orange-600 text-sm font-medium">Collection Rate</p>
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
              {user?.role === 'admin' ? 'Location-wise Revenue Summary' : 'Class-wise Revenue Summary'}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {user?.role === 'admin' ? 'Location' : 'Class'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Quarter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenueSummaryData.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">
                          {user?.role === 'admin' ? item.locationName : item.className}
                        </p>
                        {user?.role === 'teacher' && (
                          <p className="text-sm text-gray-500">{item.studentCount} students</p>
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
                            style={{ width: `${(item.receivedCurrent / item.currentMonth) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round((item.receivedCurrent / item.currentMonth) * 100)}%
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
    // Mock user registration data
    const userRegistrationData = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        role: 'teacher',
        status: 'active',
        locationId: '1',
        locationName: 'Nelliyadi Campus',
        registrationDate: '2024-01-15',
        approvalDate: '2024-01-16',
        lastLogin: '2024-03-15',
        classesAssigned: 3
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@email.com',
        role: 'student',
        status: 'active',
        locationId: '2',
        locationName: 'Chavakacheri Campus',
        registrationDate: '2024-02-01',
        approvalDate: '2024-02-02',
        lastLogin: '2024-03-14',
        classesEnrolled: 4
      },
      {
        id: '3',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@email.com',
        role: 'parent',
        status: 'inactive',
        locationId: '1',
        locationName: 'Nelliyadi Campus',
        registrationDate: '2024-02-15',
        approvalDate: '2024-02-16',
        lastLogin: '2024-02-20',
        childrenCount: 2
      },
      {
        id: '4',
        firstName: 'Sarah',
        lastName: 'Wilson',
        email: 'sarah.wilson@email.com',
        role: 'teacher',
        status: 'pending',
        locationId: '2',
        locationName: 'Chavakacheri Campus',
        registrationDate: '2024-03-10',
        approvalDate: null,
        lastLogin: null,
        classesAssigned: 0
      }
    ];

    // Apply filters
    const filteredData = userRegistrationData.filter(user => {
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
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'student' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
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
                      {new Date(user.registrationDate).toLocaleDateString()}
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
        classId: '1',
        className: 'Advanced Mathematics',
        totalScheduled: 20,
        completed: 18,
        cancelled: 1,
        upcoming: 1,
        attendanceRate: 94.5,
        avgStudentsPresent: 23.6
      },
      {
        classId: '2',
        className: 'Physics Fundamentals',
        totalScheduled: 18,
        completed: 16,
        cancelled: 0,
        upcoming: 2,
        attendanceRate: 96.2,
        avgStudentsPresent: 21.2
      }
    ];

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Scheduled</p>
                <p className="text-2xl font-bold text-blue-900">
                  {scheduleSummaryData.reduce((sum, item) => sum + item.totalScheduled, 0)}
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
                  {scheduleSummaryData.reduce((sum, item) => sum + item.completed, 0)}
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
                  {scheduleSummaryData.reduce((sum, item) => sum + item.cancelled, 0)}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Avg Attendance</p>
                <p className="text-2xl font-bold text-purple-900">
                  {Math.round(scheduleSummaryData.reduce((sum, item) => sum + item.attendanceRate, 0) / scheduleSummaryData.length)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Schedule Summary Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Class Schedule Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Scheduled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancelled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upcoming</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Students Present</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduleSummaryData.map((schedule) => (
                  <tr key={schedule.classId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{schedule.className}</p>
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
                        <span className="text-sm font-medium text-gray-900">{schedule.attendanceRate}%</span>
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
    if (user?.role === 'admin') {
      return [
        { id: 'class-overview', name: 'Class Overview Report', icon: BookOpen },
        { id: 'attendance', name: 'Attendance Report', icon: Users },
        { id: 'fee-collection', name: 'Fee Collection Report', icon: DollarSign },
        { id: 'enrollment', name: 'Student Enrollment Report', icon: TrendingUp },
        { id: 'revenue-summary', name: 'Revenue Summary Report', icon: BarChart3 },
        { id: 'user-registration', name: 'User Registration & Approval Report', icon: FileText }
      ];
    } else if (user?.role === 'teacher') {
      return [
        { id: 'class-overview', name: 'Class Overview Report', icon: BookOpen },
        { id: 'attendance', name: 'Attendance Report - Per Student', icon: Users },
        { id: 'fee-collection', name: 'Fee Collection Report - Student Wise', icon: DollarSign },
        { id: 'revenue-summary', name: 'Class-wise Revenue Summary', icon: BarChart3 },
        { id: 'schedule-summary', name: 'Monthly Class Schedule Summary', icon: Calendar }
      ];
    }

    return [
      { id: 'class-overview', name: 'Class Overview Report', icon: BookOpen },
      { id: 'attendance', name: 'Attendance Report', icon: Users },
      { id: 'fee-collection', name: 'Fee Collection Report', icon: DollarSign }
    ];
  };

  const availableReports = getAvailableReports();

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">Generate comprehensive reports</p>
        </div>

        {/* Report Types */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {availableReports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${
                  selectedReport === report.id
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
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showFilters && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {filters.dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                      <input
                        type="month"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                      <input
                        type="month"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {user?.role === 'admin' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                      <select
                        value={filters.locationId}
                        onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">All Locations</option>
                        {locations.map(location => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Teacher</label>
                      <select
                        value={filters.teacherId}
                        onChange={(e) => setFilters({ ...filters, teacherId: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">All Teachers</option>
                        {teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.firstName} {teacher.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Class</label>
                  <select
                    value={filters.classId}
                    onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Classes</option>
                    {classes.map(classItem => (
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
                        value={filters.userStatus || 'all'}
                        onChange={(e) => setFilters({ ...filters, userStatus: e.target.value })}
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

                {selectedReport === 'fee-collection' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Payment Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
                <h3 className="text-lg font-semibold text-gray-900">{getReportTitle()}</h3>
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
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => {
                    switch (selectedReport) {
                      case 'class-overview':
                        exportReport(classOverviewData, 'class-overview');
                        break;
                      case 'attendance':
                        exportReport(attendanceData, 'attendance-report');
                        break;
                      case 'fee-collection':
                        exportReport(feeCollectionData, 'fee-collection');
                        break;
                      case 'enrollment':
                        exportReport(enrollmentData, 'enrollment-report');
                        break;
                      case 'revenue-summary':
                        exportReport([], 'revenue-summary');
                        break;
                      case 'user-registration':
                        exportReport([], 'user-registration-report');
                        break;
                      case 'schedule-summary':
                        exportReport([], 'schedule-summary');
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