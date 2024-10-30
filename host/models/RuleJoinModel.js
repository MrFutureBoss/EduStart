import mongoose, { Schema } from "mongoose";

const ruleJoinSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const RuleJoin = mongoose.model("RuleJoin", ruleJoinSchema);
export default RuleJoin;
