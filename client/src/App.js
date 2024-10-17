import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
// import ProfessionManagement from "./pages/ProfessionManagement.jsx";
import PendingUsers from "./pages/semester/PendingUserList.js";
import AdminLayout from "./layouts/admin/AdminLayout.js";
import UserListSemester from "./pages/semester/UserList.js";
import SemesterList from "./pages/semester/SemesterList.js";
import { ToastContainer } from "react-toastify";
import SignIn from "./pages/authen&author/SignIn.jsx";
import { ProtectRoute } from "./utilities/auth.js";

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
          <Route
            path="semester-list/user-semester"
            element={<UserListSemester />}
          />
        </Route>
        {/* <Route path="/" element={<Profession/Management />} /> */}
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
