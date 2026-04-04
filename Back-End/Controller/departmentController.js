const Department = require("../Models/DepartmentSchema");

// CREATE DEPARTMENT
exports.createDepartment = async (req, res) => {
  try {
    const { departmentName } = req.body;

    if (!departmentName) {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const newDepartment = await Department.create({ departmentName });

    const io = req.app.get("io");
    if (io) {
      io.to("admin-incharge-shared").emit("department:created", newDepartment);
      console.log(
        "📢 Socket broadcast sent to Admin and In-charge shared room",
      );
    }

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: newDepartment,
    });
  } catch (error) {
    console.error("Create Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// GET ALL DEPARTMENTS WITH SEARCH + PAGINATION
exports.getAllDepartments = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    search = search.replace(/\+/g, " ");

    const searchFilter = search
      ? { departmentName: { $regex: search, $options: "i" } }
      : {};

    const totalDepartments = await Department.countDocuments(searchFilter);

    const departments = await Department.find(searchFilter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPages = Math.ceil(totalDepartments / limit);

    res.status(200).json({
      success: true,
      data: departments,
      pagination: {
        totalDepartments,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Get Departments Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// GET SINGLE DEPARTMENT
exports.getSingleDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      department,
    });
  } catch (error) {
    console.error("Get Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// UPDATE DEPARTMENT
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentName } = req.body;

    const department = await Department.findByIdAndUpdate(
      id,
      { departmentName },
      { new: true, runValidators: true },
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      department,
    });
  } catch (error) {
    console.error("Update Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// DELETE DEPARTMENT
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByIdAndDelete(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Delete Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
