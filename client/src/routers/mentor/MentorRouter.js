import React from "react";
import { Route } from "react-router-dom";
import { ProtectRoute } from "../../utilities/auth";
import MentorLayout from "../../layouts/mentor/MentorLayout";
import ProjectsList from "../../pages/mentor/ProjectListForMentor";
import GroupList from "../../pages/mentorgroup/GroupList";

const MentorRouter = () => {
  return (
    <Route
      path="/mentor-dashboard"
      element={
        <ProtectRoute allowedRoles={["3"]}>
          <MentorLayout />
        </ProtectRoute>
      }
    >
      <Route path="managegroup" element={<GroupList />} />
      <Route path="project-suggest" element={<ProjectsList />} />
    </Route>
  );
};

export default MentorRouter;
