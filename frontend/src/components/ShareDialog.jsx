import { LoaderCircle, Mail, Share2, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { listDocumentShares, listUsers, revokeDocumentShare, shareDocument } from '../services/sharingService.js';
import { ErrorBanner } from './Feedback.jsx';

export default function ShareDialog({ documentId, currentUserId, onClose }) {
  const [users, setUsers] = useState([]);
  const [shares, setShares] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permission, setPermission] = useState('editor');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const [availableUsers, currentShares] = await Promise.all([
        listUsers(),
        listDocumentShares(documentId),
      ]);
      setUsers(availableUsers);
      setShares(currentShares);
      const firstAvailable = availableUsers.find((user) => user.id !== currentUserId && !currentShares.some((share) => share.user_id === user.id));
      setSelectedUserId(firstAvailable ? String(firstAvailable.id) : '');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [documentId]);

  const shareableUsers = useMemo(
    () => users.filter((user) => user.id !== currentUserId && !shares.some((share) => share.user_id === user.id)),
    [users, shares, currentUserId],
  );

  async function handleShare(event) {
    event.preventDefault();
    if (!selectedUserId) return;
    setIsSaving(true);
    setError('');
    try {
      await shareDocument(documentId, selectedUserId, permission);
      await loadData();
    } catch (shareError) {
      setError(shareError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRevoke(userId) {
    if (!window.confirm('Remove this person’s access to the document?')) return;
    setError('');
    try {
      await revokeDocumentShare(documentId, userId);
      await loadData();
    } catch (revokeError) {
      setError(revokeError.message);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-dialog-title">
        <div className="modal-header">
          <div className="modal-title-lockup">
            <div className="modal-icon"><Share2 size={18} /></div>
            <div>
              <h2 id="share-dialog-title">Share document</h2>
              <p>Invite a demo user to collaborate.</p>
            </div>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close sharing dialog"><X size={19} /></button>
        </div>

        <ErrorBanner error={error} compact />
        {isLoading ? (
          <div className="inline-state"><LoaderCircle className="spin" size={18} /> Loading sharing settings…</div>
        ) : (
          <>
            <form className="share-form" onSubmit={handleShare}>
              <label className="form-field">
                <span>Invite person</span>
                <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} disabled={!shareableUsers.length}>
                  {shareableUsers.length ? shareableUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  )) : <option value="">All demo users already have access</option>}
                </select>
              </label>
              <label className="form-field permission-select">
                <span>Permission</span>
                <select value={permission} onChange={(event) => setPermission(event.target.value)}>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </label>
              <button className="button button-primary share-submit" type="submit" disabled={!selectedUserId || isSaving || !shareableUsers.length}>
                {isSaving ? <LoaderCircle className="spin" size={16} /> : <Share2 size={16} />}
                Share
              </button>
            </form>

            <div className="share-list-heading">People with access <span>{shares.length}</span></div>
            {shares.length ? (
              <div className="share-list">
                {shares.map((share) => (
                  <div className="share-person" key={share.id || share.user_id}>
                    <div className="avatar avatar-small">{(share.user?.name || share.name || '?').charAt(0).toUpperCase()}</div>
                    <div className="share-person-copy">
                      <strong>{share.user?.name || share.name || `User ${share.user_id}`}</strong>
                      <span>{share.user?.email || share.email || ''}</span>
                    </div>
                    <span className="permission-pill">{share.permission}</span>
                    <button className="icon-button danger-icon" type="button" title="Remove access" aria-label="Remove access" onClick={() => handleRevoke(share.user_id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-note">This document has not been shared yet.</p>
            )}
          </>
        )}
        <div className="modal-footer"><Mail size={14} /> Demo sharing is available between the seeded accounts.</div>
      </section>
    </div>
  );
}
