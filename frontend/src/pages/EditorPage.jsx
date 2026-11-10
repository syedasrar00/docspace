import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, LoaderCircle } from 'lucide-react';
import DocumentHeader from '../components/DocumentHeader.jsx';
import RichTextEditor from '../components/RichTextEditor.jsx';
import ShareDialog from '../components/ShareDialog.jsx';
import { ErrorBanner, FullPageLoader } from '../components/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getDocument, updateDocument } from '../services/documentService.js';

export default function EditorPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const contentRef = useRef(null);
  const revisionRef = useRef(0);
  const savedRevisionRef = useRef(0);
  const isSavingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadDocument = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await getDocument(documentId);
      setDocument(result);
      setContent(result.content || { type: 'doc', content: [{ type: 'paragraph' }] });
      contentRef.current = result.content || { type: 'doc', content: [{ type: 'paragraph' }] };
      revisionRef.current = 0;
      savedRevisionRef.current = 0;
      setRevision(0);
      setSaveStatus('saved');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => { loadDocument(); }, [loadDocument]);

  const isOwner = document ? (document.is_owner ?? document.owner_id === user?.id) : false;
  const permission = document?.permission || (isOwner ? 'owner' : 'viewer');
  const canEdit = isOwner || permission === 'editor';
  const canShare = isOwner;

  const handleContentChange = useCallback((nextContent) => {
    contentRef.current = nextContent;
    revisionRef.current += 1;
    setRevision(revisionRef.current);
    setContent(nextContent);
    setSaveStatus('dirty');
  }, []);

  const flushSave = useCallback(async () => {
    if (isSavingRef.current || !canEdit || !documentId) return;
    isSavingRef.current = true;
    let failed = false;

    try {
      while (savedRevisionRef.current !== revisionRef.current) {
        const revisionBeingSaved = revisionRef.current;
        const contentBeingSaved = contentRef.current;
        if (mountedRef.current) setSaveStatus('saving');
        try {
          await updateDocument(documentId, { content: contentBeingSaved });
          savedRevisionRef.current = revisionBeingSaved;
          if (mountedRef.current) setError('');
        } catch (saveError) {
          failed = true;
          if (mountedRef.current) {
            setSaveStatus('error');
            setError(`Could not save your changes: ${saveError.message}`);
          }
          break;
        }
      }
    } finally {
      isSavingRef.current = false;
      if (mountedRef.current && !failed && savedRevisionRef.current === revisionRef.current) {
        setSaveStatus('saved');
      }
    }
  }, [canEdit, documentId]);

  useEffect(() => {
    if (revision === 0 || !canEdit) return undefined;
    const timer = window.setTimeout(() => { flushSave(); }, 900);
    return () => window.clearTimeout(timer);
  }, [revision, canEdit, flushSave]);

  async function handleRename(title) {
    try {
      const updated = await updateDocument(documentId, { title });
      setError('');
      setDocument((current) => ({ ...current, ...updated, title: updated?.title || title }));
    } catch (renameError) {
      setError(`Could not rename document: ${renameError.message}`);
    }
  }

  if (isLoading) return <FullPageLoader label="Opening document…" />;
  if (error && !document) {
    return (
      <main className="editor-error-page">
        <ErrorBanner error={error} />
        <button type="button" className="button button-secondary" onClick={() => navigate('/')}>Back to workspace</button>
      </main>
    );
  }
  if (!document || !content) return null;

  return (
    <div className="editor-page">
      <DocumentHeader
        document={document}
        canEdit={canEdit}
        canShare={canShare}
        saveStatus={saveStatus}
        onRename={handleRename}
        onShare={() => setIsShareOpen(true)}
      />
      <main className="editor-main">
        <div className="editor-context-row">
          <span className="document-type-label"><FileText size={14} /> DOCUMENT</span>
          {!canEdit && <span className="read-only-label">View only</span>}
          {permission === 'editor' && !isOwner && <span className="permission-label">Shared with edit access</span>}
        </div>
        <ErrorBanner error={error} compact />
        <RichTextEditor
          key={document.id}
          content={content}
          editable={canEdit}
          onChange={handleContentChange}
        />
        <div className="editor-bottom-note">
          {canEdit ? 'Your changes are saved automatically.' : 'You have view-only access to this document.'}
          {saveStatus === 'error' && (
            <button className="text-button" type="button" onClick={flushSave}>
              <LoaderCircle size={13} /> Retry save
            </button>
          )}
        </div>
      </main>
      {isShareOpen && (
        <ShareDialog
          documentId={document.id}
          currentUserId={user?.id}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  );
}
