import mongoose, { Schema } from "mongoose";

const mentorCategorySchema = new Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    professionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profession",
        required: true,
      },
    ],
    specialties: [
      {
        specialtyId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Specialty",
          required: true,
        },
        proficiencyLevel: {
          type: Number,
          required: true,
        },
      },
    ],
    maxLoad: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

const MentorCategory = mongoose.model("MentorCategory", mentorCategorySchema);
export default MentorCategory;
