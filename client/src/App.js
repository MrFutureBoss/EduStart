import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
// import ProfessionManagement from "./pages/ProfessionManagement.jsx";
import PendingUsers from "./pages/semester/PendingUserList.js";
import AdminLayout from "./layouts/admin/AdminLayout.js";
import UserListSemester from "./pages/semester/UserList.js";
import SemesterList from "./pages/semester/SemesterList.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChangePassword from "./pages/ChangePassword.jsx";
import ProfessionManagement from "./pages/professiona&specialty/ProfessionManagement.jsx";
import SignIn from "./pages/authen&author/SignIn.jsx";
import { ProtectRoute } from "./utilities/auth.js";
import MyActivity from "./pages/activity/MyActivity.jsx";
import Tasks from "./pages/activity/Tasks.jsx";
import MaterialList from "./pages/activity/MaterialList.jsx";
import TeacherLayout from "./layouts/teacher/TeacherLayout.js";

//Route tạm thời để code không dùng thì comment lại

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Layout dành cho Admin, bao gồm các route bên trong */}

        <Route
          path="/admin-dashboard"
          element={
            <ProtectRoute allowedRoles={["1"]}>
              <AdminLayout />
            </ProtectRoute>
          }
        >
          <Route path="semester-list" element={<SemesterList />} />
          <Route path="current-semester" element={<UserListSemester />} />
          <Route path="pending-user" element={<PendingUsers />} />
          <Route path="semester-list/user-semester" element={<UserListSemester />}/>
          <Route
            path="professionmanagement"
            element={<ProfessionManagement />}
          />
        </Route>

         {/* Layout dành cho Teacher, bao gồm các route bên trong */}
        <Route
          path="/teacher-dashboard"
          element={
            <ProtectRoute allowedRoles={["2"]}>
              <TeacherLayout />
            </ProtectRoute>
          }
        >
          <Route path="/teacher-activity" element={<MyActivity />}/>
          <Route path="/tasks"  element={ <Tasks /> } />
          <Route path="/materials" element={ <MaterialList />}/>
        </Route>

        
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
