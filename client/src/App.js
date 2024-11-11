import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChangePassword from "./pages/ChangePassword.jsx";
import SignIn from "./pages/authen&author/SignIn.jsx";
import { ProtectRoute } from "./utilities/auth.js";
import TeacherRouter from "./routers/teacher/TeacherRouter.js";
import AdminRouter from "./routers/admin/AdminRouter.js";
import UserProfile from "./pages/UserProfile.jsx"

function App() {

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {AdminRouter()}
        {TeacherRouter()}
        <Route path="/profile" element={<UserProfile />} />
        <Route
          path="/student-dashboard"
          element={
            <ProtectRoute allowedRoles={["4"]}>
              <h1>Student Dashboard</h1>
            </ProtectRoute>
          }
        />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/" element={<SignIn />} />
        <Route path="/unauthorized" element={<h1>Access Denied</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
