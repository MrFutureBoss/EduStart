import React from "react";
import { Route } from "react-router-dom";
import { ProtectRoute } from "../../utilities/auth";
import TeacherLayout from "../../layouts/teacher/TeacherLayout";
import MyActivity from "../../pages/activity/MyActivity";
import ProfessionManagement from "../../pages/professiona&specialty/ProfessionManagement";
// import UnGroupList from "../../pages/class/UnGroupList";
import ChooseMentor from "../../pages/teacher/chooseMentor/ChooseMentor";
import Result from "../../pages/Dnd_test/Result";
import ClassManagement from "../../pages/class/ClassManagement";
import MainStep from "../../pages/teacher/stepSelectMentor/MainStep";
import MatchingMentorIndex from "../../pages/teacher/matchingMentor";
import ProjectCardMain from "../../pages/teacher/matchingMentor/matching/ProjectCardMain";
import DetailedSelection from "../../pages/teacher/matchingMentor/matching/DetailedSelection";
import ProjectRequest from "../../pages/teacher/projectApproval/ProjectRequest";
import OutcomeDetail from "../../pages/activity/OutcomeDetail";
import ClassDetail from "../../pages/class/ClassDetail";
import GroupDetail from "../../pages/managegroup/GroupDetail";

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
      <Route path="class/detail/:className" element={<ClassDetail/>} />
      <Route path="class" element={<ClassManagement />} />
      <Route path="teacher-activity" element={<MyActivity />} />
      <Route path="professionmanagement" element={<ProfessionManagement />} />
      <Route path="teacher-dashboard" element={<MyActivity />} />
      <Route path="dashboard-choose-mentor" element={<ChooseMentor />} />
      <Route path="choose-mentor" element={<MainStep />} />
      <Route path="class/detail/:className/outcomes" element={<OutcomeDetail/>} />
      <Route path="dashboard-choose-mentor/main-step" element={<MainStep />} />
      <Route path="temp-matching" element={<ProjectCardMain />} />
      <Route path="summary-class/temp-matching" element={<ProjectCardMain />} />
      <Route path="summary-class" element={<MatchingMentorIndex />} />
      <Route
        path="temp-matching/detailed-selection/:projectId"
        element={<DetailedSelection />}
      />
      <Route
        path="summary-class/temp-matching/detailed-selection/:projectId"
        element={<DetailedSelection />}
      />
      <Route path="project-request" element={<ProjectRequest />} />
      <Route path="group-detail/:groupId" element={<GroupDetail />} />
    </Route>
  );
};

export default TeacherRouter;
