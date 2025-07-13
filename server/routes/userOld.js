import express from "express";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import { auth, authorize } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get("/", auth, authorize(["admin"]), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, location, search } = req.query;

    // Build query
    const query = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (location) query.locationId = location;

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with pagination
    const users = await User.find(query)
      .populate("locationId", "name address")
      .populate("classIds", "title level")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.json({
      status: "success",
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalUsers: total,
          hasNext: skip + users.length < total,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("locationId", "name address phoneNumber")
      .populate("classIds", "title level subject schedule");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Check authorization - users can only view their own profile unless admin
    if (req.user.role !== "admin" && req.user.id !== user._id.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Access denied",
      });
    }

    res.json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// @route   PUT /api/users/:id/approve
// @desc    Approve pending user (admin only)
// @access  Private (Admin)
router.put("/:id/approve", auth, authorize(["admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (user.status !== "pending") {
      return res.status(400).json({
        status: "error",
        message: "User is not in pending status",
      });
    }

    user.status = "active";
    await user.save();

    res.json({
      status: "success",
      message: "User approved successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Approve user error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// @route   PUT /api/users/:id/reject
// @desc    Reject pending user (admin only)
// @access  Private (Admin)
router.put("/:id/reject", auth, authorize(["admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (user.status !== "pending") {
      return res.status(400).json({
        status: "error",
        message: "User is not in pending status",
      });
    }

    // Delete the user instead of just changing status
    await User.findByIdAndDelete(req.params.id);

    res.json({
      status: "success",
      message: "User registration rejected and removed",
    });
  } catch (error) {
    console.error("Reject user error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put(
  "/:id",
  auth,
  [
    body("firstName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),
    body("lastName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters"),
    body("phoneNumber")
      .optional()
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage("Please enter a valid phone number"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email address"),
  ],
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

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }

      // Check authorization - users can only update their own profile unless admin
      if (req.user.role !== "admin" && req.user.id !== user._id.toString()) {
        return res.status(403).json({
          status: "error",
          message: "Access denied",
        });
      }

      // Update allowed fields
      const allowedUpdates = ["firstName", "lastName", "phoneNumber"];
      const updates = {};

      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Admin can update additional fields
      if (req.user.role === "admin") {
        const adminUpdates = [
          "email",
          "role",
          "status",
          "locationId",
          "classIds",
        ];
        adminUpdates.forEach((field) => {
          if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
          }
        });
      }

      // Check if email is being changed and if it already exists
      if (updates.email && updates.email !== user.email) {
        const existingUser = await User.findOne({ email: updates.email });
        if (existingUser) {
          return res.status(409).json({
            status: "error",
            message: "Email already exists",
          });
        }
      }

      const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      })
        .populate("locationId", "name address")
        .populate("classIds", "title level subject");

      res.json({
        status: "success",
        message: "User updated successfully",
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private (Admin)
router.delete("/:id", auth, authorize(["admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === user._id.toString()) {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete your own account",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics (admin only)
// @access  Private (Admin)
router.get("/stats/overview", auth, authorize(["admin"]), async (req, res) => {
  try {
    const stats = await Promise.all([
      User.countDocuments({ role: "student", status: "active" }),
      User.countDocuments({ role: "teacher", status: "active" }),
      User.countDocuments({ role: "parent", status: "active" }),
      User.countDocuments({ status: "pending" }),
      User.countDocuments({ status: "inactive" }),
    ]);

    const [
      activeStudents,
      activeTeachers,
      activeParents,
      pendingUsers,
      inactiveUsers,
    ] = stats;

    res.json({
      status: "success",
      data: {
        stats: {
          activeStudents,
          activeTeachers,
          activeParents,
          pendingUsers,
          inactiveUsers,
          totalActiveUsers: activeStudents + activeTeachers + activeParents,
          totalUsers:
            activeStudents +
            activeTeachers +
            activeParents +
            pendingUsers +
            inactiveUsers,
        },
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

export default router;
