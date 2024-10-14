import mongoose, { Schema } from "mongoose";

const SpecialtySchema = new Schema(
  {
    name: {
      type: String,
      minlength: 2,
      maxlength: 50,
      unique: true,
      require: true,
    },
    status: {
      type: Boolean,
      default: false,
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

const Specialty = mongoose.model("Specialty", SpecialtySchema);
export default Specialty;
