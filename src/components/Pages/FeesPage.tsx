import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import DataTable from "../Common/DataTable";
import Modal from "../Common/Modal";
import { useAuth } from "../../contexts/AuthContext";

interface FeeStructure {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  frequency: "monthly" | "semester" | "annual" | "one-time";
  category:
    | "tuition"
    | "lab"
    | "library"
    | "sports"
    | "transport"
    | "exam"
    | "other";
  applicableClasses: string[];
  status: "active" | "inactive";
  createdAt: string;
}

interface StudentFee {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  feeStructureId: string;
  feeName: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue" | "partial";
  paidAmount: number;
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
}

const FeesPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "fee-structure" | "payment" | "bulk-assign"
  >("fee-structure");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: 0,
    currency: "LKR",
    frequency: "monthly",
    category: "tuition",
    applicableClasses: [],
    status: "active",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API calls
      const mockFeeStructures: FeeStructure[] = [
        {
          id: "1",
          name: "Monthly Tuition Fee",
          description: "Regular monthly tuition fee for all students",
          amount: 4500,
          currency: "INR",
          frequency: "monthly",
          category: "tuition",
          applicableClasses: ["1", "2", "3"],
          status: "active",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "2",
          name: "Laboratory Fee",
          description: "Fee for laboratory equipment and materials",
          amount: 750,
          currency: "INR",
          frequency: "semester",
          category: "lab",
          applicableClasses: ["2", "3"],
          status: "active",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "3",
          name: "Annual Sports Fee",
          description: "Fee for sports activities and equipment",
          amount: 1200,
          currency: "INR",
          frequency: "annual",
          category: "sports",
          applicableClasses: ["1", "2", "3"],
          status: "active",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const mockStudentFees: StudentFee[] = [
        {
          id: "1",
          studentId: "3",
          studentName: "Alice Johnson",
          className: "Advanced Mathematics",
          feeStructureId: "1",
          feeName: "Monthly Tuition Fee",
          amount: 4500,
          dueDate: "2024-04-01",
          status: "paid",
          paidAmount: 4500,
          paidDate: "2024-03-28",
          paymentMethod: "Card",
        },
        {
          id: "2",
          studentId: "4",
          studentName: "Bob Smith",
          className: "Physics Fundamentals",
          feeStructureId: "1",
          feeName: "Monthly Tuition Fee",
          amount: 4500,
          dueDate: "2024-04-01",
          status: "pending",
          paidAmount: 0,
        },
        {
          id: "3",
          studentId: "5",
          studentName: "Carol Davis",
          className: "Chemistry Lab",
          feeStructureId: "2",
          feeName: "Laboratory Fee",
          amount: 750,
          dueDate: "2024-03-15",
          status: "overdue",
          paidAmount: 0,
        },
        {
          id: "4",
          studentId: "6",
          studentName: "David Wilson",
          className: "Advanced Mathematics",
          feeStructureId: "1",
          feeName: "Monthly Tuition Fee",
          amount: 4500,
          dueDate: "2024-04-01",
          status: "partial",
          paidAmount: 2000,
          paidDate: "2024-03-25",
          paymentMethod: "Cash",
        },
      ];

      setFeeStructures(mockFeeStructures);
      setStudentFees(mockStudentFees);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await fetchData();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || "Failed to save fee structure");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setFormData({
      name: "",
      description: "",
      amount: 0,
      currency: "USD",
      frequency: "monthly",
      category: "tuition",
      applicableClasses: [],
      status: "active",
    });
  };

  const feeStructureColumns = [
    {
      key: "name",
      label: "Fee Name",
      sortable: true,
      render: (value: string, row: FeeStructure) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{row.description}</p>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (value: number, row: FeeStructure) => (
        <span className="font-medium text-gray-900">₹{value}</span>
      ),
    },
    {
      key: "frequency",
      label: "Frequency",
      sortable: true,
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "monthly"
              ? "bg-blue-100 text-blue-800"
              : value === "semester"
              ? "bg-green-100 text-green-800"
              : value === "annual"
              ? "bg-purple-100 text-purple-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-900 capitalize">{value}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value: any, row: FeeStructure) => (
        <div className="flex items-center space-x-2">
          <button className="text-blue-600 hover:text-blue-800 transition-colors duration-200">
            <Edit className="w-4 h-4" />
          </button>
          <button className="text-red-600 hover:text-red-800 transition-colors duration-200">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const studentFeeColumns = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (value: string, row: StudentFee) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{row.className}</p>
        </div>
      ),
    },
    {
      key: "feeName",
      label: "Fee Type",
      sortable: true,
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (value: number, row: StudentFee) => (
        <div>
          <p className="font-medium text-gray-900">₹{value}</p>
          {row.paidAmount > 0 && (
            <p className="text-sm text-green-600">Paid: ₹{row.paidAmount}</p>
          )}
        </div>
      ),
    },
    {
      key: "dueDate",
      label: "Due Date",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "paid"
              ? "bg-green-100 text-green-800"
              : value === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : value === "overdue"
              ? "bg-red-100 text-red-800"
              : "bg-orange-100 text-orange-800"
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value: any, row: StudentFee) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedItem(row);
              setModalType("payment");
              setIsModalOpen(true);
            }}
            className="px-3 py-1 bg-teal-50 text-teal-600 rounded-md hover:bg-teal-100 text-xs font-medium"
          >
            Record Payment
          </button>
          <button className="text-blue-600 hover:text-blue-800 transition-colors duration-200">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const stats = [
    {
      title: "Total Revenue",
      value: "₹4,56,000",
      subtitle: "This month",
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Pending Payments",
      value: "₹84,500",
      subtitle: "18 students",
      icon: Clock,
      color: "orange",
    },
    {
      title: "Overdue Payments",
      value: "₹28,500",
      subtitle: "7 students",
      icon: AlertCircle,
      color: "red",
    },
    {
      title: "Collection Rate",
      value: "94.2%",
      subtitle: "This month",
      icon: CheckCircle,
      color: "blue",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fee Management</h2>
          <p className="text-gray-600 mt-1">
            Manage fee structures and student payments
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setModalType("bulk-assign");
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Bulk Assign Fees
          </button>
          <button
            onClick={() => {
              setModalType("fee-structure");
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fee Structure</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
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
                  stat.color === "green"
                    ? "bg-green-500"
                    : stat.color === "orange"
                    ? "bg-orange-500"
                    : stat.color === "red"
                    ? "bg-red-500"
                    : "bg-blue-500"
                }`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("structures")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "structures"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Fee Structures
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "payments"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Student Payments
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Payments
                  </h3>
                  <div className="space-y-3">
                    {studentFees
                      .filter((fee) => fee.status === "paid")
                      .slice(0, 5)
                      .map((fee) => (
                        <div
                          key={fee.id}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {fee.studentName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {fee.feeName}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-green-600">
                            ₹{fee.paidAmount}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Overdue Payments
                  </h3>
                  <div className="space-y-3">
                    {studentFees
                      .filter((fee) => fee.status === "overdue")
                      .map((fee) => (
                        <div
                          key={fee.id}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {fee.studentName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {fee.feeName}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-red-600">
                            ₹{fee.amount}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "structures" && (
            <DataTable
              columns={feeStructureColumns}
              data={feeStructures}
              title="Fee Structures"
              searchable={true}
              filterable={true}
              exportable={true}
            />
          )}

          {activeTab === "payments" && (
            <DataTable
              columns={studentFeeColumns}
              data={studentFees}
              title="Student Payments"
              searchable={true}
              filterable={true}
              exportable={true}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          modalType === "fee-structure"
            ? "Add Fee Structure"
            : modalType === "payment"
            ? "Record Payment"
            : "Bulk Assign Fees"
        }
        size="lg"
      >
        {modalType === "fee-structure" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fee Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter fee name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="tuition">Tuition</option>
                  <option value="lab">Laboratory</option>
                  <option value="library">Library</option>
                  <option value="sports">Sports</option>
                  <option value="transport">Transport</option>
                  <option value="exam">Examination</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter fee description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="LKR">LKR (Sri Lankan Rupee)</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="semester">Semester</option>
                  <option value="annual">Annual</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors duration-200"
              >
                Create Fee Structure
              </button>
            </div>
          </form>
        )}

        {modalType === "payment" && selectedItem && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">
                {selectedItem.studentName}
              </h4>
              <p className="text-sm text-gray-600">{selectedItem.feeName}</p>
              <p className="text-lg font-bold text-gray-900 mt-2">
                ₹{selectedItem.amount}
              </p>
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={selectedItem.amount - selectedItem.paidAmount}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Amount in Rs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="check">Check</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Additional notes (optional)"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors duration-200"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        )}

        {modalType === "bulk-assign" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Fee Structure
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Choose fee structure</option>
                {feeStructures.map((fee) => (
                  <option key={fee.id} value={fee.id}>
                    {fee.name} - ₹{fee.amount}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Classes
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Advanced Mathematics</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Physics Fundamentals</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Chemistry Lab</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Assign Fees
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeesPage;
