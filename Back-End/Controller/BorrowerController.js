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

exports.getSpecificBorrower = AsyncErrorHandler(async (req, res) => {
  try {
    const { rfidId } = req.params;

    const borrower = await Borrower.aggregate([
      {
        $match: { rfidId: rfidId }
      },
      {
        $lookup: {
          from: "userloginschemas",
          localField: "linkedId",
          foreignField: "_id",
          as: "linkedAccount"
        }
      },
      {
        $lookup: {
          from: "equipments",
          localField: "borrowedItems.itemId",
          foreignField: "_id",
          as: "borrowedEquipments"
        }
      },
      {
        $project: {
          rfidId: 1,
          contactNumber: 1,
          address: 1,
          borrowerType: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          "linkedAccount": { 
            $arrayElemAt: ["$linkedAccount", 0] 
          },
          "borrowedItems": {
            $map: {
              input: "$borrowedItems",
              as: "item",
              in: {
                borrowedDate: "$$item.borrowedDate",
                returnDate: "$$item.returnDate",
                status: "$$item.status",
                equipment: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$borrowedEquipments",
                        cond: { $eq: ["$$this._id", "$$item.itemId"] }
                      }
                    },
                    0
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    if (!borrower || borrower.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Borrower not found with this RFID ID",
      });
    }

    res.status(200).json({
      success: true,
      message: "Borrower found successfully",
      data: borrower[0],
    });
    
  } catch (error) {
    console.error("Error in getSpecificBorrower:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
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

exports.getAllBorrowers = AsyncErrorHandler(async (req, res) => {
  try {
    let { page = 1, limit = 5, search = "" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    search = search.replace(/\+/g, " ");

    // 🔍 SEARCH FILTER
    const searchFilter = search
      ? {
          $or: [
            { "user.first_name": { $regex: search, $options: "i" } },
            { "user.last_name": { $regex: search, $options: "i" } },
            { rfidId: { $regex: search, $options: "i" } },
            { contactNumber: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // 🔢 PIPELINE
    const pipeline = [
      // 🏢 LABORATORY
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

      // 👤 USER (FIXED LINKEDID)
      {
        $lookup: {
          from: "userloginschemas",
          localField: "linkedId", // 🔥 FIXED HERE
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },

      // 🔍 SEARCH
      {
        $match: searchFilter,
      },

      // 🔽 SORT
      {
        $sort: { createdAt: -1 },
      },

      // 📤 OUTPUT
      {
        $project: {
          // USER INFO
          first_name: "$user.first_name",
          last_name: "$user.last_name",
          middleName: "$user.middle_name",
          email: "$user.username",
          suffix: "$user.suffix",
          avatar: "$user.avatar",

          // BORROWER INFO
          rfidId: 1,
          contactNumber: 1,
          address: 1,
          borrowerType: 1,
          status: 1,
          createdAt: 1,

          // LAB
          laboratoryId: 1,
          laboratoryName: "$laboratory.laboratoryName",
          laboratoryDescription: "$laboratory.description",
        },
      },
    ];

    // 🔢 COUNT
    const totalData = await Borrower.aggregate([
      ...pipeline,
      { $count: "total" },
    ]);

    const total = totalData[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 📄 DATA
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

exports.updateBorrower = AsyncErrorHandler(async (req, res, next) => {
  try {
    const io = req.app.get("io");

    let borrower = await Borrower.findById(req.params.id);
    if (!borrower) return next(new CustomError("Borrower not found", 404));

    // --- FIX 1: HANDLE AVATAR STRING FROM FRONTEND ---
    // Kung ang avatar ay string (JSON), i-parse ito. Kung hindi, hayaan lang.
    if (req.body.avatar && typeof req.body.avatar === "string") {
      try {
        req.body.avatar = JSON.parse(req.body.avatar);
      } catch (e) {
        // Kung hindi JSON string, baka empty string ito o maling format
        console.log("Avatar parse skipped");
      }
    }

    // --- FIX 2: FILE UPLOAD LOGIC ---
    if (req.file && req.file.buffer) {
      // Burahin ang lumang avatar sa Cloudinary kung meron
      if (borrower.avatar && borrower.avatar.public_id) {
        await cloudinary.uploader.destroy(borrower.avatar.public_id);
      }

      // Upload sa Cloudinary
      const uploadedResponse = await uploadFromBuffer(req.file.buffer);

      // I-update ang req.body gamit ang bagong Cloudinary data
      req.body.avatar = {
        public_id: uploadedResponse.public_id,
        url: uploadedResponse.secure_url,
      };
    }

    // --- UPDATE DATABASE ---
    const updateData = { ...req.body };
    const updatedBorrower = await Borrower.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );

    // --- AGGREGATION (Para sa Real-time UI) ---
    const borrowerWithLab = await Borrower.aggregate([
      { $match: { _id: updatedBorrower._id } },
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
          avatar: 1,
        },
      },
    ]);

    // Emit Socket Event
    io.to("role:admin").emit("borrowerUpdated", {
      payloads: borrowerWithLab,
    });

    res.status(200).json({
      status: "success",
      data: { borrower: borrowerWithLab[0] || updatedBorrower },
    });
  } catch (error) {
    console.error("Update Borrower Error:", error);
    // Proteksyon laban sa stream errors para hindi mag-crash ang app
    if (!res.headersSent) {
      res.status(500).json({
        status: "error",
        message:
          error.message || "Something went wrong while updating borrower",
      });
    }
  }
});

exports.deleteBorrower = AsyncErrorHandler(async (req, res, next) => {
  const borrower = await Borrower.findById(req.params.id);
  if (!borrower) return next(new CustomError("Borrower not found", 404));

  if (borrower.avatar && borrower.avatar.public_id) {
    await cloudinary.uploader.destroy(borrower.avatar.public_id);
  }

  await borrower.deleteOne();

  res.status(204).json({ status: "success", data: null });
});
