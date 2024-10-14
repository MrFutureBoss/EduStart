import express, { json } from "express";
import dotnv from "dotenv";
import cors from "cors";
import createError from "http-errors";
import connectDB from "./database.js";
import http from "http";
import routes from "./routes/index.js";
import semesterController from "./controllers/semesterController/index.js";
import cron from "node-cron";
import errorMiddleware from "./middlewares/errorMiddleware.js";

const app = express();
dotnv.config();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(json());

const port = process.env.PORT || 9999;
const server = http.createServer(app);
// const io = setupSocket(server);

// app.set("io", io);

// Cấu hình multer và các route
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "./uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(
//       null,
//       file.fieldname + "-" + Date.now() + path.extname(file.originalname)
//     );
//   },
// });

app.use("/semester", routes.semesterRouter);
app.use("/admins", routes.adminRouter);
app.use("/profession", routes.professionRouters);
app.use("/specialty", routes.specialtyRouters);
app.use("/tempMatching", routes.tempMatchingRouter);
app.use("/teacher", routes.teacherRouter);
app.use("/user", routes.userRouters);
app.use("/activity", routes.activityRouters);

app.use(async (req, res, next) => {
  next(createError.NotFound());
});
app.use(errorMiddleware);

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: err.status || 500,
    message: err.message,
  });
});
cron.schedule("0 0 * * *", () => {
  semesterController.autoUpdateSemesterStatus();
});
server.listen(port, () => {
  connectDB();
  console.log(`listening on ${port}`);
});
