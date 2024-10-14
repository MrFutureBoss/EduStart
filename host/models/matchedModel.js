import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema({
  title: String,
  allDay: { type: Boolean, default: false },
  start: { type: Date, required: true },
  end: { type: Date, required: true }
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
    status: { type: String },
    time: [eventSchema],
  },
  {
    timestamps: true,
  }
);
const Matched = mongoose.model("Matched", MatchedSchema);
export default Matched;
