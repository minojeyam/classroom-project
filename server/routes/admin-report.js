import express from "express";
import { auth, authorize } from "../middleware/auth.js";

import Class from "../models/Class.js";
import Attendance from "../models/Attendance.js";
import StudentFee from "../models/StudentFee.js";
import ScheduledClass from "../models/ScheduledClass.js";

const router = express.Router();

// Middleware for teacher-only access
router.use(auth, authorize(["admin"]));

// @route GET /api/reports/class-overview
router.get("/class-overview", async (req, res) => {
  try {
    const { classId, range, from, to } = req.query;

    // Step 1: Get teacher's class list
    const teacherClasses = await Class.find({ teacherId: req.user.id })
      .populate("locationId", "name")
      .populate("teacherId", "firstName lastName");

    let filteredClasses = teacherClasses;

    if (classId && classId !== "all") {
      filteredClasses = teacherClasses.filter(
        (c) => c._id.toString() === classId
      );
    }

    // Step 2: Handle date filtering
    let startDate, endDate;

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else if (range) {
      const now = new Date();
      switch (range) {
        case "this-week": {
          const first = now.getDate() - now.getDay();
          startDate = new Date(now.setDate(first));
          endDate = new Date(now.setDate(first + 6));
          break;
        }
        case "this-month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case "this-quarter": {
          const q = Math.floor((now.getMonth() + 3) / 3);
          startDate = new Date(now.getFullYear(), (q - 1) * 3, 1);
          endDate = new Date(now.getFullYear(), q * 3, 0);
          break;
        }
        case "this-year":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
      }
    }

    const data = await Promise.all(
      filteredClasses.map(async (c) => {
        const studentIds = c.enrolledStudents.map((s) => s.studentId);

        // Filter attendance by date
        const attendanceQuery = { classId: c._id };
        if (startDate && endDate) {
          attendanceQuery.date = {
            $gte: startDate.toISOString().split("T")[0],
            $lte: endDate.toISOString().split("T")[0],
          };
        }

        const attendanceRecords = await Attendance.find(attendanceQuery);
        const totalRecords = attendanceRecords.length;
        const presentRecords = attendanceRecords.filter(
          (a) => a.status === "present"
        ).length;
        const averageAttendance = totalRecords
          ? Math.round((presentRecords / totalRecords) * 100)
          : 0;

        // Filter fee records by date
        const feeQuery = { classId: c._id };
        if (startDate && endDate) {
          feeQuery.createdAt = { $gte: startDate, $lte: endDate };
        }

        const feeRecords = await StudentFee.find(feeQuery);

        const totalRevenue = feeRecords.reduce(
          (sum, r) => sum + (r.paidAmount || 0),
          0
        );
        const pendingFees = feeRecords.reduce(
          (sum, r) => sum + ((r.amount || 0) - (r.paidAmount || 0)),
          0
        );

        return {
          classId: c._id,
          className: c.title,
          subject: c.subject,
          level: c.level,
          teacherName: `${c.teacherId.firstName} ${c.teacherId.lastName}`,
          locationName: c.locationId.name,
          totalStudents: c.currentEnrollment,
          activeStudents: studentIds.length,
          averageAttendance,
          totalRevenue,
          pendingFees,
        };
      })
    );

    res.json({ status: "success", data });
  } catch (err) {
    console.error("Class overview error:", err);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch class overview" });
  }
});

