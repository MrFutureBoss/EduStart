import express from "express";
import activityController from "../controllers/activityController/index.js";
import { verifyAccessToken, verifyRole } from "../utilities/jwt.js";
import upload, { downloadFile } from "../middlewares/uploadMiddleware.js";

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

activityRouters.patch(
  "/:activityId",
  verifyAccessToken,
  verifyRole([2]),
  upload.single("materialFile"),
  activityController.updateActivity
);

activityRouters.delete(
  "/:activityId",
  verifyAccessToken,
  verifyRole([2]),
  activityController.deleteActivity
);

activityRouters.get("/checkFileExists", activityController.checkFileExists);

activityRouters.get("/download/:filename", downloadFile);

activityRouters.get(
  "/:userId",
  verifyAccessToken,
  verifyRole([2]),
  activityController.getActivitiesByTeacher
);
activityRouters.get(
  "/suggested-materials/:classId",
  verifyAccessToken,
  verifyRole([2]),
  activityController.getSuggestedMaterials
);
activityRouters.post(
  "/send-reminder",
  verifyAccessToken,
  verifyRole([2]),
  activityController.sendReminder
);
activityRouters.post(
  "/assign-outcome",
  verifyAccessToken,
  verifyRole([2]),
  activityController.assignOutcomeToAllGroups
);
activityRouters.patch(
  "/update-outcome/:activityId",
  verifyAccessToken,
  verifyRole([2]),
  activityController.updateOutcomeDeadline
);
export default activityRouters;
