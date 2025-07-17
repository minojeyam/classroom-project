import React, { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Video,
  Image,
  Link,
  File,
  Calendar,
  BookOpen,
  Search,
  Filter,
  ExternalLink,
  Eye,
} from "lucide-react";
import { classesAPI } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";

interface Material {
  id: string;
  title: string;
  description: string;
  type: "document" | "video" | "image" | "link" | "audio" | "other";
  classId: string;
  className: string;
  url?: string;
  fileName?: string;
  fileSize?: number;
  uploadDate: string;
  downloadCount: number;
  createdByName: string;
}

interface Class {
  _id: string;
  title: string;
  level: string;
  subject: string;
  locationId: {
    _id: string;
    name: string;
  };
  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

const StudentMaterialsView: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchStudentClasses();
  }, [user]);

  useEffect(() => {
    if (classes.length > 0) {
      fetchMaterials();
    }
  }, [classes, selectedClass]);

  const fetchStudentClasses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken") ?? undefined;

      // For students, fetch classes they are enrolled in
      // This would typically come from a student-specific endpoint
      const response = await classesAPI.getClasses({}, token);

      if (response.status === "success") {
        // Filter classes where student is enrolled (mock logic)
        const enrolledClasses =
          response.data.classes?.filter((classItem: any) =>
            classItem.enrolledStudents?.some(
              (enrollment: any) => enrollment.studentId === user?.id
            )
          ) || [];

        setClasses(enrolledClasses);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      // Mock materials data for student view - replace with actual API call
      const mockMaterials: Material[] = [
        {
          id: "1",
          title: "Chapter 5: Algebra Fundamentals",
          description:
            "Complete notes and examples for algebra basics including linear equations and graphing.",
          type: "document",
          classId: "1",
          className: "Advanced Mathematics",
          fileName: "algebra-fundamentals.pdf",
          fileSize: 2048576, // 2MB
          uploadDate: "2024-03-15T10:30:00.000Z",
          downloadCount: 23,
          createdByName: "Teacher User",
        },
        {
          id: "2",
          title: "Physics Lab Experiment Video",
          description:
            "Demonstration of pendulum motion experiment with detailed explanations.",
          type: "video",
          classId: "2",
          className: "Physics Fundamentals",
          url: "https://example.com/physics-lab-video",
          uploadDate: "2024-03-14T14:20:00.000Z",
          downloadCount: 45,
          createdByName: "Teacher User",
        },
        {
          id: "3",
          title: "Chemistry Periodic Table Reference",
          description:
            "Interactive periodic table with element properties and examples.",
          type: "link",
          classId: "3",
          className: "Chemistry Lab",
          url: "https://example.com/periodic-table",
          uploadDate: "2024-03-13T09:15:00.000Z",
          downloadCount: 12,
          createdByName: "Teacher User",
        },
        {
          id: "4",
          title: "Math Problem Set Solutions",
          description: "Step-by-step solutions for homework problems 1-20.",
          type: "document",
          classId: "1",
          className: "Advanced Mathematics",
          fileName: "problem-solutions.pdf",
          fileSize: 1536000, // 1.5MB
          uploadDate: "2024-03-12T16:45:00.000Z",
          downloadCount: 67,
          createdByName: "Teacher User",
        },
        {
          id: "5",
          title: "Biology Cell Structure Diagrams",
          description:
            "Detailed diagrams of plant and animal cell structures with labels.",
          type: "image",
          classId: "4",
          className: "Biology Basics",
          fileName: "cell-diagrams.png",
          fileSize: 3072000, // 3MB
          uploadDate: "2024-03-11T11:20:00.000Z",
          downloadCount: 34,
          createdByName: "Teacher User",
        },
      ];

      // Filter materials to only show those from enrolled classes
      const enrolledClassIds = classes.map((c) => c._id);
      const filteredMaterials = mockMaterials.filter((material) =>
        enrolledClassIds.includes(material.classId)
      );

      setMaterials(filteredMaterials);
    } catch (err: any) {
      setError(err.message || "Failed to fetch materials");
    }
  };

  const handleDownload = async (material: Material) => {
    try {
      // Mock download functionality - replace with actual implementation
      if (material.type === "link") {
        window.open(material.url, "_blank");
      } else {
        // Simulate file download
        console.log(`Downloading: ${material.fileName || material.title}`);

        // Update download count
        setMaterials((prev) =>
          prev.map((m) =>
            m.id === material.id
              ? { ...m, downloadCount: m.downloadCount + 1 }
              : m
          )
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to download material");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      case "image":
        return <Image className="w-5 h-5" />;
      case "link":
        return <Link className="w-5 h-5" />;
      case "audio":
        return <File className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "document":
        return "bg-blue-100 text-blue-800";
      case "video":
        return "bg-red-100 text-red-800";
      case "image":
        return "bg-green-100 text-green-800";
      case "link":
        return "bg-purple-100 text-purple-800";
      case "audio":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  // Filter materials based on selected class, search term, and type
  const filteredMaterials = materials.filter((material) => {
    const classMatch =
      selectedClass === "all" || material.classId === selectedClass;
    const searchMatch =
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = filterType === "all" || material.type === filterType;
    return classMatch && searchMatch && typeMatch;
  });

  const stats = [
    {
      title: "Available Materials",
      value: materials.length.toString(),
      icon: FileText,
      color: "blue",
    },
    {
      title: "Enrolled Classes",
      value: classes.length.toString(),
      icon: BookOpen,
      color: "green",
    },
    {
      title: "Documents",
      value: materials.filter((m) => m.type === "document").length.toString(),
      icon: FileText,
      color: "purple",
    },
    {
      title: "Videos & Links",
      value: materials
        .filter((m) => m.type === "video" || m.type === "link")
        .length.toString(),
      icon: Video,
      color: "orange",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Learning Materials
          </h2>
          <p className="text-gray-600 mt-1">
            Access study materials from your enrolled classes
          </p>
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
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.color === "blue"
                    ? "bg-blue-500"
                    : stat.color === "green"
                    ? "bg-green-500"
                    : stat.color === "purple"
                    ? "bg-purple-500"
                    : "bg-orange-500"
                }`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Classes</option>
              {classes.map((classItem) => (
                <option key={classItem._id} value={classItem._id}>
                  {classItem.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Types</option>
              <option value="document">Documents</option>
              <option value="video">Videos</option>
              <option value="image">Images</option>
              <option value="link">Links</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredMaterials.length} of {materials.length} materials
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center h-64">
          <FileText className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            No Materials Found
          </h3>
          <p className="text-gray-500 mt-1">
            No materials match your current filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                {/* Material Header */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(
                      material.type
                    )}`}
                  >
                    {getTypeIcon(material.type)}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                      material.type
                    )}`}
                  >
                    {material.type.charAt(0).toUpperCase() +
                      material.type.slice(1)}
                  </span>
                </div>

                {/* Material Info */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {material.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {material.description}
                  </p>

                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{material.className}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(material.uploadDate).toLocaleDateString()}
                      </span>
                    </div>
                    {material.fileName && (
                      <div className="flex items-center space-x-2">
                        <File className="w-4 h-4" />
                        <span>{formatFileSize(material.fileSize)}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>{material.downloadCount} downloads</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleDownload(material)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {material.type === "link" ? (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Link</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </>
                  )}
                </button>

                {/* Teacher Info */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Uploaded by {material.createdByName}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentMaterialsView;
