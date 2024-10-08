import "./App.css";
import { Routes, Route, BrowserRouter} from "react-router-dom";
import StudentProfile from "./pages/StudentProfile.jsx";

//Route tạm thời để code không dùng thì comment lại

function App() {
  return (
        <BrowserRouter>
          <Routes>

            <Route path="/" element={<StudentProfile />} />

          </Routes>
        </BrowserRouter>
  );
}

export default App;