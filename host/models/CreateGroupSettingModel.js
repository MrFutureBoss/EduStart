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
    autoFinish: {
      type: Boolean,
      require: true,
      default: false,
    },
    status: {
      type: Boolean,
      require: true,
      default: true,
    },
    ruleJoin: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: RuleJoin,
        required: true,
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

const CreateGroupSetting = mongoose.model(
  "CreateGroupSetting",
  createGroupSettingSchema
);
export default CreateGroupSetting;
