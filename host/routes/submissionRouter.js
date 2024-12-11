import express from "express";
import { verifyAccessToken, verifyRole } from "../utilities/jwt.js";
import submissionController from "../controllers/submissionController/submissionController.js";
import upload, { downloadSubmission, multipleUpload } from "../middlewares/uploadMiddleware.js";

const submissionRouter = express.Router();

submissionRouter.get(
  "/",
  verifyAccessToken,
  verifyRole([2, 4]),
  submissionController.getSubmissions
);

submissionRouter.get(
  "/:id",
  verifyAccessToken,
  verifyRole([2, 4]),
  submissionController.getSubmissionById
);

submissionRouter.post(
  "/",
  multipleUpload,
  verifyAccessToken,
  verifyRole([2, 4]),
  submissionController.createSubmission
);

submissionRouter.patch(
  "/:id",
  verifyAccessToken,
  verifyRole([2, 4]),
  multipleUpload,
  submissionController.updateSubmissionById
);

submissionRouter.delete(
  "/:id",
  verifyAccessToken,
  verifyRole([2, 4]),
  submissionController.deleteSubmissionById
);

submissionRouter.get(
  "/submitId/:submitId",
  verifyAccessToken,
  verifyRole([2, 4]),
  submissionController.getSubmissionBySubmitId
);

submissionRouter.get(
  "/group/:groupId",
  verifyAccessToken,
  verifyRole([2, 4]),
  submissionController.fetchSubmissionsByGroupId
);

submissionRouter.get("/download/:filename", downloadSubmission);

export default submissionRouter;
