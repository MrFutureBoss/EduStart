import express from "express";
import { verifyAccessToken, verifyRole } from "../utilities/jwt.js";
import submissionController from "../controllers/submissionController/submissionController.js";
import upload, { multipleUpload } from "../middlewares/uploadMiddleware.js";

const submissionRouter = express.Router();

submissionRouter.get(
    "/",
    verifyAccessToken,
    verifyRole([4]),
    submissionController.getSubmissions
  );

submissionRouter.get(
  "/:id",
  verifyAccessToken,
  verifyRole([4]),
  submissionController.getSubmissionById
);

submissionRouter.post("/", multipleUpload, submissionController.createSubmission);

submissionRouter.put(
  "/:id",
  verifyAccessToken,
  verifyRole([4]),
  submissionController.updateSubmissionById
);

submissionRouter.delete(
    "/:id",
    verifyAccessToken,
    verifyRole([4]),
    submissionController.deleteSubmissionById
)
export default submissionRouter;
