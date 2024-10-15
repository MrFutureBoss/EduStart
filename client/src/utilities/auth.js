import { Navigate } from "react-router-dom";

export const ProtectRoute = ({ allowedRoles, children }) => {
    const token = localStorage.getItem("jwt");
    const userRole = localStorage.getItem("role"); 
  
    if (!token) {
      return <Navigate to="/" replace />;
    }
  
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  
    return children;
  };