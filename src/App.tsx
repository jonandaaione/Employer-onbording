import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import Landing from '@/pages/Landing';
import SignUp from '@/pages/SignUp';
import SignIn from '@/pages/SignIn';
import AppShell from '@/pages/app/AppShell';
import Dashboard from '@/pages/app/Dashboard';
import Employees from '@/pages/app/Employees';
import EmployeeDetail from '@/pages/app/EmployeeDetail';
import Departments from '@/pages/app/Departments';
import JobRoles from '@/pages/app/JobRoles';
import Templates from '@/pages/app/Templates';
import Tasks from '@/pages/app/Tasks';
import Documents from '@/pages/app/Documents';
import Signatures from '@/pages/app/Signatures';
import Training from '@/pages/app/Training';
import ITRequests from '@/pages/app/ITRequests';
import Reports from '@/pages/app/Reports';
import AuditLogs from '@/pages/app/AuditLogs';
import Settings from '@/pages/app/Settings';
import PortalShell from '@/pages/portal/PortalShell';
import PortalDashboard from '@/pages/portal/PortalDashboard';
import PortalProfile from '@/pages/portal/PortalProfile';
import PortalDocuments from '@/pages/portal/PortalDocuments';
import PortalAgreements from '@/pages/portal/PortalAgreements';
import PortalTasks from '@/pages/portal/PortalTasks';
import PortalTraining from '@/pages/portal/PortalTraining';
import PortalHelp from '@/pages/portal/PortalHelp';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>;
  if (!session) return <Navigate to="/signin" state={{ from: location }} replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<PublicOnlyRoute><SignUp /></PublicOnlyRoute>} />
          <Route path="/signin" element={<PublicOnlyRoute><SignIn /></PublicOnlyRoute>} />

          {/* Employer panel */}
          <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="employees/:id" element={<EmployeeDetail />} />
            <Route path="departments" element={<Departments />} />
            <Route path="job-roles" element={<JobRoles />} />
            <Route path="templates" element={<Templates />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="documents" element={<Documents />} />
            <Route path="signatures" element={<Signatures />} />
            <Route path="training" element={<Training />} />
            <Route path="it-requests" element={<ITRequests />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Employee portal */}
          <Route path="/portal" element={<ProtectedRoute><PortalShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="/portal/dashboard" replace />} />
            <Route path="dashboard" element={<PortalDashboard />} />
            <Route path="profile" element={<PortalProfile />} />
            <Route path="documents" element={<PortalDocuments />} />
            <Route path="agreements" element={<PortalAgreements />} />
            <Route path="tasks" element={<PortalTasks />} />
            <Route path="training" element={<PortalTraining />} />
            <Route path="help" element={<PortalHelp />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
