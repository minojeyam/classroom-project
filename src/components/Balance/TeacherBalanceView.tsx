import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
} from "lucide-react";
import DataTable from "../Common/DataTable";
import { feesAPI } from "../../utils/api";
import { classesAPI } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";

const TeacherBalanceView: React.FC = () => {
  const { user } = useAuth();
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("all");
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("current");

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const data = await feesAPI.getStudentFees();
        const teacherClassIds =
          user?.classIds?.map((id) => id.toString()) || [];
        const relevantFees = data.filter((fee: any) =>
          teacherClassIds.includes(fee.classId)
        );
        setStudentFees(relevantFees);
        setFilteredPayments(relevantFees);
      } catch (err) {
        console.error("Failed to load student fees", err);
      }
    };
    fetchFees();
  }, [user]);

  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-based: Jan = 0
    const currentYear = now.getFullYear();

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const filtered = studentFees.filter((fee) => {
      const feeDate = new Date(fee.dueDate);
      const feeMonth = feeDate.getMonth();
      const feeYear = feeDate.getFullYear();

      const classMatch =
        selectedClass === "all" || fee.className === selectedClass;

      const monthMatch =
        selectedMonth === "all" ||
        (selectedMonth === "current" &&
          feeMonth === currentMonth &&
          feeYear === currentYear) ||
        (selectedMonth === "last" &&
          feeMonth === lastMonth &&
          feeYear === lastMonthYear);

      return classMatch && monthMatch;
    });

    setFilteredPayments(filtered);
  }, [selectedClass, selectedMonth, studentFees]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await classesAPI.getClasses({ status: "active" });
        const classTitles = res.data.classes.map((cls: any) => cls.title);
        setClassOptions(classTitles);
      } catch (err) {
        console.error("Failed to load classes", err);
      }
    };
    fetchClasses();
  }, []);

  const stats = {
    totalStudents: [...new Set(studentFees.map((f) => f.studentId))].length,
    collected: studentFees.reduce((sum, f) => sum + (f.paidAmount || 0), 0),
    pending: studentFees
      .filter((f) => f.status === "pending")
      .reduce((sum, f) => sum + f.amount, 0),
    paymentRate: studentFees.length
      ? Math.round(
          (studentFees.filter((f) => f.status === "paid").length /
            studentFees.length) *
            100
        )
      : 0,
  };

  const teacherStats = [
    {
      title: "Total Students",
      value: stats.totalStudents.toString(),
      subtitle: "Across your classes",
      icon: Users,
      color: "teal",
    },
    {
      title: "Fees Collected",
      value: `Rs ${stats.collected.toLocaleString()}`,
      subtitle: "This period",
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Payment Rate",
      value: `${stats.paymentRate}%`,
      subtitle: "On-time payments",
      icon: CheckCircle,
      color: "blue",
    },
    {
      title: "Pending Fees",
      value: `Rs ${stats.pending.toLocaleString()}`,
      subtitle: "Unpaid balances",
      icon: AlertCircle,
      color: "orange",
    },
  ];

  const paymentColumns = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{row.className}</p>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">Rs {value}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string, row: any) => {
        const isOverdue =
          value === "pending" && new Date(row.dueDate) < new Date();
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              value === "paid"
                ? "bg-green-100 text-green-800"
                : isOverdue
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {value === "paid" ? "Paid" : isOverdue ? "Overdue" : "Pending"}
          </span>
        );
      },
    },
    {
      key: "dueDate",
      label: "Due Date",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "paidDate",
      label: "Paid Date",
      sortable: true,
      render: (value: string | null) =>
        value ? new Date(value).toLocaleDateString() : "-",
    },
    {
      key: "paymentMethod",
      label: "Method",
      render: (value: string | null) =>
        value ? (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              value === "Card"
                ? "bg-blue-100 text-blue-800"
                : value === "Cash"
                ? "bg-green-100 text-green-800"
                : "bg-purple-100 text-purple-800"
            }`}
          >
            {value}
          </span>
        ) : (
          "-"
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: () => (
        <div className="flex items-center space-x-2">
          <button className="text-teal-600 hover:text-teal-800 transition-colors duration-200">
            <Eye className="w-4 h-4" />
          </button>
          <button className="text-blue-600 hover:text-blue-800 transition-colors duration-200">
            <Download className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fee Management</h2>
          <p className="text-gray-600 mt-1">
            Track student payments and class revenue
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Classes</option>
            {classOptions.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          {/* Duration Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="current">Current Month</option>
            <option value="last">Last Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {teacherStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.color === "teal"
                    ? "bg-teal-500"
                    : stat.color === "green"
                    ? "bg-green-500"
                    : stat.color === "blue"
                    ? "bg-blue-500"
                    : "bg-orange-500"
                }`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Table */}
      <DataTable
        columns={paymentColumns}
        data={filteredPayments}
        title="Student Payment Status"
        searchable
        filterable
        exportable
      />
    </div>
  );
};

export default TeacherBalanceView;
