const Laboratory = require("../Models/LaboratoryScchema");
const RegisterEquipment = require("../Models/RegisterAssitsSchema");
const Userlogin = require("../Models/LogInSchema");
const mongoose = require("mongoose");

exports.createLaboratory = async (req, res) => {
  try {
    console.log("Create Laboratory Request Body:", req.body);
    const { laboratoryName, description, departmentId } = req.body;

    if (!laboratoryName || !description) {
      return res.status(400).json({
        success: false,
        message: "Laboratory name and description are required",
      });
    }

    const newLaboratory = await Laboratory.create({
      laboratoryName,
      description,
      departmentId,
    });

    const io = req.app.get("io");

    if (io) {
      io.to("admin-incharge-shared").emit("laboratory:created", newLaboratory);
      console.log(
        "📢 Socket broadcast sent to Admin and In-charge shared room",
      );
    }

    res.status(201).json({
      success: true,
      message: "Laboratory created successfully",
      data: newLaboratory,
    });
  } catch (error) {
    console.error("Create Laboratory Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.getAllLaboratory = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    search = search.replace(/\+/g, " ");

    const searchFilter = search
      ? {
          $or: [
            { laboratoryName: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const totalLaboratories = await Laboratory.countDocuments(searchFilter);

    const laboratories = await Laboratory.aggregate([
      { $match: searchFilter },

      {
        $lookup: {
          from: "departments", // collection name
          localField: "departmentId",
          foreignField: "_id",
          as: "department",
        },
      },

      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true,
        },
      },

      { $sort: { created_at: -1 } },

      { $skip: (page - 1) * limit },

      { $limit: limit },
    ]);

    const totalPages = Math.ceil(totalLaboratories / limit);

    res.status(200).json({
      success: true,
      data: laboratories,
      pagination: {
        totalLaboratories,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Get Laboratories Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.getSingleLaboratory = async (req, res) => {
  try {
    const { id } = req.params;

    const laboratory = await Laboratory.findById(id);

    if (!laboratory) {
      return res.status(404).json({
        success: false,
        message: "Laboratory not found",
      });
    }

    res.status(200).json({
      success: true,
      laboratory,
    });
  } catch (error) {
    console.error("Get Laboratory Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.updateLaboratory = async (req, res) => {
  try {
    const { id } = req.params;
    const { laboratoryName, description } = req.body;

    const laboratory = await Laboratory.findByIdAndUpdate(
      id,
      { laboratoryName, description },
      { new: true, runValidators: true },
    );

    if (!laboratory) {
      return res.status(404).json({
        success: false,
        message: "Laboratory not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Laboratory updated successfully",
      laboratory,
    });
  } catch (error) {
    console.error("Update Laboratory Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.deleteLaboratory = async (req, res) => {
  try {
    const { id } = req.params;

    const laboratory = await Laboratory.findByIdAndDelete(id);

    if (!laboratory) {
      return res.status(404).json({
        success: false,
        message: "Laboratory not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Laboratory deleted successfully",
    });
  } catch (error) {
    console.error("Delete Laboratory Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.getAllLaboratorydropdown = async (req, res) => {
  try {
    const { all } = req.query;

    const pipeline = [
      {
        $lookup: {
          from: "departments", // ✅ correct (plural)
          localField: "departmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          laboratoryName: 1,
          description: 1,
          departmentId: 1,
          departmentName: "$department.departmentName",
        },
      },
      {
        $sort: { created_at: -1 }, // ✅ FIXED
      },
    ];

    if (all !== "true") {
      pipeline.push({ $limit: 10 });
    }

    const laboratories = await Laboratory.aggregate(pipeline);

    console.log(laboratories); // 🔥 DEBUG

    res.status(200).json({
      success: true,
      total: laboratories.length,
      data: laboratories,
    });
  } catch (error) {
    console.error("Get Laboratories Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


exports.getAllCategoryDropdown = async (req, res) => {
  try {
    const { laboratoryId } = req.query;

    if (!laboratoryId) {
      return res.status(400).json({
        success: false,
        message: "laboratoryId is required in query",
      });
    }

    const labObjId = new mongoose.Types.ObjectId(laboratoryId);

    // 🔍 Hanapin in-charge user ng laboratory na ito
    const inchargeUser = await Userlogin.findOne({
      laboratoryId: labObjId,
      role: "in-charge",
    });

    if (!inchargeUser) {
      return res.status(404).json({
        success: false,
        message: "No in-charge found for this laboratory",
      });
    }

    const inchargeObjectId = new mongoose.Types.ObjectId(inchargeUser._id);

    // 🔥 Aggregate categories
    const categories = await RegisterEquipment.aggregate([
      {
        $match: { incharge: inchargeObjectId },
      },
      {
        $group: { _id: "$category" }, // unique category
      },
      {
        $lookup: {
          from: "categories", // exact collection name
          localField: "_id",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      { $unwind: "$categoryData" },
      {
        $project: {
          _id: 0,
          categoryId: "$_id",
          categoryName: "$categoryData.categoryName",
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
