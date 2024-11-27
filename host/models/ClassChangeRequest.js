import mongoose from "mongoose";

const classChangeRequestSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    currentClassId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    requestedClassId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ClassChangeRequest", classChangeRequestSchema);
