import React from "react";
import { Route } from "react-router-dom";
import { ProtectRoute } from "../../utilities/auth";
import StudentLayout from "../../layouts/student/Layout";
import GroupMembers from "../../pages/group/GroupMembers";
import ClassDetail from "../../pages/student/ClassDetail";
const StudentRouter = () => {
  return (
    <Route
      path="/student-dashboard"
      element={
        <ProtectRoute allowedRoles={["4"]}>
          <StudentLayout />
        </ProtectRoute>
      }
    >
      <Route path="class" element={<ClassDetail />} />
      <Route path="group-detail" element={<GroupMembers />} />
    </Route>
  );
};

export default StudentRouter;
