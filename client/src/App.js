import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
// import ProfessionManagement from "./pages/ProfessionManagement.jsx";
import SignIn from "./pages/SignIn.jsx";
import PendingUsers from "./pages/semester/PendingUserList.js";
import AdminLayout from "./layouts/admin/AdminLayout.js";
import UserListSemester from "./pages/semester/UserList.js";
import SemesterList from "./pages/semester/SemesterList.js";
import { ToastContainer } from "react-toastify";
import ProfessionManagement from "./pages/professiona&specialty/ProfessionManagement.jsx"
//Route tạm thời để code không dùng thì comment lại

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Layout dành cho Admin, bao gồm các route bên trong */}
        <Route path="/admin-dashboard" element={<AdminLayout />}>
          <Route path="semester-list" element={<SemesterList />} />
          <Route path="current-semester" element={<UserListSemester />} />
          <Route path="pending-user" element={<PendingUsers />} />
          <Route
            path="semester-list/user-semester"
            element={<UserListSemester />}
          />
          <Route path="professionmanagement" element={<ProfessionManagement/>} />
        </Route>
        <Route path="/" element={<SignIn />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
