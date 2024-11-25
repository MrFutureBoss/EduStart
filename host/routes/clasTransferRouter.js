import express from "express";
import classTransferController from "../controllers/classTransferController/index.js";
import { verifyAccessToken, verifyRole } from "../utilities/jwt.js";
import {
  getAvailableClasses,
  requestClassTransfer,
  getUserTransferRequests,
} from "../controllers/ClassTransferRequest.js";


const classTransferRoutes = express.Router();

// Get available classes
classTransferRoutes.get("/classes/available", getAvailableClasses);

// Create a transfer request
classTransferRoutes.post("/requests/create", requestClassTransfer);

// Get transfer requests for a user
classTransferRoutes.get("/requests/user/:userId", getUserTransferRequests);

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
