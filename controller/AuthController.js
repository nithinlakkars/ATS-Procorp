import { config } from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../model/user.js";

config();

const SECRET = process.env.JWT_SECRET || "fallback_secret";

export const loginUser = async (req, res) => {
  console.log("🚀 BODY RECEIVED:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const tokenPayload = {
      email: user.email,
      role: user.role,
      id: user._id,
    };
    const token = jwt.sign(tokenPayload, SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "✅ Login successful",
      email: user.email,
      role: user.role,
      token,
      status: true,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed", status: false });
  }
};

export const registerUser = async (req, res) => {
  const { username, email, password, role } = req.body;

  // ✅ Basic validation
  if (!username || !email || !password || !role) {
    return res.status(400).json({
      error: "Username, email, password, and role are required",
    });
  }

  // ✅ Role validation
  const validRoles = ["admin", "lead", "recruiter"];
  const normalizedRole = role.toLowerCase();
  if (!validRoles.includes(normalizedRole)) {
    return res.status(400).json({
      error: `Invalid role. Accepted roles: ${validRoles.join(", ")}`,
    });
  }

  try {
    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // ✅ Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ Save user
    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: normalizedRole,
    });

    await newUser.save();

    res.status(201).json({
      message: "✅ Registration successful",
      status: true,
    });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({
      error: "Registration failed",
      details: err.message,
      status: false,
    });
  }
};


// get leads and recuiters

export const getLeads = async (req, res) => {
  console.log("➡️ GET /api/users/leads");
  try {
    const leads = await User.find({ role: "lead" }, "email username");
    res.json(leads.map((user) => ({ email: user.email, name: user.username })));
  } catch (err) {
    console.error("❌ Error fetching leads:", err);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
};

export const getRecruiters = async (req, res) => {
  console.log("➡️ GET /api/users/recruiters");
  try {
    const query = { role: "recruiter" };
    if (req.query.team) query.team = req.query.team;

    const recruiters = await User.find(query, "email username");
    res.json(
      recruiters.map((user) => ({ email: user.email, name: user.username }))
    );
  } catch (err) {
    console.error("❌ Error fetching recruiters:", err);
    res.status(500).json({ error: "Failed to fetch recruiters" });
  }
};
