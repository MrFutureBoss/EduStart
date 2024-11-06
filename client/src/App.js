import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
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
import InvestmentProjectUploader from "./components/InvestmentProjectUploader";
import InvestmentProjectList from "./components/InvestmentProjectList";
import React, { useState } from "react";

function App() {

  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
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
          <Route path="semester-list/user-semester" element={<UserListSemester />} />
          <Route path="professionmanagement" element={<ProfessionManagement />} />
        </Route>

        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/" element={<SignIn />} />
        <Route path="/unauthorized" element={<h1>Access Denied</h1>} />
        <Route
          path="/student-dashboard"
          element={
            <ProtectRoute allowedRoles={["4"]}>
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
              <Tasks />
            </ProtectRoute>
          }
        />
        <Route
          path="/materials"
          element={
            <ProtectRoute allowedRoles={["2"]}>
              <MaterialList />
            </ProtectRoute>
          }
        />
   <Route
          path="/investments"
          element={
            <>
              <InvestmentProjectUploader onUploadSuccess={handleUploadSuccess} />
              <InvestmentProjectList key={refreshKey} />
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
