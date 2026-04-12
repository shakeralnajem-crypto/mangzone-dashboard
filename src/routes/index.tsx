import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { AppointmentsPage } from '@/features/appointments/pages/AppointmentsPage';
import { PatientsPage } from '@/features/patients/pages/PatientsPage';
import { LeadsPage } from '@/features/leads/pages/LeadsPage';
import { TreatmentsPage } from '@/features/treatments/pages/TreatmentsPage';
import { BillingPage } from '@/features/billing/pages/BillingPage';
import { ReportsPage } from '@/features/reports/pages/ReportsPage';
import { StaffPage } from '@/features/staff/pages/StaffPage';
import { ServicesPage } from '@/features/services/pages/ServicesPage';
import { FollowupPage } from '@/features/followup/pages/FollowupPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { AccountingPage } from '@/features/accounting/pages/AccountingPage';
import { ContentPage } from '@/features/content/pages/ContentPage';

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
          { path: '/appointments', element: <AppointmentsPage /> },
          { path: '/patients',     element: <PatientsPage /> },
          { path: '/leads',        element: <LeadsPage /> },
          { path: '/treatments',   element: <TreatmentsPage /> },
          { path: '/billing',      element: <BillingPage /> },
          { path: '/services',     element: <ServicesPage /> },
          { path: '/followup',     element: <FollowupPage /> },
          { path: '/reports',      element: <ReportsPage /> },
          { path: '/staff',        element: <StaffPage /> },
          { path: '/settings',     element: <SettingsPage /> },
          { path: '/accounting',   element: <AccountingPage /> },
          { path: '/content',      element: <ContentPage /> },
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
