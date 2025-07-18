import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface AssignStudentsModalProps {
  classId: string;
  token: string;
  onClose: () => void;
}

const AssignStudentsModal: React.FC<AssignStudentsModalProps> = ({
  classId,
  token,
  onClose,
}) => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("/api/users?role=student&status=active", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setStudents(data.data.users || []);
      } catch (err) {
        toast.error("Failed to load students");
      }
    };
    fetchStudents();
  }, [token]);

  const handleEnroll = async () => {
    try {
      const res = await fetch(`/api/classes/${classId}/enroll-bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(data.message);
        onClose();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Enrollment failed");
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Assign Students</h2>

        <select
          multiple
          value={selectedStudentIds}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map(
              (option) => option.value
            );
            setSelectedStudentIds(selected);
          }}
          className="w-full h-48 border border-gray-300 rounded p-2 mb-4"
        >
          {students.map((student) => (
            <option key={student._id} value={student._id}>
              {student.firstName} {student.lastName} ({student.email})
            </option>
          ))}
        </select>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleEnroll}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Enroll
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignStudentsModal;
