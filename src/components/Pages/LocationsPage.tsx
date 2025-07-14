import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Building } from "lucide-react";
import DataTable from "../Common/DataTable";
import Modal from "../Common/Modal";
import { locationsAPI } from "../../utils/api";

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
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    phoneNumber: "",
    email: "",
    capacity: 100,
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
        status: formData.status,
      };

      if (isEditMode && selectedLocation) {
        await locationsAPI.updateLocation(selectedLocation.id, locationData);
      } else {
        await locationsAPI.createLocation(locationData);
      }

      await fetchLocations();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || "Failed to save location");
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
      status: location.status,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      try {
        await locationsAPI.deleteLocation(id);
        await fetchLocations();
      } catch (err: any) {
        setError(err.message || "Failed to delete location");
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
      country: "United States",
      phoneNumber: "",
      email: "",
      capacity: 100,
      status: "active",
    });
  };

  const columns = [
    {
      key: "name",
      label: "Location",
      sortable: true,
      render: (value: string, row: Location) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">
              {row.address.city}, {row.address.state}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "address",
      label: "Address",
      render: (_: any, row: Location) => (
        <div>
          <p className="text-sm text-gray-900">{row.address.street}</p>
          <p className="text-sm text-gray-500">
            {row.address.city}, {row.address.state} {row.address.zipCode}
          </p>
        </div>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      render: (_: any, row: Location) => (
        <div>
          <p className="text-sm text-gray-900">{row.phoneNumber}</p>
          <p className="text-sm text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: "capacity",
      label: "Capacity",
      sortable: true,
      render: (value: number, row: Location) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {row.currentEnrollment} / {value}
          </p>
          <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-teal-500 h-2 rounded-full"
              style={{ width: `${(row.currentEnrollment / value) * 100}%` }}
            ></div>
          </div>
        </div>
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
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800 transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const actions = (
    <button
      onClick={() => setIsModalOpen(true)}
      className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors duration-200 flex items-center space-x-2"
    >
      <Plus className="w-4 h-4" />
      <span>Add Location</span>
    </button>
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
        <div className="flex items-center space-x-3">
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Total Locations: </span>
            <span className="font-semibold text-gray-900">
              {locations.length}
            </span>
          </div>
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
          data={locations}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter location name"
              />
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
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              type="text"
              required
              value={formData.street}
              onChange={(e) =>
                setFormData({ ...formData, street: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter street address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zip Code
              </label>
              <input
                type="text"
                required
                value={formData.zipCode}
                onChange={(e) =>
                  setFormData({ ...formData, zipCode: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Zip Code"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Email address"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Maximum capacity"
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
              {isEditMode ? "Update Location" : "Create Location"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LocationsPage;
