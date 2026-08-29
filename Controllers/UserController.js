const User = require("../Models/Users");
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
// Admin/manager only
exports.updateUser = async (req, res) => {
  try {
    const {
      fullname,
      email,
      gender,
      phone,
      role,
      HasAdminAccess,
      password, // included only so we can reject it
    } = req.body;

    // Check if the logged-in user is authorized
    if (
      !req.user ||
      !["Admin", "manager"].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Admin or manager can update users.",
      });
    }

    // Prevent Admin/manager from changing another user's password
    if (password !== undefined) {
      return res.status(403).json({
        success: false,
        message: "You cannot change another user's password.",
      });
    }

    // Find the user being updated
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // =========================
    // UPDATE EMAIL
    // =========================
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

    // =========================
    // UPDATE PHONE
    // =========================
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

    // =========================
    // UPDATE FULLNAME
    // =========================
    if (fullname) {
      user.fullname = fullname.trim();
    }

    // =========================
    // UPDATE GENDER
    // =========================
    if (gender) {
      user.gender = gender.trim();
    }

    // =========================
    // UPDATE ROLE
    // =========================
    if (role) {
      user.role = role;
    }

    // =========================
    // UPDATE ADMIN ACCESS
    // =========================
    if (typeof HasAdminAccess === "boolean") {
      user.HasAdminAccess = HasAdminAccess;
    }

    // Save changes
    const updatedUser = await user.save();

    // Remove password from response
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: userResponse,
    });

  } catch (error) {
    console.error("Update User Error:", error);

    // Invalid MongoDB ID
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    // Duplicate email/phone
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

// Update Current Logged-in User's Email and Password
exports.updateMyAccount = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    // Get the logged-in user's ID from the JWT
    const userId = req.user.id;

    // Find the logged-in user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Make sure at least one field is provided
    if (!email && !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email or new password.",
      });
    }

    // =====================================
    // UPDATE EMAIL
    // =====================================
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();

      // Check whether another user already has this email
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already exists.",
        });
      }

      user.email = normalizedEmail;
    }

    // =====================================
    // UPDATE PASSWORD
    // =====================================
    if (newPassword) {
      // Current password must be provided
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required.",
        });
      }

      // Verify current password
      const passwordMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect.",
        });
      }

      // Validate new password
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long.",
        });
      }

      // Hash new password
      user.password = await bcrypt.hash(
        newPassword,
        SALT_ROUNDS
      );
    }

    // Save changes
    const updatedUser = await user.save();

    // Remove password from response
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "Your account has been updated successfully.",
      user: userResponse,
    });

  } catch (error) {
    console.error("Update My Account Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};