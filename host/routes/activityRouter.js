import express from "express";
import activityController from "../controllers/activityController/index.js";
import { authorize, verifyAccessToken } from "../utilities/jwt.js";
import upload from "../middlewares/uploadMiddleware.js";
const activityRouters = express.Router();

activityRouters.get("/", verifyAccessToken, activityController.getActivities);
activityRouters.post(
  "/",
  verifyAccessToken,
  upload.single("materialFile"),
  activityController.createActivity
);
// activityRouters.patch("/:activityId", activityController.updateActivity);
// activityRouters.delete("/:activityId", activityController.deleteActivity);
// activityRouters.get("/overdue-groups/:activityId", activityController.getOverdueGroups);
// activityRouters.post("/send-reminder/:activityId", activityController.sendReminder);

export default activityRouters;
