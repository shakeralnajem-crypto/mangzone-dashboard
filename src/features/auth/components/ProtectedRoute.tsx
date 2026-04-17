import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { canAccessPage } from '@/lib/permissions';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, profile } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',background:'#0D1117',flexDirection:'column',gap:16}}>
        <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(.95)}}`}</style>
        <div style={{width:48,height:48,borderRadius:14,background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:900,color:'white',boxShadow:'0 0 30px rgba(124,58,237,0.5)',animation:'pulse 1.5s ease-in-out infinite'}}>MZ</div>
        <p style={{fontSize:13,color:'rgba(255,255,25        <p style={{fontSize:13,color:'rgba(255,255,25        ل...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <N  if (!isAuthenticated) return <N  if (!isAut} rep  if (!isAuthenticated) return <N  if (!isA, locatio  if (!isAuthenticated) return <N"/dashboard" replace />;
  return <Outlet />;
}
