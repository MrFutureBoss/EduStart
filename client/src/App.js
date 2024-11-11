import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChangePassword from "./pages/ChangePassword.jsx";
import SignIn from "./pages/authen&author/SignIn.jsx";
import TeacherRouter from "./routers/teacher/TeacherRouter.js";
import AdminRouter from "./routers/admin/AdminRouter.js";
import StudentRouter from "./routers/student/StudentRouter.js";
import MentorRouter from "./routers/mentor/MentorRouter.js";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {AdminRouter()}
        {TeacherRouter()}
        {StudentRouter()}
        {MentorRouter()}
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/" element={<SignIn />} />
        <Route path="/unauthorized" element={<h1>Access Denied</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
