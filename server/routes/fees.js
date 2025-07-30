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
router.get( "/structures", auth, authorize(["admin", "teacher"]),
  async (req, res) => {
    try {
      const structures = await FeeStructure.find().populate(
        "applicableClasses",
        "title"
      );
      res.json({ status: "success", data: structures });
    } catch (error) {
      console.error("Get fee structures error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  }
);

// @route   POST /api/fees/structures
// @desc    Create a new fee structure
// @access  Private (Admin)
router.post( "/structures", auth,authorize(["admin", "teacher"]),
  [
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .custom(async (value) => {
        const existingFee = await FeeStructure.findOne({ name: value });
        if (existingFee) {
          throw new Error("Fee structure with this name already exists");
        }
        return true;
      }),
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


// @route   PUT /api/fees/structures/:id
// @desc    Update a fee structure by ID
// @access  Private (Admin, Teacher)
router.put(
  "/structures/:id",
  auth,
  authorize(["admin", "teacher"]),
  [
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .custom(async (value, { req }) => {
        const existingFee = await FeeStructure.findOne({ name: value });
        if (existingFee && existingFee._id.toString() !== req.params.id) {
          throw new Error("Fee structure with this name already exists");
        }
        return true;
      }),
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
      const fee = await FeeStructure.findById(req.params.id);
      if (!fee) {
        return res.status(404).json({ status: "error", message: "Fee structure not found" });
      }

      // Update fields
      fee.name = req.body.name;
      fee.description = req.body.description;
      fee.amount = req.body.amount;
      fee.currency = req.body.currency;
      fee.frequency = req.body.frequency;
      fee.category = req.body.category;
      fee.applicableClasses = req.body.applicableClasses;
      fee.status = req.body.status || fee.status;

      await fee.save();

      res.json({ status: "success", data: fee });
    } catch (error) {
      console.error("Update fee structure error:", error);
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
  }
);


// @route   DELETE /api/fees/structures/:id
// @desc    Delete a fee structure by ID
// @access  Private (Admin, Teacher)
router.delete(
  "/structures/:id",
  auth,
  authorize(["admin", "teacher"]),
  async (req, res) => {
    try {
      const fee = await FeeStructure.findById(req.params.id);
      if (!fee) {
        return res.status(404).json({ status: "error", message: "Fee structure not found" });
      }
      await fee.deleteOne();
      res.json({ status: "success", message: "Fee structure deleted" });
    } catch (error) {
      console.error("Delete fee structure error:", error);
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
  }
);


// =======================
// Student Fee Records
// =======================

// @route   GET /api/fees/student
// @desc    Get all student fee records
// @access  Private (Admin)
router.get(
  "/student",
  auth,
  authorize(["admin", "teacher"]),
  async (req, res) => {
    try {
      const records = await StudentFee.find()
        .populate("studentId", "firstName lastName")
        .populate("classId", "title")
        .populate("feeStructureId", "name");
      res.json({
        status: "success",
        data: records.map((r) => ({
          id: r._id,
          studentId: r.studentId?._id,
          studentName: `${r.studentId?.firstName || ""} ${
            r.studentId?.lastName || ""
          }`,
          className: r.classId?.title || "",
          feeStructureId: r.feeStructureId?._id,
          feeName: r.feeStructureId?.name || "",
          amount: r.amount,
          dueDate: r.dueDate,
          status: r.status,
          paidAmount: r.paidAmount,
          paidDate: r.paidDate,
          paymentMethod: r.paymentMethod,
          notes: r.notes,
          currency: r.currency,
        })),
      });
    } catch (error) {
      console.error("Get student fees error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  }
);

// @route   PATCH /api/fees/student/:id/pay
// @desc    Record a payment for a student
// @access  Private (Admin)
router.patch(
  "/student/:id/pay",
  auth,
  authorize(["admin", "teacher"]),
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
// @access  Private (Admin, Teacher)
router.post(
  "/assign",
  auth,
  authorize(["admin", "teacher"]),
  async (req, res) => {
    const { feeStructureId, classIds, dueDate } = req.body;

    try {
      const fee = await FeeStructure.findById(feeStructureId);
      if (!fee)
        return res.status(404).json({
          status: "error",
          message: "Fee structure not found",
        });

      const classes = await Class.find({ _id: { $in: classIds } });
      let createdFees = [];

      for (const classItem of classes) {
        const students = await User.find({
          _id: { $in: classItem.enrolledStudents.map((s) => s.studentId) },
        });

        const classFeeAmount =
          fee.category === "tuition" && classItem.monthlyFee
            ? classItem.monthlyFee.amount
            : fee.amount;

        const currency =
          fee.category === "tuition" && classItem.monthlyFee?.currency
            ? classItem.monthlyFee.currency
            : fee.currency;

        for (const student of students) {
          const record = new StudentFee({
            studentId: student._id,
            classId: classItem._id,
            feeStructureId: fee._id,
            amount: classFeeAmount,
            currency,
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
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  }
);

// @route   PUT /api/fees/structures/:id
// @desc    Update an existing fee structure
// @access  Private (Admin, Teacher)
router.put(
  "/structures/:id",
  auth,
  authorize(["admin", "teacher"]),
  async (req, res) => {
    try {
      const updated = await FeeStructure.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res
          .status(404)
          .json({ status: "error", message: "Fee structure not found" });
      }

      res.json({ status: "success", data: updated });
    } catch (error) {
      console.error("Update fee structure error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  }
);

// @route   DELETE /api/fees/structures/:id
// @desc    Delete a fee structure
// @access  Private (Admin, Teacher)
router.delete(
  "/structures/:id",
  auth,
  authorize(["admin", "teacher"]),
  async (req, res) => {
    try {
      const deleted = await FeeStructure.findByIdAndDelete(req.params.id);

      if (!deleted) {
        return res
          .status(404)
          .json({ status: "error", message: "Fee structure not found" });
      }

      res.json({
        status: "success",
        message: "Fee structure deleted successfully",
      });
    } catch (error) {
      console.error("Delete fee structure error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  }
);


// @route   GET /api/fees/class-overview
// @desc    Get fee overview for all classes with revenue growth & collection %
// router.get(
//   "/class-overview",
//   auth,
//   authorize(["admin", "teacher"]),
//   async (req, res) => {
//     try {
//       const classes = await Class.find().select(
//         "title enrolledStudents monthlyFee"
//       );

//       const feeRecords = await StudentFee.find()
//         .populate("classId", "title")
//         .populate("feeStructureId", "category");

//       // ---------- Date ranges ----------
//       const now = new Date();
//       const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//       const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//       const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

//       const currentMonthFees = feeRecords.filter(
//         (fee) => fee.paidDate && fee.paidDate >= startOfCurrentMonth
//       );
//       const lastMonthFees = feeRecords.filter(
//         (fee) => fee.paidDate && fee.paidDate >= startOfLastMonth && fee.paidDate <= endOfLastMonth
//       );

//       const currentMonthRevenue = currentMonthFees.reduce(
//         (sum, record) => sum + (record.paidAmount || 0),
//         0
//       );
//       const previousMonthRevenue = lastMonthFees.reduce(
//         (sum, record) => sum + (record.paidAmount || 0),
//         0
//       );

//       const feeIncreasePercentage =
//         previousMonthRevenue > 0
//           ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
//           : 0;

//       // ---------- Per-Class Overview ----------
//       const overview = classes.map((classItem) => {
//         const classFeeRecords = feeRecords.filter(
//           (record) => record.classId?._id.toString() === classItem._id.toString()
//         );

//         const totalStudents = classItem.enrolledStudents.length;
//         const totalExpectedRevenue = classFeeRecords.reduce(
//           (sum, record) => sum + record.amount,
//           0
//         );
//         const collectedAmount = classFeeRecords.reduce(
//           (sum, record) => sum + (record.paidAmount || 0),
//           0
//         );

//         const collectionPercentage =
//           totalExpectedRevenue > 0
//             ? (collectedAmount / totalExpectedRevenue) * 100
//             : 0;

//         const paidCount = classFeeRecords.filter((r) => r.status === "paid").length;
//         const partialCount = classFeeRecords.filter((r) => r.status === "partial").length;
//         const pendingCount = classFeeRecords.filter((r) => r.status === "pending").length;

//         return {
//           classId: classItem._id,
//           className: classItem.title,
//           totalStudents,
//           totalExpectedRevenue,
//           collectedAmount,
//           collectionPercentage,
//           paidCount,
//           partialCount,
//           pendingCount,
//           currency: classItem.monthlyFee?.currency || "LKR"
//         };
//       });

//       res.json({
//         status: "success",
//         data: {
//           overview,
//           monthlyRevenue: {
//             currentMonthRevenue,
//             previousMonthRevenue,
//             feeIncreasePercentage
//           }
//         }
//       });
//     } catch (error) {
//       console.error("Get class fee overview error:", error);
//       res.status(500).json({ status: "error", message: "Internal server error" });
//     }
//   }
// );



// @route   GET /api/fees/class-summary
// @desc    Get summarized fee details for each class within a date range
router.get(
  "/class-summary",
  auth,
  authorize(["admin", "teacher"]),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({
          status: "error",
          message: "startDate and endDate are required (YYYY-MM format)",
        });
      }

      const start = new Date(`${startDate}-01`);
      const end = new Date(`${endDate}-31T23:59:59`);

      const records = await StudentFee.find({
        dueDate: { $gte: start, $lte: end },
      })
        .populate("classId", "title monthlyFee")
        .populate("studentId", "firstName lastName");

      const summary = records.reduce((acc, record) => {
        const classId = record.classId?._id.toString();
        if (!acc[classId]) {
          acc[classId] = {
            classId,
            className: record.classId?.title || "Unknown",
            totalStudents: 0,
            expectedAmount: 0,
            collectedAmount: 0,
            paid: 0,
            partial: 0,
            pending: 0,
          };
        }

        acc[classId].totalStudents++;
        acc[classId].expectedAmount += record.amount;
        acc[classId].collectedAmount += record.paidAmount || 0;

        if (record.status === "paid") acc[classId].paid++;
        else if (record.status === "partial") acc[classId].partial++;
        else acc[classId].pending++;

        return acc;
      }, {});

      res.json({
        status: "success",
        data: Object.values(summary),
      });
    } catch (error) {
      console.error("Class summary error:", error);
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
  }
);


// @route   GET /api/fees/location-from-classes
// @desc    Get total fee amounts grouped by location (based on class fees)
// @access  Private (Admin, Teacher)


router.get(
  "/location-from-classes",
  auth,
  authorize(["admin", "teacher"]),
  async (req, res) => {
    try {
      // 1. Get all classes with fees and location info
      const classes = await Class.find()
        .populate("locationId", "name")
        .select("title fees currency locationId");

      // 2. Group by location
      const summary = {};
      let overallTotalClasses = 0;
      let overallTotalFee = 0;

      classes.forEach((cls) => {
        const locationName = cls.locationId?.name || "Unknown";
        const feeTotal = (cls.fees || []).reduce(
          (sum, fee) => sum + (fee.amount || 0),
          0
        );

        if (!summary[locationName]) {
          summary[locationName] = {
            location: locationName,
            totalClasses: 0,
            totalFee: 0,
            classes: [],
          };
        }

        summary[locationName].totalClasses += 1;
        summary[locationName].totalFee += feeTotal;
        summary[locationName].classes.push({
          classId: cls._id,
          title: cls.title,
          feeTotal,
          currency: cls.currency,
        });

        // Update overall totals
        overallTotalClasses += 1;
        overallTotalFee += feeTotal;
      });

      res.json({
        status: "success",
        data: {
          locations: Object.values(summary),
          overall: {
            totalClasses: overallTotalClasses,
            totalFee: overallTotalFee,
          },
        },
      });
    } catch (error) {
      console.error("Location fee summary error:", error);
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
  }
);

// @route   POST /api/fees/structures/:id/bulk-assign
// @desc    Bulk assign classes to a fee structure
// @access  Private (Admin)
router.post(
  "/structures/:id/bulk-assign",
  auth,
  authorize(["admin", "teacher"]),
  [
    body("classIds")
      .isArray({ min: 1 })
      .withMessage("classIds must be an array with at least one ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "error", errors: errors.array() });
    }

    const { id } = req.params;
    const { classIds } = req.body;

    try {
      const feeStructure = await FeeStructure.findById(id);
      if (!feeStructure) {
        return res
          .status(404)
          .json({ status: "error", message: "Fee structure not found" });
      }

      // Add classes avoiding duplicates
      const uniqueClasses = [
        ...new Set([...feeStructure.applicableClasses, ...classIds]),
      ];

      feeStructure.applicableClasses = uniqueClasses;
      await feeStructure.save();

      res.json({ status: "success", data: feeStructure });
    } catch (error) {
      console.error("Bulk assign error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  }
);




export default router;
