import express from "express";
import { body, validationResult } from "express-validator";
import Class from "../models/Class.js";
import User from "../models/User.js";
import Location from "../models/Location.js";
import { auth, authorize } from "../middleware/auth.js";

const router = express.Router();

// Validation rules for class
const classValidation = [
  body("title")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Class title must be between 2 and 100 characters"),
  body("level")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Class level must be between 1 and 50 characters"),
  body("subject")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Subject must be between 2 and 50 characters"),
  body("locationId").isMongoId().withMessage("Valid location ID is required"),
  body("teacherId").isMongoId().withMessage("Valid teacher ID is required"),
  body("schedule.dayOfWeek")
    .isInt({ min: 0, max: 6 })
    .withMessage("Day of week must be between 0-6"),
  body("schedule.startTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Start time must be in HH:MM format"),
  body("schedule.endTime")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("End time must be in HH:MM format"),
  body("capacity")
    .isInt({ min: 1, max: 100 })
    .withMessage("Capacity must be between 1 and 100"),
  body("fees").isArray({ min: 1 }).withMessage("At least one fee is required"),
  body("fees.*.name").isString().notEmpty().withMessage("Fee name is required"),
  body("fees.*.amount")
    .isFloat({ min: 0 })
    .withMessage("Fee amount must be a positive number"),
  body("fees.*.frequency")
    .isIn(["monthly", "semester", "annual", "one-time"])
    .withMessage(
      "Fee frequency must be one of monthly, semester, annual, one-time"
    ),
  body("fees.*.category")
    .isIn(["tuition", "lab", "library", "sports", "transport", "exam", "other"])
    .withMessage("Fee category must be valid"),

  body("startDate").isISO8601().withMessage("Start date must be a valid date"),
  body("endDate").isISO8601().withMessage("End date must be a valid date"),
];

