import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import ProfessionManagement from "./pages/ProfessionManagement.jsx";
import SignIn from "./pages/SignIn.jsx";

//Route tạm thời để code không dùng thì comment lại

function App() {
  return (
    <Routes>
      {/* <Route path="/" element={<ProfessionManagement />} /> */}
      <Route path="/" element={<SignIn />} />
    </Routes>
  );
}

export default App;
