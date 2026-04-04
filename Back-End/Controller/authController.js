const UserLogin = require("../Models/LogInSchema");
const Admin = require("../Models/AdminSchema");
const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const axios = require("axios");
const CustomError = require("../Utils/CustomError");
const jwt = require("jsonwebtoken");
const util = require("util");
const fs = require("fs");
const FormData = require("form-data");
const crypto = require("crypto");
const sendEmail = require("./../Utils/email");

const signToken = (id, role, linkId) => {
  return jwt.sign({ id, role, linkId }, process.env.SECRET_STR, {
    expiresIn: "12h",
  });
};

exports.signup = AsyncErrorHandler(async (req, res) => {
  try {
    const {
      id_number,
      first_name,
      last_name,
      middle_name,
      email,
      suffix,
      role,
      department,
      password,
      laboratoryId,
      confirmPassword,
      contact_number,
      specialty,
    } = req.body;

    console.log("Signup Request Body:", req.body);

    const allowedRoles = ["admin", "in-charge"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Only admin and in-charge are allowed.",
      });
    }

    const requiredFieldsByRole = {
      admin: ["first_name", "last_name", "email", "password"],
      "in-charge": ["first_name", "last_name", "email", "password"],
    };

    const requiredFields = requiredFieldsByRole[role];

    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    let avatar = { url: "", public_id: "" };

    // 👇 Build user object first
    const userData = {
      avatar,
      first_name,
      last_name,
      middle_name,
      suffix,
      username: email,
      password,
      confirmPassword,
      role,
      id_number,
      department: department || null,
      contact_number: contact_number
        ? Number(contact_number.replace(/\D/g, ""))
        : 0,
      specialty: specialty || "",
    };

    // 👇 Only add laboratoryId if valid
    if (laboratoryId && laboratoryId !== "") {
      userData.laboratoryId = laboratoryId;
    }

    const newUser = new UserLogin(userData);

    await newUser.save();

    const io = req.app.get("io");

    if (io) {
      io.to("role:admin").emit("user:created", newUser);

      console.log("📢 Socket broadcast sent to Admin room");
    }

    res.status(201).json({
      status: true,
      user: newUser,
    });
  } catch (error) {
    console.error("❌ Signup failed:", error);

    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

exports.login = AsyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await UserLogin.findOne({ username: email }).select("+password");

  if (!user || !(await user.comparePasswordInDb(password, user.password))) {
    return next(new CustomError("Incorrect email or password", 400));
  }

  let linkId = user.linkedId || user._id;

  if (req.session.userId && req.session.userId !== user._id) {
    req.session.destroy((err) => {
      if (err) console.log("Failed to destroy old session:", err);
    });
  }

  const token = signToken(user._id, user.role, linkId);

  req.session.userId = user._id;
  req.session.isLoggedIn = true;
  req.session.user = {
    email: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    linkId,
    theme: user.theme,
  };

  return res.status(200).json({
    status: "Success",
    userId: user._id,
    linkId,
    role: user.role,
    token,
    email: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    theme: user.theme,
  });
});

exports.logout = AsyncErrorHandler((req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Logout failed.");
    res.clearCookie("connect.sid");
    res.send("Logged out successfully!");
  });
});

