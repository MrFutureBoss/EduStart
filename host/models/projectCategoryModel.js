import mongoose, { Schema } from "mongoose";

const projectCategorySchema = new Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    professionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profession",
      required: true,
    },
    specialtyIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Specialty",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ProjectCategory = mongoose.model(
  "ProjectCategory",
  projectCategorySchema
);
export default ProjectCategory;
