import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';

// Lazy load all pages — reduces initial bundle size significantly
const DashboardPage   = lazy(() => import('@/features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AppointmentsPage = lazy(() => import('@/features/appointments/pages/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })));
const PatientsPage    = lazy(() => import('@/features/patients/pages/PatientsPage').then(m => ({ default: m.PatientsPage })));
const LeadsPage       = lazy(() => import('@/features/leads/pages/LeadsPage').then(m => ({ default: m.LeadsPage })));
const TreatmentsPage  = lazy(() => import('@/features/treatments/pages/TreatmentsPage').then(m => ({ default: m.TreatmentsPage })));
const BillingPage     = lazy(() => import('@/features/billing/pages/BillingPage').then(m => ({ default: m.BillingPage })));
const ReportsPage     = lazy(() => import('@/features/reports/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const StaffPage       = lazy(() => import('@/features/staff/pages/StaffPage').then(m => ({ default: m.StaffPage })));
const ServicesPage    = lazy(() => import('@/features/services/pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const FollowupPage    = lazy(() => import('@/features/followup/pages/FollowupPage').then(m => ({ default: m.FollowupPage })));
const SettingsPage    = lazy(() => import('@/features/settings/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AccountingPage  = lazy(() => import('@/features/accounting/pages/AccountingPage').then(m => ({ default: m.AccountingPage })));
const ContentPage     = lazy(() => import('@/features/content/pages/ContentPage').then(m => ({ default: m.ContentPage })));

function PageLoader() {
  return (
    <div style={{
      display: 'flex', height: '100%', minHeight: '60vh',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="ds-spinner" />
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/',             element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard',    element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> },
          { path: '/appointments', element: <SuspenseWrapper><AppointmentsPage /></SuspenseWrapper> },
          { path: '/patients',     element: <SuspenseWrapper><PatientsPage /></SuspenseWrapper> },
          { path: '/leads',        element: <SuspenseWrapper><LeadsPage /></SuspenseWrapper> },
          { path: '/treatments',   element: <SuspenseWrapper><TreatmentsPage /></SuspenseWrapper> },
          { path: '/billing',      element: <SuspenseWrapper><BillingPage /></SuspenseWrapper> },
          { path: '/services',     element: <SuspenseWrapper><ServicesPage /></SuspenseWrapper> },
          { path: '/followup',     element: <SuspenseWrapper><FollowupPage /></SuspenseWrapper> },
          { path: '/reports',      element: <SuspenseWrapper><ReportsPage /></SuspenseWrapper> },
          { path: '/staff',        element: <SuspenseWrapper><StaffPage /></SuspenseWrapper> },
          { path: '/settings',     element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper> },
          { path: '/accounting',   element: <SuspenseWrapper><AccountingPage /></SuspenseWrapper> },
          { path: '/content',      element: <SuspenseWrapper><ContentPage /></SuspenseWrapper> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: (
      <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <p style={{ fontSize: 72, fontWeight: 900, color: 'var(--txt3)' }}>404</p>
        <p style={{ color: 'var(--txt3)' }}>Page not found.</p>
      </div>
    ),
  },
]);
