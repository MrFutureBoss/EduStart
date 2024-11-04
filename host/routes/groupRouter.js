import express from "express";
import { verifyAccessToken, verifyRole } from "../utilities/jwt.js";
import groupController from "../controllers/groupController/groupController.js";

const groupRouter = express.Router();

groupRouter.get(
  "/project/:groupId",
  verifyAccessToken,
  verifyRole([2]),
  groupController.getProjectByGroupId
);

export default groupRouter;
