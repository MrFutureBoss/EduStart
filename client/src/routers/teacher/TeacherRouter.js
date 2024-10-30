import React from "react";
import { Route } from "react-router-dom";
import { ProtectRoute } from "../../utilities/auth";
import TeacherLayout from "../../layouts/teacher/TeacherLayout";
import MyActivity from "../../pages/activity/MyActivity";
import Tasks from "../../pages/activity/Tasks";
import MaterialList from "../../pages/activity/MaterialList";
import GroupProccess from "../../pages/create-group/GroupProccess";
import ChooseMentor from "../../pages/teacher/ChooseMentor";
import PostActivity from "../../pages/activity/PostActivity";
import Result from "../../pages/Dnd_test/Result";
import ClassManagement from "../../pages/class/ClassManagement";

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
      <Route path="choose-mentor" element={<ChooseMentor />} />
      <Route path="posts" element={<PostActivity />} />
    </Route>
  );
};

export default TeacherRouter;
