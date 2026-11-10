import { FileText, Files, LogOut, Plus, UserRound } from 'lucide-react';
import ImportButton from './ImportButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar({ scope, onScopeChange, onCreateDocument, onImported }) {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <div className="brand-mark">D</div>
        <div>
          <strong>DocSpace</strong>
          <span>Documents, together.</span>
        </div>
      </div>

      <div className="sidebar-actions">
        <button className="button button-primary button-full" onClick={onCreateDocument} type="button">
          <Plus size={18} /> New document
        </button>
        <ImportButton onImported={onImported} />
      </div>

      <div className="sidebar-label">Workspace</div>
      <nav className="sidebar-nav" aria-label="Workspace navigation">
        <button
          type="button"
          className={`nav-item${scope === 'owned' ? ' active' : ''}`}
          onClick={() => onScopeChange('owned')}
        >
          <FileText size={18} /> My documents
        </button>
        <button
          type="button"
          className={`nav-item${scope === 'shared' ? ' active' : ''}`}
          onClick={() => onScopeChange('shared')}
        >
          <Files size={18} /> Shared with me
        </button>
      </nav>

      <div className="sidebar-spacer" />
      <div className="sidebar-account">
        <div className="avatar"><UserRound size={17} /></div>
        <div className="account-copy">
          <strong>{user?.name || 'Demo user'}</strong>
          <span>{user?.email}</span>
        </div>
        <button className="icon-button" type="button" title="Switch account" aria-label="Switch account" onClick={logout}>
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
}
