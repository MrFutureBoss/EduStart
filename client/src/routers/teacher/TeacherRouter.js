import React from "react";
import { Route } from "react-router-dom";
import { ProtectRoute } from "../../utilities/auth";
import TeacherLayout from "../../layouts/teacher/TeacherLayout";
import MyActivity from "../../pages/activity/MyActivity";
import Tasks from "../../pages/activity/Tasks";
import MaterialList from "../../pages/activity/MaterialList";
import ProfessionManagement from "../../pages/professiona&specialty/ProfessionManagement";
// import UnGroupList from "../../pages/class/UnGroupList";
import ChooseMentor from "../../pages/teacher/chooseMentor/ChooseMentor";
import GroupProccess from "../../pages/create-group/GroupProccess";
import PostActivity from "../../pages/activity/PostActivity";
import Result from "../../pages/Dnd_test/Result";
import ClassManagement from "../../pages/class/ClassManagement";
import OutcomeActivity from "../../pages/activity/OutcomeActivity";
import MainStep from "../../pages/teacher/stepSelectMentor/MainStep";
import ClassGroupTreeView from "../../pages/teacher/matchingMentor/ClassGroupTreeView";
import MatchingMentorIndex from "../../pages/teacher/matchingMentor";
import ProjectCardMain from "../../pages/teacher/matchingMentor/ProjectCardMain";
import DetailedSelection from "../../pages/teacher/matchingMentor/DetailedSelection";

const TeacherRouter = () => {
  return (
    <Route
      path="/teacher-dashboard"
      element={
        <ProtectRoute allowedRoles={["2"]}>
          <TeacherLayout />
        </ProtectRoute>
      }
    >
      <Route path="professionmanagement" element={<Result />} />
      <Route path="class/detail/:className" element={<GroupProccess />} />
      <Route path="class" element={<ClassManagement />} />
      <Route path="teacher-activity" element={<MyActivity />} />
      <Route path="tasks" element={<Tasks />} />
      <Route path="materials" element={<MaterialList />} />
      <Route path="professionmanagement" element={<ProfessionManagement />} />
      <Route path="class/:className" element={<GroupProccess />} />
      <Route path="teacher-dashboard" element={<MyActivity />} />
      <Route path="dashboard-choose-mentor" element={<ChooseMentor />} />
      <Route path="choose-mentor" element={<MainStep />} />
      <Route path="posts" element={<PostActivity />} />
      <Route path="dashboard-choose-mentor/main-step" element={<MainStep />} />
      <Route path="temp-matching" element={<ProjectCardMain />} />
      <Route path="summary-class/temp-matching" element={<ProjectCardMain />} />
      <Route path="summary-class" element={<MatchingMentorIndex />} />
      <Route
        path="temp-matching/detailed-selection/:projectId"
        element={<DetailedSelection />}
      />
    </Route>
  );
};

export default TeacherRouter;
