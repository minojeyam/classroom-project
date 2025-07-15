import React, { useState } from "react";
import DataTable from "../Common/DataTable";
import AssignStudentsModal from "./AssignStudentsModal";

const ClassTableWithAssign = ({
  classes,
  authToken,
}: {
  classes: any[];
  authToken: string;
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const handleOpenAssignModal = (classId: string) => {
    setSelectedClassId(classId);
    setShowAssignModal(true);
  };

  const columns = [
    { key: "title", label: "Title", sortable: true },
    { key: "level", label: "Level", sortable: true },
    { key: "subject", label: "Subject", sortable: true },
    {
      key: "assign",
      label: "Add Students",
      render: (_: any, row: any) => (
        <button
          onClick={() => handleOpenAssignModal(row._id)}
          className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700"
        >
          Assign
        </button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={classes}
        title="All Classes"
        actions={null} // Add actions if needed
      />

      {showAssignModal && selectedClassId && (
        <AssignStudentsModal
          classId={selectedClassId}
          token={authToken}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </>
  );
};

export default ClassTableWithAssign;
