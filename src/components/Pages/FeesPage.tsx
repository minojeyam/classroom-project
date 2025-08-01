// FeesPage.tsx
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
import axios, { AxiosError } from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// TypeScript interfaces aligned with backend (fees.js)
interface FeeStructure {
  _id: string;
  name: string;
  amount: number;
  currency: "LKR" | "USD" | "EUR";
  frequency: "monthly" | "semester" | "annual" | "one-time";
  category:
    | "tuition"
    | "lab"
    | "library"
    | "sports"
    | "transport"
    | "exam"
    | "other";
  applicableClasses: { _id: string; title: string }[];
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
  status: "pending" | "paid" | "partial";
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

interface ClassFeeOverview {
  classId: string;
  className: string;
  totalStudents: number;
  totalExpectedRevenue: number;
  collectedAmount: number;
  paidCount: number;
  partialCount: number;
  pendingCount: number;
  currency: string;
}

// API base URL
const API_BASE_URL = "http://localhost:5000";

// Axios instance with auth header
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Class fee overview columns
const classColumns = [
  { key: "className", label: "Class Name" },
  { key: "totalStudents", label: "Total Students" },
  {
    key: "totalExpectedRevenue",
    label: "Expected Revenue",
    render: (value: number, classItem: ClassFeeOverview) =>
      `${classItem.currency} ${value?.toFixed(2)}`,
  },
  {
    key: "collectedAmount",
    label: "Collected Amount",
    render: (value: number, classItem: ClassFeeOverview) =>
      `${classItem.currency} ${value?.toFixed(2)}`,
  },
  {
    key: "paymentStatus",
    label: "Payment Status",
    render: (_: any, classItem: ClassFeeOverview) => (
      <div>
        <span className="text-green-600">{classItem.paidCount} Paid</span> |{" "}
        <span className="text-yellow-600">
          {classItem.partialCount} Partial
        </span>{" "}
        | <span className="text-red-600">{classItem.pendingCount} Pending</span>
      </div>
    ),
  },
];

const FeesPage: React.FC = () => {
  const { user, accessToken, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "structures" | "payments"
  >("overview");
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classOverview, setClassOverview] = useState<ClassFeeOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "fee-structure" | "payment" | "bulk-assign" | "view"
  >("fee-structure");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    amount: 0,
    currency: "LKR" as "LKR" | "USD" | "EUR",
    frequency: "monthly" as "monthly" | "semester" | "annual" | "one-time",
    category: "tuition" as
      | "tuition"
      | "lab"
      | "library"
      | "sports"
      | "transport"
      | "exam"
      | "other",
    applicableClasses: [] as string[],
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
  const [filters, setFilters] = useState({
    classId: "",
    status: "",
  });

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  const fetchData = async () => {
    if (!accessToken) {
      setError("Please log in to access this page.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const [feeStructuresRes, studentFeesRes, classesRes, overviewRes] =
        await Promise.all([
          axiosInstance.get("/api/fees/structures", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axiosInstance.get("/api/fees/student", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axiosInstance.get("/api/classes", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axiosInstance.get("/api/reports/class-overview", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);
      setFeeStructures(
        feeStructuresRes.data.data.map((f: any) => ({ ...f, id: f._id }))
      );
      setStudentFees(studentFeesRes.data.data);
      setClasses(classesRes.data.data.classes || classesRes.data.data);
      setClassOverview(overviewRes.data.data);
    } catch (err: any) {
      const error = err as AxiosError;
      if (error.response?.status === 401) {
        setError("Session expired. Please log in again.");
        logout();
      } else {
        setError(error.response?.data?.message || "Failed to fetch data");
        toast.error(error.response?.data?.message || "Failed to fetch data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFeeStructureSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!accessToken) {
      setError("Please log in to perform this action.");
      toast.error("Please log in to perform this action.");
      return;
    }

    if (formData.amount <= 0) {
      setError("Amount must be positive.");
      toast.error("Amount must be positive.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      const url = formData.id
        ? `/api/fees/structures/${formData.id}`
        : `/api/fees/structures`;
      const method: "post" | "put" = formData.id ? "put" : "post";

      await axiosInstance({
        method,
        url,
        data: formData,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setSuccess(
        `Fee structure ${formData.id ? "updated" : "created"} successfully`
      );
      toast.success(
        `Fee structure ${formData.id ? "updated" : "created"} successfully`
      );
      await fetchData();
      handleCloseModal();
    } catch (err: any) {
      const error = err as AxiosError;
      setError(
        error.response?.data?.message ||
          `Failed to ${formData.id ? "update" : "create"} fee structure`
      );
      toast.error(
        error.response?.data?.message ||
          `Failed to ${formData.id ? "update" : "create"} fee structure`
      );
    }
  };

  const handleDeleteFeeStructure = async (id: string) => {
    if (!accessToken) {
      setError("Please log in to perform this action.");
      toast.error("Please log in to perform this action.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this fee structure?")) {
      try {
        setError("");
        setSuccess("");
        await axiosInstance.delete(`/api/fees/structures/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setSuccess("Fee structure deleted successfully");
        toast.success("Fee structure deleted successfully");
        await fetchData();
      } catch (err: any) {
        const error = err as AxiosError;
        setError(
          error.response?.data?.message || "Failed to delete fee structure"
        );
        toast.error(
          error.response?.data?.message || "Failed to delete fee structure"
        );
      }
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setError("Please log in to perform this action.");
      toast.error("Please log in to perform this action.");
      return;
    }

    if (paymentFormData.paidAmount <= 0) {
      setError("Payment amount must be positive.");
      toast.error("Payment amount must be positive.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await axiosInstance.patch(
        `/api/fees/student/${selectedItem.id}/pay`,
        paymentFormData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setSuccess("Payment recorded successfully");
      toast.success("Payment recorded successfully");
      await fetchData();
      handleCloseModal();
    } catch (err: any) {
      const error = err as AxiosError;
      setError(error.response?.data?.message || "Failed to record payment");
      toast.error(error.response?.data?.message || "Failed to record payment");
    }
  };

  const handleBulkAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setError("Please log in to perform this action.");
      toast.error("Please log in to perform this action.");
      return;
    }

    if (
      !bulkAssignData.feeStructureId ||
      bulkAssignData.classIds.length === 0 ||
      !bulkAssignData.dueDate
    ) {
      setError(
        "Please fill all required fields (Fee Structure, Classes, and Due Date)."
      );
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await axiosInstance.post("/api/fees/assign", bulkAssignData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSuccess("Fees assigned successfully");
      toast.success("Fees assigned successfully");
      await fetchData();
      handleCloseModal();
    } catch (err: any) {
      const error = err as AxiosError;
      setError(error.response?.data?.message || "Failed to assign fees");
      toast.error(error.response?.data?.message || "Failed to assign fees");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setFormData({
      id: "",
      name: "",
      amount: 0,
      currency: "LKR",
      frequency: "monthly",
      category: "tuition",
      applicableClasses: [],
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

  // Fee structure columns
  const feeStructureColumns = [
    {
      key: "name",
      label: "Fee Name",
      sortable: true,
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (value: number, row: FeeStructure) => (
        <span className="font-medium text-gray-900">
          {row.currency} {value.toFixed(2)}
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
      key: "applicableClasses",
      label: "Classes",
      render: (value: { _id: string; title: string }[]) => (
        <span>{value.map((c) => c.title).join(", ")}</span>
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
                id: row._id,
                name: row.name,
                amount: row.amount,
                currency: row.currency,
                frequency: row.frequency,
                category: row.category,
                applicableClasses: row.applicableClasses.map((c) => c._id),
              });
              setModalType("fee-structure");
              setIsModalOpen(true);
            }}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteFeeStructure(row._id)}
            className="text-red-600 hover:text-red-800 transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Student fee columns
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
            {row.currency} {value.toFixed(2)}
          </p>
          {row.paidAmount > 0 && (
            <p className="text-sm text-green-600">
              Paid: {row.currency} {row.paidAmount.toFixed(2)}
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
          <button
            onClick={() => {
              setSelectedItem(row);
              setModalType("view");
              setIsModalOpen(true);
            }}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Stats for overview
  const stats = [
    {
      title: "Total Revenue",
      value: `${studentFees
        .reduce((sum, fee) => sum + (fee.paidAmount || 0), 0)
        .toFixed(2)} ${user?.currency || "LKR"}`,
      subtitle: "This month",
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Pending Payments",
      value: `${studentFees
        .filter((fee) => fee.status === "pending")
        .reduce((sum, fee) => sum + fee.amount, 0)
        .toFixed(2)} ${user?.currency || "LKR"}`,
      subtitle: `${
        studentFees.filter((fee) => fee.status === "pending").length
      } students`,
      icon: Clock,
      color: "orange",
    },
    {
      title: "Partial Payments",
      value: `${studentFees
        .filter((fee) => fee.status === "partial")
        .reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0)
        .toFixed(2)} ${user?.currency || "LKR"}`,
      subtitle: `${
        studentFees.filter((fee) => fee.status === "partial").length
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

  // Filter logic for student payments
  const filteredStudentFees = studentFees.filter((fee) => {
    const classMatch = !filters.classId || fee.className === filters.classId;
    const statusMatch = !filters.status || fee.status === filters.status;
    return classMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
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
              onClick={logout}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Login
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
                            {fee.currency} {fee.paidAmount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Pending Payments
                  </h3>
                  <div className="space-y-3">
                    {studentFees
                      .filter((fee) => fee.status === "pending")
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
                            {fee.currency} {fee.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    My Classes - Fee Overview
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Revenue and payment status for each class
                  </p>
                </div>
                <DataTable
                  columns={classColumns}
                  data={classOverview}
                  title=""
                  searchable={true}
                  filterable={true}
                  exportable={true}
                />
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
            <div>
              <div className="mb-4 flex space-x-4">
                <select
                  value={filters.classId}
                  onChange={(e) =>
                    setFilters({ ...filters, classId: e.target.value })
                  }
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All Classes</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.title}>
                      {classItem.title}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                </select>
                <button
                  onClick={() => setFilters({ classId: "", status: "" })}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Clear Filter
                </button>
              </div>
              <DataTable
                columns={studentFeeColumns}
                data={filteredStudentFees}
                title="Student Payments"
                searchable={true}
                filterable={true}
                exportable={true}
              />
            </div>
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
            : modalType === "view"
            ? "Payment Details"
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
                    setFormData({
                      ...formData,
                      category: e.target.value as
                        | "tuition"
                        | "lab"
                        | "library"
                        | "sports"
                        | "transport"
                        | "exam"
                        | "other",
                    })
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
                      amount: parseFloat(e.target.value) || 0,
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
                    setFormData({
                      ...formData,
                      currency: e.target.value as "LKR" | "USD" | "EUR",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="LKR">LKR</option>
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
                    setFormData({
                      ...formData,
                      frequency: e.target.value as
                        | "monthly"
                        | "semester"
                        | "annual"
                        | "one-time",
                    })
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
                {selectedItem.currency} {selectedItem.amount.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                Remaining: {selectedItem.currency}{" "}
                {(selectedItem.amount - selectedItem.paidAmount).toFixed(2)}
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
                      paidAmount: parseFloat(e.target.value) || 0,
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
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
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

        {modalType === "view" && selectedItem && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">
                {selectedItem.studentName}
              </h4>
              <p className="text-sm text-gray-600">{selectedItem.feeName}</p>
              <p className="text-lg font-bold text-gray-900 mt-2">
                {selectedItem.currency} {selectedItem.amount.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                Paid: {selectedItem.currency}{" "}
                {selectedItem.paidAmount.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                Remaining: {selectedItem.currency}{" "}
                {(selectedItem.amount - selectedItem.paidAmount).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                Status: {selectedItem.status}
              </p>
              {selectedItem.paidDate && (
                <p className="text-sm text-gray-600">
                  Paid Date:{" "}
                  {new Date(selectedItem.paidDate).toLocaleDateString()}
                </p>
              )}
              {selectedItem.paymentMethod && (
                <p className="text-sm text-gray-600">
                  Payment Method: {selectedItem.paymentMethod}
                </p>
              )}
              {selectedItem.notes && (
                <p className="text-sm text-gray-600">
                  Notes: {selectedItem.notes}
                </p>
              )}
            </div>
            <div className="flex items-center justify-end pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
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
                  <option key={fee._id} value={fee._id}>
                    {fee.name} - {fee.currency} {fee.amount.toFixed(2)}
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

      <ToastContainer />
    </div>
  );
};

export default FeesPage;
