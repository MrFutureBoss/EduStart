import express from "express";
import tempMatchingController from "../controllers/tempMatchingController/index.js";
const tempMatchingRouter = express.Router();

// Lấy danh sách mentor khả dụng
tempMatchingRouter.post(
  "/recommend",
  tempMatchingController.recommendMentorsForClassGroups
);

export default tempMatchingRouter;
