import mongoose, { Schema } from "mongoose";

const mentorCategorySchema = new Schema(
  {
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
    specialties: [
      {
        specialtyId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Specialty",
        },
        proficiencyLevel: {
          type: Number,
          required: true,
        },
      },
    ],
    maxLoad: { type: Number, required: true },
    currentLoad: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const MentorCategory = mongoose.model("MentorCategory", mentorCategorySchema);
export default MentorCategory;
