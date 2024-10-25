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

const socket = io("http://localhost:9999");

function App() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on("message", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off("message");
    };
  }, []);

  const sendMessage = (msg) => {
    socket.emit("message", msg);
  };

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {AdminRouter()}
        {TeacherRouter()}
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

      {/* Hiển thị và gửi message */}
      <div className="chat-container">
        <h2>Chat</h2>
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index}>{msg}</div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage(e.target.value);
              e.target.value = "";
            }
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
