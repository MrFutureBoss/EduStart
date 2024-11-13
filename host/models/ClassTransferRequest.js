import mongoose from "mongoose";

const classTransferRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    currentClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    requestedClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["transfer", "swap"],
    },
    reason: {
      type: String,
      required: true,
    },
    rejectMessage: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ClassTransferRequest = mongoose.model(
  "ClassTransferRequest",
  classTransferRequestSchema
);
export default ClassTransferRequest;
