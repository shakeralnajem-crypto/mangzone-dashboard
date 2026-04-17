import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { canAccessPage } from "@/lib/permissions";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, profile } = useAuthStore();
  const location = useLocation();
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
      </div>
    );
  }
  return <Outlet />;
}
