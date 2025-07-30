import express from "express";
import { body, validationResult } from "express-validator";
import Notice from "../models/Notice.js";
import { auth, authorize } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// GET all notices
router.get("/", auth, async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json({ status: "success", data: { notices } });
  } catch (error) {
    console.error("Fetch notices error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch notices" });
  }
});


// GET upcoming notices
router.get("/upcoming", auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today

    const upcomingNotices = await Notice.find({
      date: { $gte: today }   // only future or today's events
    }).sort({ date: 1 });     // sort earliest first

    res.json({
      status: "success",
      data: { notices: upcomingNotices },
    });
  } catch (error) {
    console.error("Fetch upcoming notices error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch upcoming notices" });
  }
});


// POST create new notice
router.post(
  "/",
  auth,
  authorize(["admin", "teacher"]),
  [
    body("title").notEmpty().isLength({ max: 150 }),
    body("content").notEmpty(),
    body("type").isIn([
      "general",
      "urgent",
      "event",
      "academic",
      "administrative",
    ]),
    body("priority").isIn(["low", "medium", "high"]),
    body("targetAudience").isIn([
      "all",
      "students",
      "teachers",
      "parents",
      "staff",
    ]),
    body("status").isIn(["draft", "published"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const {
        title,
        content,
        type,
        priority,
        targetAudience,
        locationId,
        locationName,
        classId,
        className,
        isGlobal,
        requiresAcknowledgment,
        expiresAt,
        status,
      } = req.body;

      const filter =
        targetAudience === "all"
          ? { status: "active" }
          : { role: targetAudience, status: "active" };

      const users = await User.find(filter).select("_id");

      const newNotice = new Notice({
        title,
        content,
        type,
        priority,
        targetAudience,
        locationId,
        locationName,
        classId,
        className,
        isGlobal,
        requiresAcknowledgment,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        status,
        createdBy: req.user.id,
        createdByName: `${req.user.firstName} ${req.user.lastName}`,
        totalTargetUsers: users.length,
        recipients: requiresAcknowledgment
          ? users.map((u) => ({ userId: u._id, acknowledged: false }))
          : [],
      });

      await newNotice.save();
      res.status(201).json({
        status: "success",
        message: "Notice created successfully",
        data: { notice: newNotice },
      });
    } catch (error) {
      console.error("Create notice error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to create notice",
        details: error.message,
      });
    }
  }
);

// PUT update notice
router.put(
  "/:id",
  auth,
  authorize(["admin", "teacher"]),
  [
    body("title").optional().notEmpty().isLength({ max: 150 }),
    body("content").optional().notEmpty(),
    body("type")
      .optional()
      .isIn(["general", "urgent", "event", "academic", "administrative"]),
    body("priority").optional().isIn(["low", "medium", "high"]),
    body("targetAudience")
      .optional()
      .isIn(["all", "students", "teachers", "parents", "staff"]),
    body("status").optional().isIn(["draft", "published"]),
    body("expiresAt").optional().isISO8601().toDate(),
    body("isGlobal").optional().isBoolean(),
    body("requiresAcknowledgment").optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    if (!req.params.id) {
      return res.status(400).json({
        status: "error",
        message: "Notice ID is required",
      });
    }

    try {
      const notice = await Notice.findById(req.params.id);
      if (!notice) {
        return res
          .status(404)
          .json({ status: "error", message: "Notice not found" });
      }

      const allowedUpdates = [
        "title",
        "content",
        "type",
        "priority",
        "targetAudience",
        "expiresAt",
        "isGlobal",
        "requiresAcknowledgment",
      ];
      const updates = Object.keys(req.body).filter((key) =>
        allowedUpdates.includes(key)
      );

      if (updates.length === 0) {
        return res
          .status(400)
          .json({ status: "error", message: "No updatable fields provided" });
      }

      if (
        notice.status === "published" &&
        req.body.status &&
        req.body.status !== "published"
      ) {
        return res.status(400).json({
          status: "error",
          message: "Cannot change status of a published notice",
        });
      }

      const updatedNotice = await Notice.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      res.json({
        status: "success",
        message: "Notice updated",
        data: { notice: updatedNotice },
      });
    } catch (error) {
      console.error("Update notice error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to update notice",
        details: error.message,
      });
    }
  }
);

// DELETE a notice
router.delete(
  "/:id",
  auth,
  authorize(["admin", "teacher"]),
  async (req, res) => {
    try {
      const notice = await Notice.findByIdAndDelete(req.params.id);
      if (!notice) {
        return res
          .status(404)
          .json({ status: "error", message: "Notice not found" });
      }
      res.json({ status: "success", message: "Notice deleted" });
    } catch (error) {
      console.error("Delete notice error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Failed to delete notice" });
    }
  }
);

// POST /api/notices/:id/acknowledge
router.post("/:id/acknowledge", auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({
        status: "error",
        message: "Notice not found",
      });
    }

    if (!notice.requiresAcknowledgment) {
      return res.status(400).json({
        status: "error",
        message: "This notice does not require acknowledgment",
      });
    }

    const recipient = notice.recipients.find(
      (r) => r.userId.toString() === req.user.id
    );

    if (!recipient) {
      return res.status(403).json({
        status: "error",
        message: "You are not a recipient of this notice",
      });
    }

    if (recipient.acknowledged) {
      return res.status(400).json({
        status: "error",
        message: "You have already acknowledged this notice",
      });
    }

    recipient.acknowledged = true;
    recipient.acknowledgedAt = new Date();
    notice.acknowledgmentCount += 1;
    await notice.save();

    res.json({
      status: "success",
      message: "Notice acknowledged successfully",
    });
  } catch (error) {
    console.error("Acknowledge notice error:", error);
    res.status(400).json({
      status: "error",
      message: "Failed to acknowledge notice",
    });
  }
});

export default router;
