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
import axios from "axios";

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
  currency: string;
}

interface Class {
  id: string;
  title: string;
}

const FeesPage: React.FC = () => {
  const { user, accessToken, logout, login } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "fee-structure" | "payment" | "bulk-assign"
  >("fee-structure");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    amount: 0,
    currency: "LKR",
    frequency: "monthly",
    category: "tuition",
    applicableClasses: [] as string[],
    status: "active",
  });
  const [paymentFormData, setPaymentFormData] = useState({
    paidAmount: 0,
    paymentMethod: "cash",
    paidDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [bulkAssignData, setBulkAssignData] = useState({
    feeStructureId: "",
    classIds: [] as string[],
    dueDate: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!accessToken) {
      setError("Please log in to access this page. Click below to log in.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const [feeStructuresRes, studentFeesRes, classesRes] = await Promise.all([
        axios.get("/api/fees/structures", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axios.get("/api/fees/student", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axios.get("/api/classes", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);
      setFeeStructures(feeStructuresRes.data.data);
      setStudentFees(studentFeesRes.data.data);
      console.log("ClassesRes:", classesRes.data.data);

      setClasses(classesRes.data.data.classes);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        logout(); // Redirect to login
      } else {
        setError(err.response?.data?.message || "Failed to fetch data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    logout(); // Triggers redirect to login page
  };

  const handleFeeStructureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setError("Please log in to perform this action.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      const url = formData.id
        ? `/api/fees/structures/${formData.id}`
        : "/api/fees/structures";
      const method = formData.id ? "put" : "post";
      await axios({
        method,
        url,
        data: formData,
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSuccess(
        `Fee structure ${formData.id ? "updated" : "created"} successfully`
      );
      await fetchData();
      handleCloseModal();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save fee structure");
    }
  };

  const handleDeleteFeeStructure = async (id: string) => {
    if (!accessToken) {
      setError("Please log in to perform this action.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this fee structure?")) {
      try {
        setError("");
        setSuccess("");
        await axios.delete(`/api/fees/structures/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setSuccess("Fee structure deleted successfully");
        await fetchData();
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to delete fee structure"
        );
      }
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setError("Please log in to perform this action.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await axios.patch(
        `/api/fees/student/${selectedItem.id}/pay`,
        paymentFormData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setSuccess("Payment recorded successfully");
      await fetchData();
      handleCloseModal();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to record payment");
    }
  };

  const handleBulkAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setError("Please log in to perform this action.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await axios.post("/api/fees/assign", bulkAssignData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSuccess("Fees assigned successfully");
      await fetchData();
      handleCloseModal();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to assign fees");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setFormData({
      id: "",
      name: "",
      description: "",
      amount: 0,
      currency: "LKR",
      frequency: "monthly",
      category: "tuition",
      applicableClasses: [],
      status: "active",
    });
    setPaymentFormData({
      paidAmount: 0,
      paymentMethod: "cash",
      paidDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setBulkAssignData({
      feeStructureId: "",
      classIds: [],
      dueDate: "",
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
        <span className="font-medium text-gray-900">
          {row.currency} {value}
        </span>
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
      render: (_: any, row: FeeStructure) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedItem(row);
              setFormData({
                id: row.id,
                name: row.name,
                description: row.description,
                amount: row.amount,
                currency: row.currency,
                frequency: row.frequency,
                category: row.category,
                applicableClasses: row.applicableClasses,
                status: row.status,
              });
              setModalType("fee-structure");
              setIsModalOpen(true);
            }}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteFeeStructure(row.id)}
            className="text-red-600 hover:text-red-800 transition-colors duration-200"
          >
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
          <p className="font-medium text-gray-900">
            {row.currency} {value}
          </p>
          {row.paidAmount > 0 && (
            <p className="text-sm text-green-600">
              Paid: {row.currency} {row.paidAmount}
            </p>
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
      render: (_: any, row: StudentFee) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedItem(row);
              setPaymentFormData({
                paidAmount: row.amount - row.paidAmount,
                paymentMethod: "cash",
                paidDate: new Date().toISOString().split("T")[0],
                notes: "",
              });
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
      value: `${studentFees.reduce(
        (sum, fee) => sum + (fee.paidAmount || 0),
        0
      )} ${user?.currency || "LKR"}`,
      subtitle: "This month",
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Pending Payments",
      value: `${studentFees
        .filter((fee) => fee.status === "pending")
        .reduce((sum, fee) => sum + fee.amount, 0)} ${user?.currency || "LKR"}`,
      subtitle: `${
        studentFees.filter((fee) => fee.status === "pending").length
      } students`,
      icon: Clock,
      color: "orange",
    },
    {
      title: "Overdue Payments",
      value: `${studentFees
        .filter((fee) => fee.status === "overdue")
        .reduce((sum, fee) => sum + fee.amount, 0)} ${user?.currency || "LKR"}`,
      subtitle: `${
        studentFees.filter((fee) => fee.status === "overdue").length
      } students`,
      icon: AlertCircle,
      color: "red",
    },
    {
      title: "Collection Rate",
      value: `${(
        (studentFees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0) /
          studentFees.reduce((sum, fee) => sum + fee.amount, 0)) *
          100 || 0
      ).toFixed(1)}%`,
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
          {error.includes("Please log in") && (
            <button
              onClick={handleLoginRedirect}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Login
            </button>
          )}
          {error.includes("Session expired") && (
            <button
              onClick={handleLoginRedirect}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Log In Again
            </button>
          )}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-600">{success}</p>
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
                            {fee.currency} {fee.paidAmount}
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
                            {fee.currency} {fee.amount}
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
            ? (selectedItem ? "Edit" : "Add") + " Fee Structure"
            : modalType === "payment"
            ? "Record Payment"
            : "Bulk Assign Fees"
        }
        size="lg"
      >
        {modalType === "fee-structure" && (
          <form onSubmit={handleFeeStructureSubmit} className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Applicable Classes
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                {classes.map((classItem) => (
                  <label key={classItem.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.applicableClasses.includes(
                        classItem.id
                      )}
                      onChange={(e) => {
                        const updatedClasses = e.target.checked
                          ? [...formData.applicableClasses, classItem.id]
                          : formData.applicableClasses.filter(
                              (id) => id !== classItem.id
                            );
                        setFormData({
                          ...formData,
                          applicableClasses: updatedClasses,
                        });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{classItem.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
                {selectedItem ? "Update" : "Create"} Fee Structure
              </button>
            </div>
          </form>
        )}

        {modalType === "payment" && selectedItem && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">
                {selectedItem.studentName}
              </h4>
              <p className="text-sm text-gray-600">{selectedItem.feeName}</p>
              <p className="text-lg font-bold text-gray-900 mt-2">
                {selectedItem.currency} {selectedItem.amount}
              </p>
              <p className="text-sm text-gray-600">
                Remaining: {selectedItem.currency}{" "}
                {selectedItem.amount - selectedItem.paidAmount}
              </p>
            </div>

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
                  value={paymentFormData.paidAmount}
                  onChange={(e) =>
                    setPaymentFormData({
                      ...paymentFormData,
                      paidAmount: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentFormData.paymentMethod}
                  onChange={(e) =>
                    setPaymentFormData({
                      ...paymentFormData,
                      paymentMethod: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
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
                value={paymentFormData.paidDate}
                onChange={(e) =>
                  setPaymentFormData({
                    ...paymentFormData,
                    paidDate: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={paymentFormData.notes}
                onChange={(e) =>
                  setPaymentFormData({
                    ...paymentFormData,
                    notes: e.target.value,
                  })
                }
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
        )}

        {modalType === "bulk-assign" && (
          <form onSubmit={handleBulkAssignSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Fee Structure
              </label>
              <select
                value={bulkAssignData.feeStructureId}
                onChange={(e) =>
                  setBulkAssignData({
                    ...bulkAssignData,
                    feeStructureId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">Choose fee structure</option>
                {feeStructures.map((fee) => (
                  <option key={fee.id} value={fee.id}>
                    {fee.name} - {fee.currency} {fee.amount}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Classes
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                {classes.map((classItem) => (
                  <label key={classItem.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={bulkAssignData.classIds.includes(classItem.id)}
                      onChange={(e) => {
                        const updatedClasses = e.target.checked
                          ? [...bulkAssignData.classIds, classItem.id]
                          : bulkAssignData.classIds.filter(
                              (id) => id !== classItem.id
                            );
                        setBulkAssignData({
                          ...bulkAssignData,
                          classIds: updatedClasses,
                        });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{classItem.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={bulkAssignData.dueDate}
                onChange={(e) =>
                  setBulkAssignData({
                    ...bulkAssignData,
                    dueDate: e.target.value,
                  })
                }
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
          </form>
        )}
      </Modal>
    </div>
  );
};

export default FeesPage;
