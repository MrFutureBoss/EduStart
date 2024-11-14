import express from "express";
import classTransferController from "../controllers/classTransferController/index.js";
import { verifyAccessToken, verifyRole } from "../utilities/jwt.js";

const classTransferRoutes = express.Router();

classTransferRoutes.post(
  "/request-class-transfer",
  verifyAccessToken,
  classTransferController.requestClassTransfer
);
classTransferRoutes.patch(
  "/update-transfer-status",
  verifyAccessToken,
  classTransferController.updateTransferRequestStatus
);
classTransferRoutes.get(
  "/all-transfer-requests",
  classTransferController.getAllTransferRequests
);

export default classTransferRoutes;
