import mongoose, { Schema } from "mongoose";
import Project from "./projectModel.js";
const groupSchema = new Schema(
  {
    name: { type: String, require: true },
    description: { type: String },
    status: { type: String },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Project,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
  },
  {
    timestamps: true,
  }
);
const Group = mongoose.model("Group", groupSchema);
export default Group;
