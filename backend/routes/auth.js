const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { reverseGeocode } = require("../utils/nominatim");
const { sendMail } = require("../config/mailer");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key_change_me";

/**
 * REGISTER AUTHORITY
 * POST /api/auth/register-authority
 */
router.post("/register-authority", async (req, res) => {
  try {
    const { name, phone, email, password, department, departmentLocation } = req.body;

    if (!name || !phone || !email || !password || !department) {
      return res.status(400).json({ message: "Name, phone, email, password, and department are required." });
    }

    // Normalize inputs
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // Check if email already exists
    let user = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        { email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } }
      ]
    });
    if (user) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Check if phone already exists
    user = await User.findOne({ phone: normalizedPhone });
    if (user) {
      return res.status(400).json({ message: "Phone number already registered." });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    // Validate department
    const validDepartments = ["Roads", "Water", "Sanitation", "Electricity", "Other"];
    if (!validDepartments.includes(department)) {
      return res.status(400).json({ message: "Invalid department. Must be one of: Roads, Water, Sanitation, Electricity, Other" });
    }

    // Use Nominatim to get location details if needed
    let finalLocation = departmentLocation || {};
    const hasProvidedCoordinates =
      departmentLocation &&
      departmentLocation.latitude &&
      departmentLocation.longitude;

    if (hasProvidedCoordinates) {
      finalLocation = {
        address: departmentLocation.address || "",
        city: departmentLocation.city || "",
        latitude: departmentLocation.latitude,
        longitude: departmentLocation.longitude,
      };
    } else if (departmentLocation && departmentLocation.address && departmentLocation.city) {
      try {
        // Try to get coordinates from address using Nominatim forward geocoding
        const axios = require("axios");
        const searchQuery = `${departmentLocation.address}, ${departmentLocation.city}`;
        const nominatimResponse = await axios.get(
          "https://nominatim.openstreetmap.org/search",
          {
            params: {
              q: searchQuery,
              format: "json",
              addressdetails: 1,
              limit: 1,
            },
            headers: {
              "User-Agent": "civic-issue-app/1.0",
            },
          }
        );

        if (nominatimResponse.data && nominatimResponse.data.length > 0) {
          const result = nominatimResponse.data[0];
          finalLocation = {
            address: departmentLocation.address,
            city:
              departmentLocation.city ||
              result.address?.city ||
              result.address?.town ||
              "",
            latitude: result.lat,
            longitude: result.lon,
          };
        }
      } catch (error) {
        console.warn(
          "Nominatim geocoding failed, using provided location:",
          error.message
        );
        // Continue with provided location if Nominatim fails
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      name: name.trim(),
      phone: normalizedPhone,
      email: normalizedEmail,
      password: hashedPassword,
      role: "authority",
      department: department,
      departmentLocation: finalLocation,
    });

    await user.save();

    try {
      await sendMail({
        to: user.email,
        subject: "Authority Access Granted - Civic Platform",
        html: `
          <p>Hello ${user.name || "there"},</p>
          <p>Your authority account for the Civic Issue Management platform has been created successfully.</p>
          <p><strong>Department:</strong> ${user.department || "N/A"}</p>
          <p>You can now log in to the authority dashboard to review, assign, and update citizen-reported issues.</p>
          <p>Best regards,<br/>Civic Connect Team</p>
        `,
      });
    } catch (mailErr) {
      console.warn("Authority welcome email failed:", mailErr.message);
    }

    return res.status(201).json({ 
      message: "Authority registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
      }
    });
  } catch (err) {
    console.error("Authority Register Error:", err);
    
    // Handle duplicate key errors
    if (err.code === 11000 || err.code === 11001) {
      const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
      const fieldName = field === 'phone' ? 'Phone number' : 
                       field === 'email' ? 'Email' : 
                       field.charAt(0).toUpperCase() + field.slice(1);
      return res.status(400).json({ 
        message: `${fieldName} is already registered. Please use a different ${field === 'phone' ? 'phone number' : field}.` 
      });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

/**
 * REGISTER USER (Citizen)
 * POST /api/auth/register
 */
router.post("/register", async (req, res) => {
  try {
    const { name, age, phone, email, password } = req.body;

    if (!name || !age || !phone || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate age is a number
    const numericAge = Number(age);
    if (Number.isNaN(numericAge) || numericAge <= 0 || numericAge > 150) {
      return res.status(400).json({ message: "Please enter a valid age." });
    }

    // Normalize inputs
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // Check if email already exists
    let user = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        { email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } }
      ]
    });
    if (user) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Check if phone already exists
    user = await User.findOne({ phone: normalizedPhone });
    if (user) {
      return res.status(400).json({ message: "Phone number already registered." });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      name: name.trim(),
      age: numericAge,
      phone: normalizedPhone,
      email: normalizedEmail,
      password: hashedPassword,
    });

    await user.save();

    try {
      await sendMail({
        to: user.email,
        subject: "Welcome to Civic Connect",
        html: `
          <p>Hi ${user.name || "there"},</p>
          <p>Thank you for registering with the Civic Issue Management platform. You can now report issues, upload supporting media, and track resolution progress directly from the mobile app.</p>
          <p>We are here to help you keep your community running smoothly.</p>
          <p>Best regards,<br/>Civic Connect Team</p>
        `,
      });
    } catch (mailErr) {
      console.warn("Citizen welcome email failed:", mailErr.message);
    }

    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register Error:", err);
    
    // Handle duplicate key errors (MongoDB unique constraint violations)
    if (err.code === 11000 || err.code === 11001) {
      const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
      const fieldName = field === 'phone' ? 'Phone number' : 
                       field === 'email' ? 'Email' : 
                       field.charAt(0).toUpperCase() + field.slice(1);
      return res.status(400).json({ 
        message: `${fieldName} is already registered. Please use a different ${field === 'phone' ? 'phone number' : field}.` 
      });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    // Don't expose internal error details to client
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

/**
 * LOGIN USER
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Missing fields." });

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "No account found." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials." });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        age: user.age,
        phone: user.phone,
        email: user.email,
        role: user.role || "citizen",
        department: user.department,
        departmentLocation: user.departmentLocation,
        expoPushToken: user.expoPushToken,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET CURRENT USER
 * GET /api/auth/me
 */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({
      id: user._id,
      name: user.name,
      age: user.age,
      phone: user.phone,
      email: user.email,
      role: user.role || "citizen",
      department: user.department,
      departmentLocation: user.departmentLocation,
      expoPushToken: user.expoPushToken,
    });
  } catch (err) {
    console.error("Get Me Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * SAVE / UPDATE EXPO PUSH TOKEN
 * POST /api/auth/push-token
 */
router.post("/push-token", auth, async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    if (!expoPushToken) {
      return res.status(400).json({ message: "expoPushToken is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { expoPushToken },
      { new: true }
    ).select("id name email expoPushToken");

    return res.json({
      message: "Push token updated",
      user,
    });
  } catch (err) {
    console.error("Push token save error:", err);
    res.status(500).json({ message: "Failed to save push token" });
  }
});

module.exports = router;
