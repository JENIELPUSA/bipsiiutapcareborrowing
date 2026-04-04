const Equipment = require("../Models/RegisterAssitsSchema");
const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");

// CREATE EQUIPMENT
// CREATE EQUIPMENT
exports.createEquipment = AsyncErrorHandler(async (req, res, next) => {
  try {
    const { equipment, category, brand, model, serialNo, status } = req.body;
    const incharge = req.user._id;

    console.log("--- Debugging Create Equipment ---");
    console.log("Received Body:", req.body);
    console.log("In-charge ID:", incharge);
    // 2. Create and Save
    const newEquipment = new Equipment({
      equipment,
      category, // Siguraduhin na valid ObjectId ito
      brand,
      model,
      serialNo,
      status,
      incharge, // Galing sa token/auth middleware
    });

    const savedEquipment = await newEquipment.save();

    // 3. Success Response
    res.status(201).json({
      success: true,
      message: "Equipment registered successfully!",
      data: savedEquipment,
    });
  } catch (error) {
    // DITO MO MAKIKITA ANG TOTOONG MALI SA TERMINAL MO
    console.error("CRITICAL ERROR DURING SAVE:", error);

    // I-handle ang Mongoose Duplicate Key Error (E11000)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Duplicate key error: Ang ID o Serial Number ay exist na sa system.",
      });
    }

    // I-handle ang Mongoose Validation Error (e.g. maling ObjectId format)
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Data format error: Pakicheck ang Category ID o format ng mga inputs.",
        details: error.message,
      });
    }

    // Default error response
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// GET ALL EQUIPMENTS WITH SEARCH & PAGINATION
exports.getAllEquipment = AsyncErrorHandler(async (req, res) => {
  let { page = 1, limit = 5, search = "" } = req.query;

  // Convert to number
  page = parseInt(page);
  limit = parseInt(limit);

  // Build search query
  const query = {};
  if (search) {
    // Example: search by name or serialNumber
    query.$or = [
      { name: { $regex: search, $options: "i" } }, // case-insensitive search by name
      { serialNumber: { $regex: search, $options: "i" } }, // search by serialNumber
    ];
  }

  // Count total matching documents
  const total = await Equipment.countDocuments(query);

  // Fetch paginated results
  const equipments = await Equipment.find(query)
    .populate("category") // populate category if needed
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: equipments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// GET EQUIPMENT BY ID
exports.getEquipmentById = AsyncErrorHandler(async (req, res) => {
  const equipment = await Equipment.findById(req.params.id).populate(
    "category",
  );
  if (!equipment)
    return res
      .status(404)
      .json({ success: false, message: "Equipment not found" });

  res.status(200).json({ success: true, data: equipment });
});

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
