// src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import TeacherDashboard from "./pages/TeacherDashboard";
import { Provider } from "react-redux";
import store from "../src/redux/store";
import SemesterIndex from "./pages/semester";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/a" element={<TeacherDashboard />} />
          <Route path="/" element={<SemesterIndex />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
