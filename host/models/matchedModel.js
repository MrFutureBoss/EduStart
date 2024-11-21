import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema({
  title: {type: String, required: true},
  allDay: { type: Boolean, default: false },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
});

const MatchedSchema = new Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
    time: [eventSchema],
    declineMessage: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);
const Matched = mongoose.model("Matched", MatchedSchema);
export default Matched;
