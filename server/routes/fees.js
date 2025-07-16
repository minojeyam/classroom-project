// routes/fees.js
import express from "express";
import { body, validationResult } from "express-validator";
import FeeStructure from "../models/FeeStructure.js";
import StudentFee from "../models/StudentFee.js";
import Class from "../models/Class.js";
import User from "../models/User.js";
import { auth, authorize } from "../middleware/auth.js";

const router = express.Router();

// =======================
// Fee Structures
// =======================

// @route   GET /api/fees/structures
// @desc    Get all fee structures
// @access  Private (Admin)
router.get("/structures", auth, authorize(["admin"]), async (req, res) => {
  try {
    const structures = await FeeStructure.find().populate(
      "applicableClasses",
      "title"
    );
    res.json({ status: "success", data: structures });
  } catch (error) {
    console.error("Get fee structures error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// @route   POST /api/fees/structures
// @desc    Create a new fee structure
// @access  Private (Admin)
router.post(
  "/structures",
  auth,
  authorize(["admin"]),
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("amount").isFloat({ min: 0 }).withMessage("Amount must be positive"),
    body("currency").isIn(["LKR", "USD", "EUR"]),
    body("frequency").isIn(["monthly", "semester", "annual", "one-time"]),
    body("category").isIn([
      "tuition",
      "lab",
      "library",
      "sports",
      "transport",
      "exam",
      "other",
    ]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "error", errors: errors.array() });
    }

    try {
      const fee = new FeeStructure({ ...req.body, createdBy: req.user.id });
      await fee.save();
      res.status(201).json({ status: "success", data: fee });
    } catch (error) {
      console.error("Create fee structure error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  }
);

// =======================
// Student Fee Records
// =======================

// @route   GET /api/fees/student
// @desc    Get all student fee records
// @access  Private (Admin)
router.get("/student", auth, authorize(["admin"]), async (req, res) => {
  try {
    const records = await StudentFee.find()
      .populate("studentId", "firstName lastName")
      .populate("classId", "title")
      .populate("feeStructureId", "name");
    res.json({ status: "success", data: records });
  } catch (error) {
    console.error("Get student fees error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// @route   PATCH /api/fees/student/:id/pay
// @desc    Record a payment for a student
// @access  Private (Admin)
router.patch(
  "/student/:id/pay",
  auth,
  authorize(["admin"]),
  async (req, res) => {
    const { paidAmount, paymentMethod, paidDate, notes } = req.body;
    try {
      const fee = await StudentFee.findById(req.params.id);
      if (!fee)
        return res
          .status(404)
          .json({ status: "error", message: "Fee record not found" });

      fee.paidAmount += paidAmount;
      fee.paidDate = paidDate || new Date();
      fee.paymentMethod = paymentMethod;
      fee.notes = notes;
      fee.recordedBy = req.user.id;

      if (fee.paidAmount >= fee.amount) {
        fee.status = "paid";
      } else if (fee.paidAmount > 0) {
        fee.status = "partial";
      }

      await fee.save();
      res.json({ status: "success", data: fee });
    } catch (error) {
      console.error("Record payment error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  }
);

// =======================
// Bulk Assign Fees
// =======================

// @route   POST /api/fees/assign
// @desc    Assign a fee to all students in selected classes
// @access  Private (Admin)
router.post("/assign", auth, authorize(["admin"]), async (req, res) => {
  const { feeStructureId, classIds, dueDate } = req.body;
  try {
    const fee = await FeeStructure.findById(feeStructureId);
    if (!fee)
      return res
        .status(404)
        .json({ status: "error", message: "Fee structure not found" });

    const classes = await Class.find({ _id: { $in: classIds } });
    let createdFees = [];

    for (const classItem of classes) {
      const students = await User.find({
        _id: { $in: classItem.enrolledStudents.map((s) => s.studentId) },
      });

      for (const student of students) {
        const record = new StudentFee({
          studentId: student._id,
          classId: classItem._id,
          feeStructureId: fee._id,
          amount: fee.amount,
          currency: fee.currency,
          dueDate,
          status: "pending",
        });
        await record.save();
        createdFees.push(record);
      }
    }

    res.status(201).json({ status: "success", data: createdFees });
  } catch (error) {
    console.error("Bulk assign error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

export default router;
