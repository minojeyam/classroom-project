import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Class title is required"],
      trim: true,
      maxlength: [100, "Class title cannot exceed 100 characters"],
    },
    level: {
      type: String,
      required: [true, "Class level is required"],
      trim: true,
      maxlength: [50, "Class level cannot exceed 50 characters"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [50, "Subject cannot exceed 50 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: [true, "Location is required"],
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher is required"],
    },
    schedule: {
      dayOfWeek: {
        type: Number,
        required: [true, "Day of week is required"],
        min: [0, "Day of week must be between 0-6"],
        max: [6, "Day of week must be between 0-6"], // 0 = Sunday, 6 = Saturday
      },
      startTime: {
        type: String,
        required: [true, "Start time is required"],
        match: [
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          "Please enter a valid time format (HH:MM)",
        ],
      },
      endTime: {
        type: String,
        required: [true, "End time is required"],
        match: [
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          "Please enter a valid time format (HH:MM)",
        ],
      },
      duration: {
        type: Number, // Duration in minutes
        required: [true, "Duration is required"],
        min: [15, "Duration must be at least 15 minutes"],
        max: [480, "Duration cannot exceed 8 hours"],
      },
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
      max: [100, "Capacity cannot exceed 100 students"],
    },
    currentEnrollment: {
      type: Number,
      default: 0,
      min: [0, "Current enrollment cannot be negative"],
    },
    // monthlyFee: {
    //   amount: {
    //     type: Number,
    //     required: [true, "Monthly fee amount is required"],
    //     min: [0, "Monthly fee cannot be negative"],
    //   },
    fees: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        frequency: {
          type: String,
          enum: ["monthly", "semester", "annual", "one-time"],
          required: true,
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
          required: true,
        },
      },
    ],
    currency: {
      type: String,
      default: "LKR",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "completed"],
      default: "active",
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    enrolledStudents: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        enrollmentDate: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["active", "inactive", "completed", "dropped"],
          default: "active",
        },
      },
    ],
    materials: [
      {
        title: String,
        description: String,
        type: {
          type: String,
          enum: ["document", "video", "link", "image", "audio"],
        },
        url: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    exams: [
      {
        title: String,
        description: String,
        date: Date,
        totalMarks: Number,
        passingMarks: Number,
        status: {
          type: String,
          enum: ["scheduled", "ongoing", "completed", "cancelled"],
          default: "scheduled",
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for occupancy rate
classSchema.virtual("occupancyRate").get(function () {
  if (this.capacity === 0) return 0;
  return Math.round((this.currentEnrollment / this.capacity) * 100);
});

// Virtual for schedule display
classSchema.virtual("scheduleDisplay").get(function () {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return `${
    days[this.schedule.dayOfWeek]
  } ${this.schedule.startTime} - ${this.schedule.endTime}`;
});

// Index for better query performance
classSchema.index({ locationId: 1, status: 1 });
classSchema.index({ teacherId: 1 });
classSchema.index({ "schedule.dayOfWeek": 1, "schedule.startTime": 1 });
classSchema.index({ level: 1, subject: 1 });

// Pre-save middleware to validate dates and enrollment
classSchema.pre("save", function (next) {
  // Validate start date is before end date
  if (this.startDate >= this.endDate) {
    return next(new Error("Start date must be before end date"));
  }

  // Validate current enrollment doesn't exceed capacity
  if (this.currentEnrollment > this.capacity) {
    return next(new Error("Current enrollment cannot exceed capacity"));
  }

  // Validate schedule times
  const startTime = this.schedule.startTime.split(":");
  const endTime = this.schedule.endTime.split(":");
  const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
  const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);

  if (startMinutes >= endMinutes) {
    return next(new Error("Start time must be before end time"));
  }

  // Calculate and set duration
  this.schedule.duration = endMinutes - startMinutes;

  next();
});

export default mongoose.model("Class", classSchema);
