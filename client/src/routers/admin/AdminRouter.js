import React from "react";
import { Route } from "react-router-dom";
import { ProtectRoute } from "../../utilities/auth";
import AdminLayout from "../../layouts/admin/AdminLayout";
import SemesterList from "../../pages/semester/SemesterList";
import UserListSemester from "../../pages/admin/UserList";
import ProfessionManagement from "../../pages/professiona&specialty/ProfessionManagement";
import AdminDashboard from "../../pages/admin/Dashboard/AdminDashboard";
import ClassManager from "../../pages/admin/ManagerClass";
import ClassDetail from "../../pages/admin/ClassDetail";
import UserProfile from "../../pages/UserProfile";
const AdminRouter = () => {
  return (
    <Route
      path="/admin"
      element={
        <ProtectRoute allowedRoles={["1"]}>
          <AdminLayout />
        </ProtectRoute>
      }
    >
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="semester-list" element={<SemesterList />} />
      <Route path="dashboard/current-semester" element={<UserListSemester />} />
      <Route path="current-semester" element={<UserListSemester />} />
      <Route
        path="semester-list/user-semester"
        element={<UserListSemester />}
      />
      <Route path="professionmanagement" element={<ProfessionManagement />} />

      <Route path="class-manager" element={<ClassManager />} />
      <Route path="class-manager/class-detail/:id" element={<ClassDetail />} />
      <Route path="profile" element={<UserProfile />} />
    </Route>
  );
};

export default AdminRouter;
