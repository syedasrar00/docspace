import { FileText, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

function formatDate(value) {
  if (!value) return 'Recently updated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export default function DocumentListItem({ document, currentUserId, onDelete }) {
  const isOwner = document.is_owner ?? document.owner_id === currentUserId;
  const permission = document.permission || (isOwner ? 'owner' : 'viewer');

  return (
    <article className="document-card">
      <Link className="document-card-main" to={`/documents/${document.id}`}>
        <div className="document-card-icon"><FileText size={20} /></div>
        <div className="document-card-copy">
          <h3 title={document.title}>{document.title || 'Untitled document'}</h3>
          <p>
            {isOwner ? 'Owned by you' : `Shared by ${document.owner?.name || document.owner_name || 'another user'}`}
            <span className="meta-dot">·</span>
            {formatDate(document.updated_at)}
          </p>
        </div>
      </Link>
      <div className="document-card-meta">
        {!isOwner && <span className="permission-pill"><Users size={12} /> {permission}</span>}
        {isOwner && <span className="owner-pill">Owner</span>}
        {isOwner && onDelete && (
          <button
            type="button"
            className="icon-button subtle-icon-button"
            aria-label={`Delete ${document.title}`}
            title="Delete document"
            onClick={() => onDelete(document)}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </article>
  );
}
