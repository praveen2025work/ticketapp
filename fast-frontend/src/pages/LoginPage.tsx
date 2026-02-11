import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect to dashboard when authenticated (BAM/LDAP handles auth)
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-100 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">FAST</h1>
          <p className="text-slate-500 mt-1 text-sm">Fast Acceleration Support Team</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent" />
            <p className="text-slate-500 mt-3 text-sm">Authenticating...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center py-6">
            <p className="text-slate-600 mb-4">Authentication is handled via BAM SSO / LDAP.</p>
            <p className="text-slate-500 text-sm">If you are not redirected automatically, please contact your administrator.</p>
          </div>
        ) : null}

        <div className="mt-6 p-4 bg-slate-50 rounded-xl text-xs text-slate-500">
          <p className="font-medium mb-2 text-slate-600">Roles</p>
          <div className="grid grid-cols-2 gap-1">
            <span>ADMIN - Create & manage</span>
            <span>REVIEWER - Business review</span>
            <span>APPROVER - IT review</span>
            <span>RTB_OWNER - RTB lead</span>
            <span>TECH_LEAD - BTB lead</span>
            <span>READ_ONLY - View only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
