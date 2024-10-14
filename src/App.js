import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import ProfessionManagement from "./pages/ProfessionManagement.jsx";
import ChangePassword from './ChangePassword'; 

//Route tạm thời để code không dùng thì comment lại

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Change Password Example</h1>
        <p>Click the link below to change your password:</p>

       <ChangePassword />
        <Routes> 
        <Route path="/" element={<ProfessionManagement />} />
      </Routes>
      </header>
    </div>
      
      
  );
}

export default App;
