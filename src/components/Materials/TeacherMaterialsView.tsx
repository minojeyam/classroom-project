import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload,
  FileText,
  Video,
  Image,
  Link,
  File,
  Calendar,
  BookOpen,
  Search,
  Filter,
} from "lucide-react";
import Modal from "../Common/Modal";
import DataTable from "../Common/DataTable";
import { classesAPI, usersAPI } from "../../utils/api";
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
  isVisible: boolean;
  downloadCount: number;
  createdBy: string;
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
  currentEnrollment: number;
  capacity: number;
}

const TeacherMaterialsView: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "document" as Material["type"],
    classId: "",
    url: "",
    file: null as File | null,
    isVisible: true,
  });

  useEffect(() => {
    fetchTeacherClasses();
  }, [user]);

  useEffect(() => {
    if (classes.length > 0) {
      fetchMaterials();
    }
  }, [classes, selectedClass]);

  const fetchTeacherClasses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken") ?? undefined;
      const response = await classesAPI.getClasses({
        teacher: user?.id,
        token,
      });

      if (response.status === "success") {
        setClasses(response.data.classes || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem("user") || "{}")?.tokens
        ?.accessToken;
      if (!token) throw new Error("No access token found");
      const response = await fetch("http://localhost:5000/api/materials", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result.status === "success") {
        setMaterials(result.data.materials || []);
      } else {
        throw new Error(result.message || "Failed to fetch materials");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch materials");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const token = JSON.parse(localStorage.getItem("user") || "{}")?.tokens
      ?.accessToken;
    if (!token) {
      setError("No access token found. Please log in again.");
      return;
    }

    const form = new FormData();
    form.append("title", formData.title);
    form.append("description", formData.description);
    form.append("type", formData.type);
    form.append("classId", formData.classId);
    form.append("isVisible", String(formData.isVisible));

    if (formData.type === "link") {
      form.append("url", formData.url);
    } else if (formData.file) {
      form.append("file", formData.file);
    }

    try {
      const res = await fetch("http://localhost:5000/api/materials", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const result = await res.json();

      if (result.status === "success") {
        const savedMaterial = result.data.material;
        savedMaterial.className =
          classes.find((c) => c._id === savedMaterial.classId)?.title || "";

        setMaterials((prev) => [...prev, savedMaterial]);
        handleCloseModal();
      } else {
        setError(result.message || "Upload failed");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Failed to upload material.");
    }
  };

  const handleEdit = (material: Material) => {
    setSelectedMaterial(material);
    setFormData({
      title: material.title,
      description: material.description,
      type: material.type,
      classId: material.classId,
      url: material.url || "",
      file: null,
      isVisible: material.isVisible,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      try {
        // Mock API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        setMaterials((prev) => prev.filter((m) => m.id !== id));
      } catch (err: any) {
        setError(err.message || "Failed to delete material");
      }
    }
  };

  const handleToggleVisibility = async (id: string) => {
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setMaterials((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isVisible: !m.isVisible } : m))
      );
    } catch (err: any) {
      setError(err.message || "Failed to update visibility");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedMaterial(null);
    setFormData({
      title: "",
      description: "",
      type: "document",
      classId: "",
      url: "",
      file: null,
      isVisible: true,
    });
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

  const columns = [
    {
      key: "title",
      label: "Material",
      sortable: true,
      render: (value: string, row: Material) => (
        <div className="flex items-start space-x-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(
              row.type
            )}`}
          >
            {getTypeIcon(row.type)}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 line-clamp-2">
              {row.description}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                  row.type
                )}`}
              >
                {row.type.charAt(0).toUpperCase() + row.type.slice(1)}
              </span>
              {row.fileName && (
                <span className="text-xs text-gray-500">
                  {formatFileSize(row.fileSize)}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "className",
      label: "Class",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: "uploadDate",
      label: "Upload Date",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-900">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "downloadCount",
      label: "Downloads",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center space-x-1">
          <Download className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      key: "isVisible",
      label: "Status",
      sortable: true,
      render: (value: boolean) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {value ? "Visible" : "Hidden"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value: any, row: Material) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleToggleVisibility(row.id)}
            className={`p-1 rounded-md transition-colors duration-200 ${
              row.isVisible
                ? "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            }`}
            title={row.isVisible ? "Hide from students" : "Show to students"}
          >
            {row.isVisible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
            title="Edit material"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
            title="Delete material"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const stats = [
    {
      title: "Total Materials",
      value: materials.length.toString(),
      icon: FileText,
      color: "blue",
    },
    {
      title: "Visible Materials",
      value: materials.filter((m) => m.isVisible).length.toString(),
      icon: Eye,
      color: "green",
    },
    {
      title: "Total Downloads",
      value: materials.reduce((sum, m) => sum + m.downloadCount, 0).toString(),
      icon: Download,
      color: "purple",
    },
    {
      title: "Classes with Materials",
      value: new Set(materials.map((m) => m.classId)).size.toString(),
      icon: BookOpen,
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
            Materials Management
          </h2>
          <p className="text-gray-600 mt-1">
            Upload and manage learning materials for your classes
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Material</span>
        </button>
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

      {/* Materials Table */}
      <DataTable
        columns={columns}
        data={filteredMaterials}
        title="Learning Materials"
        searchable={false}
        filterable={false}
        exportable={true}
      />

      {/* Add/Edit Material Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditMode ? "Edit Material" : "Add New Material"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter material title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class *
              </label>
              <select
                required
                value={formData.classId}
                onChange={(e) =>
                  setFormData({ ...formData, classId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Class</option>
                {classes.map((classItem) => (
                  <option key={classItem._id} value={classItem._id}>
                    {classItem.title} - {classItem.level}
                  </option>
                ))}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter material description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as Material["type"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="document">Document</option>
                <option value="video">Video</option>
                <option value="image">Image</option>
                <option value="link">Link</option>
                <option value="audio">Audio</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="isVisible"
                checked={formData.isVisible}
                onChange={(e) =>
                  setFormData({ ...formData, isVisible: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isVisible" className="text-sm text-gray-700">
                Visible to students
              </label>
            </div>
          </div>

          {formData.type === "link" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Upload {!isEditMode && "*"}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  required={!isEditMode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      file: e.target.files?.[0] || null,
                    })
                  }
                  className="hidden"
                  id="file-upload"
                  accept={
                    formData.type === "document"
                      ? ".pdf,.doc,.docx,.txt"
                      : formData.type === "video"
                      ? ".mp4,.avi,.mov,.wmv"
                      : formData.type === "image"
                      ? ".jpg,.jpeg,.png,.gif"
                      : formData.type === "audio"
                      ? ".mp3,.wav,.ogg"
                      : "*"
                  }
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.type === "document" &&
                      "PDF, DOC, DOCX, TXT files"}
                    {formData.type === "video" && "MP4, AVI, MOV, WMV files"}
                    {formData.type === "image" && "JPG, PNG, GIF files"}
                    {formData.type === "audio" && "MP3, WAV, OGG files"}
                    {formData.type === "other" && "Any file type"}
                  </p>
                </label>
                {formData.file && (
                  <p className="text-sm text-blue-600 mt-2">
                    Selected: {formData.file.name}
                  </p>
                )}
              </div>
            </div>
          )}

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
              {isEditMode ? "Update Material" : "Upload Material"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherMaterialsView;
