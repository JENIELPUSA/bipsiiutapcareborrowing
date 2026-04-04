const mongoose = require("mongoose");
const LogActionAudit = require("../Models/LogActionAudit");
const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");

exports.displayAuditLogs = AsyncErrorHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const { type, dateFrom, dateTo } = req.query;
  const matchFilter = {};
  if (type) matchFilter.type = type;

  if (dateFrom || dateTo) {
    matchFilter.createdAt = {};
    if (dateFrom) matchFilter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const dateToEnd = new Date(dateTo);
      dateToEnd.setHours(23, 59, 59, 999);
      matchFilter.createdAt.$lte = dateToEnd;
    }
  }

  const logs = await LogActionAudit.aggregate([
    { $match: matchFilter },

    {
      $facet: {
        officerLogs: [
          { $match: { performedByModel: "Officer" } },
          {
            $lookup: {
              from: "officers",
              localField: "performedBy",
              foreignField: "_id",
              as: "user_info",
              pipeline: [{ $project: { first_name: 1, last_name: 1 } }],
            },
          },
          {
            $lookup: {
              from: "files",
              localField: "file",
              foreignField: "_id",
              as: "file_info",
              pipeline: [{ $project: { title: 1 } }],
            },
          },
          {
            $addFields: {
              file_title: {
                $ifNull: [{ $arrayElemAt: ["$file_info.title", 0] }, ""],
              },
              performed_by_name: {
                $cond: [
                  { $gt: [{ $size: "$user_info" }, 0] },
                  {
                    $concat: [
                      { $ifNull: [{ $arrayElemAt: ["$user_info.first_name", 0] }, ""] },
                      " ",
                      { $ifNull: [{ $arrayElemAt: ["$user_info.last_name", 0] }, ""] },
                    ],
                  },
                  "Unknown",
                ],
              },
            },
          },
        ],
        adminLogs: [
          { $match: { performedByModel: "Admin" } },
          {
            $lookup: {
              from: "admins",
              localField: "performedBy",
              foreignField: "_id",
              as: "user_info",
              pipeline: [{ $project: { first_name: 1, last_name: 1 } }],
            },
          },
          {
            $lookup: {
              from: "files",
              localField: "file",
              foreignField: "_id",
              as: "file_info",
              pipeline: [{ $project: { title: 1 } }],
            },
          },
          {
            $addFields: {
              file_title: {
                $ifNull: [{ $arrayElemAt: ["$file_info.title", 0] }, ""],
              },
              performed_by_name: {
                $cond: [
                  { $gt: [{ $size: "$user_info" }, 0] },
                  {
                    $concat: [
                      { $ifNull: [{ $arrayElemAt: ["$user_info.first_name", 0] }, ""] },
                      " ",
                      { $ifNull: [{ $arrayElemAt: ["$user_info.last_name", 0] }, ""] },
                    ],
                  },
                  "Unknown",
                ],
              },
            },
          },
        ],
      },
    },
    {
      $project: {
        mergedLogs: { $concatArrays: ["$officerLogs", "$adminLogs"] },
      },
    },
    { $unwind: "$mergedLogs" },
    { $replaceRoot: { newRoot: "$mergedLogs" } },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ]);

  const totalCount = logs[0]?.metadata[0]?.total || 0;
  const totalPages = Math.ceil(totalCount / limit);

  res.status(200).json({
    currentPage: page,
    totalPages,
    status: "success",
    results: logs[0].data.length,
    data: logs[0].data,
  });
});

