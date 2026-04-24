const LoanEquipment = require("../Models/EnchargeBorroweSchema"); // path sa schema mo
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const CustomError = require("../Utils/CustomError");
const Borrower = require("../Models/BorrowerSchema");
const userlogin = require("../Models/LogInSchema");
const Notification = require("../Models/NotificationSchema");
const Category = require("../Models/categorySchema");
const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");

const RegisterAssists = require("../Models/RegisterAssitsSchema");

exports.createLoan = AsyncErrorHandler(async (req, res) => {
  try {
    const { borrowerID, laboratoryId, category } = req.body;
    const io = req.app.get("io");

    console.log("Received createLoan request with data:", req.body);

    // --- 1. Validate borrower ---
    const borrower = await Borrower.findOne({ rfidId: borrowerID });
    if (!borrower) {
      return res
        .status(404)
        .json({ success: false, message: "Borrower not found" });
    }

    // --- 2. Validate in-charge for this laboratory ---
    const incharge = await userlogin.findOne({
      role: "in-charge",
      laboratoryId: new mongoose.Types.ObjectId(laboratoryId),
    });
    if (!incharge) {
      return res.status(404).json({
        success: false,
        message: "In-charge not found for this laboratory",
      });
    }

    // --- 3. Validate category array ---
    if (!Array.isArray(category) || category.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category must be a non-empty array",
      });
    }

    // --- 4. Fetch category names from DB ---
    const categoriesFromDB = await Category.find({
      _id: { $in: category.map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .select("categoryName")
      .lean(); // lean() para plain JS objects

    const categoryMap = categoriesFromDB.reduce((acc, cat) => {
      acc[cat._id.toString()] = cat.categoryName;
      return acc;
    }, {});

    // --- 5. Prepare equipmentIds array with categoryName ---
    const equipmentsWithCategory = category.map((catId) => ({
      equipmentId: new mongoose.Types.ObjectId(catId),
      status: "Pending",
      serialNumber: "",
      assistsId: null,
      returnDate: null,
      categoryName: categoryMap[catId.toString()] || "Unknown",
    }));

    // --- 6. Create LoanEquipment document ---
    const newLoan = new LoanEquipment({
      borrowerId: borrower._id,
      inchargeId: incharge._id,
      equipmentIds: equipmentsWithCategory,
    });

    const savedLoan = await newLoan.save();

    // --- 7. Create Notification ---
    const categoryList = equipmentsWithCategory
      .map((eq) => eq.categoryName)
      .join(", ");

    const newNotification = new Notification({
      message: `Pending Approval: ${borrower.firstName || ""} ${borrower.lastName || ""} is requesting to borrow ${categoryList}.`,
      viewers: [{ user: incharge._id, isRead: false }],
    });
    const savedNotification = await newNotification.save();

    // --- 8. Emit via Socket.io ---
    if (io && savedLoan && savedNotification) {
      const combinedPayload = {
        loan: {
          ...savedLoan.toObject(),
          equipmentIds: equipmentsWithCategory,
        },
        notification: savedNotification.toObject(),
      };

      io.to(`user:${incharge._id}`).emit(
        "borrowrequest:created",
        combinedPayload,
      );
      io.to("admin:send-to-incharge").emit(
        "borrowrequest:created",
        combinedPayload,
      );

      console.log("Combined payload emitted successfully.");
    }

    // --- 9. Respond ---
    res.status(201).json({
      success: true,
      data: savedLoan,
      notification: savedNotification,
    });
  } catch (error) {
    console.error("Create Loan Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create loan",
      error: error.message,
    });
  }
});

