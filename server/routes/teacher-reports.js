import express from "express";
import { auth, authorize } from "../middleware/auth.js";
import Class from "../models/Class.js";
import User from "../models/User.js";
import StudentFee from "../models/StudentFee.js";

const router = express.Router();

// Middleware for teacher-only access
router.use(auth, authorize(["teacher"]));

// @route GET /api/reports/class-overview
router.get("/class-overview", async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.user.id })
      .populate("locationId", "name")
      .populate("teacherId", "firstName lastName");

    const data = classes.map((c) => ({
      classId: c._id,
      className: c.title,
      subject: c.subject,
      level: c.level,
      teacherName: `${c.teacherId.firstName} ${c.teacherId.lastName}`,
      locationName: c.locationId.name,
      totalStudents: c.currentEnrollment,
      activeStudents: Math.floor(c.currentEnrollment * 0.95),
      averageAttendance: 90, // placeholder
      totalRevenue: c.currentEnrollment * (c.monthlyFee?.amount || 4500),
      pendingFees:
        Math.floor(c.currentEnrollment * 0.1) * (c.monthlyFee?.amount || 4500),
    }));

    res.json({ status: "success", data });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch class overview" });
  }
});

// @route GET /api/reports/attendance
router.get("/attendance", async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.user.id });
    const data = [];

    classes.forEach((c) => {
      for (let i = 0; i < c.currentEnrollment; i++) {
        const attendanceRate = Math.floor(Math.random() * 20) + 80;
        data.push({
          studentId: `s-${i}`,
          studentName: `Student ${i + 1}`,
          className: c.title,
          date: new Date().toISOString().split("T")[0],
          status: Math.random() > 0.8 ? "absent" : "present",
          attendanceRate,
        });
      }
    });

    res.json({ status: "success", data });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch attendance data" });
  }
});

// @route GET /api/reports/fee-collection
router.get("/fee-collection", async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.user.id });
    const data = [];

    classes.forEach((c) => {
      for (let i = 0; i < c.currentEnrollment; i++) {
        const total = c.monthlyFee?.amount || 4500;
        const paid = Math.random() > 0.2 ? total : Math.floor(total * 0.5);

        data.push({
          studentId: `s-${i}`,
          studentName: `Student ${i + 1}`,
          className: c.title,
          totalAmount: total,
          paidAmount: paid,
          pendingAmount: total - paid,
          lastPaymentDate: new Date(Date.now() - Math.random() * 1e9)
            .toISOString()
            .split("T")[0],
          paymentStatus:
            paid === total ? "paid" : paid === 0 ? "pending" : "partial",
        });
      }
    });

    res.json({ status: "success", data });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch fee data" });
  }
});

// @route GET /api/reports/schedule-summary
router.get("/schedule-summary", async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.user.id });
    const data = classes.map((c) => ({
      classId: c._id,
      className: c.title,
      totalScheduled: 20,
      completed: 18,
      cancelled: 1,
      upcoming: 1,
      attendanceRate: 92,
      avgStudentsPresent: Math.floor(c.currentEnrollment * 0.8),
    }));

    res.json({ status: "success", data });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch schedule summary" });
  }
});

// @route GET /api/reports/revenue-summary
router.get("/revenue-summary", async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.user.id });

    const result = await Promise.all(
      classes.map(async (cls) => {
        const feeRecords = await StudentFee.find({ classId: cls._id });

        const totalExpected = feeRecords.reduce((sum, r) => sum + r.amount, 0);
        const totalCollected = feeRecords.reduce(
          (sum, r) => sum + (r.paidAmount || 0),
          0
        );

        const totalPending = totalExpected - totalCollected;

        return {
          classId: cls._id,
          className: cls.title,
          students: cls.enrolledStudents?.length || 0,
          currentMonth: totalExpected, // you can add a date filter if needed
          lastMonth: totalExpected, // placeholder
          currentQuarter: totalExpected * 3, // placeholder
          received: totalCollected,
          pending: totalPending,
        };
      })
    );

    res.json({ status: "success", data: result });
  } catch (err) {
    console.error("❌ Revenue summary error:", err);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch revenue summary" });
  }
});

export default router;
