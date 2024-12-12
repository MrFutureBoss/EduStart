import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChangePassword from "./pages/ChangePassword.jsx";
import SignIn from "./pages/authen&author/SignIn.jsx";
import { ProtectRoute } from "./utilities/auth.js";
import TeacherRouter from "./routers/teacher/TeacherRouter.js";
import AdminRouter from "./routers/admin/AdminRouter.js";
import UserProfile from "./pages/UserProfile.jsx";
import StudentRouter from "./routers/student/StudentRouter.js";
import MentorRouter from "./routers/mentor/MentorRouter.js";
import "../src/style/Common.css";
import AccessDenied from "./components/Result/AccessDenied.jsx";

function App() {
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
        {StudentRouter()}
        {MentorRouter()}
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/" element={<SignIn />} />
        <Route path="/unauthorized" element={<AccessDenied />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
