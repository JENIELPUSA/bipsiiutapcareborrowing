const LoanEquipment = require("../Models/EnchargeBorroweSchema"); // path sa schema mo
const mongoose = require("mongoose");

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
      message: `${borrower.firstName || ""} ${borrower.lastName || ""} requested equipment: ${categoryList}.`,
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
  try {
    const { rfidData } = req.params;
    let { page = 1, limit = 10, status } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // Find borrower
    const borrower = await Borrower.findOne({ rfidId: rfidData });
    if (!borrower) {
      return res.status(404).json({
        success: false,
        message: "Borrower not found",
      });
    }

    const borrowerId = borrower._id;

    // Count total equipment items after optional status filter
    const totalAggregation = await LoanEquipment.aggregate([
      { $match: { borrowerId } },
      { $unwind: "$equipmentIds" },
      ...(status ? [{ $match: { "equipmentIds.status": status } }] : []),
      { $count: "total" },
    ]);

    const totalEntries = totalAggregation[0]?.total || 0;
    const totalPages = Math.ceil(totalEntries / limit);

    // ---------------------------
    // PAGINATED DATA PIPELINE
    // ---------------------------
    const paginatedPipeline = [
      { $match: { borrowerId } },
      { $unwind: "$equipmentIds" },
      ...(status ? [{ $match: { "equipmentIds.status": status } }] : []),

      // Lookup category
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

      // Lookup equipment details
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

      // Merge details
      {
        $addFields: {
          "equipmentIds.categoryName": "$categoryDetails.categoryName",
          "equipmentIds.categoryDescription": "$categoryDetails.discription",
          "equipmentIds.equipmentName": "$equipmentDetails.equipment",
          "equipmentIds.serialNumber": {
            $ifNull: [
              "$equipmentDetails.serialNo",
              "$equipmentIds.serialNumber",
            ],
          },
          "equipmentIds.brand": "$equipmentDetails.brand",
          "equipmentIds.model": "$equipmentDetails.model",
        },
      },

      // Lookup incharge
      {
        $lookup: {
          from: "userloginschemas",
          localField: "inchargeId",
          foreignField: "_id",
          as: "incharge",
        },
      },
      { $unwind: { path: "$incharge", preserveNullAndEmptyArrays: true } },

      // Lookup borrower
      {
        $lookup: {
          from: "borrowers",
          localField: "borrowerId",
          foreignField: "_id",
          as: "borrower",
        },
      },
      { $unwind: { path: "$borrower", preserveNullAndEmptyArrays: true } },

      { $sort: { "equipmentIds._id": -1 } },

      // Pagination
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const equipmentAggregation =
      await LoanEquipment.aggregate(paginatedPipeline);

    // ---------------------------
    // ALL DATA PIPELINE (Only Released)
    // ---------------------------
    const allPipeline = [
      { $match: { borrowerId } },
      { $unwind: "$equipmentIds" },

      // Only Released equipment
      { $match: { "equipmentIds.status": "Release" } },

      // Lookup category
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

      // Lookup equipment details
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

      // Merge details
      {
        $addFields: {
          "equipmentIds.categoryName": "$categoryDetails.categoryName",
          "equipmentIds.categoryDescription": "$categoryDetails.discription",
          "equipmentIds.equipmentName": "$equipmentDetails.equipment",
          "equipmentIds.serialNumber": {
            $ifNull: [
              "$equipmentDetails.serialNo",
              "$equipmentIds.serialNumber",
            ],
          },
          "equipmentIds.brand": "$equipmentDetails.brand",
          "equipmentIds.model": "$equipmentDetails.model",
        },
      },

      // Lookup incharge
      {
        $lookup: {
          from: "userloginschemas",
          localField: "inchargeId",
          foreignField: "_id",
          as: "incharge",
        },
      },
      { $unwind: { path: "$incharge", preserveNullAndEmptyArrays: true } },

      // Lookup borrower
      {
        $lookup: {
          from: "borrowers",
          localField: "borrowerId",
          foreignField: "_id",
          as: "borrower",
        },
      },
      { $unwind: { path: "$borrower", preserveNullAndEmptyArrays: true } },

      { $sort: { "equipmentIds._id": -1 } },
    ];

    const allEquipmentAggregation = await LoanEquipment.aggregate(allPipeline);

    // ---------------------------
    // RESPOND
    // ---------------------------
    res.status(200).json({
      success: true,
      totalEntries,
      totalPages,
      currentPage: page,
      data: equipmentAggregation.map((e) => ({
        _id: e._id,
        borrower: e.borrower,
        incharge: e.incharge,
        borrowerId: e.borrowerId,
        inchargeId: e.inchargeId,
        equipment: e.equipmentIds,
        createdAt: e.createdAt,
      })),
      allData: allEquipmentAggregation.map((e) => ({
        _id: e._id,
        borrower: e.borrower,
        incharge: e.incharge,
        borrowerId: e.borrowerId,
        inchargeId: e.inchargeId,
        equipment: e.equipmentIds,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get loan",
      error,
    });
  }
});

exports.updateLoan = AsyncErrorHandler(async (req, res) => {
  try {
    const io = req.app.get("io");
    const { equipmentId, serialNumber, status } = req.body;
    const loanId = req.params.id;

    console.log("loanId", loanId);

    console.log("req.body", req.body);

    if (!equipmentId || !status) {
      return res.status(400).json({
        success: false,
        message: "equipmentId and status are required.",
      });
    }

    const loanObjectId = new mongoose.Types.ObjectId(loanId);
    const eqId = new mongoose.Types.ObjectId(equipmentId);

    const loanDoc = await LoanEquipment.findById(loanObjectId);
    if (!loanDoc)
      return res
        .status(404)
        .json({ success: false, message: "Loan not found." });

    const targetEquipment = loanDoc.equipmentIds.find(
      (eq) => eq.equipmentId.toString() === eqId.toString(),
    );

    if (!targetEquipment)
      return res.status(404).json({
        success: false,
        message: "Equipment not found in loan.",
      });

    if (status === "Release") {
      // Only Pending can be released
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

      // Check in RegisterAssists
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

      // Prevent duplicate release across all loans
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

      targetEquipment.status = status;
      targetEquipment.serialNumber = serialNumber;
      targetEquipment.assistsId = registerData._id;
      targetEquipment.releaseDate = new Date();
    } else if (status === "Returned") {
      targetEquipment.status = status;
      targetEquipment.returnDate = new Date();
    } else {
      targetEquipment.status = status;
    }

    await loanDoc.save();

    const updatedLoanArray = await LoanEquipment.aggregate([
      { $match: { _id: loanObjectId } },
      { $unwind: "$equipmentIds" },

      // Lookup categories
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

      // Lookup equipment details
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

      // Merge fields
      {
        $addFields: {
          "equipmentIds.categoryName": "$categoryDetails.categoryName",
          "equipmentIds.equipmentName": "$equipmentDetails.equipment",
          "equipmentIds.serialNo": "$equipmentDetails.serialNo",
          "equipmentIds.brand": "$equipmentDetails.brand",
          "equipmentIds.model": "$equipmentDetails.model",
        },
      },

      // Lookup incharge
      {
        $lookup: {
          from: "userloginschemas",
          localField: "inchargeId",
          foreignField: "_id",
          as: "incharge",
        },
      },
      { $unwind: { path: "$incharge", preserveNullAndEmptyArrays: true } },

      // Lookup borrower
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
          incharge: { $first: "$incharge" },
          borrowerId: { $first: "$borrowerId" },
          inchargeId: { $first: "$inchargeId" },
          equipmentIds: { $push: "$equipmentIds" },
          createdAt: { $first: "$createdAt" },
        },
      },
    ]);

    const updatedLoan = updatedLoanArray[0];
    const borrowerName = updatedLoan.borrower
      ? `${updatedLoan.borrower.firstName || ""} ${updatedLoan.borrower.lastName || ""}`
      : "Unknown Borrower";

    const inchargeName = updatedLoan.incharge
      ? `${updatedLoan.incharge.first_name || ""} ${updatedLoan.incharge.last_name || ""}`
      : "Unknown Incharge";

    const newNotification = new Notification({
      message: `Incharge ${inchargeName} updated equipment [${status}] for borrower ${borrowerName}.`,
      viewers: (await userlogin.find({ role: "admin" }).select("_id")).map(
        (admin) => ({ user: admin._id, isRead: false }),
      ),
    });

    const savedNotification = await newNotification.save();

    // Emit socket
    io.to("role:admin").emit("updatestatusequipment:update", {
      loan: updatedLoan,
      notification: savedNotification,
    });

    res.status(200).json({
      success: true,
      data: updatedLoan,
      notification: savedNotification,
    });
  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
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
