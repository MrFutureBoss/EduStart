import mongoose, { Schema } from "mongoose";
const professionSchema = new Schema(
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

    specialty: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Specialty",
        require: false,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Profession = mongoose.model("Profession", professionSchema);
export default Profession;
