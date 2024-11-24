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

matchedRouter.get(
  "/infor-matched/:groupId",
  verifyAccessToken,
  verifyRole([2]),
  matchedController.getMatchedInfoByGroupId
);

matchedRouter.put(
  "/edit-matched/:id",
  verifyAccessToken,
  verifyRole([2]),
  matchedController.updateMatchedStatus
);

matchedRouter.patch("/:id", verifyAccessToken, matchedController.patchMatched);

matchedRouter.post(
  "/time/:id",
  verifyAccessToken,
  matchedController.createNewTimeEventsHandler
);

matchedRouter.get(
  "/mentor/:mentorId",
  verifyAccessToken,
  matchedController.getAllMatchingDetailByMentorId
);
export default matchedRouter;
