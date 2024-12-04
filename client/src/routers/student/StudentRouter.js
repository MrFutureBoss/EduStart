import React from "react";
import { Route } from "react-router-dom";
import { ProtectRoute } from "../../utilities/auth";
import StudentLayout from "../../layouts/student/Layout";
import GroupMembers from "../../pages/group/GroupMembers";
import ClassDetail from "../../pages/student/ClassDetail";
import UserProfile from "../../pages/UserProfile";
import Dashboard from "../../pages/student/StudentDashboard";
const StudentRouter = () => {
  return (
    <Route
      path="/student"
      element={
        <ProtectRoute allowedRoles={["4"]}>
          <StudentLayout />
        </ProtectRoute>
      }
    >
      <Route path="class" element={<ClassDetail />} />
      <Route path="group-detail" element={<GroupMembers />} />
      <Route path="class" element={<ClassDetail />} />
      <Route path="profile" element={<UserProfile />} />
      <Route path="dashboard" element={<Dashboard />} />
    </Route>
  );
};

export default StudentRouter;
