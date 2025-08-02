import express from "express";
import { auth, authorize } from "../middleware/auth.js";

import Class from "../models/Class.js";
import Attendance from "../models/Attendance.js";
import StudentFee from "../models/StudentFee.js";
import ScheduledClass from "../models/ScheduledClass.js";

const router = express.Router();
router.use(auth, authorize(["admin"]));

// Class Overview
router.get("/class-overview", async (req, res) => {
  try {
    const { classId, range, from, to } = req.query;

    const classes = await Class.find()
      .populate("locationId", "name")
      .populate("teacherId", "firstName lastName");

    let filteredClasses = classes;
    if (classId && classId !== "all") {
      filteredClasses = classes.filter((c) => c._id.toString() === classId);
    }

    let startDate, endDate;
    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else if (range) {
      const now = new Date();
      switch (range) {
        case "this-week":
          startDate = new Date(now.setDate(now.getDate() - now.getDay()));
          endDate = new Date(now.setDate(startDate.getDate() + 6));
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
        const studentIds = c.enrolledStudents.map((s) => s.studentId);

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

// Attendance
router.get("/attendance", async (req, res) => {
  try {
    const { classId, from, to, range } = req.query;

    const classes = await Class.find();
    const classIds = classes.map((c) => c._id.toString());

    const query = {
      classId: classId && classId !== "all" ? classId : { $in: classIds },
    };

    let start, end;
    if (from && to) {
      query.date = { $gte: from, $lte: to };
    } else if (range) {
      const now = new Date();
      switch (range) {
        case "this-week":
          start = new Date(now.setDate(now.getDate() - now.getDay()));
          end = new Date(now.setDate(start.getDate() + 6));
          break;
        case "this-month":
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case "this-quarter":
          const q = Math.floor((now.getMonth() + 3) / 3);
          start = new Date(now.getFullYear(), (q - 1) * 3, 1);
          end = new Date(now.getFullYear(), q * 3, 0);
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

// Fee Collection
router.get("/fee-collection", async (req, res) => {
  console.log("🎯 Hitting /api/reports/fee-collection");
  try {
    if (!req.user) {
      console.warn("⛔ No authenticated user found in request");
      return res.status(401).json({
        status: "error",
        message: "Unauthorized access",
      });
    }

    console.log("👤 Authenticated User:", req.user);

    const { classId, status, from, to, range, location, teacher } = req.query;
    console.log("📦 Query Params:", req.query);

    let allClasses = await Class.find()
      .populate("locationId")
      .populate("teacherId");

    if (!allClasses || allClasses.length === 0) {
      console.warn("⚠️ No classes found in the database.");
      return res.json({ status: "success", data: [] });
    }

    // Filter by location
    if (location && location !== "all") {
      allClasses = allClasses.filter(
        (c) => c.locationId?._id?.toString() === location
      );
    }

    // Filter by teacher
    if (teacher && teacher !== "all") {
      allClasses = allClasses.filter(
        (c) => c.teacherId?._id?.toString() === teacher
      );
    }

    const classIds = allClasses.map((c) => c._id.toString());

    // Build query
    const query = {
      classId: classId && classId !== "all" ? classId : { $in: classIds },
    };

    // Handle date range
    let startDate, endDate;
    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else if (range) {
      const now = new Date();
      switch (range) {
        case "this-week":
          startDate = new Date(now.setDate(now.getDate() - now.getDay()));
          endDate = new Date(now.setDate(startDate.getDate() + 6));
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

    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    // Filter by payment status
    if (status && status !== "all") {
      query.status = status;
    }

    const fees = await StudentFee.find(query)
      .populate("studentId", "firstName lastName")
      .populate("classId", "title");

    console.log(`📊 Found ${fees.length} fee records.`);

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
        className: fee.classId?.title || "Unknown",
        totalAmount: total,
        paidAmount: paid,
        pendingAmount: pending,
        lastPaymentDate: fee.paidDate
          ? new Date(fee.paidDate).toISOString().split("T")[0]
          : "-",
        paymentStatus,
      };
    });

    console.log("✅ Sending fee collection data:", data.length, "entries");

    res.json({ status: "success", data });
  } catch (err) {
    console.error("🔥 Fee collection route error:", err.message, err.stack);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch fee data" });
  }
});

// Student Enrollment Report
router.get("/student-enrollment", async (req, res) => {
  try {
    const { range, from, to, location, teacher, classId } = req.query;

    let classes = await Class.find()
      .populate("locationId")
      .populate("teacherId");

    if (location && location !== "all") {
      classes = classes.filter(
        (c) => c.locationId?._id?.toString() === location
      );
    }

    if (teacher && teacher !== "all") {
      classes = classes.filter((c) => c.teacherId?._id?.toString() === teacher);
    }

    if (classId && classId !== "all") {
      classes = classes.filter((c) => c._id.toString() === classId);
    }

    let startDate, endDate;
    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else if (range) {
      const now = new Date();
      switch (range) {
        case "this-week":
          startDate = new Date(now.setDate(now.getDate() - now.getDay()));
          endDate = new Date(now.setDate(startDate.getDate() + 6));
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

    const result = [];
    for (const loc of [...new Set(classes.map((c) => c.locationId?.name))]) {
      const locClasses = classes.filter((c) => c.locationId?.name === loc);
      let totalStudents = 0;
      let active = 0;

      for (const cl of locClasses) {
        const filteredStudents = cl.enrolledStudents.filter((s) => {
          const enrolledAt = new Date(s.enrollmentDate);
          return (
            (!startDate || enrolledAt >= startDate) &&
            (!endDate || enrolledAt <= endDate)
          );
        });

        totalStudents += filteredStudents.length;
        active += filteredStudents.filter((s) => s.status === "active").length;
      }

      result.push({
        location: loc,
        classes: locClasses.length,
        totalStudents,
        active,
      });
    }

    res.json({ status: "success", data: result });
  } catch (err) {
    console.error("Student enrollment error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch student enrollment data",
    });
  }
});

// Schedule Summary
router.get("/schedule-summary", async (req, res) => {
  try {
    const { classId, range, from, to } = req.query;
    const classes = await Class.find();
    let filteredClasses = classes;

    if (classId && classId !== "all") {
      filteredClasses = filteredClasses.filter(
        (c) => c._id.toString() === classId
      );
    }

    let startDate, endDate;
    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else if (range) {
      const now = new Date();
      switch (range) {
        case "this-week":
          startDate = new Date(now.setDate(now.getDate() - now.getDay()));
          endDate = new Date(now.setDate(startDate.getDate() + 6));
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

// Revenue Summary
router.get("/revenue-summary", async (req, res) => {
  try {
    const { classId, subject, range, from, to } = req.query;
    let filteredClasses = await Class.find();

    if (classId && classId !== "all") {
      filteredClasses = filteredClasses.filter(
        (c) => c._id.toString() === classId
      );
    }

    if (subject && subject !== "all") {
      filteredClasses = filteredClasses.filter((c) => c.subject === subject);
    }

    let startDate, endDate;
    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else if (range) {
      const now = new Date();
      switch (range) {
        case "this-week":
          startDate = new Date(now.setDate(now.getDate() - now.getDay()));
          endDate = new Date(now.setDate(startDate.getDate() + 6));
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
        const feeQuery = { classId: c._id };
        if (startDate && endDate) {
          feeQuery.createdAt = { $gte: startDate, $lte: endDate };
        }

        const fees = await StudentFee.find(feeQuery);
        const currentMonth = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
        const received = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
        const pending = currentMonth - received;

        return {
          className: c.title,
          subject: c.subject,
          students: c.currentEnrollment,
          currentMonth,
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
