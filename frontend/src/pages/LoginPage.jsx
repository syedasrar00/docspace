import { FileText, LockKeyhole, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ErrorBanner } from '../components/Feedback.jsx';
import DemoUserSelector from '../components/DemoUserSelector.jsx';

const DEMO_USERS = [
  { name: 'Alice', email: 'alice@docspace.demo' },
  { name: 'Bob', email: 'bob@docspace.demo' },
];

export default function LoginPage() {
  const [selectedEmail, setSelectedEmail] = useState(DEMO_USERS[0].email);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(selectedEmail);
      navigate('/', { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-lockup login-brand">
          <div className="brand-mark">D</div>
          <div><strong>DocSpace</strong><span>Documents, together.</span></div>
        </div>
        <div className="login-intro">
          <span className="eyebrow">YOUR SHARED WORKSPACE</span>
          <h1>Make space for<br />good ideas.</h1>
          <p>A simple place to create, edit and share documents with your team.</p>
        </div>
        <div className="login-feature-row">
          <span><FileText size={15} /> Rich-text docs</span>
          <span><Users size={15} /> Simple sharing</span>
          <span><LockKeyhole size={15} /> Demo access</span>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <span>Choose a demo account</span>
            <DemoUserSelector value={selectedEmail} onChange={setSelectedEmail} />
          </div>
          <ErrorBanner error={error} compact />
          <button className="button button-primary button-full login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : `Continue as ${DEMO_USERS.find((user) => user.email === selectedEmail)?.name}`}
          </button>
          <p className="login-disclaimer">This assessment uses seeded demo accounts. No password is required.</p>
        </form>
      </section>
      <footer className="login-footer">DocSpace <span>·</span> Lightweight collaborative documents</footer>
    </main>
  );
}
