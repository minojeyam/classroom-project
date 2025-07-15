import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Building, Power } from "lucide-react";
import DataTable from "../Common/DataTable";
import Modal from "../Common/Modal";
import { locationsAPI } from "../../utils/api";
import { toast } from "react-toastify";

interface Location {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phoneNumber: string;
  email: string;
  capacity: number;
  currentEnrollment: number;
  status: "active" | "inactive" | "maintenance";
  color: string;
  createdAt: string;
}

const LocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [filter, setFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Sri Lanka",
    phoneNumber: "",
    email: "",
    capacity: 100,
    color: "#14B8A6",
    status: "active",
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await locationsAPI.getLocations();
      if (response.status === "success") {
        setLocations(response.data.locations || []);
      } else {
        throw new Error(response.message || "Failed to fetch locations");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch locations");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (location: Location) => {
    const newStatus = location.status === "active" ? "inactive" : "active";
    if (
      !window.confirm(
        `Are you sure you want to ${
          newStatus === "inactive" ? "disable" : "enable"
        } "${location.name}"?`
      )
    )
      return;

    try {
      await locationsAPI.updateLocation(location.id, {
        ...location,
        status: newStatus,
        address: location.address, // ensure structure
      });
      toast.success(
        `"${location.name}" ${
          newStatus === "inactive" ? "disabled" : "enabled"
        }`
      );
      fetchLocations();
    } catch (err: any) {
      toast.error(err.message || "Failed to update location status");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const locationData = {
        name: formData.name,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        capacity: formData.capacity,
        color: formData.color,
        status: formData.status,
      };

      if (isEditMode && selectedLocation) {
        await locationsAPI.updateLocation(selectedLocation.id, locationData);
      } else {
        await locationsAPI.createLocation(locationData);
      }

      fetchLocations();
      handleCloseModal();
    } catch (err: any) {
      toast.error(err.message || "Failed to save location");
    }
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      street: location.address.street,
      city: location.address.city,
      state: location.address.state,
      zipCode: location.address.zipCode,
      country: location.address.country,
      phoneNumber: location.phoneNumber,
      email: location.email,
      capacity: location.capacity,
      color: location.color,
      status: location.status,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      try {
        await locationsAPI.deleteLocation(id);
        fetchLocations();
      } catch (err: any) {
        toast.error(err.message || "Failed to delete location");
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedLocation(null);
    setFormData({
      name: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Sri Lanka",
      phoneNumber: "",
      email: "",
      capacity: 100,
      color: "#14B8A6",
      status: "active",
    });
  };

  const filteredLocations =
    filter === "all"
      ? locations
      : locations.filter((loc) => loc.status === filter);

  const columns = [
    {
      key: "name",
      label: "Location",
      sortable: true,
      render: (_: string, row: Location) => (
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center`}
            style={{ backgroundColor: row.color }}
          >
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-sm text-gray-500">
              {row.address.city}, {row.address.state}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "capacity",
      label: "Capacity",
      render: (_: any, row: Location) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {row.currentEnrollment} / {row.capacity}
          </p>
          <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-teal-500 h-2 rounded-full"
              style={{
                width: `${(row.currentEnrollment / row.capacity) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "active"
              ? "bg-green-100 text-green-800"
              : value === "inactive"
              ? "bg-gray-100 text-gray-800"
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
      render: (_: any, row: Location) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(row)}
            className={
              row.status === "active"
                ? "text-yellow-600 hover:text-yellow-800"
                : "text-green-600 hover:text-green-800"
            }
            title={row.status === "active" ? "Disable" : "Enable"}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const actions = (
    <div className="flex items-center space-x-4">
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="maintenance">Maintenance</option>
      </select>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center space-x-2"
      >
        <Plus className="w-4 h-4" />
        <span>Add Location</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Locations Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage school locations and facilities
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
          <span className="text-sm text-gray-600">Total Locations: </span>
          <span className="font-semibold text-gray-900">
            {locations.length}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredLocations}
          title="All Locations"
          actions={actions}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditMode ? "Edit Location" : "Add New Location"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              className="border p-2 rounded"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <input
              type="tel"
              placeholder="Phone"
              className="border p-2 rounded"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="border p-2 rounded"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            <input
              type="number"
              placeholder="Capacity"
              className="border p-2 rounded"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: +e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Street"
              className="border p-2 rounded"
              value={formData.street}
              onChange={(e) =>
                setFormData({ ...formData, street: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="City"
              className="border p-2 rounded"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="State"
              className="border p-2 rounded"
              value={formData.state}
              onChange={(e) =>
                setFormData({ ...formData, state: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Zip Code"
              className="border p-2 rounded"
              value={formData.zipCode}
              onChange={(e) =>
                setFormData({ ...formData, zipCode: e.target.value })
              }
              required
            />
            <label className="col-span-2 flex items-center gap-3">
              Color:
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-10 h-8 border rounded"
              />
            </label>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
            >
              {isEditMode ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LocationsPage;
