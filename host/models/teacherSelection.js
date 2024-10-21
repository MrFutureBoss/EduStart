import mongoose, { Schema } from "mongoose";

const teacherSelectionSchema = new Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    professionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profession",
      required: true,
    },
    specialtyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialty",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TeacherSelection = mongoose.model(
  "TeacherSelection",
  teacherSelectionSchema
);
export default TeacherSelection;
