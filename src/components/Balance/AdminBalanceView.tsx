import React, { useState, useEffect, ComponentState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  CheckCircle,
  Clock,
  MapPin,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import DataTable from "../Common/DataTable";
import Modal from "../Common/Modal";
import { useAuth } from "../../contexts/AuthContext";
import { classesAPI, feesAPI, locationsAPI } from "../../utils/api";
import { toast } from "react-toastify";
import ConfirmModal from "../Common/ConfirmModal";
import axios from "axios";

interface FeeStructure {
  value: any;
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  frequency: "monthly" | "semester" | "annual" | "one-time" | undefined;
  category:
    | "tuition"
    | "lab"
    | "library"
    | "sports"
    | "transport"
    | "exam"
    | "other"
    | undefined;
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

interface LocationRevenue {
  locationId: string;
  locationName: string;
  totalClasses: number;
  totalStudents: number;
  monthlyRevenue: number;
  receivedAmount: number;
  pendingAmount: number;
  collectionRate: number;
  classes: ClassRevenue[];
}

interface ClassRevenue {
  classId: string;
  className: string;
  subject: string;
  level: string;
  teacherName: string;
  studentCount: number;
  monthlyFee: number;
  totalRevenue: number;
  receivedAmount: number;
  pendingAmount: number;
  collectionRate: number;
  students: StudentPaymentDetail[];
}

interface StudentPaymentDetail {
  studentId: string;
  studentName: string;
  email: string;
  phoneNumber?: string;
  parentEmail?: string;
  monthlyFee: number;
  paidAmount: number;
  pendingAmount: number;
  lastPaymentDate?: string;
  paymentStatus: "paid" | "partial" | "pending" | "overdue";
  paymentMethod?: string;
}

interface FeeStructureActionsProps {
  fee: FeeStructure;
  onDeleted: () => void; // callback to refresh data after deletion
  onEdit: (fee: FeeStructure) => void; // callback to open edit modal
}

const FeesPage: React.FC<FeeStructureActionsProps> = () => {
  useAuth();
  const [activeTab, setActiveTab] = useState("location-overview");
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [locationRevenue, setLocationRevenue] = useState<LocationRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    | "fee-structure"
    | "edit-fee-structure"
    | "payment"
    | "bulk-assign"
    | "class-details"
    | "student-payments"
  >("fee-structure");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<ClassRevenue | null>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationRevenue | null>(null);
  const [formData, setFormData] = useState<Partial<FeeStructure>>({
    id: "",
    name: "",
    description: "",
    amount: 0,
    currency: "USD",
    frequency: "monthly" as const,
    category: "tuition" as const,
    applicableClasses: [],
    status: "active",
  });

  const [selectedFee, setSelectedFee] = useState<FeeStructure | null>(null);
  const [deleteState, setDeleteState] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({
    isOpen: false,
    id: null,
  });

  // Get Location
  const [locations, setLocations] = useState<{ id: string; name: string }[]>(
    []
  );
  const [selectedLocationFilter, setSelectedLocationFilter] = useState("all");
  const [selectedFeeStructure, setSelectedFeeStructure] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem("accessToken") ?? undefined;
      const response = await locationsAPI.getLocations({}, token);

      // Extract only id and name
      const locationList = response.data.locations.map((loc: any) => ({
        id: loc._id,
        name: loc.name,
      }));

      setLocations(locationList);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  // get Classes
  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("accessToken") ?? undefined;
      const response = await classesAPI.getClasses({}, token);
      const classList = response.data.classes.map((cls: any) => ({
        id: cls._id,
        name: cls.title,
      }));
      setClasses(classList);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLocations();
    fetchClasses();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token") || undefined;

      // ---- 1) Fetch Fee Structures ----
      const feeResponse = await feesAPI.getStructures(token);
      if (feeResponse.status !== "success") {
        throw new Error(
          feeResponse.message || "Failed to fetch fee structures"
        );
      }
      const mappedStructures: FeeStructure[] = feeResponse.data.map(
        (item: any) => ({
          id: item._id,
          name: item.name,
          description: item.description,
          amount: item.amount,
          currency: item.currency,
          frequency: item.frequency,
          category: item.category,
          applicableClasses: item.applicableClasses?.map(
            (cls: any) => cls.title
          ),
          status: item.status,
          createdAt: item.createdAt,
        })
      );
      setFeeStructures(mappedStructures);

      console.log(mappedStructures, "fee items");

      // ---- 2) Fetch Student Fees ----
      const studentFeeResponse = await feesAPI.getStudentFees(token);
      if (studentFeeResponse.status !== "success") {
        throw new Error(
          studentFeeResponse.message || "Failed to fetch student fees"
        );
      }
      const mappedStudentFees: StudentFee[] = studentFeeResponse.data.map(
        (item: any) => ({
          id: item._id,
          studentId: item.studentId?._id,
          studentName: item.studentId?.name,
          className: item.studentId?.className,
          feeStructureId: item.feeStructureId?._id,
          feeName: item.feeStructureId?.name,
          amount: item.amount ?? item.feeStructureId?.amount,
          dueDate: item.dueDate,
          status: item.status,
          paidAmount: item.paidAmount,
          paidDate: item.paidDate,
          paymentMethod: item.paymentMethod,
          notes: item.notes,
        })
      );
      setStudentFees(mappedStudentFees);

      // ---- 3) Fetch Location Revenue ----
      const locationResponse = await feesAPI.getLocationRevenueDetails(token);
      if (locationResponse.status !== "success") {
        throw new Error(
          locationResponse.message || "Failed to fetch location revenue"
        );
      }
      const mappedLocationRevenue: LocationRevenue[] =
        locationResponse.data.locations.map((loc: any) => ({
          locationId: loc.locationName, // fallback
          locationName: loc.locationName,
          totalClasses: loc.totalClasses,
          totalStudents: loc.classes.reduce(
            (sum: number, c: any) => sum + (c.studentCount || 0),
            0
          ),
          monthlyRevenue: loc.totalFee,
          receivedAmount: loc.totalFee,
          pendingAmount: 0,
          collectionRate: 100,
          classes: loc.classes.map((cls: any) => ({
            classId: cls.classId,
            className: cls.title,
            subject: cls.subject,
            level: cls.level,
            teacherName: cls.teacherName,
            studentCount: cls.studentCount,
            monthlyFee: cls.feeTotal,
            totalRevenue: cls.feeTotal,
            receivedAmount: cls.feeTotal,
            pendingAmount: 0,
            collectionRate: 100,
            students: [],
          })),
        }));

      setLocationRevenue(mappedLocationRevenue);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (id: string) => {
    console.log("Deleting Fee Structure ID:", id); // <-- print ID
    setDeleteState({ isOpen: true, id });
  };

  const handleDelete = async () => {
    if (!deleteState.id) {
      toast.error("Invalid Fee ID");
      return;
    }

    try {
      const token = localStorage.getItem("token") || undefined;
      console.log("Deleting Fee Structure ID:", deleteState.id);

      await feesAPI.deleteStructure(deleteState.id, token);

      toast.success("Fee structure deleted successfully");
      setDeleteState({ isOpen: false, id: null });

      await fetchData(); // <-- directly refresh after delete
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete fee structure");
    }
  };

  const handleBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFeeStructure) {
      toast.error("Please select a fee structure");
      return;
    }
    if (selectedClasses.length === 0) {
      toast.error("Please select at least one class");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") ?? undefined;
      await axios.post(
        `/api/fees/structures/${selectedFeeStructure}/bulk-assign`,
        {
          classIds: selectedClasses,
          dueDate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Fee assigned successfully");
      handleCloseModal();

      // reset form
      setSelectedClasses([]);
      setSelectedFeeStructure("");
      setDueDate("");
    } catch (error) {
      console.error("Bulk assign error:", error);
      toast.error("Failed to assign fee");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || undefined;
      const response = await feesAPI.createStructure(formData, token);

      if (response.status !== "success") {
        throw new Error(response.message || "Failed to save fee structure");
      }

      toast.success("Fee structure created successfully!");

      await fetchData();
      handleCloseModal();
    } catch (err: any) {
      toast.error(err.message || "Failed to save fee structure"); // optional error toast
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

  const handleViewClassDetails = (
    classData: ClassRevenue,
    location: LocationRevenue
  ) => {
    setSelectedClass(classData);
    setSelectedLocation(location);
    setModalType("class-details");
    setIsModalOpen(true);
  };

  const handleViewStudentPayments = (classData: ClassRevenue) => {
    setSelectedClass(classData);
    setModalType("student-payments");
    setIsModalOpen(true);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-orange-100 text-orange-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
        <span className="font-medium text-gray-900">LKR{value}</span>
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
          <button
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            onClick={() => {
              setSelectedFee(row);
              setFormData(row); // prefill
              setModalType("edit-fee-structure");
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            className="text-red-600 hover:text-red-800 transition-colors duration-200"
            onClick={() => handleOpenDelete(row?.id)}
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
          <p className="font-medium text-gray-900">LKR{value}</p>
          {row.paidAmount > 0 && (
            <p className="text-sm text-green-600">Paid: LKR{row.paidAmount}</p>
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

  // Calculate overall stats from location revenue data
  const overallStats = {
    totalRevenue: locationRevenue.reduce(
      (sum, loc) => sum + loc.monthlyRevenue,
      0
    ),
    receivedAmount: locationRevenue.reduce(
      (sum, loc) => sum + loc.receivedAmount,
      0
    ),
    pendingAmount: locationRevenue.reduce(
      (sum, loc) => sum + loc.pendingAmount,
      0
    ),
    totalStudents: locationRevenue.reduce(
      (sum, loc) => sum + loc.totalStudents,
      0
    ),
    totalClasses: locationRevenue.reduce(
      (sum, loc) => sum + loc.totalClasses,
      0
    ),
    overallCollectionRate:
      locationRevenue.length > 0
        ? locationRevenue.reduce((sum, loc) => sum + loc.collectionRate, 0) /
          locationRevenue.length
        : 0,
  };

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
          <h2 className="text-2xl font-bold text-gray-900">
            Financial Management
          </h2>
          <p className="text-gray-600 mt-1">
            Monitor revenue, payments, and fee collection across all locations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="current-month">Current Month</option>
            <option value="last-month">Last Month</option>
            <option value="current-quarter">Current Quarter</option>
            <option value="last-quarter">Last Quarter</option>
          </select>
          <select
            
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select> */}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                LKR{overallStats.totalRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">This month</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Received Amount
              </p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                LKR{overallStats.receivedAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {overallStats.totalStudents} students
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Pending Amount
              </p>
              <p className="text-2xl font-bold text-orange-600 mt-2">
                LKR{overallStats.pendingAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">Outstanding fees</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Collection Rate
              </p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {overallStats.overallCollectionRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 mt-1">Average rate</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                {overallStats.totalClasses}
              </p>
              <p className="text-sm text-gray-500 mt-1">Active classes</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("location-overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "location-overview"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Location Overview
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
          {activeTab === "location-overview" && (
            <div className="space-y-6">
              {/* Location-wise Revenue Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {locationRevenue
                  .filter(
                    (location) =>
                      selectedLocationFilter === "all" ||
                      location.locationId === selectedLocationFilter
                  )
                  .map((location) => (
                    <div
                      key={location.locationId}
                      className="bg-white border border-gray-200 rounded-xl shadow-sm"
                    >
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                              <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {location.locationName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {location.totalClasses} classes •{" "}
                                {location.totalStudents} students
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              LKR{location.monthlyRevenue.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              Monthly Revenue
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-600">
                              LKR{location.receivedAmount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">Received</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-orange-600">
                              LKR{location.pendingAmount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">Pending</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-blue-600">
                              {location.collectionRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              Collection Rate
                            </p>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${location.collectionRate}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">
                          Classes
                        </h4>
                        <div className="space-y-3">
                          {location.classes.map((classData) => (
                            <div
                              key={classData.classId}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="font-medium text-gray-900">
                                    {classData.className}
                                  </h5>
                                  <span className="text-sm font-bold text-gray-900">
                                    LKR{classData.totalRevenue.toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {classData.subject} • {classData.level}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-500">
                                    {classData.studentCount} students
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-green-600">
                                      LKR
                                      {classData.receivedAmount.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-orange-600">
                                      LKR
                                      {classData.pendingAmount.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-green-500 h-1.5 rounded-full"
                                      style={{
                                        width: `${classData.collectionRate}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  handleViewClassDetails(classData, location)
                                }
                                className="ml-4 px-3 py-1 bg-teal-50 text-teal-600 rounded-md hover:bg-teal-100 text-xs font-medium"
                              >
                                View Details
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
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
            : modalType === "edit-fee-structure"
            ? `Edit Fee Structure - ${selectedFee?.name ?? ""}`
            : modalType === "payment"
            ? "Record Payment"
            : modalType === "bulk-assign"
            ? "Bulk Assign Fees"
            : modalType === "class-details"
            ? `Class Details - ${selectedClass?.className}`
            : "Student Payment Details"
        }
        size={
          modalType === "class-details" || modalType === "student-payments"
            ? "xl"
            : "lg"
        }
      >
        {modalType === "class-details" && selectedClass && selectedLocation && (
          <div className="space-y-6">
            {/* Class Summary */}
            <div className="bg-teal-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Class</p>
                  <p className="font-semibold text-gray-900">
                    {selectedClass.className}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedClass.subject} • {selectedClass.level}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teacher</p>
                  <p className="font-semibold text-gray-900">
                    {selectedClass.teacherName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Students</p>
                  <p className="font-semibold text-gray-900">
                    {selectedClass.studentCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Fee</p>
                  <p className="font-semibold text-gray-900">
                    {selectedClass.monthlyFee}
                  </p>
                </div>
              </div>
            </div>

            {/* Revenue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">
                  LKR{selectedClass.receivedAmount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Received Amount</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-600">
                  LKR{selectedClass.pendingAmount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Pending Amount</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {selectedClass.collectionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Collection Rate</p>
              </div>
            </div>

            {/* Student Payment Details */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  Student Payment Status
                </h4>
                <button
                  onClick={() => handleViewStudentPayments(selectedClass)}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm font-medium"
                >
                  View All Students
                </button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedClass.students.map((student) => (
                  <div
                    key={student.studentId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium text-gray-900">
                          {student.studentName}
                        </h5>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            student.paymentStatus
                          )}`}
                        >
                          {student.paymentStatus.charAt(0).toUpperCase() +
                            student.paymentStatus.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          Paid: {student.paidAmount} / LKR{student.monthlyFee}
                        </span>
                        {student.lastPaymentDate && (
                          <span className="text-xs text-gray-500">
                            Last:{" "}
                            {new Date(
                              student.lastPaymentDate
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {modalType === "student-payments" && selectedClass && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900">
                {selectedClass.className}
              </h4>
              <p className="text-sm text-gray-600">
                {selectedClass.subject} • {selectedClass.level}
              </p>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="text-center">
                  <p className="font-bold text-green-600">
                    LKR{selectedClass.receivedAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Received</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-orange-600">
                    LKR{selectedClass.pendingAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-blue-600">
                    {selectedClass.collectionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">Collection Rate</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedClass.students.map((student) => (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.studentName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {student.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <p className="text-gray-900">
                            {student.phoneNumber || "N/A"}
                          </p>
                          <p className="text-gray-500">
                            {student.parentEmail || "N/A"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">
                            LKR{student.monthlyFee}
                          </p>
                          <p className="text-sm text-green-600">
                            Paid: LKR{student.paidAmount}
                          </p>
                          {student.pendingAmount > 0 && (
                            <p className="text-sm text-orange-600">
                              Pending: LKR{student.pendingAmount}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            student.paymentStatus
                          )}`}
                        >
                          {student.paymentStatus.charAt(0).toUpperCase() +
                            student.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.lastPaymentDate ? (
                          <div>
                            <p>
                              {new Date(
                                student.lastPaymentDate
                              ).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {student.paymentMethod}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">No payments</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button className="px-2 py-1 bg-teal-50 text-teal-600 rounded text-xs hover:bg-teal-100">
                            Record Payment
                          </button>
                          <button className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100">
                            Send Reminder
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
                    setFormData({
                      ...formData,
                      category: e.target.value as FeeStructure["category"],
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
                    setFormData({
                      ...formData,
                      frequency: e.target.value as FeeStructure["frequency"],
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

        {modalType === "edit-fee-structure" && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const token = localStorage.getItem("accessToken") ?? undefined;

                const payload = {
                  name: formData.name,
                  description: formData.description,
                  amount: formData.amount,
                  currency: formData.currency,
                  frequency: formData.frequency as
                    | "monthly"
                    | "semester"
                    | "annual"
                    | "one-time",
                  category: formData.category,
                  applicableClasses: formData.applicableClasses,
                  status: formData.status,
                };

                await feesAPI.updateStructure(formData.id, payload, token);
                toast.success("Fee structure updated successfully");
                await fetchData();
                handleCloseModal();
              } catch (error) {
                console.error("Error updating fee structure:", error);
                alert("Failed to update fee structure");
              }
            }}
            className="space-y-4"
          >
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
                      category: e.target.value as FeeStructure["category"],
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
                Update Fee Structure
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
                LKR{selectedItem.amount}
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
          <form onSubmit={handleBulkAssign} className="space-y-4">
            {/* Select Fee Structure */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Fee Structure
              </label>
              <select
                value={selectedFeeStructure}
                onChange={(e) => setSelectedFeeStructure(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Choose fee structure</option>
                {feeStructures.map((fee) => (
                  <option key={fee.id} value={fee.id}>
                    {fee.name} - LKR{fee.amount}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Classes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Classes
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                {classes.map((cls) => (
                  <label key={cls.id} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selectedClasses.includes(cls.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClasses([...selectedClasses, cls.id]);
                        } else {
                          setSelectedClasses(
                            selectedClasses.filter((id) => id !== cls.id)
                          );
                        }
                      }}
                    />
                    <span className="text-sm">{cls.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Action Buttons */}
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteState.isOpen}
        onClose={() => setDeleteState({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Fee Structure"
        message="Are you sure you want to delete this fee structure?  This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default FeesPage;
