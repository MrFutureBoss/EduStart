import mongoose, { Schema } from "mongoose";
import Classes from "./classModel.js";
import Group from "./groupModel.js";
import Semester from "./semesterModel.js";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Tên người dùng không được để trống"],
    },
    email: {
      type: String,
      required: [true, "Email không được để trống"],
    },
    password: {
      type: String,
      required: [true, "Mật khẩu không được để trống"],
      min: [6, "Mật khẩu phải dài hơn 6 chữ số"],
    },
    role: {
      type: Number,
      required: [true, "Role không được để trống"],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Classes,
    },
    Dob: { type: Date },
    phoneNumber: { type: String },
    degree: { type: String },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Group,
    },
    semesterId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Semester" }],

    status: {
      type: String,
      enum: ["Active", "InActive", "Disabled", "Pending"],
      default: "InActive",
    },
    rollNumber: { type: String },
    memberCode: { type: String },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
