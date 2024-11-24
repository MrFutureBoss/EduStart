// routes/groupRoutes.js
import express from "express";
import notificationController from "../controllers/notificationController/index.js";
import { verifyAccessToken } from "../utilities/jwt.js";
const notificationRouter = express.Router();

notificationRouter.get(
  "/get-all-notification",
  verifyAccessToken,
  notificationController.fetchNotifications
);
notificationRouter.patch(
  "/:notificationId/read",
  notificationController.markNotificationAsReadHandler
);
notificationRouter.put(
  "/:userId/all-read",
  notificationController.markAllNotificationsAsRead
);
export default notificationRouter;
