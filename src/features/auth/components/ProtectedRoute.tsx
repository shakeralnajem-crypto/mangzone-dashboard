import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { canAccessPage } from "@/lib/permissions";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, profile } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{background:"#0D1117",flexDirection:"column",gap:16}}>
        <div className="ds-spinner" />
        <p style={{fontSize:13,color:"rgba(255,255,255,0.3)"}}>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!canAccessPage(profile?.role, location.pathname)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
