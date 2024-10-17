import express from "express";
import activityController from "../controllers/activityController/index.js";
import { authorize, verifyAccessToken, verifyRole } from "../utilities/jwt.js";
import upload, { checkFileExists } from "../middlewares/uploadMiddleware.js";
const activityRouters = express.Router();

activityRouters.get(
  "/",
  verifyAccessToken,
  verifyRole([2]),
  activityController.getActivities
);
activityRouters.post(
  "/",
  verifyAccessToken,
  verifyRole([2]),
  upload.single("materialFile"),
  activityController.createActivity
);
// activityRouters.patch("/:activityId", activityController.updateActivity);
activityRouters.delete("/:activityId", activityController.deleteActivity);
// activityRouters.get("/overdue-groups/:activityId", activityController.getOverdueGroups);
// activityRouters.post("/send-reminder/:activityId", activityController.sendReminder);
activityRouters.get("/checkFileExists", checkFileExists);

export default activityRouters;
