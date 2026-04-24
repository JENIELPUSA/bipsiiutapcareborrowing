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
const mongoose = require("mongoose");
const cloudinary = require("../Utils/cloudinary"); // Gamit ang iyong utility path
const streamifier = require("streamifier");
const Borrower = require("../Models/BorrowerSchema");
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
      contactNumber,
      specialty,
      address,
      borrowerType,
      rfidId,
    } = req.body;

    console.log("Signup Request Body:", req.body);

    // ✅ ROLES
    const allowedRoles = [
      "admin",
      "in-charge",
      "employee",
      "student",
      "borrower",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    // ✅ REQUIRED FIELDS
    const requiredFieldsByRole = {
      admin: ["first_name", "last_name", "email", "password"],
      "in-charge": ["first_name", "last_name", "email", "password"],
      employee: ["first_name", "last_name", "password"],
      student: ["first_name", "last_name", "password"],
      borrower: [
        "first_name",
        "last_name",
        "password",
        "rfidId",
        "contactNumber",
      ],
    };

    const requiredFields = requiredFieldsByRole[role] || [];
    const missingFields = requiredFields.filter((f) => !req.body[f]);

    if (missingFields.length) {
      return res.status(400).json({
        message: `Missing fields: ${missingFields.join(", ")}`,
      });
    }

    // ❗ PASSWORD CHECK SAFE
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    // =========================
    // 1. CREATE USER FIRST
    // =========================
    const newUser = new UserLogin({
      first_name,
      last_name,
      middle_name,
      suffix,
      username: email || rfidId,
      password,
      confirmPassword,
      passwordisplay: password,
      role,

      id_number,
      contact_number: contactNumber,
      specialty: specialty || "",
      department: department || null,
      laboratoryId: laboratoryId || null,
    });

    await newUser.save();

    let newBorrower = null;

    // =========================
    // 2. CREATE BORROWER
    // =========================
    if (role === "borrower") {
      const existingBorrower = await Borrower.findOne({
        $or: [{ rfidId }, { contactNumber }],
      });

      if (existingBorrower) {
        return res.status(400).json({
          message: "RFID or Contact already exists",
        });
      }

      newBorrower = new Borrower({
        rfidId,
        contactNumber,
        address,
        laboratoryId: laboratoryId || null,
        borrowerType: borrowerType || "external",

        // 🔥 IMPORTANT CHANGE HERE
        linkedId: newUser._id,
      });

      await newBorrower.save();

      console.log("✅ Borrower linked to User:", newUser._id);
    }

    // =========================
    // SOCKET
    // =========================
    const io = req.app.get("io");
    if (io) {
      io.to("role:admin").emit("user:created", newUser);
    }

    return res.status(201).json({
      status: true,
      user: newUser,
      borrower: newBorrower,
    });
  } catch (error) {
    console.error("❌ Signup failed:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: `Duplicate field: ${Object.keys(error.keyValue).join(", ")}`,
      });
    }

    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

