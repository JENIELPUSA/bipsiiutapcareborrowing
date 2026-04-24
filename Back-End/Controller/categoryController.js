const Category = require("../Models/categorySchema");
const Equipment = require("../Models/RegisterAssitsSchema");
const LoanEquipment = require("../Models/EnchargeBorroweSchema");

exports.getAllCategory = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    search = search.replace(/\+/g, " ");

    const matchStage = search
      ? {
          $or: [
            { categoryName: { $regex: search, $options: "i" } },
            { discription: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const skip = (page - 1) * limit;

    // 📦 CATEGORIES
    const categories = await Category.find(matchStage)
      .skip(skip)
      .limit(limit);

    // 🔥 LOANS (CLEAN FIX)
    const loaned = await LoanEquipment.aggregate([
      { $unwind: "$equipmentIds" },

      {
        $match: {
          "equipmentIds.status": {
            $in: ["Release", "Pending"],
          },
        },
      },

      // 🚨 REMOVE NULL FIX
      {
        $match: {
          "equipmentIds.assistsId": { $ne: null },
        },
      },

      {
        $project: {
          equipmentId: {
            $toString: "$equipmentIds.assistsId",
          },
        },
      },
    ]);

    const borrowedSet = new Set(
      loaned
        .map(l => l.equipmentId)
        .filter(Boolean) 
    );
    const equipments = await Equipment.find({})
      .select("_id category");

    const grouped = {};

    for (const eq of equipments) {
      const catId = eq.category.toString();

      if (!grouped[catId]) {
        grouped[catId] = [];
      }

      grouped[catId].push(eq._id.toString());
    }

    // 🔥 BUILD RESPONSE
    const result = categories.map(cat => {
      const eqList =
        grouped[cat._id.toString()] || [];

      const hasBorrowed = eqList.some(id =>
        borrowedSet.has(id)
      );

      return {
        ...cat.toObject(),
        equipmentCount: eqList.length,
        status: hasBorrowed
          ? "Not Available"
          : "Available",
      };
    });

    const totalCategories = await Category.countDocuments(matchStage);

    res.status(200).json({
      success: true,
      data: result,
      pagination: {
        totalCategories,
        totalPages: Math.ceil(totalCategories / limit),
        currentPage: page,
        limit,
      },
    });

  } catch (error) {
    console.error("ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    console.log("Received create category request with body:", req.body);

    const { categoryName, discription } = req.body;

    if (!categoryName || !discription) {
      return res.status(400).json({
        success: false,
        message: "Category categoryName and discription are required",
      });
    }

    const newCategory = await Category.create({
      categoryName,
      discription,
    });

    const io = req.app.get("io");

    if (io) {
      io.to("admin-incharge-shared").emit("category:created", newCategory);

      console.log(
        "📢 Socket broadcast sent to Admin and In-charge shared room",
      );
    }

    res.status(201).json({
      status: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    console.error("Create Category Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// GET SINGLE CATEGORY
exports.getSingleCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// UPDATE CATEGORY
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, discription } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { categoryName, discription },
      { new: true, runValidators: true },
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// DELETE CATEGORY
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// GET CATEGORY DROPDOWN (Simplified)
exports.categoryDropdown = async (req, res) => {
  try {
    const { all } = req.query;

    // Kung all=true, walang limit. Kung wala, default ay 10.
    const limitValue = all === "true" ? 0 : 10;

    const categories = await Category.find({})
      .sort({ created_at: -1 })
      .limit(limitValue);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Category Dropdown Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
