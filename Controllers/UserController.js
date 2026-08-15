const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 12;

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.fullname,
      email: user.email,
      role: user.role,
      HasAdminAccess: user.HasAdminAccess,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    }
  );
};

// Register User
exports.createuser = async (req, res) => {
  try {
    const {
      fullname,
      email,
      password,
      gender,
      phone,
      role,
      HasAdminAccess,
    } = req.body;

    // Validate required fields
    if (!fullname || !email || !password || !gender || !phone) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // Check if email or phone already exists
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    });

    if (existingUser) {
      const field =
        existingUser.email === normalizedEmail
          ? "Email"
          : "Phone number";

      return res.status(409).json({
        success: false,
        message: `${field} already exists.`,
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      SALT_ROUNDS
    );

    // Create user
    const user = await User.create({
      fullname: fullname.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      gender: gender.trim(),
      phone: normalizedPhone,
      role: role || "user", // Default role is set to 'user'
      HasAdminAccess: HasAdminAccess || false, // Default is false
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token: generateToken(user),
      user: userResponse,
    });

  } catch (error) {
    console.error("Register Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or phone already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


// Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: generateToken(user),
      role: user.role,
    });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });

  } catch (error) {
    console.error("Get Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


// Get User By ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("Get User Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


// Update User
exports.updateUser = async (req, res) => {
  try {
    const {
      fullname,
      email,
      password,
      gender,
      phone,
      role,
      HasAdminAccess,
    } = req.body;

    const user = await User.findById(req.params.id);

    // console.log("REQ.USER:", req.user);
    // console.log("REQUESTED ROLE:", role);
    // console.log("CURRENT DATABASE ROLE:", user.role);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Update email
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already exists.",
        });
      }

      user.email = normalizedEmail;
    }

    // Update phone
    if (phone) {
      const normalizedPhone = phone.trim();

      const existingPhone = await User.findOne({
        phone: normalizedPhone,
        _id: { $ne: user._id },
      });

      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: "Phone number already exists.",
        });
      }

      user.phone = normalizedPhone;
    }

    if (fullname) {
      user.fullname = fullname.trim();
    }

    if (gender) {
      user.gender = gender.trim();
    }

    // Update fields
    if (req.user && req.user.role === "Admin") {
      if (role) {
        user.role = role;
      }

      if (typeof HasAdminAccess === "boolean") {
        user.HasAdminAccess = HasAdminAccess;
      }
    }

    // Update password
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long.",
        });
      }

      user.password = await bcrypt.hash(
        password,
        SALT_ROUNDS
      );
    }

    const updatedUser = await user.save();

    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: userResponse,
    });

  } catch (error) {
    console.error("Update Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or phone already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });

  } catch (error) {
    console.error("Delete Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


// Get Current Logged-in User
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("GetMe Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};