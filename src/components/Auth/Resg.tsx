// import React, { useState } from 'react';
// import { Eye, EyeOff, GraduationCap } from 'lucide-react';

// interface RegisterFormProps {
//   onToggleForm: () => void;
// }

// const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm }) => {
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     role: 'student', // Default role
//     phoneNumber: '',
//     parentEmail: '',
//     locationId: ''
//   });

//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState(false);

//   const locations = [
//     { id: 'nelliyadi', name: 'Nelliyadi' },
//     { id: 'chavakacheri', name: 'Chavakacheri' }
//   ];

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     // Validation
//     if (formData.password !== formData.confirmPassword) {
//       setError('Passwords do not match');
//       setLoading(false);
//       return;
//     }

//     if (formData.role === 'student' && !formData.parentEmail) {
//       setError('Parent email is required for student registration');
//       setLoading(false);
//       return;
//     }

//     try {
//       // API call to register
//       const response = await fetch('http://localhost:5000/api/auth/register', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           firstName: formData.firstName,
//           lastName: formData.lastName,
//           email: formData.email,
//           password: formData.password,
//           role: formData.role,
//           phoneNumber: formData.phoneNumber,
//           parentEmail: formData.parentEmail,
//           locationId: formData.locationId
//         })
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || 'Registration failed');
//       }

//       // Success
//       setSuccess(true);
//       setFormData({
//         firstName: '',
//         lastName: '',
//         email: '',
//         password: '',
//         confirmPassword: '',
//         role: 'student',
//         phoneNumber: '',
//         parentEmail: '',
//         locationId: ''
//       });
//     } catch (err: any) {
//       setError(err.message || 'Registration failed. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4">
//       <div className="max-w-md w-full space-y-8">
//         <div className="text-center">
//           <div className="flex justify-center">
//             <div className="w-16 h-16 bg-gradient-to-r from-teal-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
//               <GraduationCap className="w-8 h-8 text-white" />
//             </div>
//           </div>
//           <h2 className="mt-6 text-3xl font-bold text-gray-900">IO Space</h2>
//           <p className="mt-2 text-sm text-gray-600">
//             Register for Multi-Location Classroom Management System
//           </p>
//         </div>

//         {success ? (
//           <div className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
//             <div className="bg-green-50 border border-green-200 rounded-md p-4">
//               <p className="text-green-700 font-medium">Registration successful!</p>
//               <p className="text-sm text-green-600 mt-1">
//                 Your registration is pending approval by an administrator. You will be notified once your account is approved.
//               </p>
//             </div>
//             <button
//               onClick={onToggleForm}
//               className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
//             >
//               Back to Login
//             </button>
//           </div>
//         ) : (
//           <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg border border-gray-100" onSubmit={handleSubmit}>
//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
//                     First Name
//                   </label>
//                   <input
//                     id="firstName"
//                     name="firstName"
//                     type="text"
//                     required
//                     value={formData.firstName}
//                     onChange={handleChange}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
//                     placeholder="First Name"
//                   />
//                 </div>
//                 <div>
//                   <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
//                     Last Name
//                   </label>
//                   <input
//                     id="lastName"
//                     name="lastName"
//                     type="text"
//                     required
//                     value={formData.lastName}
//                     onChange={handleChange}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
//                     placeholder="Last Name"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
//                   Email Address
//                 </label>
//                 <input
//                   id="email"
//                   name="email"
//                   type="email"
//                   required
//                   value={formData.email}
//                   onChange={handleChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
//                   placeholder="Email Address"
//                 />
//               </div>

//               <div>
//                 <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <input
//                     id="password"
//                     name="password"
//                     type={showPassword ? 'text' : 'password'}
//                     required
//                     value={formData.password}
//                     onChange={handleChange}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent pr-10"
//                     placeholder="Password"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                   >
//                     {showPassword ? (
//                       <EyeOff className="h-4 w-4 text-gray-400" />
//                     ) : (
//                       <Eye className="h-4 w-4 text-gray-400" />
//                     )}
//                   </button>
//                 </div>
//               </div>

