import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    activityType: {
      type: String,
      enum: ["material", "post", "outcome"],
    },
    description: {
      type: String,
    },
    materialUrl: {
      type: String,
    },
    outcomeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OutcomeType",
    },
    startDate: {
      type: Date,
    },
    deadline: {
      type: Date,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
  },
  {
    timestamps: true,
  }
);

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
