import express from "express";
import createGroupSettingController from "../controllers/createGroupSettingController/index.js";
import { verifyAccessToken } from "../utilities/jwt.js";

const createGroupSettingRouter = express.Router();

createGroupSettingRouter.get(
  "/",
  verifyAccessToken,
  createGroupSettingController.getAllCreateGroupSettings
);

createGroupSettingRouter.post(
  "/",
  verifyAccessToken,
  createGroupSettingController.createCreateGroupSettingWithTempGroup
);

createGroupSettingRouter.get(
  "/:id",
  verifyAccessToken,
  createGroupSettingController.getCreateGroupSettingById
);

createGroupSettingRouter.get(
  "/class/:classId",
  verifyAccessToken,
  createGroupSettingController.getCreateGroupSettingByClassId
);

createGroupSettingRouter.put(
  "/:id",
  verifyAccessToken,
  createGroupSettingController.updateCreateGroupSetting
);

createGroupSettingRouter.delete(
  "/:id",
  verifyAccessToken,
  createGroupSettingController.deleteCreateGroupSetting
);

export default createGroupSettingRouter;
