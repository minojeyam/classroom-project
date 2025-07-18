import express from "express";
import { auth, authorize } from "../middleware/auth.js";
import Material from "../models/Material.js";
import { body, validationResult } from "express-validator";
import { uploadFile } from "../utils/fileUpload.js";

const router = express.Router();

// @route   GET /api/materials
// @desc    Get materials (teachers see their own classes)
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "teacher") {
      filter.createdBy = req.user.id;
    } else if (req.user.role === "student") {
      filter.classId = { $in: req.user.classIds };
      filter.isVisible = true;
    }

    const materials = await Material.find(filter).populate("classId", "title");
    res.json({ status: "success", data: { materials } });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

// @route   POST /api/materials
// @desc    Add new material
// @access  Private (teacher or admin)
router.post(
  "/",
  auth,
  authorize(["teacher", "admin"]),
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("type")
      .isIn(["document", "video", "image", "link", "audio", "other"])
      .withMessage("Invalid material type"),
    body("classId").notEmpty().withMessage("Class ID is required"),
  ],
  async (req, res) => {
    // Validate fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "error", errors: errors.array() });
    }

    try {
      const { title, description, type, classId, isVisible, url } = req.body;

      let fileInfo = {};

      if (type !== "link" && req.files?.file) {
        // Handle file upload
        fileInfo = await uploadFile(req.files.file, type);
      }

      const material = new Material({
        title,
        description,
        type,
        classId,
        url: type === "link" ? url : fileInfo.url,
        fileName: fileInfo.fileName,
        fileSize: fileInfo.fileSize,
        isVisible: isVisible === "false" ? false : true,
        createdBy: req.user.id,
      });
      console.log("✅ Authenticated user:", req.user);

      await material.save();
      res.status(201).json({ status: "success", data: { material } });
    } catch (error) {
      console.error("Material upload error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Failed to save material" });
    }
  }
);

// @route   PUT /api/materials/:id
// @desc    Update material
// @access  Private (owner or admin)
router.put("/:id", auth, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material)
      return res.status(404).json({ status: "error", message: "Not found" });

    const isOwner = material.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ status: "error", message: "Forbidden" });

    Object.assign(material, req.body);
    await material.save();
    res.json({ status: "success", data: { material } });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Update failed" });
  }
});

// @route   DELETE /api/materials/:id
// @desc    Delete material
// @access  Private (owner or admin)
router.delete("/:id", auth, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material)
      return res.status(404).json({ status: "error", message: "Not found" });

    const isOwner = material.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ status: "error", message: "Forbidden" });

    await Material.findByIdAndDelete(req.params.id);
    res.json({ status: "success", message: "Material deleted" });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Deletion failed" });
  }
});

router.get("/student", auth, authorize(["student"]), async (req, res) => {
  try {
    const classIds = req.user.classIds;
    const materials = await Material.find({
      classId: { $in: classIds },
      isVisible: true,
    })
      .populate("classId", "title")
      .populate("createdBy", "firstName lastName");

    const transformed = materials.map((m) => ({
      id: m._id,
      title: m.title,
      description: m.description,
      type: m.type,
      classId: m.classId?._id,
      className: m.classId?.title,
      url: m.url,
      fileName: m.fileName,
      fileSize: m.fileSize,
      uploadDate: m.uploadDate,
      downloadCount: m.downloadCount,
      createdByName: `${m.createdBy?.firstName || ""} ${
        m.createdBy?.lastName || ""
      }`.trim(),
    }));

    res.json({ status: "success", data: transformed });
  } catch (error) {
    console.error("Student material fetch error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Unable to fetch materials" });
  }
});

export default router;
