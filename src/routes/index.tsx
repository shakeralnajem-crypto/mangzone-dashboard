import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export const router = createBrowserRouter([
  // Public
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
    ],
  },

  // Protected
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/',             element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard',    element: <DashboardPage /> },
          { path: '/appointments', element: <ComingSoonPage title="Appointments" /> },
          { path: '/patients',     element: <ComingSoonPage title="Patients" /> },
          { path: '/treatments',   element: <ComingSoonPage title="Treatments" /> },
          { path: '/billing',      element: <ComingSoonPage title="Billing" /> },
          { path: '/reports',      element: <ComingSoonPage title="Reports" /> },
          { path: '/staff',        element: <ComingSoonPage title="Staff" /> },
          { path: '/settings',     element: <ComingSoonPage title="Settings" /> },
        ],
      },
    ],
  },

  // 404
  {
    path: '*',
    element: (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <p className="text-6xl font-bold text-slate-200">404</p>
        <p className="text-slate-500">Page not found.</p>
      </div>
    ),
  },
]);
