import React, { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import Sidebar from "./components/Layout/Sidebar";
import Header from "./components/Layout/Header";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import TeacherDashboard from "./components/Dashboard/TeacherDashboard";
import StudentDashboard from "./components/Dashboard/StudentDashboard";
import ParentDashboard from "./components/Dashboard/ParentDashboard";
import UsersPage from "./components/Pages/UsersPage";
import PendingApprovalsPage from "./components/Pages/PendingApprovalsPage";
import ComingSoonPage from "./components/Pages/ComingSoonPage";
import LocationsPage from "./components/Pages/LocationsPage";
import ClassesPage from "./components/Pages/ClassesPage";

const pages = {
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/locations": "Locations",
  "/classes": "Classes",
  "/attendance": "Attendance",
  "/fees": "Fees",
  "/materials": "Materials",
  "/schedule": "Schedule",
  "/exams": "Exams",
  "/notices": "Notice Board",
  "/approvals": "Pending Approvals",
  "/reports": "Reports",
  "/import": "Bulk Import",
  "/settings": "Settings",
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [currentPage, setCurrentPage] = useState("/dashboard");

  if (!user) {
    return showRegister ? (
      <RegisterForm onToggleForm={() => setShowRegister(false)} />
    ) : (
      <LoginForm onToggleForm={() => setShowRegister(true)} />
    );
  }

  const renderDashboard = () => {
    switch (user.role) {
      case "admin":
        return <AdminDashboard />;
      case "teacher":
        return <TeacherDashboard />;
      case "student":
        return <StudentDashboard />;
      case "parent":
        return <ParentDashboard />;
      default:
        return <div>Invalid role</div>;
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "/dashboard":
        return renderDashboard();
      case "/users":
        return <UsersPage />;
      case "/approvals":
        return <PendingApprovalsPage />;
      case "/locations":
        return <LocationsPage />;
      case "/classes":
        return <ClassesPage />;

      case "/attendance":
        return (
          <ComingSoonPage
            feature="Attendance Management"
            description="Track student attendance, mark present/absent, and generate reports."
          />
        );
      case "/fees":
        return (
          <ComingSoonPage
            feature="Fee Management"
            description="Manage student fees, track payments, and generate invoices."
          />
        );
      case "/materials":
        return (
          <ComingSoonPage
            feature="Teaching Materials"
            description="Upload and manage teaching materials, assignments, and resources."
          />
        );
      case "/schedule":
        return (
          <ComingSoonPage
            feature="Schedule Management"
            description="View and manage class schedules, timetables, and events."
          />
        );
      case "/exams":
        return (
          <ComingSoonPage
            feature="Exam Management"
            description="Create exams, record marks, and generate report cards."
          />
        );
      case "/notices":
        return (
          <ComingSoonPage
            feature="Notice Board"
            description="Send notices, announcements, and messages to students and parents."
          />
        );
      case "/reports":
        return (
          <ComingSoonPage
            feature="Reports & Analytics"
            description="Generate comprehensive reports and analytics for better insights."
          />
        );
      case "/import":
        return (
          <ComingSoonPage
            feature="Bulk Import/Export"
            description="Import and export data in bulk using CSV files."
          />
        );
      case "/settings":
        return (
          <ComingSoonPage
            feature="Settings"
            description="Configure system settings, branding, and preferences."
          />
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

      <div className="flex-1 flex flex-col ml-64">
        <Header
          title={pages[currentPage as keyof typeof pages] || "Dashboard"}
        />

        <main className="flex-1 overflow-y-auto p-6">{renderPage()}</main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
