import React, { useState } from "react";
import {
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Download,
  Receipt,
  Bell,
} from "lucide-react";

const StudentBalanceView: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("current");

  const balanceStats = [
    {
      title: "Current Balance",
      value: "LKR0",
      subtitle: "All fees paid",
      icon: DollarSign,
      color: "green",
      status: "positive",
    },
    {
      title: "Next Payment",
      value: "LKR4,500",
      subtitle: "Due April 1st",
      icon: Calendar,
      color: "blue",
      status: "upcoming",
    },
    {
      title: "Total Paid",
      value: "₹22,500",
      subtitle: "This academic year",
      icon: CheckCircle,
      color: "teal",
      status: "completed",
    },
    {
      title: "Payment Method",
      value: "Auto-Pay",
      subtitle: "Card ending 4532",
      icon: CreditCard,
      color: "purple",
      status: "active",
    },
  ];

  const paymentHistory = [
    {
      id: 1,
      description: "Monthly Tuition Fee",
      amount: 4500,
      dueDate: "2024-03-01",
      paidDate: "2024-02-28",
      status: "Paid",
      method: "Auto-Pay",
      receiptId: "RCP-2024-001",
    },
    {
      id: 2,
      description: "Lab Fee - Chemistry",
      amount: 750,
      dueDate: "2024-03-01",
      paidDate: "2024-02-28",
      status: "Paid",
      method: "Auto-Pay",
      receiptId: "RCP-2024-002",
    },
    {
      id: 3,
      description: "Monthly Tuition Fee",
      amount: 4500,
      dueDate: "2024-02-01",
      paidDate: "2024-01-30",
      status: "Paid",
      method: "Card",
      receiptId: "RCP-2024-003",
    },
    {
      id: 4,
      description: "Exam Fee - Mid-term",
      amount: 500,
      dueDate: "2024-02-15",
      paidDate: "2024-02-14",
      status: "Paid",
      method: "Card",
      receiptId: "RCP-2024-004",
    },
    {
      id: 5,
      description: "Monthly Tuition Fee",
      amount: 4500,
      dueDate: "2024-01-01",
      paidDate: "2023-12-30",
      status: "Paid",
      method: "Bank Transfer",
      receiptId: "RCP-2023-012",
    },
  ];

  const upcomingPayments = [
    {
      id: 1,
      description: "Monthly Tuition Fee",
      amount: 4500,
      dueDate: "2024-04-01",
      type: "Monthly Fee",
      autoPayEnabled: true,
    },
    {
      id: 2,
      description: "Annual Sports Fee",
      amount: 1200,
      dueDate: "2024-04-15",
      type: "Annual Fee",
      autoPayEnabled: false,
    },
    {
      id: 3,
      description: "Field Trip Fee",
      amount: 850,
      dueDate: "2024-04-20",
      type: "Activity Fee",
      autoPayEnabled: false,
    },
  ];

  const feeBreakdown = [
    { category: "Tuition Fee", amount: 4500, frequency: "Monthly" },
    { category: "Lab Fee", amount: 750, frequency: "Monthly" },
    { category: "Library Fee", amount: 250, frequency: "Monthly" },
    { category: "Sports Fee", amount: 1200, frequency: "Annual" },
    { category: "Technology Fee", amount: 500, frequency: "Semester" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
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
            My Fees & Payments
          </h2>
          <p className="text-gray-600 mt-1">
            Track your payment history and upcoming dues
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="current">Current Year</option>
            <option value="last">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download Statement</span>
          </button>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {balanceStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-lg text-teal-600">
                  Rs 55,000
                </span>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.color === "green"
                    ? "bg-green-500"
                    : stat.color === "blue"
                    ? "bg-blue-500"
                    : stat.color === "teal"
                    ? "bg-teal-500"
                    : "bg-purple-500"
                }`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Payments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Upcoming Payments
                </h3>
                <p className="text-sm text-gray-600">
                  Fees due in the next 30 days
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {upcomingPayments.length} due
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {upcomingPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {payment.description}
                    </h4>
                    <span className="text-lg font-bold text-gray-900">
                      LKR{payment.amount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Due: {new Date(payment.dueDate).toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-2">
                      {payment.autoPayEnabled ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Auto-Pay Enabled
                        </span>
                      ) : (
                        <button className="px-3 py-1 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-xs font-medium">
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Fee Structure
            </h3>
            <p className="text-sm text-gray-600 mt-1">Breakdown of your fees</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {feeBreakdown.map((fee, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{fee.category}</p>
                    <p className="text-sm text-gray-500">{fee.frequency}</p>
                  </div>
                  <span className="font-medium text-gray-900">
                    LKR{fee.amount}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">
                  Monthly Total
                </span>
                <span className="font-bold text-lg text-teal-600">
                  LKR5,500
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Payment Settings
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage your payment preferences
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Auto-Pay</p>
                  <p className="text-sm text-gray-500">
                    Automatic monthly payments
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-6 bg-green-500 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Payment Reminders</p>
                  <p className="text-sm text-gray-500">Email notifications</p>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-6 bg-green-500 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Primary Payment Method
                    </p>
                    <p className="text-sm text-gray-600">**** **** **** 4532</p>
                  </div>
                </div>
                <button className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Update Payment Method
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Payment History
            </h3>
            <button className="text-teal-600 hover:text-teal-700 text-sm font-medium">
              View All
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paymentHistory.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.description}
                      </p>
                      <p className="text-sm text-gray-500">{payment.method}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.paidDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-teal-600 hover:text-teal-800 transition-colors duration-200 flex items-center space-x-1">
                      <Receipt className="w-4 h-4" />
                      <span className="text-sm">Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors duration-200 text-center">
            <DollarSign className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Make Payment</p>
          </button>
          <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-center">
            <Download className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">
              Download Receipt
            </p>
          </button>
          <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200 text-center">
            <CreditCard className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Update Card</p>
          </button>
          <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors duration-200 text-center">
            <Bell className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Set Reminders</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentBalanceView;