exports.getAllLoans = AsyncErrorHandler(async (req, res) => {
  try {
    let { page = 1, limit = 5, search = "" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    search = search.replace(/\+/g, " ");

    // 🔍 SEARCH FILTER
    const searchFilter = search
      ? {
          $or: [
            { "borrower.name": { $regex: search, $options: "i" } },
            { "incharge.name": { $regex: search, $options: "i" } },
            { "equipmentIds.equipmentName": { $regex: search, $options: "i" } },
            { "equipmentIds.serialNo": { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // 🔢 MAIN PIPELINE
    const pipeline = [
      // 1️⃣ Lookup incharge
      {
        $lookup: {
          from: "userloginschemas",
          localField: "inchargeId",
          foreignField: "_id",
          as: "incharge",
        },
      },
      { $unwind: { path: "$incharge", preserveNullAndEmptyArrays: true } },

      // 2️⃣ Lookup borrower
      {
        $lookup: {
          from: "borrowers",
          localField: "borrowerId",
          foreignField: "_id",
          as: "borrower",
        },
      },
      { $unwind: { path: "$borrower", preserveNullAndEmptyArrays: true } },

      // 3️⃣ Unwind equipmentIds
      {
        $unwind: {
          path: "$equipmentIds",
          preserveNullAndEmptyArrays: true,
        },
      },

      // 4️⃣ Lookup category
      {
        $lookup: {
          from: "categories",
          localField: "equipmentIds.equipmentId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true },
      },

      // 5️⃣ Lookup equipment
      {
        $lookup: {
          from: "equipments",
          localField: "equipmentIds.assistsId",
          foreignField: "_id",
          as: "equipmentDetails",
        },
      },
      {
        $unwind: {
          path: "$equipmentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // 6️⃣ Add fields
      {
        $addFields: {
          "equipmentIds.categoryName": "$categoryDetails.categoryName",
          "equipmentIds.categoryDescription": "$categoryDetails.discription",
          "equipmentIds.equipmentName": "$equipmentDetails.equipment",
          "equipmentIds.serialNo": "$equipmentDetails.serialNo",
          "equipmentIds.brand": "$equipmentDetails.brand",
          "equipmentIds.model": "$equipmentDetails.model",
        },
      },

      // 🔍 APPLY SEARCH (IMPORTANT: after lookup para may fields na)
      {
        $match: searchFilter,
      },

      // 7️⃣ Group back
      {
        $group: {
          _id: "$_id",
          borrower: { $first: "$borrower" },
          incharge: { $first: "$incharge" },
          borrowerId: { $first: "$borrowerId" },
          inchargeId: { $first: "$inchargeId" },
          equipmentIds: { $push: "$equipmentIds" },
          createdAt: { $first: "$createdAt" },
        },
      },

      // 📅 Sort latest
      { $sort: { createdAt: -1 } },
    ];

    // 🔢 COUNT TOTAL (separate pipeline)
    const totalData = await LoanEquipment.aggregate([
      ...pipeline,
      { $count: "total" },
    ]);

    const total = totalData[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 📄 PAGINATION
    const paginatedPipeline = [
      ...pipeline,
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const loans = await LoanEquipment.aggregate(paginatedPipeline);

    res.status(200).json({
      success: true,
      data: loans,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get loans",
      error: error.message,
    });
  }
});

exports.useRFidGet = AsyncErrorHandler(async (req, res) => {
  const { rfidData } = req.params;
  let { page = 1, limit = 10, status } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  // 1. FIND BORROWER + POPULATE USER INFO
  const borrowerDoc = await Borrower.findOne({
    rfidId: rfidData.trim(),
  }).populate("linkedId"); // 🔥 IMPORTANT FIX

  if (!borrowerDoc) {
    return res.status(404).json({
      success: false,
      type: "BORROWER_NOT_FOUND",
      message: "This RFID is not registered",
    });
  }

  const borrowerId = borrowerDoc._id;

  // 2. COUNT TOTAL
  const totalAggregation = await LoanEquipment.aggregate([
    { $match: { borrowerId } },
    { $unwind: "$equipmentIds" },
    ...(status ? [{ $match: { "equipmentIds.status": status } }] : []),
    { $count: "total" },
  ]);

  const totalEntries = totalAggregation[0]?.total || 0;
  const totalPages = Math.ceil(totalEntries / limit);

  // 3. LOOKUPS (NO BORROWER LOOKUP NEEDED)
  const lookupStages = [
    {
      $lookup: {
        from: "categories",
        localField: "equipmentIds.equipmentId",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    {
      $unwind: {
        path: "$categoryDetails",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "equipments",
        localField: "equipmentIds.assistsId",
        foreignField: "_id",
        as: "equipmentDetails",
      },
    },
    {
      $unwind: {
        path: "$equipmentDetails",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "userloginschemas",
        localField: "inchargeId",
        foreignField: "_id",
        as: "incharge",
      },
    },
    {
      $unwind: {
        path: "$incharge",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $addFields: {
        "equipmentIds.categoryName": "$categoryDetails.categoryName",
        "equipmentIds.categoryDescription": "$categoryDetails.discription",

        "equipmentIds.equipmentName": "$equipmentDetails.equipment",
        "equipmentIds.serialNumber": {
          $ifNull: ["$equipmentDetails.serialNo", "$equipmentIds.serialNumber"],
        },
        "equipmentIds.brand": "$equipmentDetails.brand",
        "equipmentIds.model": "$equipmentDetails.model",

        "incharge.fullName": {
          $trim: {
            input: {
              $concat: [
                { $ifNull: ["$incharge.first_name", ""] },
                " ",
                { $ifNull: ["$incharge.middle_name", ""] },
                " ",
                { $ifNull: ["$incharge.last_name", ""] },
                " ",
                { $ifNull: ["$incharge.suffix", ""] },
              ],
            },
          },
        },

        "equipmentIds.inchargeName": "$incharge.fullName",
      },
    },
  ];

  // 4. MAIN DATA
  const equipmentAggregation = await LoanEquipment.aggregate([
    { $match: { borrowerId } },
    { $unwind: "$equipmentIds" },
    ...(status ? [{ $match: { "equipmentIds.status": status } }] : []),
    ...lookupStages,
    { $sort: { "equipmentIds._id": -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);

  const allEquipmentAggregation = await LoanEquipment.aggregate([
    { $match: { borrowerId } },
    { $unwind: "$equipmentIds" },
    { $match: { "equipmentIds.status": "Release" } },
    ...lookupStages,
    { $sort: { "equipmentIds._id": -1 } },
  ]);

  // 5. FORMAT RESPONSE (NOW USING linkedId)
  const formatResponse = (item) => ({
    _id: item._id,

    borrower: {
      _id: borrowerDoc._id,
      rfidId: borrowerDoc.rfidId,

      // 🔥 REAL USER INFO FROM linkedId
      firstName: borrowerDoc.linkedId?.first_name,
      lastName: borrowerDoc.linkedId?.last_name,

      fullName: `${borrowerDoc.linkedId?.first_name || ""} ${
        borrowerDoc.linkedId?.last_name || ""
      }`.trim(),

      avatar:
        borrowerDoc.linkedId?.avatar?.url ||
        borrowerDoc.linkedId?.avatar ||
        null,
    },

    incharge: {
      _id: item.incharge?._id,
      name: item.incharge?.fullName,
      avatar: item.incharge?.avatar?.url || item.incharge?.avatar || null,
    },

    equipment: item.equipmentIds,
    createdAt: item.createdAt,
  });

  return res.status(200).json({
    success: true,
    totalEntries,
    totalPages,
    currentPage: page,
    data: equipmentAggregation.map(formatResponse),
    allData: allEquipmentAggregation.map(formatResponse),
  });
});
exports.updateLoan = AsyncErrorHandler(async (req, res) => {
  try {
    const io = req.app.get("io");

    const { equipmentId, serialNumber, status, condition } = req.body;
    const loanId = req.params.id;

    if (!equipmentId || (!status && !condition)) {
      return res.status(400).json({
        success: false,
        message: "equipmentId and status or condition are required.",
      });
    }

    const loanObjectId = new mongoose.Types.ObjectId(loanId);
    const eqId = new mongoose.Types.ObjectId(equipmentId);

    const loanDoc = await LoanEquipment.findById(loanObjectId);

    if (!loanDoc) {
      return res.status(404).json({
        success: false,
        message: "Loan not found.",
      });
    }

    const targetEquipment = loanDoc.equipmentIds.find(
      (eq) => eq.equipmentId.toString() === eqId.toString(),
    );

    if (!targetEquipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found in loan.",
      });
    }

    // =========================
    // FINAL STATUS
    // =========================
    let finalStatus = targetEquipment.status;

    // =========================
    // 🔥 PRIORITY 1: CONDITION OVERRIDE
    // =========================
    if (condition === "Missing") {
      finalStatus = "Missing"; // ✅ FIX HERE
    } else if (condition === "Damage") {
      finalStatus = "Damage";
    }

    // =========================
    // 🔥 PRIORITY 2: STATUS ACTIONS
    // =========================
    else if (status === "Release") {
      if (targetEquipment.status !== "Pending") {
        return res.status(400).json({
          success: false,
          message: "Only Pending equipment can be released.",
        });
      }

      if (!serialNumber) {
        return res.status(400).json({
          success: false,
          message: "Serial Number is required for release.",
        });
      }

      const registerData = await RegisterAssists.findOne({
        category: eqId,
        serialNo: serialNumber,
      });

      if (!registerData) {
        return res.status(400).json({
          success: false,
          message: "Invalid serial number or mismatched category.",
        });
      }

      const alreadyReleased = await LoanEquipment.findOne({
        "equipmentIds.serialNumber": serialNumber,
        "equipmentIds.status": "Release",
      });

      if (alreadyReleased) {
        return res.status(400).json({
          success: false,
          message: "This serial number is already released.",
        });
      }

      finalStatus = "Release";
      targetEquipment.serialNumber = serialNumber;
      targetEquipment.assistsId = registerData._id;
      targetEquipment.releaseDate = new Date();
    } else if (status === "Returned") {
      finalStatus = "Returned";
      targetEquipment.returnDate = new Date();
    }

    // fallback status
    else if (status) {
      finalStatus = status;
    }

    // =========================
    // APPLY VALUES
    // =========================
    targetEquipment.status = finalStatus;

    if (condition) {
      targetEquipment.condition = condition;
    }

    await loanDoc.save();

    // =========================
    // AGGREGATION
    // =========================
    const updatedLoanArray = await LoanEquipment.aggregate([
      { $match: { _id: loanObjectId } },
      { $unwind: "$equipmentIds" },

      {
        $lookup: {
          from: "categories",
          localField: "equipmentIds.equipmentId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "equipments",
          localField: "equipmentIds.assistsId",
          foreignField: "_id",
          as: "equipmentDetails",
        },
      },
      {
        $unwind: {
          path: "$equipmentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          "equipmentIds.categoryName": "$categoryDetails.categoryName",
          "equipmentIds.equipmentName": "$equipmentDetails.equipment",
          "equipmentIds.serialNo": "$equipmentDetails.serialNo",
          "equipmentIds.brand": "$equipmentDetails.brand",
          "equipmentIds.model": "$equipmentDetails.model",
        },
      },

      {
        $lookup: {
          from: "userloginschemas",
          localField: "inchargeId",
          foreignField: "_id",
          as: "incharge",
        },
      },
      {
        $unwind: {
          path: "$incharge",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "userloginschemas",
          localField: "borrowerId",
          foreignField: "_id",
          as: "borrower",
        },
      },
      {
        $unwind: {
          path: "$borrower",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: "$_id",
          borrower: { $first: "$borrower" },
          incharge: { $first: "$incharge" },
          borrowerId: { $first: "$borrowerId" },
          inchargeId: { $first: "$inchargeId" },
          equipmentIds: { $push: "$equipmentIds" },
          createdAt: { $first: "$createdAt" },
        },
      },
    ]);

    const updatedLoan = updatedLoanArray[0];

    const inchargeName = updatedLoan?.incharge
      ? `${updatedLoan.incharge.first_name || ""} ${updatedLoan.incharge.last_name || ""}`
      : "Unknown Incharge";

    // =========================
    // NOTIFICATION
    // =========================
    const newNotification = new Notification({
      message: `In-charge ${inchargeName} has updated equipment status/condition.`,
      viewers: (await userlogin.find({ role: "admin" }).select("_id")).map(
        (admin) => ({ user: admin._id, isRead: false }),
      ),
    });

    const savedNotification = await newNotification.save();

    // =========================
    // SOCKET
    // =========================
    io.to("role:admin").emit("updatestatusequipment:update", {
      loan: updatedLoan,
      notification: savedNotification,
    });

    io.to(`user:${updatedLoan.inchargeId}`).emit(
      "updatestatusequipment:update",
      { loan: updatedLoan },
    );

    res.status(200).json({
      success: true,
      data: updatedLoan,
      notification: savedNotification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

exports.deleteLoan = AsyncErrorHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid ID" });

    const deletedLoan = await LoanEquipment.findByIdAndDelete(id);
    if (!deletedLoan)
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });

    res
      .status(200)
      .json({ success: true, message: "Loan deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete loan", error });
  }
});

exports.ReturnLoan = AsyncErrorHandler(async (req, res) => {
  try {
    const io = req.app.get("io");
    const loanId = req.params.id; // Ito yung 69c68f75db81a224b3a0af79
    const updates = req.body; // Ito yung Array ng equipment updates

    console.log("Processing Loan ID:", loanId);
    console.log("Payloads to update:", updates);

    // 1. Validation: Siguraduhin na array ang pumasok at may loanId
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Payload must be a non-empty array of equipment updates.",
      });
    }

    // 2. Hanapin ang Loan Document
    const loanDoc = await LoanEquipment.findById(loanId);
    if (!loanDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Loan not found." });
    }

    // 3. I-loop ang bawat update request mula sa req.body
    updates.forEach((updateItem) => {
      const { equipmentId, status, serialNumber } = updateItem;

      // Hanapin ang tugmang equipment sa loob ng loanDoc.equipmentIds
      const targetEquipment = loanDoc.equipmentIds.find(
        (eq) => eq.equipmentId.toString() === equipmentId.toString(),
      );

      if (targetEquipment) {
        // I-apply ang update base sa status
        targetEquipment.status = status; // Halimbawa: "In-Review"

        if (status === "In-Review" || status === "Returned") {
          targetEquipment.returnDate = new Date();
        }

        // Kung may serialNumber na kasama, i-update din (optional logic)
        if (serialNumber) {
          targetEquipment.serialNumber = serialNumber;
        }
      }
    });

    // 4. I-save ang kabuuang document (isang save lang para sa lahat ng items)
    await loanDoc.save();

    // 5. Re-fetch para sa Socket at Response gamit ang Aggregate (kapareho ng dati)
    const updatedLoanArray = await LoanEquipment.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(loanId) } },
      { $unwind: "$equipmentIds" },
      {
        $lookup: {
          from: "categories",
          localField: "equipmentIds.equipmentId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "equipments",
          localField: "equipmentIds.assistsId",
          foreignField: "_id",
          as: "equipmentDetails",
        },
      },
      {
        $unwind: {
          path: "$equipmentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "equipmentIds.categoryName": "$categoryDetails.categoryName",
          "equipmentIds.equipmentName": "$equipmentDetails.equipment",
          "equipmentIds.serialNo": "$equipmentDetails.serialNo",
        },
      },
      {
        $lookup: {
          from: "userloginschemas",
          localField: "borrowerId",
          foreignField: "_id",
          as: "borrower",
        },
      },
      { $unwind: { path: "$borrower", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          borrower: { $first: "$borrower" },
          equipmentIds: { $push: "$equipmentIds" },
          createdAt: { $first: "$createdAt" },
        },
      },
    ]);

    const updatedLoan = updatedLoanArray[0];

    // 6. Socket Emission
    io.to("role:admin").emit("updatestatusequipment:update", {
      loan: updatedLoan,
      message: `Multiple items set to In-Review for loan ${loanId}`,
    });

    res.status(200).json({
      success: true,
      data: updatedLoan,
    });
  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

exports.getLatestEquipment = AsyncErrorHandler(async (req, res) => {
  try {
    const mongoose = require("mongoose");

    const role = req.user.role;
    const userId = req.user._id;
    let { page = 1, limit = 5, search = "" } = req.query;

    page = Math.max(1, parseInt(page) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (page - 1) * limit;

    const cleanSearch = search?.trim().replace(/\s+/g, " ");
    const searchTerms = cleanSearch ? cleanSearch.split(" ") : [];

    // 🔥 ROLE-BASED FILTER (IMPORTANT FIX)
    const matchFilter =
      role?.toLowerCase() === "admin"
        ? {} // admin = all data
        : {
            $or: [
              { borrowerId: new mongoose.Types.ObjectId(userId) },
              { inchargeId: new mongoose.Types.ObjectId(userId) },
            ],
          };

    const pipeline = [
      // 🔥 APPLY FILTER EARLY
      { $match: matchFilter },

      // ✅ Incharge
      {
        $lookup: {
          from: "userloginschemas",
          localField: "inchargeId",
          foreignField: "_id",
          as: "incharge",
        },
      },
      { $unwind: { path: "$incharge", preserveNullAndEmptyArrays: true } },

      // ✅ Borrower
      {
        $lookup: {
          from: "borrowers",
          localField: "borrowerId",
          foreignField: "_id",
          as: "borrowerDoc",
        },
      },
      {
        $unwind: {
          path: "$borrowerDoc",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ Borrower → UserLogin
      {
        $lookup: {
          from: "userloginschemas",
          localField: "borrowerDoc.linkedId",
          foreignField: "_id",
          as: "borrowerUser",
        },
      },
      {
        $unwind: {
          path: "$borrowerUser",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ Equipment
      {
        $unwind: {
          path: "$equipmentIds",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ Category
      {
        $lookup: {
          from: "categories",
          localField: "equipmentIds.equipmentId",
          foreignField: "_id",
          as: "cat",
        },
      },
      { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },

      // ✅ Fields
      {
        $addFields: {
          "equipmentIds.categoryName": "$cat.categoryName",

          borrowerFullName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$borrowerUser.first_name", ""] },
                  " ",
                  { $ifNull: ["$borrowerUser.middle_name", ""] },
                  " ",
                  { $ifNull: ["$borrowerUser.last_name", ""] },
                  " ",
                  { $ifNull: ["$borrowerUser.suffix", ""] },
                ],
              },
            },
          },

          borrower: {
            fullName: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ["$borrowerUser.first_name", "Unknown"] },
                    " ",
                    { $ifNull: ["$borrowerUser.last_name", ""] },
                  ],
                },
              },
            },
            rfidId: "$borrowerDoc.rfidId",
            contactNumber: "$borrowerDoc.contactNumber",
            role: "$borrowerUser.role",
            avatar: "$borrowerUser.avatar.url",
            laboratoryId: "$borrowerDoc.laboratoryId",
          },

          "incharge.fullName": {
            $concat: [
              { $ifNull: ["$incharge.first_name", ""] },
              " ",
              { $ifNull: ["$incharge.last_name", ""] },
            ],
          },
        },
      },

      // 🔥 SEARCH
      ...(searchTerms.length
        ? [
            {
              $match: {
                $and: searchTerms.map((term) => ({
                  $or: [
                    { borrowerFullName: { $regex: term, $options: "i" } },
                    { "borrower.rfidId": { $regex: term, $options: "i" } },
                    { "incharge.fullName": { $regex: term, $options: "i" } },
                    {
                      "equipmentIds.categoryName": {
                        $regex: term,
                        $options: "i",
                      },
                    },
                  ],
                })),
              },
            },
          ]
        : []),

      // ✅ GROUP
      {
        $group: {
          _id: "$_id",
          borrower: { $first: "$borrower" },
          incharge: { $first: "$incharge" },
          equipmentIds: { $push: "$equipmentIds" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
        },
      },

      // 🔽 SORT
      { $sort: { updatedAt: -1 } },

      // 📦 PAGINATION
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ];

    const result = await LoanEquipment.aggregate(pipeline);

    const data = result?.[0]?.data || [];
    const total = result?.[0]?.metadata?.[0]?.total || 0;

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch latest equipment",
      error: error.message,
    });
  }
});
// controllers/equipmentController.js
exports.getSpecificData = AsyncErrorHandler(async (req, res) => {
  try {
    const userId = req.user.linkId;
    let { page = 1, limit = 5, status } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid User ID" });
    }

    const borrowerDoc = await Borrower.findOne({ linkedId: userId });
    if (!borrowerDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Borrower not found" });
    }
    const borrowerId = borrowerDoc._id;

    // 🔢 STATS AGGREGATION (Para sa Dashboard Cards)
    const statsAggregation = await LoanEquipment.aggregate([
      { $match: { borrowerId } },
      { $unwind: "$equipmentIds" },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          returnedItems: {
            $sum: {
              $cond: [{ $eq: ["$equipmentIds.status", "Returned"] }, 1, 0],
            },
          },
          issuesFound: {
            $sum: { $cond: [{ $ne: ["$equipmentIds.condition", "Ok"] }, 1, 0] },
          },
        },
      },
    ]);

    const stats = statsAggregation[0] || {
      totalRecords: 0,
      returnedItems: 0,
      issuesFound: 0,
    };

    // 🔢 TOTAL ENTRIES (Para sa Pagination calculation)
    const totalCountAgg = await LoanEquipment.aggregate([
      { $match: { borrowerId } },
      { $unwind: "$equipmentIds" },
      ...(status ? [{ $match: { "equipmentIds.status": status } }] : []),
      { $count: "total" },
    ]);
    const totalEntries = totalCountAgg[0]?.total || 0;
    const totalPages = Math.ceil(totalEntries / limit);

    // 📦 PAGINATED DATA
    const data = await LoanEquipment.aggregate([
      { $match: { borrowerId } },
      { $unwind: "$equipmentIds" },
      ...(status ? [{ $match: { "equipmentIds.status": status } }] : []),
      {
        $lookup: {
          from: "categories",
          localField: "equipmentIds.equipmentId",
          foreignField: "_id",
          as: "cat",
        },
      },
      { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
      { $sort: { "equipmentIds._id": -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          _id: "$equipmentIds._id",
          status: "$equipmentIds.status",
          condition: "$equipmentIds.condition",
          serialNumber: "$equipmentIds.serialNumber",
          returnDate: "$equipmentIds.returnDate",
          categoryName: "$cat.categoryName",
          categoryDescription: "$cat.discription",
        },
      },
    ]);

    res.status(200).json({
      success: true,
      totalEntries,
      totalPages,
      currentPage: page,
      stats,
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

exports.generateReport = AsyncErrorHandler(async (req, res) => {
  let { status, dateFrom, dateTo } = req.query;
  const userId = req.user._id;
  const role = req.user.role;

  // Date filter builder (unchanged)
  let dateFilter = {};
  let startDate = null,
    endDate = null;
  if (dateFrom || dateTo) {
    if (dateFrom) {
      startDate = new Date(dateFrom);
      if (isNaN(startDate))
        throw new CustomError("Invalid dateFrom format", 400);
      startDate.setHours(0, 0, 0, 0);
      dateFilter.createdAt = { ...dateFilter.createdAt, $gte: startDate };
    }
    if (dateTo) {
      endDate = new Date(dateTo);
      if (isNaN(endDate)) throw new CustomError("Invalid dateTo format", 400);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { ...dateFilter.createdAt, $lte: endDate };
    }
  }

  const matchStage = {};
  if (Object.keys(dateFilter).length > 0)
    matchStage.createdAt = dateFilter.createdAt;

  // Add role-based filtering
  if (role === "in-charge") {
    matchStage.inchargeId = userId;
  }

  const pipeline = [{ $match: matchStage }, { $unwind: "$equipmentIds" }];

  if (status && status !== "All") {
    pipeline.push({ $match: { "equipmentIds.status": status } });
  }

  pipeline.push(
    {
      $lookup: {
        from: "borrowers",
        localField: "borrowerId",
        foreignField: "_id",
        as: "borrowerDoc",
      },
    },
    { $unwind: { path: "$borrowerDoc", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "userloginschemas",
        localField: "borrowerDoc.linkedId",
        foreignField: "_id",
        as: "borrowerUser",
      },
    },
    { $unwind: { path: "$borrowerUser", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "userloginschemas",
        localField: "inchargeId",
        foreignField: "_id",
        as: "inchargeUser",
      },
    },
    { $unwind: { path: "$inchargeUser", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "categories",
        localField: "equipmentIds.equipmentId",
        foreignField: "_id",
        as: "categoryInfo",
      },
    },
    { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
    { $sort: { "equipmentIds._id": -1 } },
    {
      $project: {
        _id: "$equipmentIds._id",
        status: "$equipmentIds.status",
        condition: "$equipmentIds.condition",
        serialNumber: "$equipmentIds.serialNumber",
        returnDate: "$equipmentIds.returnDate",
        createdAt: 1,
        categoryName: { $ifNull: ["$categoryInfo.categoryName", "N/A"] },
        borrowerName: {
          $cond: {
            if: { $ifNull: ["$borrowerUser.first_name", false] },
            then: {
              $concat: [
                "$borrowerUser.first_name",
                " ",
                "$borrowerUser.last_name",
                {
                  $cond: {
                    if: { $ne: ["$borrowerUser.suffix", null] },
                    then: { $concat: [", ", "$borrowerUser.suffix"] },
                    else: "",
                  },
                },
              ],
            },
            else: { $ifNull: ["$borrowerUser.username", "N/A"] },
          },
        },
        inchargeName: {
          $cond: {
            if: { $ifNull: ["$inchargeUser.first_name", false] },
            then: {
              $concat: [
                "$inchargeUser.first_name",
                " ",
                "$inchargeUser.last_name",
                {
                  $cond: {
                    if: { $ne: ["$inchargeUser.suffix", null] },
                    then: { $concat: [", ", "$inchargeUser.suffix"] },
                    else: "",
                  },
                },
              ],
            },
            else: { $ifNull: ["$inchargeUser.username", "N/A"] },
          },
        },
      },
    },
  );

  const data = await LoanEquipment.aggregate(pipeline);
  if (!data || data.length === 0)
    throw new CustomError("No loan records found for the given filters", 404);

  const totalRecords = data.length;
  const returnedItems = data.filter(
    (item) => item.status === "Returned",
  ).length;
  const issuesFound = data.filter((item) => item.condition !== "Ok").length;

  // ========== LANDSCAPE PDF ==========
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Equipment_Loan_Report_${Date.now()}.pdf`,
  );
  doc.pipe(res);

  // Helper: Consistent date formatting
  const formatDate = (date, fallback = "N/A") => {
    if (!date) return fallback;
    const d = new Date(date);
    return isNaN(d.getTime())
      ? fallback
      : d.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  // Logo (optional)
  const logoPath = path.join(__dirname, "../public/image/logo.jpg");
  if (fs.existsSync(logoPath)) {
    const logoWidth = 65;
    const centerX = (doc.page.width - logoWidth) / 2;
    doc.image(logoPath, centerX, 25, { width: logoWidth });
    doc.moveDown(3.5);
  } else {
    doc.moveDown(1.5);
  }

  // University header
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("Republic of the Philippines", { align: "center" })
    .text("BILIRAN PROVINCE STATE UNIVERSITY", { align: "center" })
    .text("6560 Naval, Biliran Province", { align: "center" })
    .moveDown(1);

  // Title
  doc
    .fontSize(13)
    .text("Equipment Loan Report", { align: "center" })
    .moveDown(0.5);

  // Filter summary
  let filterText = "All records";
  if (status && status !== "All") filterText = `Status: ${status}`;
  if (startDate || endDate) {
    const from = startDate ? `From ${formatDate(startDate)}` : "";
    const to = endDate ? `To ${formatDate(endDate)}` : "";
    filterText +=
      (filterText !== "All records" ? " | " : "") +
      [from, to].filter(Boolean).join("  ");
  }
  doc
    .font("Helvetica")
    .fontSize(8)
    .text(filterText, { align: "center" })
    .moveDown(0.3);

  // Stats line
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(
      `Total: ${totalRecords}    |    Returned: ${returnedItems}    |    Issues: ${issuesFound}`,
      { align: "center" },
    )
    .moveDown(0.2)
    .font("Helvetica")
    .fontSize(8)
    .text(`Generated: ${formatDate(new Date())}`, { align: "center" })
    .moveDown(1);

  // ========== TABLE CONFIGURATION (Landscape Optimized) ==========
  const margins = doc.page.margins;
  const pageWidth = doc.page.width - margins.left - margins.right;
  const pageContentHeight = doc.page.height - margins.top - margins.bottom;

  const colRatios = [0.1, 0.18, 0.18, 0.12, 0.12, 0.1, 0.1, 0.1];
  const columnWidths = colRatios.map((ratio) => ratio * pageWidth);
  const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
  const startX = margins.left;

  const headerFontSize = 8.5;
  const dataFontSize = 8;
  const rowHeight = 28;
  const footerHeight = 15; // taas ng footer text

  let currentY = doc.y;
  let pageNum = 1;

  // Helper: Draw footer sa ilalim ng current page
  const drawFooter = () => {
    const footerY = doc.page.height - margins.bottom - footerHeight;
    doc.fontSize(7).font("Helvetica-Oblique").text(
      `EPDO – Equipment Loan Report  |  Page ${pageNum} of ?`, // temporary, updated later
      margins.left,
      footerY,
      { align: "center", width: pageWidth },
    );
  };

  // Helper: Draw header with background
  const drawHeader = (y) => {
    doc
      .rect(startX, y - 2, tableWidth, rowHeight)
      .fill("#e8f0fe")
      .stroke();
    doc.fillColor("#000000");
    doc.font("Helvetica-Bold").fontSize(headerFontSize);
    let x = startX;
    const headers = [
      "Date Loaned",
      "Borrower",
      "In-Charge",
      "Category",
      "Serial No.",
      "Status",
      "Condition",
      "Return Date",
    ];
    headers.forEach((h, i) => {
      doc.text(h, x + 2, y + 5, { width: columnWidths[i] - 4, align: "left" });
      x += columnWidths[i];
    });
    doc
      .moveTo(startX, y + rowHeight - 2)
      .lineTo(startX + tableWidth, y + rowHeight - 2)
      .stroke();
    return y + rowHeight;
  };

  // Helper: Draw a row with text wrapping
  const drawRow = (record, y, rowIndex) => {
    if (rowIndex % 2 === 0) {
      doc
        .rect(startX, y - 2, tableWidth, rowHeight)
        .fill("#f9f9f9")
        .stroke();
      doc.fillColor("#000000");
    }

    const loanDate = formatDate(record.createdAt);
    const returnDate = formatDate(record.returnDate, "Not returned");

    const rowData = [
      loanDate,
      record.borrowerName || "N/A",
      record.inchargeName || "N/A",
      record.categoryName || "N/A",
      record.serialNumber || "N/A",
      record.status || "N/A",
      record.condition || "N/A",
      returnDate,
    ];

    doc.font("Helvetica").fontSize(dataFontSize);
    let x = startX;
    rowData.forEach((text, i) => {
      doc.text(String(text), x + 2, y + 4, {
        width: columnWidths[i] - 4,
        align: "left",
        lineBreak: true,
      });
      x += columnWidths[i];
    });
    return y + rowHeight;
  };

  // Draw first header
  currentY = drawHeader(currentY);
  let rowIndex = 0;
  let totalPages = 1; // pansamantala, kalkulahin mamaya

  // I-save ang posisyon ng bawat page break para sa tamang page count
  // Simple approach: i-loop muna para tantiyahin ang total pages, o kaya ay i-draw at i-track.
  // Mas madali: i-draw ang lahat, tapos i-update ang footer page numbers sa pamamagitan ng pag-render sa pangalawang pass?
  // Hindi praktikal. Sa halip, gamitin ang karaniwang technique: i-store ang mga page break positions,
  // o kaya ay i-render nang may temporary page number, tapos i-overwrite? Hindi supported.
  // Alternative: kalkulahin ang total pages bago mag-draw gamit ang rows per page.
  const rowsPerPage = Math.floor(
    (pageContentHeight - (currentY - margins.top)) / rowHeight,
  );
  totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));

  // I-reset ang doc para sa actual drawing? Hindi na kailangan, pero kailangan nating i-reset ang currentY at pageNum.
  // Dahil hindi tayo pwedeng mag-rewind, gagamitin natin ang precomputed totalPages sa drawFooter.
  // Ngunit ang currentY ay nagbago na. Kailangan nating i-restart ang drawing? Hindi na kailangan, dahil ang first draw ay ginawa na.
  // Simple solution: ilipat ang footer drawing function para gamitin ang totalPages na compute bago ang loop.
  // I-adjust ang drawFooter upang tumanggap ng page number at total pages.

  const drawFooterWithPage = (pageNo, total) => {
    const footerY = doc.page.height - margins.bottom - footerHeight;
    doc
      .fontSize(7)
      .font("Helvetica-Oblique")
      .text(
        `EPDO – Equipment Loan Report  |  Page ${pageNo} of ${total}`,
        margins.left,
        footerY,
        { align: "center", width: pageWidth },
      );
  };

  // I-draw muli ang unang header? Hindi, dahil na-draw na.
  // Sa halip, ituloy ang pagguhit ng mga row, at gamitin ang bagong drawFooterWithPage.

  // I-override ang drawFooter na ginamit sa loop (kung may existing), ngunit wala pa.
  // Gagamitin natin ang bagong function sa page break at sa dulo.

  for (let i = 0; i < data.length; i++) {
    const record = data[i];
    // Kailangan ng space para sa row + footer?
    const spaceNeeded = rowHeight + footerHeight;
    if (currentY + spaceNeeded > doc.page.height - margins.bottom) {
      drawFooterWithPage(pageNum, totalPages);
      doc.addPage();
      pageNum++;
      currentY = margins.top + 10;
      currentY = drawHeader(currentY);
      rowIndex = 0;
    }
    currentY = drawRow(record, currentY, rowIndex);
    rowIndex++;
  }

  // Final footer sa huling pahina
  drawFooterWithPage(pageNum, totalPages);

  // Bottom border line
  doc
    .moveTo(startX, currentY - 2)
    .lineTo(startX + tableWidth, currentY - 2)
    .stroke();

  doc.end();
});
