import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import WorkspaceLayout from '../components/WorkspaceLayout.jsx';
import DocumentList from '../components/DocumentList.jsx';
import { ErrorBanner, LoadingState } from '../components/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createDocument, deleteDocument, listDocuments } from '../services/documentService.js';

export default function WorkspacePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scope, setScope] = useState('owned');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await listDocuments();
      setDocuments(Array.isArray(result) ? result : result.items || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  async function handleCreateDocument() {
    setIsCreating(true);
    setError('');
    try {
      const document = await createDocument({
        title: 'Untitled document',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
      });
      navigate(`/documents/${document.id}`);
    } catch (createError) {
      setError(createError.message);
    } finally {
      setIsCreating(false);
    }
  }

  function handleImported(document) {
    if (document?.id) navigate(`/documents/${document.id}`);
    else loadDocuments();
  }

  async function handleDelete(document) {
    const confirmed = window.confirm(`Delete “${document.title}”? This cannot be undone.`);
    if (!confirmed) return;
    setError('');
    try {
      await deleteDocument(document.id);
      setDocuments((current) => current.filter((item) => item.id !== document.id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  const ownedCount = useMemo(
    () => documents.filter((document) => document.is_owner ?? document.owner_id === user?.id).length,
    [documents, user?.id],
  );
  const sharedCount = documents.length - ownedCount;

  return (
    <WorkspaceLayout
      scope={scope}
      onScopeChange={setScope}
      onCreateDocument={handleCreateDocument}
      onImported={handleImported}
    >
      <main className="workspace-main">
        <div className="workspace-topbar">
          <div className="topbar-greeting">
            <span className="eyebrow">YOUR WORKSPACE</span>
            <h1>Good to see you, {user?.name?.split(' ')[0] || 'there'}.</h1>
            <p>Pick up where you left off or start something new.</p>
          </div>
          <div className="topbar-actions">
            <button className="button button-secondary" type="button" onClick={loadDocuments} disabled={isLoading}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="button button-primary" type="button" onClick={handleCreateDocument} disabled={isCreating}>
              <Plus size={17} /> {isCreating ? 'Creating…' : 'New document'}
            </button>
          </div>
        </div>

        <div className="workspace-stats">
          <div className="stat-card"><span>All documents</span><strong>{documents.length}</strong></div>
          <div className="stat-card"><span>Owned by you</span><strong>{ownedCount}</strong></div>
          <div className="stat-card"><span>Shared with you</span><strong>{sharedCount}</strong></div>
        </div>

        <ErrorBanner error={error} onRetry={loadDocuments} />
        {isLoading ? (
          <LoadingState label="Loading your documents…" />
        ) : (
          <DocumentList
            documents={documents}
            scope={scope}
            currentUserId={user?.id}
            onDelete={scope === 'owned' ? handleDelete : undefined}
          />
        )}
      </main>
    </WorkspaceLayout>
  );
}
