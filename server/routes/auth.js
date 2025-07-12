import express from "express";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import { auth, authorize } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation rules
const registerValidation = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  body("role")
    .isIn(["admin", "teacher", "student", "parent"])
    .withMessage("Invalid role specified"),
  body("phoneNumber")
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage("Please enter a valid phone number"),
  body("parentEmail")
    .if(body("role").equals("student"))
    .isEmail()
    .normalizeEmail()
    .withMessage("Parent email is required for students and must be valid"),
  body("locationId")
    .if(body("role").isIn(["student", "teacher"]))
    .notEmpty()
    .withMessage("Location is required for students and teachers"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", authLimiter, registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      role,
      phoneNumber,
      parentEmail,
      locationId,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message: "User with this email already exists",
      });
    }

    const userData = {
      firstName,
      lastName,
      email,
      password,
      role,
      phoneNumber,
      status: "pending",
    };

    if (role === "student" && parentEmail) {
      userData.parentEmail = parentEmail;
    }

    if ((role === "student" || role === "teacher") && locationId) {
      userData.locationId = locationId;
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      status: "success",
      message: "Registration successful. Please wait for admin approval.",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error during registration",
    });
  }
});

// Login and other routes remain unchanged...

export default router;
