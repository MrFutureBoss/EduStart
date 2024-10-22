import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
// import ProfessionManagement from "./pages/ProfessionManagement.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChangePassword from "./pages/ChangePassword.jsx";
import SignIn from "./pages/authen&author/SignIn.jsx";
import { ProtectRoute } from "./utilities/auth.js";
import TeacherRouter from "./routers/teacher/TeacherRouter.js";
import AdminRouter from "./routers/admin/AdminRouter.js";

//Route tạm thời để code không dùng thì comment lại

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Layout dành cho Admin, bao gồm các route bên trong */}
        {AdminRouter()}
         {/* Layout dành cho Teacher, bao gồm các route bên trong */}
        {TeacherRouter()}

        
        <Route
            path="/student-dashboard"
            element={
              <ProtectRoute allowedRoles={["4"]}>
                {/* <AdminLayout /> */}
                <h1>Student Dashboard</h1>
              </ProtectRoute>
            }
          />
        <Route path="/change-password" element={<ChangePassword />} />
        {/* <Route path="/" element={<ProfessionManagement />} /> */}
        <Route path="/" element={<SignIn />} />
        <Route path="/unauthorized" element={<h1>Access Denied</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
