import { sendResponse } from "../utils/sendResponse.utils";
import { catchAsync } from "../utils/catchAsync.utils";
import AppError from "../utils/appError.utils";
import Staff from "../models/staff.model";
import { upload, deleteFile } from "../utils/cloudinary.utils";

//* create

export const create = catchAsync(async (req, res) => {
  const {
    full_name,
    employee_id,
    department,
    position,
    phone,
    email,
    joining_date,
    monthly_salary,
    status,
    address,
    notes,
  } = req.body;

  const file = req.file;

  const existingStaff = await Staff.findOne({ employee_id });

  if (existingStaff) {
    throw new AppError("Employee ID already exists", 400);
  }

  const uploaded = file ? await upload(file) : null;

  const staff = await Staff.create({
    full_name,
    employee_id,
    department,
    position,
    phone,
    email,
    joining_date,
    monthly_salary,
    profile_image: uploaded
      ? {
          path: uploaded.path,
          public_id: uploaded.public_id,
        }
      : undefined,
    status,
    address,
    notes,
  });

  sendResponse(res, {
    message: "Staff added successfully",
    statusCode: 201,
    data: staff,
  });
});

//* update

export const update = catchAsync(async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  const existingStaff = await Staff.findById(id);

  if (!existingStaff) {
    throw new AppError("Staff not found", 404);
  }

  const uploaded = file ? await upload(file) : null;

  const updatedStaff = await Staff.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        ...req.body,
        ...(uploaded && {
          profile_image: {
            path: uploaded.path,
            public_id: uploaded.public_id,
          },
        }),
      },
    },
    { new: true, runValidators: true },
  );

  sendResponse(res, {
    message: "Staff updated successfully",
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

export const getAll = catchAsync(async (req, res) => {
  const {
    query,
    department,
    status,
    sortBy = "date",
    order = "desc",
  } = req.query;

  const filter: any = {};

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

  const sortField =
    sortBy === "name"
      ? "full_name"
      : sortBy === "salary"
        ? "monthly_salary"
        : "joining_date";

  const sortOrder = order === "asc" ? 1 : -1;

  const staff = await Staff.find(filter).sort({
    [sortField]: sortOrder,
  } as any);

  sendResponse(res, {
    message: "Staff fetched successfully",
    statusCode: 200,
    data: staff,
  });
});

//* get by id
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const staff = await Staff.findById(id);

  if (!staff) {
    throw new AppError("Staff not found", 404);
  }

  sendResponse(res, {
    message: `Staff:${id} fetched successfully`,
    statusCode: 200,
    data: staff,
  });
});

//* remove
export const remove = catchAsync(async (req, res) => {
  const { id } = req.params;

  const staff = await Staff.findByIdAndDelete(id);

  if (!staff) {
    throw new AppError("Staff not found", 404);
  }

  if (staff.profile_image?.public_id) {
    await deleteFile(staff.profile_image.public_id);
  }

  sendResponse(res, {
    message: `Staff:${id} deleted successfully`,
    statusCode: 200,
    data: null,
  });
});
