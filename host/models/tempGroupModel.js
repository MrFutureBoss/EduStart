import mongoose, { Schema } from "mongoose";

const tempGroupSchema = new Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    groupName: {
      type: String,
      minlength: 2,
      maxlength: 50,
      require: true,
    },
    userIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    maxStudent: {
        type: Number,
        required : true,
    }
  },
  {
    timestamps: true,
  }
);

const TempGroup = mongoose.model("TempGroup", tempGroupSchema);
export default TempGroup;
