const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const UserLoginSchema = require("../Models/LogInSchema");
const fs = require("fs");
const axios = require("axios");
const { URLSearchParams } = require("url");
const FormData = require("form-data");

exports.deleteAdmin = AsyncErrorHandler(async (req, res, next) => {
  const AdminID = req.params.id;

  const existingAdmin = await UserLoginSchema.findById(AdminID);
  if (!existingAdmin) {
    return res.status(404).json({
      status: "fail",
      message: "Admin not found.",
    });
  }

  const userLogin = await UserLoginSchema.findOne({ linkedId: AdminID });
  if (userLogin) {
    await UserLoginSchema.findByIdAndDelete(userLogin._id);
  }

  await UserLoginSchema.findByIdAndDelete(AdminID);

  res.status(200).json({
    status: "success",
    message: "Admin and related login deleted successfully.",
    data: null,
  });

  if (existingAdmin.avatar && existingAdmin.avatar.url) {
    const avatarUrl = existingAdmin.avatar.url;

    const params = new URLSearchParams();
    params.append("file", avatarUrl);

    axios
      .post("https://localhost/delete.php", params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
      .then((response) => {
        if (response.data.success) {
          console.log(
            "Avatar deleted from Hostinger in background:",
            avatarUrl,
          );
        } else {
          console.error(
            "Failed to delete avatar from Hostinger in background:",
            response.data.message,
          );
        }
      })
      .catch((error) => {
        console.error(
          "Error deleting avatar from Hostinger in background:",
          error.message,
        );
      });
  }
});

exports.DisplayAdmin = AsyncErrorHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const currentPage = Math.max(parseInt(page), 1);
    const perPage = Math.max(parseInt(limit), 1);
    const skip = (currentPage - 1) * perPage;

    const searchQuery = {
      role: { $ne: "borrower" }, // ❌ exclude borrower

      ...(search && {
        $or: [
          { first_name: { $regex: search, $options: "i" } },
          { middle_name: { $regex: search, $options: "i" } },
          { last_name: { $regex: search, $options: "i" } },
        ],
      }),
    };

    const totalAdmin = await UserLoginSchema.countDocuments(searchQuery);

    const adminResults = await UserLoginSchema.find(searchQuery)
      .skip(skip)
      .limit(perPage)
      .sort({ created_at: -1 });

    const totalPages = Math.ceil(totalAdmin / perPage);

    res.status(200).json({
      status: "success",
      data: adminResults,
      pagination: {
        totalAdmin,
        totalPages,
        currentPage,
        limit: perPage,
      },
    });
  } catch (error) {
    console.error("Error fetching admin data:", error);
    res.status(500).json({
      status: "fail",
      message: "Something went wrong while fetching admin data.",
      error: error.message,
    });
  }
});

exports.DisplayProfile = AsyncErrorHandler(async (req, res) => {
  const loggedInAdminId = req.user.linkId;
  const admin = await UserLoginSchema.findById(loggedInAdminId);
  if (!admin) {
    return res.status(404).json({
      status: "fail",
      message: "Admin not found",
    });
  }

  res.status(200).json({
    status: "success",
    data: admin,
  });
});

exports.UpdateAdmin = AsyncErrorHandler(async (req, res) => {
  const adminId = req.params.id;
  const io = req.app.get("io");

  console.log("req.body", req.body);
  const oldRecord = await UserLoginSchema.findById(adminId);
  if (!oldRecord) {
    return res.status(404).json({ error: "Admin not found" });
  }

  let newAvatarUrl = oldRecord.avatar ? oldRecord.avatar.url : null;
  const oldAvatarUrl = oldRecord.avatar ? oldRecord.avatar.url : null;

  // Image Validation
  if (req.file) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Invalid image type" });
    }
  }

  try {
    // Upload process
    if (req.file) {
      const form = new FormData();
      form.append("file", fs.createReadStream(req.file.path));

      const uploadResponse = await axios.post(
        "https://localhost.com/upload.php",
        form,
        { headers: form.getHeaders() },
      );

      if (uploadResponse.data.success) {
        newAvatarUrl = uploadResponse.data.url;
      }
    }

    // Prepare Update Data
    const updateData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      middle_name: req.body.middle_name,
      email: req.body.email,
      role: req.body.role,
      gender: req.body.gender,
      laboratoryId: req.body.laboratoryId, // Siguraduhing na-a-update ang ID para sa lookup
    };

    if (req.file) {
      updateData.avatar = { ...oldRecord.avatar, url: newAvatarUrl };
    }

    // Perform Update
    const updatedAdminDoc = await UserLoginSchema.findByIdAndUpdate(
      adminId,
      updateData,
      {
        new: true,
      },
    );

    if (!updatedAdminDoc) {
      return res.status(404).json({ error: "Admin not found after update" });
    }

    // --- AYOS NA LOOKUP STARTS HERE ---
    const adminWithLookup = await UserLoginSchema.aggregate([
      {
        $match: { _id: updatedAdminDoc._id },
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
          password: 0, // Itago ang sensitive info
        },
      },
    ]);

    // Kunin ang unang item sa array ng aggregate
    const finalData = adminWithLookup[0] || updatedAdminDoc;

    // Emit Socket Event
    io.to("role:admin").emit("adminUpdated", {
      payloads: finalData,
    });

    // Response
    res.json({ status: "success", data: finalData });

    // Background deletion of old image
    if (req.file && oldAvatarUrl && oldAvatarUrl !== newAvatarUrl) {
      const params = new URLSearchParams();
      params.append("file", oldAvatarUrl);
      axios
        .post("https://localhost/delete.php", params.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        })
        .catch((err) => console.error("BG Delete Error:", err.message));
    }
  } catch (error) {
    console.error("UpdateAdmin Error:", error);
    res.status(500).json({ error: "Something went wrong." });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

exports.updateStatus = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params; // ID ng user/incharge na i-update

  // Hanapin ang user sa database
  const user = await UserLoginSchema.findById(id);
  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: "User not found",
    });
  }

  // Toggle status
  user.status = user.status === "Active" ? "In-Active" : "Active";
  await user.save();

  res.status(200).json({
    status: true,
    message: `User status updated to ${user.status}`,
    data: { _id: user._id, status: user.status },
  });
});
