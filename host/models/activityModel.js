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
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    materialUrl: {
      type: String,
    },
    assignmentType: {
      type: String,
      enum: ["outcome 1", "outcome 2", "outcome 3"],
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
  },
  {
    timestamps: true,
  }
);

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
