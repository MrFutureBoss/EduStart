import mongoose, { Schema } from "mongoose";

const ProfessionSubSchema = new Schema(
  {
    professionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profession",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const SpecialtySubSchema = new Schema(
  {
    specialtyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialty",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    proficiencyLevel: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const temporaryMatchingSchema = new Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Group",
    },
    mentorIds: [
      {
        mentorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        username: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        degree: {
          type: String,
          required: true,
        },
        score: {
          type: Number,
          required: true,
          default: 0,
        },
        isPreferredGroup: {
          type: Boolean,
          required: true,
          default: false,
        },
        professions: {
          type: [ProfessionSubSchema],
          default: [],
        },
        specialties: {
          type: [SpecialtySubSchema],
          default: [],
        },
        currentLoad: Number,
        maxLoad: Number,
      },
    ],

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    status: {
      type: String,
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

const TemporaryMatching = mongoose.model(
  "TemporaryMatching",
  temporaryMatchingSchema
);

export default TemporaryMatching;
