"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const image_model_1 = __importDefault(require("./image.model"));
const staffSchema = new mongoose_1.Schema({
    full_name: {
        type: String,
        required: [true, "full_name is required"],
        minLength: [3, "name must be atleast 3 characters long"],
        trim: true,
    },
    employee_id: {
        type: String,
        required: [true, "employee_id is required"],
        trim: true,
        unique: true,
    },
    department: {
        type: String,
        required: [true, "department is required"],
        trim: true,
    },
    // posiition
    position: {
        type: String,
        trim: true,
    },
    // phone
    phone: {
        type: Number,
        minLength: [10, "phone must contain 10 numbers"],
        maxLength: [10, "phone must contain 10 numbers"],
    },
    // email
    email: {
        type: String,
        trim: true,
    },
    // joining date
    joining_date: {
        type: String,
        required: [true, "Joining Date is required"],
    },
    // monthly salary
    monthly_salary: {
        type: Number,
        required: [true, "Monthly Salary is required"],
    },
    profile_image: {
        type: image_model_1.default,
    },
    // status
    status: {
        type: String,
        enum: ["Active", "Inactive", "On Leave"],
        default: "Active",
        required: [true, "status is required"],
    },
    // address
    address: {
        type: String,
        trim: true,
    },
    // notes
    notes: {
        type: String,
        trim: true,
    },
});
//* staff model
const Staff = mongoose_1.default.model("staff", staffSchema);
exports.default = Staff;
