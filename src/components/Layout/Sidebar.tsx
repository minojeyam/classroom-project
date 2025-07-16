import React from "react";
import {
  Home,
  Users,
  UserCheck,
  MapPin,
  BookOpen,
  CreditCard,
  DollarSign,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  GraduationCap,
  Upload,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  roles: string[];
}

const sidebarItems: SidebarItem[] = [
  {
    icon: <Home className="w-5 h-5" />,
    label: "Dashboard",
    href: "/dashboard",
    roles: ["admin", "teacher", "student", "parent"],
  },
  {
    icon: <Users className="w-5 h-5" />,
    label: "Users",
    href: "/users",
    roles: ["admin"],
  },
  {
    icon: <UserCheck className="w-5 h-5" />,
    label: "Pending Approvals",
    href: "/approvals",
    roles: ["admin"],
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    label: "Locations",
    href: "/locations",
    roles: ["admin"],
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    label: "Classes",
    href: "/classes",
    roles: ["admin"],
    // roles: ["admin", "teacher"],
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    label: "My Classes",
    href: "/teacher-classes",
    roles: ["teacher"],
  },
  {
    icon: <UserCheck className="w-5 h-5" />,
    label: "Attendance",
    href: "/attendance",
    roles: ["admin", "teacher"],
  },
  {
    icon: <UserCheck className="w-5 h-5" />,
    label: "My Class Fees",
    href: "/teacher-fees",
    roles: ["teacher"],
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    label: "Fees",
    href: "/fees",
    roles: ["admin", "teacher"],
  },
  {
    icon: <DollarSign className="w-5 h-5" />,
    label: "Balance & Payments",
    href: "/balance",
    roles: ["admin", "teacher", "student", "parent"],
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    label: "Notice Board",
    href: "/notices",
    roles: ["admin", "teacher", "student", "parent"],
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    label: "Reports",
    href: "/reports",
    roles: ["admin", "teacher"],
  },
  {
    icon: <Upload className="w-5 h-5" />,
    label: "Bulk Import",
    href: "/import",
    roles: ["admin"],
  },
  {
    icon: <Settings className="w-5 h-5" />,
    label: "Settings",
    href: "/settings",
    roles: ["admin"],
  },
];

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { user, logout } = useAuth();

  const filteredItems = sidebarItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-screen fixed left-0 top-0 z-30 flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-teal-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">IO Space</h1>
        </div>
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto">
        <div className="space-y-1 px-3">
          {filteredItems.map((item) => (
            <button
              key={item.href}
              onClick={() => onPageChange(item.href)}
              className={`w-full flex items-center space-x-3 px-3 py-3 text-left transition-colors duration-200 rounded-lg ${
                currentPage === item.href
                  ? "bg-teal-50 text-teal-600 border border-teal-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-teal-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
