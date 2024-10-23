import React from 'react';
import { Route } from 'react-router-dom';
import { ProtectRoute } from '../../utilities/auth';
import TeacherLayout from '../../layouts/teacher/TeacherLayout';
import MyActivity from '../../pages/activity/MyActivity';
import Tasks from '../../pages/activity/Tasks';
import MaterialList from '../../pages/activity/MaterialList';
import ProfessionManagement from '../../pages/professiona&specialty/ProfessionManagement';
import UnGroupList from '../../pages/class/UnGroupList';

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
        <Route path="professionmanagement" element={<ProfessionManagement />} />
        <Route path="class/:className" element={ <UnGroupList />}/>
        <Route path="teacher-activity" element={<MyActivity />}/>
        <Route path="tasks"  element={ <Tasks /> } />
        <Route path="materials" element={ <MaterialList />}/>
      </Route>
    );
};

export default TeacherRouter;