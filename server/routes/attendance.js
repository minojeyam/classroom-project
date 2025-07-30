import express from "express";
import { auth } from "../middleware/auth.js";
import Attendance from "../models/Attendance.js";

const router = express.Router();

// POST or Update attendance
router.post("/", auth, async (req, res) => {
  try {
    const { studentId, classId, date, status, notes } = req.body;

    const attendance = await Attendance.findOneAndUpdate(
      { studentId, classId, date },
      {
        status,
        notes,
        markedBy: req.user.id,
        markedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      status: "success",
      message: "Attendance marked successfully",
      data: { attendance },
    });
  } catch (error) {
    console.error("Mark attendance error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// GET attendance records
router.get("/", auth, async (req, res) => {
  const { classId, date } = req.query;

  try {
    const records = await Attendance.find({ classId, date }).populate(
      "studentId",
      "firstName lastName"
    );
    res.json({ status: "success", data: { records } });
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// 📍 Add this below other routes
router.get("/teacher/overview", auth, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ status: "error", message: "Only teachers can view this stat" });
    }

    // Get all attendance records for classes the teacher teaches
    const teacherId = req.user.id;
    const classIds = req.user.classIds || [];

    if (!classIds.length) {
      return res.json({
        status: "success",
        data: { attendanceRate: 0 },
      });
    }

    const records = await Attendance.find({ classId: { $in: classIds } });

    const totalMarked = records.length;
    const totalPresent = records.filter((r) => r.status === "present").length;

    const rate =
      totalMarked === 0 ? 0 : ((totalPresent / totalMarked) * 100).toFixed(1);

    res.json({
      status: "success",
      data: { attendanceRate: parseFloat(rate) },
    });
  } catch (error) {
    console.error("Teacher overview error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// GET /api/attendance/student-summary
router.get("/student-summary", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        status: "error",
        message: "Only students can access their summary",
      });
    }

    const studentId = req.user.id;

    const total = await Attendance.countDocuments({ studentId });
    const present = await Attendance.countDocuments({
      studentId,
      status: "present",
    });

    const rate = total === 0 ? 0 : ((present / total) * 100).toFixed(1);

    res.json({
      status: "success",
      data: {
        totalDays: total,
        daysPresent: present,
        attendanceRate: `${rate}%`,
      },
    });
  } catch (error) {
    console.error("Student summary error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});




// GET /api/attendance/class-summary
router.get("/class-summary", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = { $gte: startDate, $lte: endDate };
    }

    // Aggregate attendance by class
    const summary = await Attendance.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { classId: "$classId", status: "$status" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format result
    const classSummary = {};
    summary.forEach((item) => {
      const classId = item._id.classId.toString();
      if (!classSummary[classId]) {
        classSummary[classId] = {
          classId,
          totalMarked: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0
        };
      }
      classSummary[classId].totalMarked += item.count;
      if (item._id.status === "present") classSummary[classId].presentCount += item.count;
      if (item._id.status === "absent") classSummary[classId].absentCount += item.count;
      if (item._id.status === "late") classSummary[classId].lateCount += item.count;
    });

    // Calculate attendance rate
    const result = Object.values(classSummary).map((cls) => ({
      ...cls,
      attendanceRate:
        cls.totalMarked === 0
          ? 0
          : parseFloat(((cls.presentCount / cls.totalMarked) * 100).toFixed(1)),
    }));

    res.json({ status: "success", data: result });
  } catch (error) {
    console.error("Class summary error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});




export default router;
