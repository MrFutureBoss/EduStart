import express from "express";
import { verifyAccessToken, verifyRole } from "../utilities/jwt.js";
import matchedController from "../controllers/matchedController/matchedController.js";

const matchedRouter = express.Router();

matchedRouter.post(
  "/add-matched",
  verifyAccessToken,
  verifyRole([2]),
  matchedController.createMatchedHandler
);
export default matchedRouter;
