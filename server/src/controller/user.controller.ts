import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";

export const getAllUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await User.find();
    // const users = await User.find({ role: "USER" });
    if (!users) {
      throw new Error("Data not found");
    }
    res.status(201).json({
      message: "Data found",
      status: "success",
      success: true,
      data: users,
    });
  } catch (err) {
    throw err;
  }
};

//* get profile

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id });
    if (!user) {
      throw new Error("User Not Found");
    }
    res.status(201).json({
      message: `User: ${id} fetched`,
      status: "success",
      success: true,
      data: user,
    });
  } catch (err) {
    throw err;
  }
};

// export const getAllAdmin = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const admins = await User.find({
//       role: {
//         $in: ["ADMIN", "SUPERADMIN"],
//       },
//     });
//     if (!admins) {
//       throw new Error("Data not found");
//     }
//     res.status(201).json({
//       message: "Data found",
//       status: "success",
//       success: true,
//       data: admins,
//     });
//   } catch (err) {
//     throw err;
//   }
// };
