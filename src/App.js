import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import ProfessionManagement from "./pages/ProfessionManagement.jsx";

//Route tạm thời để code không dùng thì comment lại

function App() {
  return (
      <Routes>
        <Route path="/" element={<ProfessionManagement />} />
      </Routes>
  );
}

export default App;
