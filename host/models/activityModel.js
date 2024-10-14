import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    activityType: {
      type: String,
      enum: ["material", "post", "assignment"], 
      required: true,
    },
    title: {
      type: String,
      required: true,
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
    deadline: { 
      type: Date,
    },
    classId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true, 
    },
  },
  {
    timestamps: true,
  }
);

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
