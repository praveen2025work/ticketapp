import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { ThemeProvider } from './shared/context/ThemeContext';
import { AutoRefreshProvider } from './shared/context/AutoRefreshContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import TicketListPage from './pages/TicketListPage';
import CreateTicketPage from './pages/CreateTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';
import EditTicketPage from './pages/EditTicketPage';
import ApprovalQueuePage from './pages/ApprovalQueuePage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import AdminPage from './pages/AdminPage';
import StarterGuidePage from './pages/StarterGuidePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
        Loading...
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center text-slate-600 dark:text-slate-300 max-w-md px-4">
          <p className="font-medium">Authentication required</p>
          <p className="text-sm mt-2">Please ensure you are signed in with BAM (Windows) authentication.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="guide" element={<StarterGuidePage />} />
        <Route path="tickets" element={<TicketListPage />} />
        <Route path="tickets/create" element={<CreateTicketPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="tickets/:id/edit" element={<EditTicketPage />} />
        <Route path="approvals" element={<ApprovalQueuePage />} />
        <Route path="knowledge" element={<KnowledgeBasePage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="audit" element={<Navigate to="/admin?tab=audit" replace />} />
        <Route path="settings" element={<Navigate to="/admin" replace />} />
        <Route path="applications" element={<Navigate to="/admin" replace />} />
        <Route path="users" element={<Navigate to="/admin" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AutoRefreshProvider>
              <AppRoutes />
            </AutoRefreshProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
