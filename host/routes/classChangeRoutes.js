import express from "express";
import {
  createRequest,
  getAvailableClasses,
  getUserRequests,
  updateRequestStatus,
} from "../controllers/classChangeController.js";

const router = express.Router();

router.post("/create", createRequest);
router.get("/available", getAvailableClasses);
router.get("/user/:userId", getUserRequests);
router.patch("/update-status", updateRequestStatus);

export default router;
