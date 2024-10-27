import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
// import ProfessionManagement from "./pages/ProfessionManagement.jsx";
import PendingUsers from "./pages/admin/PendingUserList.js";
import AdminLayout from "./layouts/admin/AdminLayout.js";
import UserListSemester from "./pages/admin/UserList.js";
import SemesterList from "./pages/semester/SemesterList.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChangePassword from "./pages/ChangePassword.jsx";
import ProfessionManagement from "./pages/professiona&specialty/ProfessionManagement.jsx"
import SignIn from "./pages/authen&author/SignIn.jsx";
import { ProtectRoute } from "./utilities/auth.js";
import MyActivity from "./pages/activity/MyActivity.jsx";
import Tasks from "./pages/activity/Tasks.jsx";
import MaterialList from "./pages/activity/MaterialList.jsx";
import StudentProfile from "./pages/StudentProfile.jsx";
import EditTeacherProfile from "./pages/EditTeacherProfile.jsx";

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
          <Route
            path="current-semester/pending-users"
            element={<PendingUsers />}
          />
          <Route
            path="semester-list/user-semester"
            element={<UserListSemester />}
          />
          <Route path="professionmanagement" element={<ProfessionManagement/>} />
        </Route>
        <Route path="/change-password" element={<ChangePassword />} />
        {/* <Route path="/" element={<ProfessionManagement />} /> */}
        <Route path="/" element={<SignIn />} />
        <Route path="/unauthorized" element={<h1>Access Denied</h1>} />
        <Route
          path="/student-dashboard"
          element={
            <ProtectRoute allowedRoles={["4"]}>
              {/* <AdminLayout /> */}
              <h1>Student Dashboard</h1>
            </ProtectRoute>
          }
        />
        <Route
          path="/teacher-dashboard"
          element={
            <ProtectRoute allowedRoles={["2"]}>
              <MyActivity />
            </ProtectRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectRoute allowedRoles={["2"]}>
              <Tasks/>
            </ProtectRoute>
          }
        />
        <Route
          path="/materials"
          element={
            <ProtectRoute allowedRoles={["2"]}>
              <MaterialList/>
            </ProtectRoute>
          }
        />
          <Route path="/student-profile" element={<StudentProfile />} />
          <Route path="/edit-teacherprofile" element={<EditTeacherProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
