export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  phoneNumber?: string;
  profilePicture?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  locationId?: string;
  classIds?: string[];
  parentEmail?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  capacity: number;
  logo?: string;
  color?: string;
  createdAt: string;
}

export interface Class {
  id: string;
  title: string;
  level: string;
  locationId: string;
  teacherId: string;
  schedule: string;
  capacity: number;
  currentEnrollment: number;
  monthlyFee: number;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'excused';
  notes?: string;
  markedBy: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  classId: string;
  amount: number;
  month: string;
  year: number;
  status: 'paid' | 'partial' | 'overdue';
  paidDate?: string;
  method: 'cash' | 'card' | 'bank_transfer';
  notes?: string;
  createdAt: string;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'image';
  url: string;
  classId: string;
  uploadedBy: string;
  topic: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'event';
  locationId?: string;
  classId?: string;
  isGlobal: boolean;
  requiresAcknowledgment: boolean;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}

export interface DashboardStats {
  totalStudents: number;
  pendingApprovals: number;
  totalTeachers: number;
  totalClasses: number;
  totalLocations: number;
  totalRevenue: number;
  attendanceRate: number;
  overduePayments: number;
}