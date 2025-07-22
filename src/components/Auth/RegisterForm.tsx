import React, { useState, useEffect } from "react";
import { Eye, EyeOff, GraduationCap } from "lucide-react";

interface RegisterFormProps {
  onToggleForm: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    phoneNumber: "",
    parentEmail: "",
    locationId: "",
  });

  const [locations, setLocations] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   const fetchLocations = async () => {
  //     try {
  //       const res = await fetch("http://localhost:5000/api/locations");
  //       const json = await res.json();
  //       console.log("Fetched locations:", json.data.locations);
  //       if (json?.data?.locations) {
  //         setLocations(json.data.locations);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch locations:", err);
  //     }
  //   };

  //   fetchLocations();
  // }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/locations?status=active"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch locations");
        }

        const result = await response.json();
        const locations = result?.data?.locations;

        if (locations && Array.isArray(locations)) {
          setLocations(
            locations.map((loc: any) => ({ _id: loc._id, name: loc.name }))
          );
        } else {
          console.warn("No locations found.");
          setLocations([]);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.role === "student" && !formData.parentEmail) {
      setError("Parent email is required for student registration");
      setLoading(false);
      return;
    }

    if (
      (formData.role === "student" || formData.role === "teacher") &&
      !formData.locationId
    ) {
      setError("Location is required for student/teacher");
      setLoading(false);
      return;
    }

    console.log("Submitting with:", formData); // Debug print

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phoneNumber: formData.phoneNumber,
          parentEmail: formData.parentEmail || undefined,
          locationId: formData.locationId || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");

      setSuccess(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "student",
        phoneNumber: "",
        parentEmail: "",
        locationId: "",
      });
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-teal-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">IO Space</h2>
          <p className="mt-2 text-sm text-gray-600">
            Register for Multi-Location Classroom Management
          </p>
        </div>
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
            <p className="text-green-700 font-semibold">
              Registration successful!
            </p>
            <p className="text-sm text-green-600 mt-2">
              Await admin approval to activate your account.
            </p>
            <button
              onClick={onToggleForm}
              className="mt-4 w-full py-2 px-4 bg-teal-500 text-white rounded-md hover:bg-teal-600"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form
            className="space-y-4 bg-white p-6 rounded-xl shadow-lg border border-gray-100"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="border px-3 py-2 rounded-md"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="border px-3 py-2 rounded-md"
              />
            </div>

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full border px-3 py-2 pr-10 rounded-md"
              />
              <button
                type="button"
                className="absolute right-3 top-2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
            />

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              required
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>

            {(formData.role === "student" || formData.role === "teacher") && (
              <select
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
                required
              >
                <option value="">Select Location</option>
                {locations.length === 0 ? (
                  <option disabled>Loading locations...</option>
                ) : (
                  locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name}
                    </option>
                  ))
                )}
              </select>
            )}

            <input
              type="tel"
              name="phoneNumber"
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
            />

            {formData.role === "student" && (
              <input
                type="email"
                name="parentEmail"
                placeholder="Parent Email"
                value={formData.parentEmail}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
                required
              />
            )}

            {error && (
              <p className="text-red-600 bg-red-50 p-2 rounded-md border border-red-200 text-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-teal-500 text-white rounded-md hover:bg-teal-600"
            >
              {loading ? "Registering..." : "Register"}
            </button>

            <button
              type="button"
              onClick={onToggleForm}
              className="w-full mt-2 py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
            >
              Already have an account? Sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegisterForm;
