import express from "express";
import ruleJoinController from "../controllers/ruleJoinController/index.js";
import { verifyAccessToken } from "../utilities/jwt.js";

const ruleJoinRouter = express.Router();

ruleJoinRouter.get(
  "/",
  verifyAccessToken,
  ruleJoinController.getAllRuleJoins
);

ruleJoinRouter.post(
  "/",
  verifyAccessToken,
  ruleJoinController.createRuleJoin
);

ruleJoinRouter.get(
  "/:id",
  verifyAccessToken,
  ruleJoinController.getRuleJoinById
);

ruleJoinRouter.put(
  "/:id",
  verifyAccessToken,
  ruleJoinController.updateRuleJoin
);

ruleJoinRouter.delete(
  "/:id",
  verifyAccessToken,
  ruleJoinController.deleteRuleJoin
);

export default ruleJoinRouter;
