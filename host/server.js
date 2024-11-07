import express, { json } from "express";
import dotenv from "dotenv";
import cors from "cors";
import createError from "http-errors";
import connectDB from "./database.js";
import http from "http";
import routes from "./routes/index.js";
import semesterController from "./controllers/semesterController/index.js";
import cron from "node-cron";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import { Server as SocketIOServer } from "socket.io";

const app = express();
dotenv.config();

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
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("message", (msg) => {
    console.log("Received message:", msg);
    io.emit("message", msg);
  });
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use("/semester", routes.semesterRouter);
app.use("/admins", routes.adminRouter);
app.use("/profession", routes.professionRouters);
app.use("/specialty", routes.specialtyRouters);
app.use("/tempMatching", routes.tempMatchingRouter);
app.use("/teacher", routes.teacherRouter);
app.use("/user", routes.userRouters);
app.use("/activity", routes.activityRouters);
app.use("/class", routes.classRouter);
app.use("/mentorcategory", routes.mentorCategoryRouters);
app.use("/tempgroup", routes.tempGroupRouters);
app.use("/creategroupsetting", routes.createGroupSettingRouter);
app.use("/matched", routes.matchedRouter);
app.use("/group", routes.groupRouter);
app.use("/project", routes.projectRouter);

app.use(async (req, res, next) => {
  next(createError.NotFound());
});
app.use(errorMiddleware);

// Middleware xử lý lỗi
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
