"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.getById = exports.getAll = exports.update = exports.create = void 0;
const sendResponse_utils_1 = require("../utils/sendResponse.utils");
const catchAsync_utils_1 = require("../utils/catchAsync.utils");
const appError_utils_1 = __importDefault(require("../utils/appError.utils"));
const staff_model_1 = __importDefault(require("../models/staff.model"));
//* create
exports.create = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { full_name, employee_id, department, position, phone, email, joining_date, monthly_salary, profile_image, status, address, notes, } = req.body;
    const existingStaff = await staff_model_1.default.findOne({ employee_id });
    if (existingStaff) {
        throw new appError_utils_1.default("Employee ID already exists", 400);
    }
    const staff = await staff_model_1.default.create({
        full_name,
        employee_id,
        department,
        position,
        phone,
        email,
        joining_date,
        monthly_salary,
        profile_image,
        status,
        address,
        notes,
    });
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: "Staff added successfully",
        statusCode: 201,
        data: staff,
    });
});
//* update
exports.update = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const existingStaff = await staff_model_1.default.findById(id);
    if (!existingStaff) {
        throw new appError_utils_1.default("Staff not found", 404);
    }
    const allowedFields = [
        "full_name",
        "employee_id",
        "department",
        "position",
        "phone",
        "email",
        "joining_date",
        "monthly_salary",
        "profile_image",
        "status",
        "address",
        "notes",
    ];
    const updates = {};
    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });
    const updatedStaff = await staff_model_1.default.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: `Staff:${id} updated successfully`,
        statusCode: 200,
        data: updatedStaff,
    });
});
//* get all
// GET /staff?sortBy=date&order=desc
// GET /staff?sortBy=name&order=asc
// GET /staff?sortBy=salary&order=desc
// GET /staff?query=john
// GET /staff?department=IT
// GET /staff?status=Active
exports.getAll = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { query, department, status, sortBy = "date", order = "desc", } = req.query;
    const filter = {};
    if (query) {
        filter.$or = [
            { full_name: { $regex: query, $options: "i" } },
            { employee_id: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
        ];
    }
    if (department) {
        filter.department = department;
    }
    if (status) {
        filter.status = status;
    }
    const sortField = sortBy === "name"
        ? "full_name"
        : sortBy === "salary"
            ? "monthly_salary"
            : "joining_date";
    const sortOrder = order === "asc" ? 1 : -1;
    const staff = await staff_model_1.default.find(filter).sort({
        [sortField]: sortOrder,
    });
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: "Staff fetched successfully",
        statusCode: 200,
        data: staff,
    });
});
//* get by id
exports.getById = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const staff = await staff_model_1.default.findById(id);
    if (!staff) {
        throw new appError_utils_1.default("Staff not found", 404);
    }
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: `Staff:${id} fetched successfully`,
        statusCode: 200,
        data: staff,
    });
});
//* remove
exports.remove = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const staff = await staff_model_1.default.findByIdAndDelete(id);
    if (!staff) {
        throw new appError_utils_1.default("Staff not found", 404);
    }
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: `Staff:${id} deleted successfully`,
        statusCode: 200,
        data: null,
    });
});
