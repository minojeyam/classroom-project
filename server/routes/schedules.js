import express from "express";
import { body, validationResult } from "express-validator";
import ScheduledClass from "../models/ScheduledClass.js";
import { auth, authorize } from "../middleware/auth.js";

const router = express.Router();

const hasTimeConflict = async ({
  classId,
  locationId,
  date,
  startTime,
  endTime,
  excludeId = null,
}) => {
  const query = {
    classId,
    locationId,
    date,
    status: "scheduled",
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const overlapping = await ScheduledClass.find(query);

  const newStart = new Date(`2000-01-01T${startTime}`);
  const newEnd = new Date(`2000-01-01T${endTime}`);

  return overlapping.some((c) => {
    const existingStart = new Date(`2000-01-01T${c.startTime}`);
    const existingEnd = new Date(`2000-01-01T${c.endTime}`);
    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );
  });
};

// GET: All scheduled classes (with optional filters)
router.get("/", auth, async (req, res) => {
  const { role, id } = req.user;
  const { teacherId, classId, date, status } = req.query;

  const query = {};
  if (teacherId) query.teacherId = teacherId;
  if (classId) query.classId = classId;
  if (date) query.date = date;
  if (status) query.status = status;
  if (role === "teacher") query.teacherId = id;

  const classes = await ScheduledClass.find(query).populate(
    "classId teacherId locationId"
  );
  res.json({ status: "success", data: { classes } });
});

// GET: Single scheduled class by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const scheduled = await ScheduledClass.findById(req.params.id).populate(
      "classId teacherId locationId"
    );

    if (!scheduled) {
      return res.status(404).json({
        status: "error",
        message: "Scheduled class not found",
      });
    }

    res.json({
      status: "success",
      data: { class: scheduled },
    });
  } catch (err) {
    console.error("Get scheduled class error:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// POST: Schedule a new class
// router.post(
//   "/",
//   auth,
//   authorize(["admin", "teacher"]),
//   [
//     body("classId").notEmpty(),
//     body("teacherId").notEmpty(),
//     body("locationId").notEmpty(),
//     body("date").notEmpty(),
//     body("startTime").notEmpty(),
//     body("endTime").notEmpty(),
//     body("duration").isNumeric(),
//   ],
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty())
//       return res.status(400).json({ status: "error", errors: errors.array() });

//     const newClass = new ScheduledClass({
//       ...req.body,
//       createdBy: req.user.id,
//     });

//     await newClass.save();
//     res.status(201).json({
//       status: "success",
//       message: "Class scheduled",
//       data: { class: newClass },
//     });
//   }
// );
router.post(
  "/",
  auth,
  authorize(["admin", "teacher"]),
  [
    body("classId").notEmpty(),
    body("teacherId").notEmpty(),
    body("locationId").notEmpty(),
    body("date").notEmpty(),
    body("startTime").notEmpty(),
    body("endTime").notEmpty(),
    body("duration").isNumeric(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ status: "error", errors: errors.array() });

    // 🛑 Check for time conflict (same class, same location, same date, overlapping time)
    const conflict = await hasTimeConflict(req.body);
    if (conflict) {
      return res.status(409).json({
        status: "error",
        message:
          "Time conflict: This class is already scheduled at this location during the selected time.",
      });
    }

    const newClass = new ScheduledClass({
      ...req.body,
      createdBy: req.user.id,
    });

    await newClass.save();

    res.status(201).json({
      status: "success",
      message: "Class scheduled",
      data: { class: newClass },
    });
  }
);

// PUT: Update scheduled class
// router.put("/:id", auth, authorize(["admin"]), async (req, res) => {
//   const updated = await ScheduledClass.findByIdAndUpdate(
//     req.params.id,
//     req.body,
//     { new: true }
//   );
//   res.json({ status: "success", data: { class: updated } });
// });
router.put("/:id", auth, authorize(["admin"]), async (req, res) => {
  // 🛑 Check for conflict excluding current schedule
  const conflict = await hasTimeConflict({
    ...req.body,
    excludeId: req.params.id,
  });

  if (conflict) {
    return res.status(409).json({
      status: "error",
      message:
        "Time conflict: This class is already scheduled at this location during the selected time.",
    });
  }

  const updated = await ScheduledClass.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({
      status: "error",
      message: "Scheduled class not found",
    });
  }

  res.json({
    status: "success",
    message: "Scheduled class updated successfully",
    data: { class: updated },
  });
});

// DELETE: Remove a scheduled class
router.delete("/:id", auth, authorize(["admin"]), async (req, res) => {
  await ScheduledClass.findByIdAndDelete(req.params.id);
  res.json({ status: "success", message: "Scheduled class deleted" });
});

export default router;
