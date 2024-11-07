import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
    {
      groupId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
      },
      classId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
      assignmentId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Activity",
        required: true,
      },
      leaderId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      fileUrl: { 
        type: String,
      },
      submittedAt: { 
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );
  
  const Assignment = mongoose.model("Assignment", assignmentSchema);
  export default Assignment;

  