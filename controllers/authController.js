const User = require("../models/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Admin Only
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};
//users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("username email createdAt"); // Only select needed fields
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const registeredUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with pending status
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      status: "pending", // new field
      role: "user",
    });

    // Do NOT generate token yet
    return res.status(201).json({
      message: "Signup request submitted. Waiting for admin approval.",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        status: user.status,
      },
    });
  } catch (err) {
    console.log({ message: err.message });
    return res.status(500).json({ message: err.message });
  }
};

///login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Admin bypass
    if (user.role !== "admin") {
      if (user.status === "pending") {
        return res
          .status(403)
          .json({ message: "Signup request is pending admin approval" });
      }

      if (user.status === "rejected") {
        return res
          .status(403)
          .json({ message: "Your signup request was rejected by admin" });
      }

      if (user.status !== "approved") {
        return res.status(403).json({ message: "Account not approved" });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0), // expire immediately
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    return res.status(200).json({ message: "User logged out successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
    console.log({ message: err.message });
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};
module.exports = { getUsers, loginUser, registeredUser, logoutUser };
