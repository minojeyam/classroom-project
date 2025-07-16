import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  type: {
    type: String,
    enum: ["general", "urgent", "event", "academic", "administrative"],
    default: "general",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  targetAudience: {
    type: String,
    enum: ["all", "students", "teachers", "parents", "staff"],
    default: "all",
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
  },
  locationName: String,
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
  },
  className: String,
  isGlobal: {
    type: Boolean,
    default: true,
  },
  requiresAcknowledgment: {
    type: Boolean,
    default: false,
  },
  recipients: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      acknowledged: {
        type: Boolean,
        default: false,
      },
      acknowledgedAt: Date,
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdByName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: Date,
  status: {
    type: String,
    enum: ["draft", "published"],
    default: "published",
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  acknowledgmentCount: {
    type: Number,
    default: 0,
  },
  totalTargetUsers: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("Notice", noticeSchema);