exports.verifyOtp = AsyncErrorHandler(async (req, res) => {
  const { otp, userId } = req.body;

  if (!otp || !userId) {
    return res
      .status(400)
      .json({ message: "Both OTP and userId are required." });
  }

  const user = await UserLogin.findById(userId);

  if (!user) return res.status(400).json({ message: "User not found" });
  if (user.isVerified)
    return res.status(400).json({ message: "User is already verified" });

  if (user.otp !== otp || user.otpExpiresAt < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;

  await user.save();

  return res.status(200).json({
    message: "Email Verified Successfully",
    data: {
      _id: user._id,
      username: user.username,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

/**
 * @description Auth Guard Middleware
 */
exports.protect = AsyncErrorHandler(async (req, res, next) => {
  if (req.session && req.session.isLoggedIn && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return next(new CustomError("You are not logged in!", 401));
  }

  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.SECRET_STR,
  );
  const user = await UserLogin.findById(decoded.id);

  if (!user) return next(new CustomError("User no longer exists", 401));

  const isPasswordChanged = await user.isPasswordChanged(decoded.iat);
  if (isPasswordChanged) {
    return next(new CustomError("Password changed. Login again.", 401));
  }

  req.user = {
    _id: user._id,
    email: user.username,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name,
    linkId: user.linkedId || user._id,
  };

  next();
});

/**
 * @description RBAC Middleware
 */
exports.restrict = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Allowed roles: ${roles.join(", ")}`,
      });
    }
    next();
  };
};

/**
 * @route POST /api/v1/auth/forgotPassword
 */
exports.forgotPassword = AsyncErrorHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await UserLogin.findOne({ username: email });

  if (!user) {
    return next(
      new CustomError("We could not find the user with given email", 404),
    );
  }

  const resetToken = user.createResetTokenPassword();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const message = `We have received a password reset request. Link (expires in 10m):\n\n${resetUrl}`;

  try {
    await sendEmail({
      email: user.username,
      subject: "Password change request received",
      text: message,
    });

    res.status(200).json({
      status: "Success",
      message: "Password reset link sent to the user email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new CustomError("Error sending reset email. Try again later.", 500),
    );
  }
});

exports.resetPassword = AsyncErrorHandler(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await UserLogin.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  if (!user) return next(new CustomError("Invalid or expired token.", 400));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  user.passwordChangedAt = Date.now();

  await user.save();
  return res.status(200).json({ status: "Success" });
});

exports.getAllUsers = AsyncErrorHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  let search = req.query.search || "";

  search = decodeURIComponent(search)
    .replace(/\+/g, " ")
    .replace(/[,]/g, "")
    .trim();

  const role = req.query.role || "";
  const skip = (page - 1) * limit;

  let searchFilter = {};

  if (search) {
    const words = search.split(/\s+/);

    searchFilter = {
      $and: words.map((word) => ({
        $or: [
          { first_name: { $regex: word, $options: "i" } },
          { middle_name: { $regex: word, $options: "i" } },
          { last_name: { $regex: word, $options: "i" } },
          { suffix: { $regex: word, $options: "i" } },
          { username: { $regex: word, $options: "i" } },
          { email: { $regex: word, $options: "i" } },
        ],
      })),
    };
  }

  const roleFilter = role ? { role } : {};
  const matchStage = { ...searchFilter, ...roleFilter };

  const users = await UserLogin.aggregate([
    { $match: matchStage },

    {
      $lookup: {
        from: "laboratories", // collection name
        localField: "laboratoryId",
        foreignField: "_id",
        as: "laboratory",
      },
    },

    {
      $unwind: {
        path: "$laboratory",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        password: 0,
      },
    },

    { $sort: { createdAt: -1 } },

    { $skip: skip },
    { $limit: limit },
  ]);

  const totalUser = await UserLogin.countDocuments(matchStage);
  const totalPages = Math.ceil(totalUser / limit);

  res.status(200).json({
    status: true,
    totalUser,
    totalPages,
    currentPage: page,
    limit,
    results: users.length,
    data: users,
  });
});

exports.updatePassword = AsyncErrorHandler(async (req, res, next) => {
  const user = await UserLogin.findById(req.user._id).select("+password");

  if (!user) return next(new CustomError("User not found.", 404));

  const isMatch = await user.comparePasswordInDb(
    req.body.currentPassword,
    user.password,
  );
  if (!isMatch)
    return next(new CustomError("The current password provided is wrong", 401));

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  const token = signToken(user._id, user.role, user.linkedId);
  res.status(200).json({ status: "success", token, data: { user } });
});
