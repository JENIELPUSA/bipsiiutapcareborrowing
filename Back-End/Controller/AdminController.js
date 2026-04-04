const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const Admin = require("../Models/AdminSchema");
const UserLoginSchema = require("../Models/LogInSchema");
const fs = require("fs");
const axios = require("axios");
const { URLSearchParams } = require("url");
const FormData = require("form-data");

exports.deleteAdmin = AsyncErrorHandler(async (req, res, next) => {
  const AdminID = req.params.id;

  const existingAdmin = await Admin.findById(AdminID);
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

  await Admin.findByIdAndDelete(AdminID);

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
      .post(
        "https://localhost/delete.php",
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      )
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
    const {
      page = 1,
      limit = 10,
      search = "",
    } = req.query;

    const currentPage = Math.max(parseInt(page), 1);
    const perPage = Math.max(parseInt(limit), 1);
    const skip = (currentPage - 1) * perPage;
    const searchQuery = search
      ? {
          $or: [
            { first_name: { $regex: search, $options: "i" } },
            { middle_name: { $regex: search, $options: "i" } },
            { last_name: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const totalAdmin = await Admin.countDocuments(searchQuery);

    const adminResults = await Admin.find(searchQuery)
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
  const admin = await Admin.findById(loggedInAdminId);
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

  const oldRecord = await Admin.findById(adminId);
  if (!oldRecord) {
    return res.status(404).json({ error: "Admin not found" });
  }

  let newAvatarUrl = oldRecord.avatar ? oldRecord.avatar.url : null;
  const oldAvatarUrl = oldRecord.avatar ? oldRecord.avatar.url : null;

  if (req.file) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete invalid temp file:", err);
      });
      return res.status(400).json({ error: "Invalid image type" });
    }
  }

  try {
    if (req.file) {
      const form = new FormData();
      form.append("file", fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const uploadResponse = await axios.post(
        "https://localhost.com/upload.php",
        form,
        {
          headers: form.getHeaders(),
          maxBodyLength: Infinity,
        },
      );

      if (!uploadResponse.data.success) {
        throw new Error(
          uploadResponse.data.message || "Failed to upload new avatar",
        );
      }

      newAvatarUrl = uploadResponse.data.url;
      console.log("New avatar uploaded:", newAvatarUrl);
    }

    const updateData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      middle_name: req.body.middle_name,
      email: req.body.email,
      gender: req.body.gender,
    };

    if (req.file) {
      updateData.avatar = {
        ...oldRecord.avatar,
        url: newAvatarUrl,
      };
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updateData, {
      new: true,
    });

    if (!updatedAdmin) {
      return res.status(404).json({ error: "Admin not found after update" });
    }

    res.json({ status: "success", data: updatedAdmin });

    if (req.file && oldAvatarUrl) {
      const params = new URLSearchParams();
      params.append("file", oldAvatarUrl);

      axios
        .post(
          "https://localhost/delete.php",
          params.toString(),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
        )
        .then((response) => {
          if (response.data.success) {
            console.log("Old news image deleted in background:", oldAvatarUrl);
          } else {
            console.error(
              "Failed to delete old news image in background:",
              response.data.message,
            );
          }
        })
        .catch((error) => {
          console.error(
            "Error deleting old news image in background:",
            error.message,
          );
        });
    }
  } catch (error) {
    console.error("UpdateAdmin Error:", error);
    res.status(500).json({ error: "Something went wrong." });
  } finally {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete temp file:", err);
      });
    }
  }
});
