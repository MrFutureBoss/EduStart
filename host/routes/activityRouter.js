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

activityRouters.get('/download/:filename', downloadFile);

activityRouters.get(
  "/:userId", 
  verifyAccessToken,
  verifyRole([2]), 
  activityController.getActivitiesByTeacher
);
export default activityRouters;
