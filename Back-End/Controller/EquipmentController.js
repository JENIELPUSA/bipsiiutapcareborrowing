const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const mongoose = require("mongoose");
const userloginSchema = require("../Models/LogInSchema");
const Equipment = require("../Models/RegisterAssitsSchema");
const EquipmentSchema = require("../Models/EnchargeBorroweSchema");

exports.getDashboardCounts = AsyncErrorHandler(async (req, res, next) => {
  try {
    let { linkId } = req.query;

    const rawUserId = linkId || req.user._id;
    const role = req.user.role;

    const userId = new mongoose.Types.ObjectId(rawUserId);

    const baseMatch =
      role === "in-charge"
        ? { inchargeId: userId }
        : {};

    const [totalAdmins, totalReleased, totalPending, totalAssets] =
      await Promise.all([
        userloginSchema.countDocuments(),

        EquipmentSchema.aggregate([
          { $match: baseMatch },
          { $unwind: "$equipmentIds" },
          {
            $match: {
              "equipmentIds.status": "Release",
            },
          },
          { $count: "total" },
        ]).then((res) => res[0]?.total || 0),

        EquipmentSchema.aggregate([
          { $match: baseMatch },
          { $unwind: "$equipmentIds" },
          {
            $match: {
              "equipmentIds.status": "Pending",
            },
          },
          { $count: "total" },
        ]).then((res) => res[0]?.total || 0),

        // ❗ HINDI GINALAW (as requested)
        role === "admin"
          ? Equipment.countDocuments()
          : Equipment.countDocuments({
              incharge: rawUserId, // same as original
            }),
      ]);

    console.log({
      userId: rawUserId,
      role,
      totalAdmins,
      totalReleased,
      totalPending,
      totalAssets,
    });

    return res.status(200).json({
      success: true,
      data: {
        totalAdmins,
        totalReleased,
        totalPending,
        totalAssets,
      },
    });
  } catch (error) {
    next(error);
  }
});

exports.getAllEquipment = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    let { page = 1, limit = 5, search = "", linkId } = req.query;
    const userId =
      new mongoose.Types.ObjectId(linkId) ||
      new mongoose.Types.ObjectId(req.user._id);
    page = parseInt(page);
    limit = parseInt(limit);
    console.log("userId", userId);

    const skip = (page - 1) * limit;

    // 📌 Base filter
    const matchStage = {
      incharge: userId,
    };

    // 🔍 Search filter
    if (search) {
      matchStage.$and = [
        {
          $or: [
            { model: { $regex: search, $options: "i" } },
            { brand: { $regex: search, $options: "i" } },
            { serialNo: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    const pipeline = [
      // 📦 FILTER EQUIPMENT BY INCHARGE
      { $match: matchStage },

      // 🔗 CHECK LOAN EQUIPMENT
      {
        $lookup: {
          from: "loanequipments",
          let: { equipmentId: "$_id" },
          pipeline: [
            { $unwind: "$equipmentIds" },

            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$equipmentIds.assistsId", "$$equipmentId"],
                    },
                    { $in: ["$equipmentIds.status", ["Release", "In-Review"]] },
                  ],
                },
              },
            },
          ],
          as: "loanMatch",
        },
      },

      // 📊 SET STATUS
      {
        $addFields: {
          status: {
            $cond: [
              { $gt: [{ $size: "$loanMatch" }, 0] },
              "Not Available",
              "Active",
            ],
          },
        },
      },

      // 🧹 CLEAN OUTPUT
      {
        $project: {
          loanMatch: 0,
        },
      },

      // 📄 PAGINATION
      { $skip: skip },
      { $limit: limit },
    ];

    const equipments = await Equipment.aggregate(pipeline);

    const totalAgg = await Equipment.aggregate([
      { $match: matchStage },
      { $count: "total" },
    ]);

    const total = totalAgg[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: equipments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch equipments",
      error: error.message,
    });
  }
};



