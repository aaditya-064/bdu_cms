"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.getAllUser = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const getAllUser = async (req, res, next) => {
    try {
        const users = await user_model_1.default.find();
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
    }
    catch (err) {
        throw err;
    }
};
exports.getAllUser = getAllUser;
//* get profile
const getProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await user_model_1.default.findOne({ _id: id });
        if (!user) {
            throw new Error("User Not Found");
        }
        res.status(201).json({
            message: `User: ${id} fetched`,
            status: "success",
            success: true,
            data: user,
        });
    }
    catch (err) {
        throw err;
    }
};
exports.getProfile = getProfile;
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
