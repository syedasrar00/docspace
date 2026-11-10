import { ArrowLeft, Check, ChevronDown, Clock3, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function DocumentHeader({ document, canEdit, canShare, saveStatus, onRename, onShare }) {
  const [title, setTitle] = useState(document.title || 'Untitled document');
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    setTitle(document.title || 'Untitled document');
  }, [document.id, document.title]);

  async function commitRename() {
    const nextTitle = title.trim() || 'Untitled document';
    setTitle(nextTitle);
    setIsRenaming(false);
    if (nextTitle !== document.title) await onRename(nextTitle);
  }

  return (
    <header className="document-header">
      <div className="document-header-left">
        <Link className="back-link" to="/" aria-label="Back to workspace" title="Back to workspace">
          <ArrowLeft size={19} />
        </Link>
        <div className="document-title-area">
          {isRenaming ? (
            <input
              className="document-title-input"
              value={title}
              maxLength={255}
              autoFocus
              onChange={(event) => setTitle(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
                if (event.key === 'Escape') {
                  setTitle(document.title);
                  setIsRenaming(false);
                }
              }}
            />
          ) : (
            <button
              className="document-title-button"
              type="button"
              disabled={!canEdit}
              title={canEdit ? 'Click to rename' : document.title}
              onClick={() => canEdit && setIsRenaming(true)}
            >
              <span>{document.title || 'Untitled document'}</span>
              {canEdit && <ChevronDown size={15} />}
            </button>
          )}
          <span className={`save-indicator save-${saveStatus}`}>
            {saveStatus === 'saved' ? <Check size={12} /> : <Clock3 size={12} />}
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Save failed' : saveStatus === 'dirty' ? 'Unsaved changes' : 'Saved'}
          </span>
        </div>
      </div>
      <div className="document-header-actions">
        {canShare && (
          <button className="button button-primary" type="button" onClick={onShare}>
            <Share2 size={16} /> Share
          </button>
        )}
      </div>
    </header>
  );
}
