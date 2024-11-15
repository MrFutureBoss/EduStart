import mongoose, { Schema } from "mongoose";

const mentorPreferenceSchema = new Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
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
