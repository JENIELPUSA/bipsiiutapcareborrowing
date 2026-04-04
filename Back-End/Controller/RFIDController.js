const RFIDRegister = require("../Models/RFIDActiveSchema");
const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");

exports.createRFID = AsyncErrorHandler(async (req, res) => {
  const { rfidNumber, status = "active", notes = "" } = req.body;

  if (!rfidNumber) {
    return res.status(400).json({
      success: false,
      message: "rfidNumber is required",
    });
  }

  const existing = await RFIDRegister.findOne({ rfidNumber });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "RFID already registered",
    });
  }

  const rfid = await RFIDRegister.create({ rfidNumber, status, notes });

  res.status(201).json({
    success: true,
    message: "RFID registered successfully",
    data: rfid,
  });
});

exports.getAllRFID = AsyncErrorHandler(async (req, res) => {
  const { search = "", page = 1, limit = 10, status = "" } = req.query;

  const currentPage = Math.max(parseInt(page), 1);
  const perPage = Math.max(parseInt(limit), 1);

  const query = {};

  if (search) {
    query.rfidNumber = { $regex: search.trim(), $options: "i" };
  }

  if (status) {
    query.status = status;
  }

  const totalRecords = await RFIDRegister.countDocuments(query);
  const totalPages = Math.ceil(totalRecords / perPage) || 1;

  const now = new Date();

  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = startOfThisMonth;

  const assignedTotal = await RFIDRegister.countDocuments({
    status: "Assigned",
  });

  const assignedThisMonth = await RFIDRegister.countDocuments({
    status: "Assigned",
    createdAt: { $gte: startOfThisMonth, $lt: startOfNextMonth },
  });

  const assignedLastMonth = await RFIDRegister.countDocuments({
    status: "Assigned",
    createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth },
  });

  let percentageChange = 0;
  if (assignedLastMonth > 0) {
    percentageChange =
      ((assignedThisMonth - assignedLastMonth) / assignedLastMonth) * 100;
  } else if (assignedThisMonth > 0) {
    percentageChange = 100;
  }

  const rfids = await RFIDRegister.find(query)
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  res.status(200).json({
    success: true,
    totalRecords,
    totalPages,
    currentPage,
    limit: perPage,
    assignedTotal,
    assignedThisMonth,
    assignedLastMonth,
    percentageChange: Number(percentageChange.toFixed(2)),
    data: rfids,
  });
});

exports.getRFIDById = AsyncErrorHandler(async (req, res) => {
  const rfid = await RFIDRegister.findById(req.params.id);

  if (!rfid) {
    return res.status(404).json({
      success: false,
      message: "RFID not found",
    });
  }

  res.status(200).json({
    success: true,
    data: rfid,
  });
});

exports.updateRFID = AsyncErrorHandler(async (req, res) => {
  const { rfidNumber, status, notes } = req.body;
  const updateData = {};
  if (rfidNumber) updateData.rfidNumber = rfidNumber;
  if (status) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;

  const rfid = await RFIDRegister.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!rfid) {
    return res.status(404).json({
      success: false,
      message: "RFID not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "RFID updated successfully",
    data: rfid,
  });
});

exports.deleteRFID = AsyncErrorHandler(async (req, res) => {
  const rfid = await RFIDRegister.findById(req.params.id);

  if (!rfid) {
    return res.status(404).json({
      success: false,
      message: "RFID not found",
    });
  }

  await rfid.deleteOne();

  res.status(200).json({
    success: true,
    message: "RFID deleted successfully",
  });
});