// CREATE EQUIPMENT
exports.createEquipment = AsyncErrorHandler(async (req, res, next) => {
  try {
    const io = req.app.get("io"); // socket.io instance
    const { equipment, category, brand, model, serialNo, status, linkId } =
      req.body;
    const incharge = new mongoose.Types.ObjectId(linkId)  || req.user._id;

    console.log("incharge ID:", incharge);

    const newEquipment = new Equipment({
      equipment,
      category,
      brand,
      model,
      serialNo,
      status,
      incharge,
    });

    const savedEquipment = await newEquipment.save();

    const populatedEquipment = await Equipment.findById(savedEquipment._id)
      .populate("category", "categoryName")
      .populate("incharge", "name email");

    const payload = {
      action: "add", // <-- mark as add
      equipment: populatedEquipment, // equipment object
      notification: {
        message: `${req.user.name} added new equipment: ${populatedEquipment.equipment}`,
        viewers: [
          { role: "admin" }, // admins should see
          { user: incharge }, // sender should see
        ],
      },
    };
    if (io) {
      io.to(`user:${incharge}`).emit("equipment:added", payload);
      io.to("role:admin").emit("equipment:added", payload);
    }

    res.status(201).json({
      success: true,
      message: "Equipment registered successfully!",
      data: populatedEquipment,
    });
  } catch (error) {
    console.error(error);
    // handle duplicate / validation errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Duplicate key error: Ang ID o Serial Number ay exist na sa system.",
      });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Data format error: Pakicheck ang Category ID o format ng mga inputs.",
        details: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

exports.getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { showAll, limit = 5 } = req.query;

    // 1. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // 2. Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          category: new mongoose.Types.ObjectId(id),
        },
      },
      // LOOKUP PARA SA CATEGORY
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category_info",
        },
      },
      { $unwind: { path: "$category_info", preserveNullAndEmptyArrays: true } },

      // LOOKUP PARA SA INCHARGE (UserLoginSchema)
      {
        $lookup: {
          from: "userloginschemas",
          localField: "incharge",
          foreignField: "_id",
          as: "incharge_info",
        },
      },
      { $unwind: { path: "$incharge_info", preserveNullAndEmptyArrays: true } },

      // LOOKUP PARA SA LABORATORY (Galing sa laboratoryId ng Incharge)
      {
        $lookup: {
          from: "laboratories", // Base sa model "laboratory", ito ang collection name
          localField: "incharge_info.laboratoryId",
          foreignField: "_id",
          as: "lab_info",
        },
      },
      { $unwind: { path: "$lab_info", preserveNullAndEmptyArrays: true } },

      // FINAL PROJECTION
      {
        $project: {
          _id: 1,
          brand: 1,
          model: 1,
          serialNo: 1,
          status: 1,
          category: {
            _id: "$category_info._id",
            categoryName: "$category_info.categoryName",
          },
          incharge: {
            _id: "$incharge_info._id",
            full_name: {
              $concat: [
                { $ifNull: ["$incharge_info.first_name", ""] },
                " ",
                { $ifNull: ["$incharge_info.last_name", ""] },
              ],
            },
            username: "$incharge_info.username",
            role: "$incharge_info.role",
            // Laboratory Details
            laboratory: {
              _id: "$lab_info._id",
              laboratoryName: "$lab_info.laboratoryName",
              description: "$lab_info.description",
            },
          },
        },
      },
    ];

    // 3. Apply limit
    if (showAll !== "true") {
      pipeline.push({
        $limit: parseInt(limit),
      });
    }

    const result = await Equipment.aggregate(pipeline);

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No equipment found for this category",
      });
    }

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Aggregation Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// UPDATE EQUIPMENT
exports.updateEquipment = AsyncErrorHandler(async (req, res) => {
  const updatedEquipment = await Equipment.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true },
  );

  if (!updatedEquipment)
    return res
      .status(404)
      .json({ success: false, message: "Equipment not found" });

  res.status(200).json({ success: true, data: updatedEquipment });
});

// DELETE EQUIPMENT
exports.deleteEquipment = AsyncErrorHandler(async (req, res) => {
  const deleted = await Equipment.findByIdAndDelete(req.params.id);
  if (!deleted)
    return res
      .status(404)
      .json({ success: false, message: "Equipment not found" });

  res
    .status(200)
    .json({ success: true, message: "Equipment deleted successfully" });
});
