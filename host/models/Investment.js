// models/Investment.js
import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  amount: { type: Number, required: true }, // example field for amount invested
  date: { type: Date, default: Date.now },
});

const Investment = mongoose.model("Investment", investmentSchema);
export default Investment;
