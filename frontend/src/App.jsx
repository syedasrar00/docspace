import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import WorkspacePage from './pages/WorkspacePage.jsx';
import EditorPage from './pages/EditorPage.jsx';
import { FullPageLoader } from './components/Feedback.jsx';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader label="Checking your session…" />;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader label="Loading DocSpace…" />;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <WorkspacePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/:documentId"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}
