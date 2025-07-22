import React, { useState, useEffect } from "react";
import {
  Download,
  Filter,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  BookOpen,
  BarChart3,
  PieChart,
  FileText,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

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

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<ReportData[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Mock reports data
      const mockReports: ReportData[] = [
        {
          id: "1",
          name: "Student Enrollment Report",
          description:
            "Comprehensive report on student enrollment across all locations and classes",
          category: "enrollment",
          type: "summary",
          lastGenerated: "2024-03-15T10:30:00.000Z",
          size: "2.4 MB",
          format: "pdf",
        },
        {
          id: "2",
          name: "Financial Summary",
          description:
            "Monthly financial overview including revenue, expenses, and outstanding payments",
          category: "financial",
          type: "summary",
          lastGenerated: "2024-03-14T16:45:00.000Z",
          size: "1.8 MB",
          format: "excel",
        },
        {
          id: "3",
          name: "Attendance Analytics",
          description: "Detailed attendance patterns and trends analysis",
          category: "attendance",
          type: "analytics",
          lastGenerated: "2024-03-13T09:15:00.000Z",
          size: "3.2 MB",
          format: "pdf",
        },
        {
          id: "4",
          name: "Academic Performance Report",
          description:
            "Student performance metrics and grade distribution analysis",
          category: "performance",
          type: "detailed",
          lastGenerated: "2024-03-12T14:20:00.000Z",
          size: "4.1 MB",
          format: "excel",
        },
        {
          id: "5",
          name: "Teacher Performance Metrics",
          description: "Teaching effectiveness and class management statistics",
          category: "academic",
          type: "analytics",
          lastGenerated: "2024-03-11T11:30:00.000Z",
          size: "1.9 MB",
          format: "pdf",
        },
      ];

      setReports(mockReports);
    } catch (err: any) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportId: string) => {
    try {
      setLoading(true);
      // Mock report generation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await fetchReports();
    } catch (err: any) {
      console.error("Failed to generate report:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      // Mock download
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In real implementation, this would trigger a file download
      alert("Report download started!");
    } catch (err: any) {
      console.error("Failed to download report:", err);
    }
  };

  // Mock analytics data
  const analyticsData = {
    enrollment: {
      total: 1247,
      thisMonth: 45,
      trend: "+12.5%",
      byLocation: [
        { name: "Nelliyadi", count: 687, percentage: 55.1 },
        { name: "Chavakacheri", count: 560, percentage: 44.9 },
      ],
    },
    financial: {
      revenue: 124580,
      outstanding: 18450,
      collectionRate: 94.2,
      monthlyTrend: "+8.3%",
    },
    attendance: {
      overall: 96.8,
      thisWeek: 97.2,
      trend: "+1.2%",
      byGrade: [
        { grade: "Grade 6", rate: 98.1 },
        { grade: "Grade 7", rate: 97.5 },
        { grade: "Grade 8", rate: 96.8 },
        { grade: "Grade 9", rate: 95.9 },
        { grade: "Grade 10", rate: 96.2 },
      ],
    },
    performance: {
      averageGrade: "B+",
      passRate: 92.4,
      improvement: "+3.1%",
      topPerformers: 15,
    },
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "academic":
        return <BookOpen className="w-5 h-5" />;
      case "financial":
        return <DollarSign className="w-5 h-5" />;
      case "attendance":
        return <Users className="w-5 h-5" />;
      case "enrollment":
        return <TrendingUp className="w-5 h-5" />;
      case "performance":
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "academic":
        return "bg-blue-100 text-blue-800";
      case "financial":
        return "bg-green-100 text-green-800";
      case "attendance":
        return "bg-purple-100 text-purple-800";
      case "enrollment":
        return "bg-orange-100 text-orange-800";
      case "performance":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Reports & Analytics
          </h2>
          <p className="text-gray-600 mt-1">
            Generate and view comprehensive reports
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Locations</option>
            <option value="nelliyadi">Nelliyadi</option>
            <option value="chavakacheri">Chavakacheri</option>
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={() => fetchReports()}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: "overview", label: "Overview" },
              { key: "academic", label: "Academic" },
              { key: "financial", label: "Financial" },
              { key: "attendance", label: "Attendance" },
              { key: "custom", label: "Custom Reports" },
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
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Total Students</p>
                      <p className="text-3xl font-bold mt-2">
                        {analyticsData.enrollment.total.toLocaleString()}
                      </p>
                      <p className="text-blue-100 text-sm mt-1">
                        +{analyticsData.enrollment.thisMonth} this month
                      </p>
                    </div>
                    <Users className="w-12 h-12 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Monthly Revenue</p>
                      <p className="text-3xl font-bold mt-2">
                        ${analyticsData.financial.revenue.toLocaleString()}
                      </p>
                      <p className="text-green-100 text-sm mt-1">
                        {analyticsData.financial.monthlyTrend} vs last month
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Attendance Rate</p>
                      <p className="text-3xl font-bold mt-2">
                        {analyticsData.attendance.overall}%
                      </p>
                      <p className="text-purple-100 text-sm mt-1">
                        {analyticsData.attendance.trend} this week
                      </p>
                    </div>
                    <BarChart3 className="w-12 h-12 text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Pass Rate</p>
                      <p className="text-3xl font-bold mt-2">
                        {analyticsData.performance.passRate}%
                      </p>
                      <p className="text-orange-100 text-sm mt-1">
                        {analyticsData.performance.improvement} improvement
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Charts Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Enrollment by Location
                  </h3>
                  <div className="space-y-4">
                    {analyticsData.enrollment.byLocation.map(
                      (location, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {location.name}
                          </span>
                          <div className="flex items-center space-x-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${location.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">
                              {location.count}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Attendance by Grade
                  </h3>
                  <div className="space-y-4">
                    {analyticsData.attendance.byGrade.map((grade, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-gray-700">
                          {grade.grade}
                        </span>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${grade.rate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {grade.rate}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(activeTab === "academic" ||
            activeTab === "financial" ||
            activeTab === "attendance") && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg text-center">
                <BarChart3 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}{" "}
                  Reports
                </h3>
                <p className="text-gray-600 mb-4">
                  Detailed {activeTab} analytics and insights will be displayed
                  here
                </p>
                <button
                  onClick={() => generateReport(activeTab)}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {loading
                    ? "Generating..."
                    : `Generate ${
                        activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                      } Report`}
                </button>
              </div>
            </div>
          )}

          {activeTab === "custom" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Available Reports
                </h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                  Create Custom Report
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(
                          report.category
                        )}`}
                      >
                        {getCategoryIcon(report.category)}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                          report.category
                        )}`}
                      >
                        {report.category}
                      </span>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-2">
                      {report.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {report.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Last Generated:</span>
                        <span className="text-gray-900">
                          {new Date(report.lastGenerated).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Size:</span>
                        <span className="text-gray-900">{report.size}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Format:</span>
                        <span className="text-gray-900 uppercase">
                          {report.format}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => generateReport(report.id)}
                        disabled={loading}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200 text-sm font-medium disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-4 h-4 inline mr-1 ${
                            loading ? "animate-spin" : ""
                          }`}
                        />
                        Generate
                      </button>
                      <button
                        onClick={() => downloadReport(report.id)}
                        className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors duration-200 text-sm font-medium"
                      >
                        <Download className="w-4 h-4 inline mr-1" />
                        Download
                      </button>
                      <button className="px-3 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors duration-200">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
