const Borrower = require("../Models/BorrowerSchema");
const cloudinary = require("../Utils/cloudinary"); // Gamit ang iyong utility path
const streamifier = require("streamifier");
const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const CustomError = require("../Utils/CustomError");


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

exports.registerBorrower = AsyncErrorHandler(async (req, res, next) => {
  try {
    console.log("req.body:", req.body);
    console.log("File:", req.file ? "File received" : "No file");

    const {
      rfidId,
      firstName,
      middleName,
      lastName,
      contactNumber,
      email,
      laboratoryId,
      address,
      borrowerType,
      suffix,
    } = req.body;

    // 🔥 VALIDATE ObjectId (very important)
    const mongoose = require("mongoose");
    if (laboratoryId && !mongoose.Types.ObjectId.isValid(laboratoryId)) {
      return next(new CustomError("Invalid laboratoryId", 400));
    }

    // 1. Check duplicates
    const existingBorrower = await Borrower.findOne({
      $or: [{ rfidId }, { contactNumber }],
    });

    if (existingBorrower) {
      const field =
        existingBorrower.rfidId === rfidId ? "RFID ID" : "Contact Number";

      return next(
        new CustomError(
          `${field} is already registered to another borrower.`,
          400,
        ),
      );
    }

    // 2. Handle Avatar Upload
    let avatarData = { url: "", public_id: "" };

    if (req.file) {
      try {
        const uploadedResponse = await uploadFromBuffer(req.file.buffer);

        avatarData = {
          public_id: uploadedResponse.public_id,
          url: uploadedResponse.secure_url,
        };
      } catch (uploadErr) {
        console.log("UPLOAD ERROR:", uploadErr);
        return next(new CustomError("Avatar upload failed.", 500));
      }
    }

    // 3. Create Borrower
    const newBorrower = await Borrower.create({
      avatar: avatarData,
      rfidId,
      firstName,
      middleName,
      lastName,
      suffix,
      contactNumber,
      email,
      laboratoryId,
      address,
      borrowerType,
    });

    res.status(201).json({
      status: "success",
      data: { borrower: newBorrower },
    });
  } catch (error) {
    console.log("FULL ERROR:", error); // 🔥 IMPORTANT DEBUG

    // 🔥 HANDLE DUPLICATE KEY ERROR (Mongo)
    if (error.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: `Duplicate field: ${Object.keys(error.keyValue)}`,
      });
    }

    return res.status(400).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
});

// @desc Get all borrowers with laboratory + search + pagination
exports.getAllBorrowers = AsyncErrorHandler(async (req, res, next) => {
  try {
    let { page = 1, limit = 5, search = "" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    search = search.replace(/\+/g, " ");

    // 🔍 SEARCH FILTER
    const searchFilter = search
      ? {
          $or: [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { rfidId: { $regex: search, $options: "i" } },
            { contactNumber: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // 🔢 MAIN PIPELINE
    const pipeline = [
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

      // 🔍 APPLY SEARCH
      {
        $match: searchFilter,
      },

      {
        $sort: { createdAt: -1 },
      },

      {
        $project: {
          firstName: 1,
          lastName: 1,
          rfidId: 1,
          contactNumber: 1,
          borrowerType: 1,
          status: 1,
          createdAt: 1,

          laboratoryId: 1,
          laboratoryName: "$laboratory.laboratoryName",
          laboratoryDescription: "$laboratory.description",
        },
      },
    ];

    // 🔢 COUNT TOTAL
    const totalData = await Borrower.aggregate([
      ...pipeline,
      { $count: "total" },
    ]);

    const total = totalData[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 📄 PAGINATION
    const borrowers = await Borrower.aggregate([
      ...pipeline,
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    res.status(200).json({
      success: true,
      data: borrowers,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Borrowers Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get borrowers",
      error: error.message,
    });
  }
});

// @desc    Update borrower
exports.updateBorrower = AsyncErrorHandler(async (req, res, next) => {
  let borrower = await Borrower.findById(req.params.id);
  if (!borrower) return next(new CustomError("Borrower not found", 404));

  // Kung may bagong file, i-upload at i-delete ang luma
  if (req.file) {
    // Delete old image from Cloudinary
    if (borrower.avatar && borrower.avatar.public_id) {
      await cloudinary.uploader.destroy(borrower.avatar.public_id);
    }
    // Upload new image
    const uploadedResponse = await uploadFromBuffer(req.file.buffer);
    req.body.avatar = {
      public_id: uploadedResponse.public_id,
      url: uploadedResponse.secure_url,
    };
  }

  const updatedBorrower = await Borrower.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    status: "success",
    data: { borrower: updatedBorrower },
  });
});

// @desc    Delete borrower
exports.deleteBorrower = AsyncErrorHandler(async (req, res, next) => {
  const borrower = await Borrower.findById(req.params.id);
  if (!borrower) return next(new CustomError("Borrower not found", 404));

  if (borrower.avatar && borrower.avatar.public_id) {
    await cloudinary.uploader.destroy(borrower.avatar.public_id);
  }

  await borrower.deleteOne();
  res.status(204).json({ status: "success", data: null });
});
