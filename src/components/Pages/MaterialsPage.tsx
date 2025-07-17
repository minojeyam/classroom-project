import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import TeacherMaterialsView from "../Materials/TeacherMaterialsView";
import StudentMaterialsView from "../Materials/StudentMaterialsView";

const MaterialsPage: React.FC = () => {
  const { user } = useAuth();

  const renderMaterialsView = () => {
    switch (user?.role) {
      case "teacher":
        return <TeacherMaterialsView />;
      case "student":
        return <StudentMaterialsView />;
      case "admin":
        return <TeacherMaterialsView />; // Admin can manage materials like teachers
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Access denied. Invalid user role.</p>
          </div>
        );
    }
  };

  return renderMaterialsView();
};

export default MaterialsPage;