exports.login = AsyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Include 'status' field (if not selected by default, add '+status')
  const user = await UserLogin.findOne({ username: email }).select(
    "+password +status",
  );

  if (!user || !(await user.comparePasswordInDb(password, user.password))) {
    return next(new CustomError("Incorrect email or password", 400));
  }

  // 🔒 New check: Do not allow login if status is 'In-Active'
  if (user.status === "In-Active") {
    return next(
      new CustomError("Account is inactive. Please contact support.", 403),
    );
  }

  let linkId = user.linkedId || user._id;

  if (req.session.userId && req.session.userId !== user._id) {
    req.session.destroy((err) => {
      if (err) console.log("Failed to destroy old session:", err);
    });
  }

  const token = signToken(user._id, user.role, linkId);

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
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let search = req.query.search || "";

    // 🔧 CLEAN SEARCH INPUT
    search = decodeURIComponent(search)
      .replace(/\+/g, " ")
      .replace(/[,]/g, "")
      .trim();

    const role = req.query.role || "";
    const skip = (page - 1) * limit;

    let searchFilter = {};

    // 🔍 SEARCH LOGIC
    if (search) {
      const escapeRegex = (text) =>
        text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const words = search.split(/\s+/).map(escapeRegex);

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

    // 🔥 ROLE FILTER (EXCLUDE BORROWER BY DEFAULT)
    const roleFilter = role
      ? { role } // if specific role requested
      : { role: { $ne: "borrower" } }; // exclude borrower

    const matchStage = { ...searchFilter, ...roleFilter };

    // 📦 MAIN AGGREGATION
    const users = await UserLogin.aggregate([
      { $match: matchStage },

      {
        $lookup: {
          from: "laboratories",
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

      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    // 🔢 COUNT TOTAL
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

  } catch (error) {
    console.error("GET ALL USERS ERROR:", error);

    return next(
      new CustomError(
        error.message || "Failed to fetch users",
        500
      )
    );
  }
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

exports.getUserById = AsyncErrorHandler(async (req, res, next) => {
  const id = req.user.linkId;

  console.log("Fetching user by ID:", id);

  const user = await UserLogin.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },

    {
      $lookup: {
        from: "laboratories",
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
  ]);

  if (!user.length) {
    return res.status(404).json({
      status: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    status: true,
    data: user[0],
  });
});

// Helper function para sa Cloudinary Stream Upload
const uploadFromBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "INVENTORY_SYSTEM/Borrowers" }, // Binago ko ang folder name
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      },
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

exports.updateUser = AsyncErrorHandler(async (req, res, next) => {
  console.log("Update User Request Params:", req.params);
  console.log("Update User Request Body:", req.body);
  console.log("Update User File:", req.file ? "File received" : "No file");

  const io = req.app.get("io");
  const { id } = req.params;

  // 1. Hanapin muna ang user para sa Cloudinary cleanup
  let user = await UserLogin.findById(id);
  if (!user) return next(new CustomError("User not found", 404));

  // 2. Handle Cloudinary Upload
  // Kung may bagong file, upload at burahin ang luma
  if (req.file && req.file.buffer) {
    try {
      if (user.avatar && user.avatar.public_id) {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      }

      const uploadedResponse = await uploadFromBuffer(req.file.buffer);

      // I-set ang avatar object sa req.body para masama sa update
      req.body.avatar = {
        public_id: uploadedResponse.public_id,
        url: uploadedResponse.secure_url,
      };
    } catch (uploadErr) {
      return next(new CustomError("Failed to upload image to Cloudinary", 500));
    }
  }

  // 3. Database Update
  // Gumamit ng $set para siguradong yung mga fields lang na nasa req.body ang magbabago
  const updatedUser = await UserLogin.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true },
  );

  // 4. Aggregation para sa Real-time UI (Consistent sa structure ng Modal mo)
  const userWithLab = await UserLogin.aggregate([
    { $match: { _id: updatedUser._id } },
    {
      $lookup: {
        from: "laboratories",
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
        // Sinunod ko ang naming convention sa frontend modal mo
        first_name: 1,
        middle_name: 1,
        last_name: 1,
        suffix: 1,
        username: 1,
        role: 1,
        status: 1,
        avatar: 1,
        laboratoryId: 1,
        laboratory: {
          laboratoryName: "$laboratory.laboratoryName",
          description: "$laboratory.description",
        },
      },
    },
  ]);

  const finalData = userWithLab[0] || updatedUser;

  // 5. Emit Socket Event (Real-time updates)
  // Nilagyan ko ng optional chaining para hindi mag-error kung walang socket connection
  io?.to("role:admin").emit("borrowerUpdated", {
    payloads: finalData,
  });

  res.status(200).json({
    status: "success",
    data: { user: finalData },
  });
});

exports.updatePassword = AsyncErrorHandler(async (req, res, next) => {
  try {
    const { currentPassword, password, confirmPassword } = req.body;

    const user = await UserLogin.findById(req.user._id).select("+password");

    if (!user) {
      return next(new CustomError("User not found.", 404));
    }

    const isMatch = await user.comparePasswordInDb(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return next(
        new CustomError("The current password you provided is wrong", 401)
      );
    }

    // ✅ validations
    if (!password || !confirmPassword) {
      return next(new CustomError("Please provide all password fields", 400));
    }

    if (password !== confirmPassword) {
      return next(new CustomError("Passwords do not match", 400));
    }

    // 🔄 update
    user.password = password;
    user.confirmPassword = confirmPassword;

    await user.save();

    const token = signToken(user._id);

    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
      token,
      data: {
        user,
      },
    });

  } catch (error) {
    console.error("UPDATE PASSWORD ERROR:", error);

    return next(
      new CustomError(
        error.message || "Something went wrong while updating password",
        500
      )
    );
  }
});