// @route GET /api/reports/attendance
router.get("/attendance", async (req, res) => {
  try {
    const { classId, from, to, range } = req.query;

    const classes = await Class.find({ teacherId: req.user.id });
    const teacherClassIds = classes.map((c) => c._id.toString());

    // Filter logic
    const query = {
      classId:
        classId && classId !== "all" ? classId : { $in: teacherClassIds },
    };

    if (from && to) {
      query.date = { $gte: from, $lte: to };
    } else if (range) {
      const now = new Date();
      let start, end;

      switch (range) {
        case "this-week":
          const today = now.getDay(); // 0 = Sun
          start = new Date(now);
          start.setDate(now.getDate() - today);
          end = new Date(start);
          end.setDate(start.getDate() + 6);
          break;
        case "this-month":
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case "this-quarter":
          const quarter = Math.floor((now.getMonth() + 3) / 3);
          start = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
          end = new Date(now.getFullYear(), quarter * 3, 0);
          break;
        case "this-year":
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear(), 11, 31);
          break;
      }

      if (start && end) {
        query.date = {
          $gte: start.toISOString().split("T")[0],
          $lte: end.toISOString().split("T")[0],
        };
      }
    }

    const records = await Attendance.find(query)
      .populate("studentId", "firstName lastName")
      .populate("classId", "title");

    // Map to structure
    const data = records.map((record) => {
      const studentRecords = records.filter(
        (r) =>
          r.studentId._id.toString() === record.studentId._id.toString() &&
          r.classId._id.toString() === record.classId._id.toString()
      );
      const presentCount = studentRecords.filter(
        (r) => r.status === "present"
      ).length;
      const attendanceRate = Math.round(
        (presentCount / studentRecords.length) * 100
      );

      return {
        studentId: record.studentId._id,
        studentName: `${record.studentId.firstName} ${record.studentId.lastName}`,
        className: record.classId.title,
        date: record.date,
        status: record.status,
        attendanceRate,
      };
    });

    res.json({ status: "success", data });
  } catch (err) {
    console.error("Attendance fetch error:", err);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch attendance data" });
  }
});

// @route GET /api/reports/fee-collection
router.get("/fee-collection", async (req, res) => {
  try {
    const { classId, status, from, to, range } = req.query;

    // Step 1: Get teacher's class list
    const classes = await Class.find({ teacherId: req.user.id });
    const teacherClassIds = classes.map((c) => c._id.toString());

    // Step 2: Build query
    const query = {
      classId:
        classId && classId !== "all" ? classId : { $in: teacherClassIds },
    };

    // Step 3: Add date filter
    let startDate, endDate;

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else if (range) {
      const now = new Date();
      switch (range) {
        case "this-week": {
          const first = now.getDate() - now.getDay();
          startDate = new Date(now.setDate(first));
          endDate = new Date(now.setDate(first + 6));
          break;
        }
        case "this-month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case "this-quarter": {
          const q = Math.floor((now.getMonth() + 3) / 3);
          startDate = new Date(now.getFullYear(), (q - 1) * 3, 1);
          endDate = new Date(now.getFullYear(), q * 3, 0);
          break;
        }
        case "this-year":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
      }
    }

    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    if (status && status !== "all") {
      query.status = status;
    }

    // Step 4: Fetch fees
    const fees = await StudentFee.find(query)
      .populate("studentId", "firstName lastName")
      .populate("classId", "title");

    const data = fees.map((fee) => {
      const total = fee.amount;
      const paid = fee.paidAmount || 0;
      const pending = total - paid;

      let paymentStatus = "pending";
      if (paid === 0) paymentStatus = "pending";
      else if (paid < total) paymentStatus = "partial";
      else if (paid >= total) paymentStatus = "paid";
      if (fee.status === "overdue") paymentStatus = "overdue";

      return {
        studentId: fee.studentId._id,
        studentName: `${fee.studentId.firstName} ${fee.studentId.lastName}`,
        className: fee.classId.title,
        totalAmount: total,
        paidAmount: paid,
        pendingAmount: pending,
        lastPaymentDate: fee.paidDate
          ? new Date(fee.paidDate).toISOString().split("T")[0]
          : "-",
        paymentStatus,
      };
    });

    res.json({ status: "success", data });
  } catch (err) {
    console.error("Fee collection error:", err);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch fee data" });
  }
});

