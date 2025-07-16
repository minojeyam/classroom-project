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

export default router;
