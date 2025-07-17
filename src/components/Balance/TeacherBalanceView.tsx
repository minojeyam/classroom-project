import React, { useState } from "react";
import {
  DollarSign,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Eye,
  Download,
} from "lucide-react";
import DataTable from "../Common/DataTable";

const TeacherBalanceView: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("current");

  const teacherStats = [
    {
      title: "Total Students",
      value: "128",
      subtitle: "Across 4 classes",
      icon: Users,
      color: "teal",
    },
    {
      title: "Fees Collected",
      value: "₹4,56,000",
      subtitle: "This month",
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Payment Rate",
      value: "94.5%",
      subtitle: "On-time payments",
      icon: CheckCircle,
      color: "blue",
    },
    {
      title: "Pending Fees",
      value: "₹28,500",
      subtitle: "7 students",
      icon: AlertCircle,
      color: "orange",
    },
  ];

  const myClasses = [
    {
      id: 1,
      name: "Mathematics Grade 7",
      students: 32,
      monthlyFee: 4500,
      collected: 288000,
      pending: 18000,
      paymentRate: 94.1,
      location: "Nelliyadi",
    },
    {
      id: 2,
      name: "Physics Grade 8",
      students: 28,
      monthlyFee: 5200,
      collected: 135200,
      pending: 10400,
      paymentRate: 92.9,
      location: "Nelliyadi",
    },
    {
      id: 3,
      name: "Chemistry Grade 9",
      students: 35,
      monthlyFee: 6000,
      collected: 198000,
      pending: 18000,
      paymentRate: 91.7,
      location: "Chavakacheri",
    },
    {
      id: 4,
      name: "Mathematics Grade 8",
      students: 33,
      monthlyFee: 4800,
      collected: 148800,
      pending: 9600,
      paymentRate: 93.9,
      location: "Chavakacheri",
    },
  ];

  const studentPayments = [
    {
      id: 1,
      studentName: "Alice Johnson",
      class: "Mathematics Grade 7",
      amount: 4500,
      status: "Paid",
      paidDate: "2024-03-15",
      method: "Card",
      dueDate: "2024-03-01",
    },
    {
      id: 2,
      studentName: "Bob Smith",
      class: "Physics Grade 8",
      amount: 5200,
      status: "Pending",
      paidDate: null,
      method: null,
      dueDate: "2024-03-01",
    },
    {
      id: 3,
      studentName: "Carol Davis",
      class: "Chemistry Grade 9",
      amount: 6000,
      status: "Paid",
      paidDate: "2024-03-10",
      method: "Bank Transfer",
      dueDate: "2024-03-01",
    },
    {
      id: 4,
      studentName: "David Wilson",
      class: "Mathematics Grade 8",
      amount: 4800,
      status: "Overdue",
      paidDate: null,
      method: null,
      dueDate: "2024-02-01",
    },
  ];

  const classColumns = [
    {
      key: "name",
      label: "Class",
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">
            {row.students} students • {row.location}
          </p>
        </div>
      ),
    },
    {
      key: "monthlyFee",
      label: "Monthly Fee",
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">₹{value}</span>
      ),
    },
    {
      key: "collected",
      label: "Collected",
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-green-600">
          ₹{value.toLocaleString()}
        </span>
      ),
    },
    {
      key: "pending",
      label: "Pending",
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-orange-600">
          Rs {value.toLocaleString()}
        </span>
      ),
    },
    {
      key: "paymentRate",
      label: "Payment Rate",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                value >= 95
                  ? "bg-green-500"
                  : value >= 90
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${value}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-900">{value}%</span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value: any, row: any) => (
        <button className="text-teal-600 hover:text-teal-800 transition-colors duration-200">
          <Eye className="w-4 h-4" />
        </button>
      ),
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
          <p className="text-sm text-gray-500">{row.class}</p>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-gray-900">₹{value}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string, row: any) => {
        const isOverdue = value === "Overdue";
        const isPending =
          value === "Pending" && new Date(row.dueDate) < new Date();

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              value === "Paid"
                ? "bg-green-100 text-green-800"
                : isOverdue
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {isOverdue ? "Overdue" : value}
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
      key: "method",
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
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Classes</option>
            <option value="math7">Mathematics Grade 7</option>
            <option value="physics8">Physics Grade 8</option>
            <option value="chemistry9">Chemistry Grade 9</option>
            <option value="math8">Mathematics Grade 8</option>
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="current">Current Month</option>
            <option value="last">Last Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {teacherStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
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

      {/* Class Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            My Classes - Fee Overview
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Revenue and payment status for each class
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {classColumns.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {myClasses.map((classItem, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {classColumns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render
                        ? column.render(
                            classItem[column.key as keyof typeof classItem],
                            classItem
                          )
                        : classItem[column.key as keyof typeof classItem]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Payments */}
      <DataTable
        columns={paymentColumns}
        data={studentPayments}
        title="Student Payment Status"
        searchable={true}
        filterable={true}
        exportable={true}
      />

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors duration-200 text-center">
            <CheckCircle className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Mark Payment</p>
          </button>
          <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors duration-200 text-center">
            <AlertCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Send Reminder</p>
          </button>
          <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-center">
            <Download className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Export Report</p>
          </button>
          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">View Analytics</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherBalanceView;