// @route GET /api/reports/schedule-summary
router.get("/schedule-summary", async (req, res) => {
  try {
    const { classId, range, from, to } = req.query;

    const teacherClasses = await Class.find({ teacherId: req.user.id });

    let filteredClasses = teacherClasses;

    if (classId && classId !== "all") {
      filteredClasses = filteredClasses.filter(
        (c) => c._id.toString() === classId
      );
    }

    // Handle date range
    let startDate, endDate;
    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else if (range) {
      const now = new Date();
      switch (range) {
        case "this-week": {
          const first = now.getDate() - now.getDay();
          startDate = new Date(now.setDate(first));
          endDate = new Date(now.setDate(first + 6));
          break;
        }
        case "this-month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case "this-quarter":
          const q = Math.floor((now.getMonth() + 3) / 3);
          startDate = new Date(now.getFullYear(), (q - 1) * 3, 1);
          endDate = new Date(now.getFullYear(), q * 3, 0);
          break;
        case "this-year":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
      }
    }

    const results = await Promise.all(
      filteredClasses.map(async (c) => {
        const scheduleQuery = { classId: c._id };
        if (startDate && endDate) {
          scheduleQuery.date = {
            $gte: startDate.toISOString().split("T")[0],
            $lte: endDate.toISOString().split("T")[0],
          };
        }

        const schedules = await ScheduledClass.find(scheduleQuery);
        const total = schedules.length;
        const completed = schedules.filter(
          (s) => s.status === "completed"
        ).length;
        const cancelled = schedules.filter(
          (s) => s.status === "cancelled"
        ).length;
        const upcoming = schedules.filter(
          (s) => s.status === "scheduled"
        ).length;

        // Attendance per scheduled class
        const classAttendance = await Attendance.find({
          classId: c._id,
          ...(startDate && endDate
            ? {
                date: {
                  $gte: startDate.toISOString().split("T")[0],
                  $lte: endDate.toISOString().split("T")[0],
                },
              }
            : {}),
        });

        const totalAttendance = classAttendance.length;
        const presentCount = classAttendance.filter(
          (a) => a.status === "present"
        ).length;

        const attendanceRate =
          totalAttendance > 0
            ? Math.round((presentCount / totalAttendance) * 100)
            : 0;

        const avgStudentsPresent =
          total > 0 ? Math.round(presentCount / total) : 0;

        return {
          className: c.title,
          totalScheduled: total,
          completed,
          cancelled,
          upcoming,
          attendanceRate,
          avgStudentsPresent,
        };
      })
    );

    res.json({ status: "success", data: results });
  } catch (err) {
    console.error("Schedule summary error:", err);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch schedule summary" });
  }
});

// @route GET /api/reports/revenue-summary
router.get("/revenue-summary", async (req, res) => {
  try {
    const { classId, subject, range, from, to } = req.query;

    // Fetch all teacher's classes
    const allClasses = await Class.find({ teacherId: req.user.id });

    // Filter by classId
    let filteredClasses = allClasses;
    if (classId && classId !== "all") {
      filteredClasses = filteredClasses.filter(
        (c) => c._id.toString() === classId
      );
    }

    // Filter by subject
    if (subject && subject !== "all") {
      filteredClasses = filteredClasses.filter((c) => c.subject === subject);
    }

    // Date filtering
    let startDate, endDate;
    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else if (range) {
      const now = new Date();
      switch (range) {
        case "this-week":
          const first = now.getDate() - now.getDay();
          startDate = new Date(now.setDate(first));
          endDate = new Date(now.setDate(first + 6));
          break;
        case "this-month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case "this-quarter":
          const q = Math.floor((now.getMonth() + 3) / 3);
          startDate = new Date(now.getFullYear(), (q - 1) * 3, 1);
          endDate = new Date(now.getFullYear(), q * 3, 0);
          break;
        case "this-year":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
      }
    }

    const data = await Promise.all(
      filteredClasses.map(async (c) => {
        const classId = c._id;

        // Build query for student fees
        const feeQuery = { classId };
        if (startDate && endDate) {
          feeQuery.createdAt = { $gte: startDate, $lte: endDate };
        }

        const StudentFee = (await import("../models/StudentFee.js")).default;
        const fees = await StudentFee.find(feeQuery);

        const currentMonth = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
        const received = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
        const pending = currentMonth - received;

        return {
          className: c.title,
          subject: c.subject,
          students: c.currentEnrollment,
          currentMonth,
          lastMonth: 0, // you can implement if needed
          currentQuarter: 0, // you can implement if needed
          received,
          pending,
        };
      })
    );

    res.json({ status: "success", data });
  } catch (err) {
    console.error("Revenue Summary Error:", err);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch revenue summary" });
  }
});

export default router;
