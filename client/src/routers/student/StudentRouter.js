import React from "react";
import { Route } from "react-router-dom";
import { ProtectRoute } from "../../utilities/auth";
import StudentLayout from "../../layouts/student/Layout";
import GroupMembers from "../../pages/group/GroupMembers";
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
      <Route path="group-detail" element={<GroupMembers />} />
    </Route>
  );
};

export default StudentRouter;
