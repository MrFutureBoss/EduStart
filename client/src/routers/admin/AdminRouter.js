import React from "react";
import { Route } from "react-router-dom";
import { ProtectRoute } from "../../utilities/auth";
import AdminLayout from "../../layouts/admin/AdminLayout";
import SemesterList from "../../pages/semester/SemesterList";
import UserListSemester from "../../pages/semester/UserList";
import PendingUsers from "../../pages/semester/PendingUserList";
import ProfessionManagement from "../../pages/professiona&specialty/ProfessionManagement";

const AdminRouter = () => {
  return (
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
      <Route path="professionmanagement" element={<ProfessionManagement />} />
    </Route>
  );
};

export default AdminRouter;
