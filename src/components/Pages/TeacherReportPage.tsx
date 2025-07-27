import React, { useEffect, useState } from "react";
import {
  Download,
  Filter,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  BookOpen,
  BarChart3,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { classesAPI } from "../../utils/api";
import Papa from "papaparse";

const TeacherReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState("class-overview");
  const [revenueSummary, setRevenueSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [classOverviewData, setClassOverviewData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [feeCollectionData, setFeeCollectionData] = useState<any[]>([]);
  const [scheduleSummary, setScheduleSummary] = useState([]);
  const [chartView, setChartView] = useState("table");
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("accessToken") ?? undefined;
      const res = await classesAPI.getClasses({}, token);
      if (res.status === "success") {
        setClasses(res.data.classes || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch classes");
    }
  };

  const generateClassOverviewData = () => {
    const mock = classes.map((c) => ({
      classId: c._id,
      className: c.title,
      teacherName: `${c.teacherId.firstName} ${c.teacherId.lastName}`,
      locationName: c.locationId.name,
      subject: c.subject,
      level: c.level,
      totalStudents: c.currentEnrollment,
      activeStudents: Math.floor(c.currentEnrollment * 0.95),
      averageAttendance: Math.floor(Math.random() * 20) + 80,
      totalRevenue: c.currentEnrollment * (c.monthlyFee?.amount || 4500),
      pendingFees:
        Math.floor(c.currentEnrollment * 0.1) * (c.monthlyFee?.amount || 4500),
    }));
    setClassOverviewData(mock);
  };

  const generateAttendanceData = () => {
    const mock = classes.flatMap((c) => {
      return Array.from({ length: c.currentEnrollment }, (_, i) => {
        const rate = Math.floor(Math.random() * 20) + 80;
        return {
          studentId: `student-${i}`,
          studentName: `Student ${i + 1}`,
          className: c.title,
          date: new Date().toISOString().split("T")[0],
          status: ["present", "absent", "late"][Math.floor(Math.random() * 3)],
          attendanceRate: rate,
        };
      });
    });
    setAttendanceData(mock);
  };

  const generateFeeCollectionData = () => {
    const mock = classes.flatMap((c) => {
      return Array.from({ length: c.currentEnrollment }, (_, i) => {
        const total = c.monthlyFee?.amount || 4500;
        const paid =
          Math.random() > 0.2 ? total : Math.floor(Math.random() * total);
        return {
          studentId: `student-${i}`,
          studentName: `Student ${i + 1}`,
          className: c.title,
          totalAmount: total,
          paidAmount: paid,
          pendingAmount: total - paid,
          lastPaymentDate: new Date().toISOString().split("T")[0],
          paymentStatus:
            paid === total ? "paid" : paid > 0 ? "partial" : "pending",
        };
      });
    });
    setFeeCollectionData(mock);
  };

  const fetchRevenueSummary = async () => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem("user") || "{}").tokens
        ?.accessToken;
      if (!token) {
        setError("Access token missing. Please log in again.");
        return;
      }

      const res = await fetch(
        "http://localhost:5000/api/reports/revenue-summary",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setRevenueSummary(result.data);
      } else {
        setError(result.message || "Failed to fetch data");
      }
    } catch (err) {
      setError("Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  };

  // const fetchScheduleSummary = async () => {
  //   try {
  //     const token = JSON.parse(localStorage.getItem("user") || "{}")?.tokens
  //       ?.accessToken;
  //     const res = await fetch(
  //       "http://localhost:5000/api/reports/schedule-summary",
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );
  //     const result = await res.json();
  //     if (result.status === "success") {
  //       setScheduleSummary(result.data);
  //     } else {
  //       setError(result.message || "Failed to fetch schedule data");
  //     }
  //   } catch (err) {
  //     setError("Failed to load schedule summary");
  //   }
  // };
  const fetchScheduleSummary = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").tokens
        ?.accessToken;
      if (!token) {
        setError("Access token missing. Please log in again.");
        return;
      }
      const res = await fetch(
        `http://localhost:5000/api/reports/schedule-summary?month=${filterMonth}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setScheduleSummary(result.data);
      } else {
        setError(result.message || "Failed to fetch schedule data");
      }
    } catch (err) {
      setError("Failed to load schedule summary");
    }
  };

  const exportToCSV = (data, filename) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    switch (selectedReport) {
      case "class-overview":
        generateClassOverviewData();
        break;
      case "attendance":
        generateAttendanceData();
        break;
      case "fee-collection":
        generateFeeCollectionData();
        break;
      case "revenue-summary":
        fetchRevenueSummary();
        break;
      case "schedule-summary":
        fetchScheduleSummary();
        break;
    }
  }, [selectedReport, classes, filterMonth]);

  const availableReports = [
    { id: "class-overview", name: "Class Overview Report", icon: BookOpen },
    { id: "attendance", name: "Attendance Report", icon: Users },
    { id: "fee-collection", name: "Fee Collection Report", icon: DollarSign },
    { id: "revenue-summary", name: "Revenue Summary", icon: BarChart3 },
    { id: "schedule-summary", name: "Schedule Summary", icon: Calendar },
  ];

  const renderSummaryCard = (
    title: string,
    value: any,
    Icon: any,
    color: string
  ) => (
    <div className={`bg-${color}-50 p-6 rounded-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-${color}-600 text-sm font-medium`}>{title}</p>
          <p className={`text-2xl font-bold text-${color}-900`}>{value}</p>
        </div>
        <Icon className={`w-8 h-8 text-${color}-500`} />
      </div>
    </div>
  );

  const renderReportContent = () => {
    if (selectedReport === "class-overview") {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {renderSummaryCard(
              "Total Classes",
              classOverviewData.length,
              BookOpen,
              "blue"
            )}
            {renderSummaryCard(
              "Total Students",
              classOverviewData.reduce((sum, c) => sum + c.totalStudents, 0),
              Users,
              "green"
            )}
            {renderSummaryCard(
              "Avg Attendance",
              `${Math.round(
                classOverviewData.reduce(
                  (sum, c) => sum + c.averageAttendance,
                  0
                ) / (classOverviewData.length || 1)
              )}%`,
              TrendingUp,
              "purple"
            )}
            {renderSummaryCard(
              "Total Revenue",
              `LKR${classOverviewData
                .reduce((sum, c) => sum + c.totalRevenue, 0)
                .toLocaleString()}`,
              DollarSign,
              "orange"
            )}
          </div>

          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
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
                {classOverviewData.map((c) => (
                  <tr key={c.classId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {c.className}
                        </p>
                        <p className="text-sm text-gray-500">
                          {c.subject} • {c.level}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {c.teacherName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {c.locationName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {c.activeStudents}/{c.totalStudents}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {c.averageAttendance}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      LKR{c.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                      LKR{c.pendingFees.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    if (selectedReport === "attendance") {
      const present = attendanceData.filter(
        (a) => a.status === "present"
      ).length;
      const absent = attendanceData.filter((a) => a.status === "absent").length;
      const late = attendanceData.filter((a) => a.status === "late").length;
      const rate = Math.round((present / (attendanceData.length || 1)) * 100);

      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {renderSummaryCard("Present", present, Users, "green")}
            {renderSummaryCard("Absent", absent, Users, "red")}
            {renderSummaryCard("Late", late, Users, "orange")}
            {renderSummaryCard("Overall Rate", `${rate}%`, TrendingUp, "blue")}
          </div>

          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData.slice(0, 50).map((a, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {a.studentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {a.className}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {a.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          a.status === "present"
                            ? "bg-green-100 text-green-800"
                            : a.status === "absent"
                            ? "bg-red-100 text-red-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              a.attendanceRate >= 90
                                ? "bg-green-500"
                                : a.attendanceRate >= 75
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${a.attendanceRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {a.attendanceRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    if (selectedReport === "fee-collection") {
      const collected = feeCollectionData.reduce(
        (sum, f) => sum + f.paidAmount,
        0
      );
      const pending = feeCollectionData.reduce(
        (sum, f) => sum + f.pendingAmount,
        0
      );
      const total = collected + pending;
      const rate = Math.round((collected / (total || 1)) * 100);
      const overdue = feeCollectionData.filter(
        (f) => f.paymentStatus === "overdue"
      ).length;

      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {renderSummaryCard(
              "Total Collected",
              `LKR ${collected.toLocaleString()}`,
              DollarSign,
              "green"
            )}
            {renderSummaryCard(
              "Pending",
              `LKR ${pending.toLocaleString()}`,
              DollarSign,
              "orange"
            )}
            {renderSummaryCard(
              "Collection Rate",
              `${rate}%`,
              TrendingUp,
              "blue"
            )}
            {renderSummaryCard("Overdue", overdue, Users, "red")}
          </div>

          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
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
                {feeCollectionData.map((f, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {f.studentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {f.className}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      LKR {f.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      LKR {f.paidAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                      LKR {f.pendingAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          f.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : f.paymentStatus === "partial"
                            ? "bg-orange-100 text-orange-800"
                            : f.paymentStatus === "overdue"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {f.paymentStatus.charAt(0).toUpperCase() +
                          f.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {f.lastPaymentDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    if (selectedReport === "revenue-summary") {
      const summary = revenueSummary;
      const totals = summary.reduce(
        (acc, s) => {
          acc.currentMonth += s.currentMonth;
          acc.lastMonth += s.lastMonth;
          acc.currentQuarter += s.currentQuarter;
          acc.received += s.received;
          acc.pending += s.pending;
          return acc;
        },
        {
          currentMonth: 0,
          lastMonth: 0,
          currentQuarter: 0,
          received: 0,
          pending: 0,
        }
      );
      const collectionRate = Math.round(
        (totals.received / (totals.currentMonth || 1)) * 100
      );

      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {renderSummaryCard(
              "Current Month",
              `LKR ${totals.currentMonth.toLocaleString()}`,
              DollarSign,
              "green"
            )}
            {renderSummaryCard(
              "Last Month",
              `LKR ${totals.lastMonth.toLocaleString()}`,
              Calendar,
              "blue"
            )}
            {renderSummaryCard(
              "Current Quarter",
              `LKR ${totals.currentQuarter.toLocaleString()}`,
              BarChart3,
              "purple"
            )}
            {renderSummaryCard(
              "Collection Rate",
              `${collectionRate}%`,
              TrendingUp,
              "orange"
            )}
          </div>

          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
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
                {summary.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div>{item.className}</div>
                      <div className="text-xs text-gray-500">
                        {item.students} students
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      LKR {item.currentMonth.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      LKR {item.lastMonth.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      LKR {item.currentQuarter.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      LKR {item.received.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                      LKR {item.pending.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${Math.round(
                                (item.received / (item.currentMonth || 1)) * 100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(
                            (item.received / (item.currentMonth || 1)) * 100
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
        </>
      );
    }

    if (selectedReport === "schedule-summary") {
      const total = scheduleSummary.reduce(
        (acc, c) => {
          acc.totalScheduled += c.totalScheduled;
          acc.completed += c.completed;
          acc.cancelled += c.cancelled;
          acc.attendance += c.attendanceRate;
          return acc;
        },
        { totalScheduled: 0, completed: 0, cancelled: 0, attendance: 0 }
      );

      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {renderSummaryCard(
              "Total Scheduled",
              total.totalScheduled,
              Calendar,
              "blue"
            )}
            {renderSummaryCard(
              "Completed",
              total.completed,
              CheckCircle,
              "green"
            )}
            {renderSummaryCard(
              "Cancelled",
              total.cancelled,
              AlertCircle,
              "red"
            )}
            {renderSummaryCard(
              "Avg Attendance",
              `${Math.round(total.attendance / scheduleSummary.length)}%`,
              TrendingUp,
              "purple"
            )}
          </div>

          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th>Class</th>
                  <th>Total Scheduled</th>
                  <th>Completed</th>
                  <th>Cancelled</th>
                  <th>Upcoming</th>
                  <th>Attendance Rate</th>
                  <th>Avg Students Present</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduleSummary.map((c, i) => (
                  <tr key={i}>
                    <td>{c.className}</td>
                    <td>{c.totalScheduled}</td>
                    <td className="text-green-600">{c.completed}</td>
                    <td className="text-red-600">{c.cancelled}</td>
                    <td className="text-blue-600">{c.upcoming}</td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 h-2 rounded-full">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${c.attendanceRate}%` }}
                          ></div>
                        </div>
                        <span>{c.attendanceRate}%</span>
                      </div>
                    </td>
                    <td>{c.avgStudentsPresent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    return (
      <pre className="bg-white p-4 rounded-lg border border-gray-200 overflow-auto">
        {JSON.stringify(
          selectedReport === "attendance" ? attendanceData : feeCollectionData,
          null,
          2
        )}
      </pre>
    );
  };

  return (
    <div className="flex h-full">
      <aside className="w-80 bg-white border-r border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Reports</h2>
        <p className="text-sm text-gray-600 mb-4">Teacher Report Panel</p>
        <div className="space-y-2">
          {availableReports.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${
                selectedReport === report.id
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <report.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{report.name}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        {selectedReport && (
          <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {availableReports.find((r) => r.id === selectedReport)?.name ||
                  "Report"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  if (selectedReport === "class-overview")
                    generateClassOverviewData();
                  if (selectedReport === "attendance") generateAttendanceData();
                  if (selectedReport === "fee-collection")
                    generateFeeCollectionData();
                }}
                className="px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200 flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => {
                  switch (selectedReport) {
                    case "class-overview":
                      exportToCSV(classOverviewData, "class-overview.csv");
                      break;
                    case "attendance":
                      exportToCSV(attendanceData, "attendance.csv");
                      break;
                    case "fee-collection":
                      exportToCSV(feeCollectionData, "fee-collection.csv");
                      break;
                    case "revenue-summary":
                      exportToCSV(revenueSummary, "revenue-summary.csv");
                      break;
                    case "schedule-summary":
                      exportToCSV(
                        scheduleSummary,
                        `schedule-summary-${filterMonth}.csv`
                      );
                      break;
                    default:
                      alert("Export not available for this report");
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </header>
        )}

        <section className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!selectedReport && renderPlaceholder()}

          {renderReportContent()}
        </section>
      </main>
    </div>
  );
};

export default TeacherReportsPage;
