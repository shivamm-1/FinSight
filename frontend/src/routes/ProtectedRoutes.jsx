import { Navigate } from "react-router-dom";
import useInactivityLogout from "../hooks/useInactivityLogout";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("finsight_token");

  useInactivityLogout();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
