import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Download,
  Filter,
  Search,
  Eye,
  CreditCard,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import DataTable from "../Common/DataTable";

const AdminBalanceView: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedLocation, setSelectedLocation] = useState("all");

  const financialStats = [
    {
      title: "Total Revenue",
      value: "₹12,45,800",
      change: "+12.5%",
      isPositive: true,
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Outstanding Fees",
      value: "₹1,84,500",
      change: "-8.2%",
      isPositive: false,
      icon: AlertCircle,
      color: "orange",
    },
    {
      title: "Monthly Target",
      value: "₹15,00,000",
      change: "83% achieved",
      isPositive: true,
      icon: TrendingUp,
      color: "blue",
    },
    {
      title: "Active Students",
      value: "1,247",
      change: "+5.3%",
      isPositive: true,
      icon: Users,
      color: "teal",
    },
  ];

  const recentTransactions = [
    {
      id: 1,
      studentName: "Alice Johnson",
      class: "Grade 7A",
      amount: 4500,
      type: "Monthly Fee",
      status: "Completed",
      date: "2024-03-15",
      method: "Card",
      location: "Nelliyadi",
    },
    {
      id: 2,
      studentName: "Bob Smith",
      class: "Grade 8B",
      amount: 5200,
      type: "Monthly Fee + Lab",
      status: "Pending",
      date: "2024-03-14",
      method: "Bank Transfer",
      location: "Chavakacheri",
    },
    {
      id: 3,
      studentName: "Carol Davis",
      class: "Grade 6A",
      amount: 3800,
      type: "Monthly Fee",
      status: "Completed",
      date: "2024-03-14",
      method: "Cash",
      location: "Nelliyadi",
    },
    {
      id: 4,
      studentName: "David Wilson",
      class: "Grade 9C",
      amount: 6000,
      type: "Monthly + Exam Fee",
      status: "Failed",
      date: "2024-03-13",
      method: "Card",
      location: "Chavakacheri",
    },
  ];

  const overduePayments = [
    {
      id: 1,
      studentName: "Emma Brown",
      class: "Grade 8A",
      amount: 4500,
      daysOverdue: 15,
      lastContact: "2024-03-01",
      parentPhone: "+1 234-567-8901",
      location: "Nelliyadi",
    },
    {
      id: 2,
      studentName: "Frank Miller",
      class: "Grade 7B",
      amount: 5200,
      daysOverdue: 8,
      lastContact: "2024-03-08",
      parentPhone: "+1 234-567-8902",
      location: "Chavakacheri",
    },
  ];

  const transactionColumns = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">
            {row.class} • {row.location}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
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
      key: "method",
      label: "Method",
      sortable: true,
      render: (value: string) => (
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
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "Completed"
              ? "bg-green-100 text-green-800"
              : value === "Pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value: any, row: any) => (
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

  const overdueColumns = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">
            {row.class} • {row.location}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-red-600">
          Rs {value.toLocaleString()}
        </span>
      ),
    },
    {
      key: "daysOverdue",
      label: "Days Overdue",
      sortable: true,
      render: (value: number) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value > 30
              ? "bg-red-100 text-red-800"
              : value > 15
              ? "bg-orange-100 text-orange-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {value} days
        </span>
      ),
    },
    {
      key: "lastContact",
      label: "Last Contact",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "parentPhone",
      label: "Contact",
      render: (value: string) => (
        <button className="text-teal-600 hover:text-teal-800 text-sm">
          {value}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 bg-teal-50 text-teal-600 rounded-md hover:bg-teal-100 text-xs font-medium">
            Send Reminder
          </button>
          <button className="px-3 py-1 bg-orange-50 text-orange-600 rounded-md hover:bg-orange-100 text-xs font-medium">
            Call Parent
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Financial Overview
          </h2>
          <p className="text-gray-600 mt-1">
            Monitor revenue, payments, and outstanding balances
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Locations</option>
            <option value="nelliyadi">Nelliyadi</option>
            <option value="chavakacheri">Chavakacheri</option>
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {financialStats.map((stat, index) => (
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
                <div className="flex items-center mt-2">
                  <span
                    className={`text-sm font-medium ${
                      stat.isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.isPositive ? (
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 inline mr-1" />
                    )}
                    {stat.change}
                  </span>
                </div>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.color === "green"
                    ? "bg-green-500"
                    : stat.color === "orange"
                    ? "bg-orange-500"
                    : stat.color === "blue"
                    ? "bg-blue-500"
                    : "bg-teal-500"
                }`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Revenue Trends
          </h3>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm bg-teal-50 text-teal-600 rounded-md">
              Monthly
            </button>
            <button className="px-3 py-1 text-sm text-gray-600 rounded-md hover:bg-gray-50">
              Weekly
            </button>
            <button className="px-3 py-1 text-sm text-gray-600 rounded-md hover:bg-gray-50">
              Daily
            </button>
          </div>
        </div>
        <div className="h-64 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-teal-500 mx-auto mb-4" />
            <p className="text-gray-600">
              Revenue chart visualization would go here
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Integration with charting library needed
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <DataTable
        columns={transactionColumns}
        data={recentTransactions}
        title="Recent Transactions"
        searchable={true}
        filterable={true}
        exportable={true}
      />

      {/* Overdue Payments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Overdue Payments
                </h3>
                <p className="text-sm text-gray-600">
                  Students with outstanding balances
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              {overduePayments.length} overdue
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {overdueColumns.map((column) => (
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
              {overduePayments.map((payment, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {overdueColumns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render
                        ? column.render(
                            payment[column.key as keyof typeof payment],
                            payment
                          )
                        : payment[column.key as keyof typeof payment]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBalanceView;
