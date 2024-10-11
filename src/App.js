import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ProfessionManagement from "./pages/professiona&specialty/ProfessionManagement";
// import SemesterIndex from "./pages/semester/index.js";
// import SignIn from "./pages/SignIn.jsx";

//Route tạm thời để code không dùng thì comment lại

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<ProfessionManagement />} />
        {/* <Route path="/" element={<SemesterIndex />} />
      <Route path="/" element={<SignIn />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
