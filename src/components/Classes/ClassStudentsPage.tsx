import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface Student {
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  status: string;
}

interface ClassType {
  _id: string;
  title: string;
  enrolledStudents: Student[];
}

export default function ClassStudentsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<ClassType | null>(null);

  useEffect(() => {
    if (id) fetchClassDetails(id);
  }, [id]);

  const fetchClassDetails = async (classId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/classes/${classId}`, {
        headers: {
          Authorization: `Bearer ${
            JSON.parse(localStorage.getItem("user") || "{}")?.tokens
              ?.accessToken
          }`,
        },
      });
      const data = await res.json();
      setClassData(data.data.class);
    } catch (err) {
      console.error("Failed to fetch class details:", err);
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold mb-4">
        Enrolled Students - {classData?.title}
      </h2>

      {classData?.enrolledStudents?.length ? (
        <table className="w-full border text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {classData.enrolledStudents.map((s, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2">
                  {s.studentId.firstName} {s.studentId.lastName}
                </td>
                <td className="p-2">{s.studentId.email}</td>
                <td className="p-2">{s.studentId.phoneNumber || "-"}</td>
                <td className="p-2">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No students enrolled yet.</p>
      )}
    </div>
  );
}