// @route   GET /api/classes
// @desc    Get all classes
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      location,
      teacher,
      level,
      subject,
      status,
      search,
    } = req.query;

    // Build query based on user role
    let query = {};

    if (req.user.role === "teacher") {
      query.teacherId = req.user.id;
    } else if (req.user.role === "student") {
      query._id = { $in: req.user.classIds || [] };
    }

    // Add filters
    if (location) query.locationId = location;
    if (teacher) query.teacherId = teacher;
    if (level) query.level = level;
    if (subject) query.subject = subject;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { level: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get classes with pagination
    const classes = await Class.find(query)
      .populate("locationId", "name address")
      .populate("teacherId", "firstName lastName email")
      .populate("enrolledStudents.studentId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Class.countDocuments(query);

    res.json({
      status: "success",
      data: {
        classes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalClasses: total,
          hasNext: skip + classes.length < total,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get classes error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// @route   GET /api/classes/:id
// @desc    Get class by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id)
      .populate("locationId", "name address phoneNumber")
      .populate("teacherId", "firstName lastName email phoneNumber")
      .populate(
        "enrolledStudents.studentId",
        "firstName lastName email phoneNumber parentEmail"
      )
      .populate("createdBy", "firstName lastName email");

    if (!classItem) {
      return res.status(404).json({
        status: "error",
        message: "Class not found",
      });
    }

    // Check authorization
    if (
      req.user.role === "teacher" &&
      classItem.teacherId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        status: "error",
        message: "Access denied",
      });
    }

    if (
      req.user.role === "student" &&
      !classItem.enrolledStudents.some(
        (s) => s.studentId._id.toString() === req.user.id
      )
    ) {
      return res.status(403).json({
        status: "error",
        message: "Access denied",
      });
    }

    res.json({
      status: "success",
      data: {
        class: classItem,
      },
    });
  } catch (error) {
    console.error("Get class error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// @route   POST /api/classes
// @desc    Create new class (admin only)
// @access  Private (Admin)
router.post(
  "/",
  auth,
  authorize(["admin"]),
  classValidation,
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      // Verify location exists
      const location = await Location.findById(req.body.locationId);
      if (!location) {
        return res.status(404).json({
          status: "error",
          message: "Location not found",
        });
      }

      // Verify teacher exists and has teacher role
      const teacher = await User.findById(req.body.teacherId);
      if (!teacher || teacher.role !== "teacher") {
        return res.status(404).json({
          status: "error",
          message: "Teacher not found",
        });
      }

      // Check for schedule conflicts
      const conflictingClass = await Class.findOne({
        locationId: req.body.locationId,
        "schedule.dayOfWeek": req.body.schedule.dayOfWeek,
        status: "active",
        $or: [
          {
            "schedule.startTime": { $lt: req.body.schedule.endTime },
            "schedule.endTime": { $gt: req.body.schedule.startTime },
          },
        ],
      });

      if (conflictingClass) {
        return res.status(409).json({
          status: "error",
          message: "Schedule conflict with existing class",
        });
      }

      // Create new class
      const classData = {
        ...req.body,
        createdBy: req.user.id,
      };

      const newClass = new Class(classData);
      await newClass.save();

      // Populate the created class
      await newClass.populate([
        { path: "locationId", select: "name address" },
        { path: "teacherId", select: "firstName lastName email" },
        { path: "createdBy", select: "firstName lastName email" },
      ]);

      res.status(201).json({
        status: "success",
        message: "Class created successfully",
        data: {
          class: newClass,
        },
      });
    } catch (error) {
      console.error("Create class error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  }
);

// @route   PUT /api/classes/:id
// @desc    Update class (admin only)
// @access  Private (Admin)
router.put(
  "/:id",
  auth,
  authorize(["admin"]),
  classValidation,
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const classItem = await Class.findById(req.params.id);

      if (!classItem) {
        return res.status(404).json({
          status: "error",
          message: "Class not found",
        });
      }

      // Verify location exists if being updated
      if (req.body.locationId) {
        const location = await Location.findById(req.body.locationId);
        if (!location) {
          return res.status(404).json({
            status: "error",
            message: "Location not found",
          });
        }
      }

      // Verify teacher exists if being updated
      if (req.body.teacherId) {
        const teacher = await User.findById(req.body.teacherId);
        if (!teacher || teacher.role !== "teacher") {
          return res.status(404).json({
            status: "error",
            message: "Teacher not found",
          });
        }
      }

      const updatedClass = await Class.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate([
        { path: "locationId", select: "name address" },
        { path: "teacherId", select: "firstName lastName email" },
        {
          path: "enrolledStudents.studentId",
          select: "firstName lastName email",
        },
      ]);

      res.json({
        status: "success",
        message: "Class updated successfully",
        data: {
          class: updatedClass,
        },
      });
    } catch (error) {
      console.error("Update class error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  }
);

// @route   DELETE /api/classes/:id
// @desc    Delete class (admin only)
// @access  Private (Admin)
router.delete("/:id", auth, authorize(["admin"]), async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({
        status: "error",
        message: "Class not found",
      });
    }

    // Check if class has enrolled students
    if (classItem.enrolledStudents.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete class with enrolled students",
      });
    }

    await Class.findByIdAndDelete(req.params.id);

    res.json({
      status: "success",
      message: "Class deleted successfully",
    });
  } catch (error) {
    console.error("Delete class error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// @route   POST /api/classes/:id/enroll
// @desc    Enroll student in class
// @access  Private (Admin, Teacher)
router.post(
  "/:id/enroll",
  auth,
  authorize(["admin", "teacher"]),
  async (req, res) => {
    try {
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({
          status: "error",
          message: "Student ID is required",
        });
      }

      const classItem = await Class.findById(req.params.id);
      if (!classItem) {
        return res.status(404).json({
          status: "error",
          message: "Class not found",
        });
      }

      // Check if teacher is authorized for this class
      if (
        req.user.role === "teacher" &&
        classItem.teacherId.toString() !== req.user.id
      ) {
        return res.status(403).json({
          status: "error",
          message: "Access denied",
        });
      }

      // Verify student exists
      const student = await User.findById(studentId);
      if (!student || student.role !== "student") {
        return res.status(404).json({
          status: "error",
          message: "Student not found",
        });
      }

      // Check if student is already enrolled
      const isEnrolled = classItem.enrolledStudents.some(
        (enrollment) => enrollment.studentId.toString() === studentId
      );

      if (isEnrolled) {
        return res.status(409).json({
          status: "error",
          message: "Student is already enrolled in this class",
        });
      }

      // Check class capacity
      if (classItem.currentEnrollment >= classItem.capacity) {
        return res.status(400).json({
          status: "error",
          message: "Class is at full capacity",
        });
      }

      // Enroll student
      classItem.enrolledStudents.push({
        studentId,
        enrollmentDate: new Date(),
        status: "active",
      });
      classItem.currentEnrollment += 1;

      await classItem.save();

      // Update student's classIds
      if (!student.classIds.includes(req.params.id)) {
        student.classIds.push(req.params.id);
        await student.save();
      }

      res.json({
        status: "success",
        message: "Student enrolled successfully",
        data: {
          class: classItem,
        },
      });
    } catch (error) {
      console.error("Enroll student error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  }
);

// @route   POST /api/classes/:id/enroll-bulk
// @desc    Enroll multiple students in a class
// @access  Private (Admin, Teacher)
router.post(
  "/:id/enroll-bulk",
  auth,
  authorize(["admin", "teacher"]),
  async (req, res) => {
    try {
      const { studentIds } = req.body;

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "An array of student IDs is required",
        });
      }

      const classItem = await Class.findById(req.params.id);
      if (!classItem) {
        return res
          .status(404)
          .json({ status: "error", message: "Class not found" });
      }

      // Check access
      if (
        req.user.role === "teacher" &&
        classItem.teacherId.toString() !== req.user.id
      ) {
        return res
          .status(403)
          .json({ status: "error", message: "Access denied" });
      }

      const validStudents = await User.find({
        _id: { $in: studentIds },
        role: "student",
      });

      const alreadyEnrolledIds = new Set(
        classItem.enrolledStudents.map((s) => s.studentId.toString())
      );
      let newEnrollments = 0;

      for (const student of validStudents) {
        const sid = student._id.toString();
        if (
          !alreadyEnrolledIds.has(sid) &&
          classItem.currentEnrollment < classItem.capacity
        ) {
          classItem.enrolledStudents.push({ studentId: sid });
          student.classIds.push(classItem._id);
          await student.save();
          classItem.currentEnrollment++;
          newEnrollments++;
        }
      }

      await classItem.save();

      res.json({
        status: "success",
        message: `${newEnrollments} students enrolled successfully`,
        data: { class: classItem },
      });
    } catch (error) {
      console.error("Bulk enroll error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  }
);

export default router;
