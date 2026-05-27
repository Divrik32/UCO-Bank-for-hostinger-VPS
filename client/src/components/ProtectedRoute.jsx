import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRole }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // No token → login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → redirect based on actual role
  if (role !== allowedRole) {
    return (
      <Navigate
        to={role === "admin" ? "/admin/dashboard" : "/user/dashboard"}
        replace
      />
    );
  }

  return <Outlet />;
}