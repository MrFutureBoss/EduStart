import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import PendingUsers from "./pages/semester/PendingUserList.js";
import AdminLayout from "./layouts/admin/AdminLayout.js";
import UserListSemester from "./pages/semester/UserList.js";
import SemesterList from "./pages/semester/SemesterList.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChangePassword from "./pages/ChangePassword.jsx";
import ProfessionManagement from "./pages/professiona&specialty/ProfessionManagement.jsx";
import SignIn from "./pages/authen&author/SignIn.jsx";
import TeacherRouter from "./routers/teacher/TeacherRouter.js";
import AdminRouter from "./routers/admin/AdminRouter.js";
import StudentRouter from "./routers/student/StudentRouter.js";
import Support from "./pages/Support"; 

function App() {

  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route
          path="/admin-dashboard"
          element={
            <ProtectRoute allowedRoles={["1"]}>
              <AdminLayout />
            </ProtectRoute>
          }
        >
          <Route path="semester-list" element={<SemesterList />} />
          <Route path="current-semester" element={<UserListSemester />} />
          <Route path="pending-user" element={<PendingUsers />} />
          <Route path="semester-list/user-semester" element={<UserListSemester />} />
          <Route path="professionmanagement" element={<ProfessionManagement />} />
        </Route>

        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/" element={<SignIn />} />
        <Route path="/unauthorized" element={<h1>Access Denied</h1>} />
        <Route path="/support" element={<Support />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
