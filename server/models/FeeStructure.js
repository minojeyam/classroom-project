import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Fee name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Fee amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "LKR",
    },
    frequency: {
      type: String,
      enum: ["monthly", "semester", "annual", "one-time"],
      default: "monthly",
    },
    category: {
      type: String,
      enum: [
        "tuition",
        "lab",
        "library",
        "sports",
        "transport",
        "exam",
        "other",
      ],
      default: "tuition",
    },
    applicableClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("FeeStructure", feeStructureSchema);
