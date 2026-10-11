import mongoose, { Schema, Document } from "mongoose";
import ImageSchema from "./image.model";

export interface IStaff extends Document {
  full_name: String;
  employee_id: String;
  department: String;
  position: String;
  phone: Number;
  profile_image: {};
  email: String;
  joining_date: Date;
  monthly_salary: Number;
  status: String;
  address: String;
  notes: String;
}

const staffSchema = new Schema<IStaff>({
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
    type: Date,
    required: [true, "Joining Date is required"],
  },
  // monthly salary
  monthly_salary: {
    type: Number,
    required: [true, "Monthly Salary is required"],
  },
  profile_image: {
    type: ImageSchema,
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
const Staff = mongoose.model("staff", staffSchema);
export default Staff;
