import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import AdminBalanceView from "../Balance/AdminBalanceView";
import TeacherBalanceView from "../Balance/TeacherBalanceView";
import StudentBalanceView from "../Balance/StudentBalanceView";

const BalancePage: React.FC = () => {
  const { user } = useAuth();

  const renderBalanceView = () => {
    switch (user?.role) {
      case "admin":
        return <AdminBalanceView />;
      case "teacher":
        return <TeacherBalanceView />;
      case "student":
        return <StudentBalanceView />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Access denied. Invalid user role.</p>
          </div>
        );
    }
  };

  return renderBalanceView();
};

export default BalancePage;