//               <div>
//                 <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
//                   Confirm Password
//                 </label>
//                 <input
//                   id="confirmPassword"
//                   name="confirmPassword"
//                   type="password"
//                   required
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
//                   placeholder="Confirm Password"
//                 />
//               </div>

//               <div>
//                 <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
//                   Register as
//                 </label>
//                 <select
//                   id="role"
//                   name="role"
//                   required
//                   value={formData.role}
//                   onChange={handleChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
//                 >
//                   <option value="student">Student</option>
//                   <option value="teacher">Teacher</option>
//                 </select>
//               </div>

//               <div>
//                 <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
//                   Phone Number
//                 </label>
//                 <input
//                   id="phoneNumber"
//                   name="phoneNumber"
//                   type="tel"
//                   value={formData.phoneNumber}
//                   onChange={handleChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
//                   placeholder="Phone Number"
//                 />
//               </div>

//               <div>
//                 <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 mb-1">
//                   Location
//                 </label>
//                 <select
//                   id="locationId"
//                   name="locationId"
//                   required
//                   value={formData.locationId}
//                   onChange={handleChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
//                 >
//                   <option value="">Select Location</option>
//                   {locations.map(location => (
//                     <option key={location.id} value={location.id}>
//                       {location.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {formData.role === 'student' && (
//                 <div>
//                   <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700 mb-1">
//                     Parent Email
//                   </label>
//                   <input
//                     id="parentEmail"
//                     name="parentEmail"
//                     type="email"
//                     value={formData.parentEmail}
//                     onChange={handleChange}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
//                     placeholder="Parent Email"
//                   />
//                 </div>
//               )}
//             </div>

//             {error && (
//               <div className="bg-red-50 border border-red-200 rounded-md p-3">
//                 <p className="text-sm text-red-600">{error}</p>
//               </div>
//             )}

//             <div className="flex flex-col space-y-3">
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
//               >
//                 {loading ? 'Registering...' : 'Register'}
//               </button>

//               <button
//                 type="button"
//                 onClick={onToggleForm}
//                 className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
//               >
//                 Already have an account? Sign in
//               </button>
//             </div>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// };

// export default RegisterForm;

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
    role: "student", // Default role
    phoneNumber: "",
    parentEmail: "",
    locationId: "",
  });

  const [locations, setLocations] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ✅ Fetch locations from backend on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/locations");
        const data = await res.json();
        if (data?.data?.locations) {
          setLocations(data.data.locations);
        }
      } catch (err) {
        console.error("Error fetching locations:", err);
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

    // Simple validations
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

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Registration failed");

      // Reset form
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
      setError(err.message || "Registration failed. Please try again.");
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
            Register for Multi-Location Classroom Management System
          </p>
        </div>

        {success ? (
          <div className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-700 font-medium">
                Registration successful!
              </p>
              <p className="text-sm text-green-600 mt-1">
                Your registration is pending admin approval. You’ll be notified
                once it’s approved.
              </p>
            </div>
            <button
              onClick={onToggleForm}
              className="w-full py-2 px-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-md"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form
            className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg border border-gray-100"
            onSubmit={handleSubmit}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="p-2 border rounded-md"
                />
                <input
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="p-2 border rounded-md"
                />
              </div>
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md"
              />

              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full p-2 pr-10 border rounded-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>

              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md"
              />

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>

              <input
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
              />

              <select
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select Location</option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.name}
                  </option>
                ))}
              </select>

              {formData.role === "student" && (
                <input
                  name="parentEmail"
                  type="email"
                  placeholder="Parent Email"
                  value={formData.parentEmail}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                />
              )}
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-md disabled:opacity-50"
            >
              {loading ? "Registering..." : "Register"}
            </button>

            <button
              type="button"
              onClick={onToggleForm}
              className="w-full mt-2 py-2 px-4 border border-gray-300 rounded-md text-sm"
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
