import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import ProfessionManagement from "./pages/ProfessionManagement.jsx";
import SignIn from "./pages/SignIn.jsx";
import PendingUsers from "./components/semester/PendingUserList.js";
import AdminLayout from "./layouts/admin/AdminLayout.js";
import UserListSemester from "./components/semester/UserList.js";
import SemesterList from "./components/semester/SemesterList.js";

//Route tạm thời để code không dùng thì comment lại

function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/semester-list" element={<SemesterList />} />
        <Route path="/current-semester" element={<UserListSemester />} />
        <Route path="/pending-users" element={<PendingUsers />} />
        <Route path="/user-semester" element={<UserListSemester />} />
        <Route path="/pending-user" element={<PendingUsers />} />
      </Route>
      {/* <Route path="/" element={<ProfessionManagement />} /> */}
      {/* <Route path="/" element={<AdminLayout />} /> */}
      {/* <Route path="/" element={<SignIn />} /> */}
    </Routes>
  );
}

export default App;
