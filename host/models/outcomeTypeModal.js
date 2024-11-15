import mongoose from "mongoose";

const outcomeTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const OutcomeType = mongoose.model("OutcomeType", outcomeTypeSchema);
export default OutcomeType;
