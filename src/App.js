import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import ProfessionManagement from "./pages/ProfessionManagement.jsx";
import SemesterIndex from "./pages/semester/index.js";

//Route tạm thời để code không dùng thì comment lại

function App() {
  return (
    <Routes>
      {/* <Route path="/" element={<ProfessionManagement />} /> */}
      <Route path="/" element={<SemesterIndex />} />
    </Routes>
  );
}

export default App;
