import mongoose, { Schema } from "mongoose";
import Class from "./classModel.js";
import RuleJoin from "./RuleJoinModel.js";
import TempGroup from "./tempGroupModel.js";

const createGroupSettingSchema = new Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Class,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    ruleJoin: [
      {
        ruleJoinId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: RuleJoin,
          required: true,
        },
        status: {
          type: Boolean,
          default: true,
        },
      },
    ],
    tempGroupId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: TempGroup,
      },
    ],
  },
  { timestamps: true }
);

const CreateGroupSetting = mongoose.model("CreateGroupSetting", createGroupSettingSchema);
export default CreateGroupSetting;
