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
    status: {
      type: Boolean,
      default: false,
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
        min: 1, 
        max: 9999,
        validate: {
          validator: Number.isInteger,
          message: "{VALUE} is not an integer value.",
        },
    }
  },
  {
    timestamps: true,
  }
);

const TempGroup = mongoose.model("TempGroup", tempGroupSchema);
export default TempGroup;
