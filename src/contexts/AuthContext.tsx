// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { User } from '../types';

// interface AuthContextType {
//   user: User | null;
//   login: (email: string, password: string) => Promise<void>;
//   logout: () => void;
//   loading: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// // Mock users for demonstration
// const mockUsers: User[] = [
//   {
//     id: '1',
//     email: 'admin@school.com',
//     firstName: 'John',
//     lastName: 'Admin',
//     role: 'admin',
//     phoneNumber: '+1234567890',
//     status: 'active',
//     createdAt: '2024-01-01T00:00:00Z',
//   },
//   {
//     id: '2',
//     email: 'teacher@school.com',
//     firstName: 'Sarah',
//     lastName: 'Teacher',
//     role: 'teacher',
//     phoneNumber: '+1234567891',
//     status: 'active',
//     createdAt: '2024-01-01T00:00:00Z',
//     locationId: '1',
//     classIds: ['1', '2'],
//   },
//   {
//     id: '3',
//     email: 'student@school.com',
//     firstName: 'Mike',
//     lastName: 'Student',
//     role: 'student',
//     phoneNumber: '+1234567892',
//     status: 'active',
//     createdAt: '2024-01-01T00:00:00Z',
//     locationId: '1',
//     classIds: ['1'],
//     parentEmail: 'parent@school.com',
//   },
//   {
//     id: '4',
//     email: 'parent@school.com',
//     firstName: 'Lisa',
//     lastName: 'Parent',
//     role: 'parent',
//     phoneNumber: '+1234567893',
//     status: 'active',
//     createdAt: '2024-01-01T00:00:00Z',
//   },
// ];

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [isRegistering, setIsRegistering] = useState(false);

//   useEffect(() => {
//     // Check if user is stored in localStorage
//     const storedUser = localStorage.getItem('user');
//     if (storedUser) {
//       setUser(JSON.parse(storedUser));
//     }
//     setLoading(false);
//   }, []);

//   const login = async (email: string, password: string) => {
//     setLoading(true);
//     try {
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       const foundUser = mockUsers.find(u => u.email === email);
//       if (foundUser) {
//         setUser(foundUser);
//         localStorage.setItem('user', JSON.stringify(foundUser));
//       } else {
//         throw new Error('Invalid credentials');
//       }
//     } catch (error) {
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const register = async (userData: any) => {
//     setLoading(true);
//     try {
//       // In a real implementation, this would be an API call
//       // For now, we'll just simulate it
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // Registration successful, but user is pending approval
//       return { success: true, message: 'Registration successful. Please wait for admin approval.' };
//     } catch (error) {
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem('user');
//   };

//   const value = {
//     user,
//     login,
//     register,
//     logout,
//     loading,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      const { user, tokens } = data.data;

      // Store tokens and user in localStorage
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
