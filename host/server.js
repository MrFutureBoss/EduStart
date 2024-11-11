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

dotenv.config();

const app = express();

// Enable CORS with specific options for your frontend origin
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);

// Add JSON parsing middleware at the start for all incoming requests
app.use(json());

const port = process.env.PORT || 9999;

// Connect to the database before starting the server
connectDB();

// Create HTTP and WebSocket servers
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
app.use("/rulejoin", routes.ruleJoinRouter);
app.use("/matched", routes.matchedRouter);
app.use("/group", routes.groupRouter);
app.use("/project", routes.projectRouter);
app.use("/mentor", routes.mentorRouter);

// Handle 404 errors for undefined routes
app.use((req, res, next) => {
  next(createError(404, "Resource not found"));
});

// Custom error handling middleware
app.use(errorMiddleware);

// Global error handler for unhandled errors
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: err.status || 500,
    message: err.message || "Internal Server Error",
  });
});

cron.schedule("0 0 * * *", () => {
  semesterController.autoUpdateSemesterStatus();
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
