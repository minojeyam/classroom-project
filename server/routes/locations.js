import express from "express";
import { body, validationResult } from "express-validator";
import Location from "../models/Location.js";
import { auth, authorize } from "../middleware/auth.js";

const router = express.Router();

// Validation rules
const locationValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Location name must be between 2 and 100 characters"),
  body("address.street").notEmpty().withMessage("Street address is required"),
  body("address.city").notEmpty().withMessage("City is required"),
  body("address.state").notEmpty().withMessage("State is required"),
  body("address.zipCode").notEmpty().withMessage("Zip code is required"),
  body("phoneNumber")
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage("Please enter a valid phone number"),
  body("email").isEmail().normalizeEmail(),
  body("capacity")
    .isInt({ min: 1, max: 10000 })
    .withMessage("Capacity must be between 1 and 10,000"),
  body("color")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage("Please enter a valid hex color"),
];

// @route   GET /api/locations
// @desc    Get all locations
// @access  Public ✅
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "address.city": { $regex: search, $options: "i" } },
        { "address.state": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const locations = await Location.find(query)
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Location.countDocuments(query);

    res.json({
      status: "success",
      data: {
        locations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalLocations: total,
          hasNext: skip + locations.length < total,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get locations error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// @route   GET /api/locations/:id
// @desc    Get location by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const location = await Location.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName email"
    );

    if (!location) {
      return res
        .status(404)
        .json({ status: "error", message: "Location not found" });
    }

    res.json({ status: "success", data: { location } });
  } catch (error) {
    console.error("Get location error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// @route   POST /api/locations
// @desc    Create location
// @access  Private (admin only)
router.post(
  "/",
  auth,
  authorize(["admin"]),
  locationValidation,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
    }

    try {
      const existing = await Location.findOne({ name: req.body.name });
      if (existing) {
        return res
          .status(409)
          .json({
            status: "error",
            message: "Location with this name already exists",
          });
      }

      const location = new Location({ ...req.body, createdBy: req.user.id });
      await location.save();
      await location.populate("createdBy", "firstName lastName email");

      res.status(201).json({
        status: "success",
        message: "Location created successfully",
        data: { location },
      });
    } catch (error) {
      console.error("Create location error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  }
);

// @route   PUT /api/locations/:id
// @desc    Update location
// @access  Private (admin only)
router.put(
  "/:id",
  auth,
  authorize(["admin"]),
  locationValidation,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "Validation failed",
          errors: errors.array(),
        });
    }

    try {
      const location = await Location.findById(req.params.id);
      if (!location) {
        return res
          .status(404)
          .json({ status: "error", message: "Location not found" });
      }

      if (req.body.name && req.body.name !== location.name) {
        const duplicate = await Location.findOne({ name: req.body.name });
        if (duplicate) {
          return res
            .status(409)
            .json({
              status: "error",
              message: "Location with this name already exists",
            });
        }
      }

      const updated = await Location.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      ).populate("createdBy", "firstName lastName email");

      res.json({
        status: "success",
        message: "Location updated successfully",
        data: { location: updated },
      });
    } catch (error) {
      console.error("Update location error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  }
);

// @route   DELETE /api/locations/:id
// @desc    Delete location
// @access  Private (admin only)
router.delete("/:id", auth, authorize(["admin"]), async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res
        .status(404)
        .json({ status: "error", message: "Location not found" });
    }

    const User = (await import("../models/User.js")).default;
    const Class = (await import("../models/Class.js")).default;

    const [usersCount, classesCount] = await Promise.all([
      User.countDocuments({ locationId: req.params.id }),
      Class.countDocuments({ locationId: req.params.id }),
    ]);

    if (usersCount > 0 || classesCount > 0) {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete location with associated users or classes",
      });
    }

    await Location.findByIdAndDelete(req.params.id);
    res.json({ status: "success", message: "Location deleted successfully" });
  } catch (error) {
    console.error("Delete location error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// @route   GET /api/locations/stats/overview
// @desc    Get location statistics
// @access  Private (admin only)
// @route   GET /api/locations/stats/overview
// @desc    Get location statistics with monthly trends
// @access  Private (admin only)
router.get("/stats/overview", auth, authorize(["admin"]), async (req, res) => {
  try {
    // ==== Date Ranges ====
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // ==== Helper for trend calculation ====
    const calcTrend = (current, previous) =>
      previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

    // ==== Current month stats ====
    const [active, inactive, maintenance, capacityData] = await Promise.all([
      Location.countDocuments({ status: "active" }),
      Location.countDocuments({ status: "inactive" }),
      Location.countDocuments({ status: "maintenance" }),
      Location.aggregate([
        { $match: { status: "active" } },
        {
          $group: {
            _id: null,
            totalCapacity: { $sum: "$capacity" },
            totalEnrollment: { $sum: "$currentEnrollment" },
          },
        },
      ]),
    ]);

    const { totalCapacity = 0, totalEnrollment = 0 } = capacityData[0] || {};
    const totalLocations = active + inactive + maintenance;

    // ==== Last month stats ====
    const [activeLast, inactiveLast, maintenanceLast, capacityLastData] =
      await Promise.all([
        Location.countDocuments({
          status: "active",
          createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth },
        }),
        Location.countDocuments({
          status: "inactive",
          createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth },
        }),
        Location.countDocuments({
          status: "maintenance",
          createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth },
        }),
        Location.aggregate([
          {
            $match: {
              status: "active",
              createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth },
            },
          },
          {
            $group: {
              _id: null,
              totalCapacity: { $sum: "$capacity" },
              totalEnrollment: { $sum: "$currentEnrollment" },
            },
          },
        ]),
      ]);

    const { totalCapacity: lastCapacity = 0, totalEnrollment: lastEnrollment = 0 } =
      capacityLastData[0] || {};
    const totalLocationsLast = activeLast + inactiveLast + maintenanceLast;

    // ==== Trends ====
    const trends = {
      activeLocations: {
        value: Number(calcTrend(active, activeLast).toFixed(2)),
        isPositive: active >= activeLast,
      },
      inactiveLocations: {
        value: Number(calcTrend(inactive, inactiveLast).toFixed(2)),
        isPositive: inactive >= inactiveLast,
      },
      maintenanceLocations: {
        value: Number(calcTrend(maintenance, maintenanceLast).toFixed(2)),
        isPositive: maintenance >= maintenanceLast,
      },
      totalLocations: {
        value: Number(calcTrend(totalLocations, totalLocationsLast).toFixed(2)),
        isPositive: totalLocations >= totalLocationsLast,
      },
      totalCapacity: {
        value: Number(calcTrend(totalCapacity, lastCapacity).toFixed(2)),
        isPositive: totalCapacity >= lastCapacity,
      },
      totalEnrollment: {
        value: Number(calcTrend(totalEnrollment, lastEnrollment).toFixed(2)),
        isPositive: totalEnrollment >= lastEnrollment,
      },
      occupancyRate: {
        value: Number(
          calcTrend(
            totalCapacity > 0 ? (totalEnrollment / totalCapacity) * 100 : 0,
            lastCapacity > 0 ? (lastEnrollment / lastCapacity) * 100 : 0
          ).toFixed(2)
        ),
        isPositive: totalEnrollment >= lastEnrollment,
      },
    };

    // ==== Final Response ====
    res.json({
      status: "success",
      data: {
        stats: {
          activeLocations: active,
          inactiveLocations: inactive,
          maintenanceLocations: maintenance,
          totalLocations,
          totalCapacity,
          totalEnrollment,
          occupancyRate:
            totalCapacity > 0
              ? Math.round((totalEnrollment / totalCapacity) * 100)
              : 0,
        },
        trends,
      },
    });
  } catch (error) {
    console.error("Stats overview error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});


export default router;
