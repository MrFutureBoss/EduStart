import mongoose, { Schema } from "mongoose";

const mentorPreferenceSchema = new Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groupIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const MentorPreference = mongoose.model(
  "MentorPreference",
  mentorPreferenceSchema
);
export default MentorPreference;
