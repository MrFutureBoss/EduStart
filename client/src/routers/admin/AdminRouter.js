import React from "react";
import { Route } from "react-router-dom";
import { ProtectRoute } from "../../utilities/auth";
import AdminLayout from "../../layouts/admin/AdminLayout";
import SemesterList from "../../pages/semester/SemesterList";
import UserListSemester from "../../pages/admin/UserList";
import PendingUsers from "../../pages/admin/PendingUserList";
import ProfessionManagement from "../../pages/professiona&specialty/ProfessionManagement";
import AdminDashboard from "../../pages/admin/Dashboard/AdminDashboard";
import TransferRequestManagement from "../../pages/admin/Dashboard/TransferRequestManager";
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

      <Route
        path="dashboard/list-request"
        element={<TransferRequestManagement />}
      />
      <Route path="list-request" element={<TransferRequestManagement />} />
      <Route path="semester-list" element={<SemesterList />} />
      <Route path="dashboard/current-semester" element={<UserListSemester />} />
      <Route path="current-semester" element={<UserListSemester />} />
      <Route path="current-semester/pending-users" element={<PendingUsers />} />
      <Route path="dashboard/pending-users" element={<PendingUsers />} />
      <Route
        path="semester-list/user-semester"
        element={<UserListSemester />}
      />
      <Route path="professionmanagement" element={<ProfessionManagement />} />
    </Route>
  );
};

export default AdminRouter;
