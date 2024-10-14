import mongoose, { Schema } from "mongoose";

const semesterSchema = new Schema(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["Ongoing", "Upcoming", "Finished"],
      default: "Upcoming",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

const Semester = mongoose.model("Semester", semesterSchema);
export default Semester;
