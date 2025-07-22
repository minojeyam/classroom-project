import React, { useState } from "react";
import DataTable from "../Common/DataTable";
import AssignStudentsModal from "./AssignStudentsModal";
import { toast } from "react-toastify";

const ClassTableWithAssign = ({
  classes,
  authToken,
}: {
  classes: any[];
  authToken: string;
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const handleOpenAssignModal = (classId: string, status: string) => {
    if (status === "inactive") {
      toast.warning("This class is inactive. Cannot assign students.");
      return;
    }
    setSelectedClassId(classId);
    setShowAssignModal(true);
  };

  const columns = [
    { key: "title", label: "Title", sortable: true },
    { key: "level", label: "Level", sortable: true },
    { key: "subject", label: "Subject", sortable: true },
    { key: "status", label: "Status", sortable: true }, // ✅ show status column
    {
      key: "assign",
      label: "Add Students",
      render: (_: any, row: any) => (
        <button
          onClick={() => handleOpenAssignModal(row._id, row.status)}
          disabled={row.status === "inactive"}
          className={`px-3 py-1 rounded text-sm ${
            row.status === "inactive"
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-teal-600 text-white hover:bg-teal-700"
          }`}
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
        actions={null}
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
