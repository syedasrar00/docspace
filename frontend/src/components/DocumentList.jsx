import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import DocumentListItem from './DocumentListItem.jsx';
import EmptyState from './EmptyState.jsx';

export default function DocumentList({ documents, scope, currentUserId, onDelete }) {
  const [query, setQuery] = useState('');

  const visibleDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return documents
      .filter((document) => {
        const isOwner = document.is_owner ?? document.owner_id === currentUserId;
        return scope === 'shared' ? !isOwner : isOwner;
      })
      .filter((document) => !normalizedQuery || document.title?.toLowerCase().includes(normalizedQuery));
  }, [documents, scope, currentUserId, query]);

  return (
    <section className="document-list-section">
      <div className="list-toolbar">
        <div>
          <h2>{scope === 'shared' ? 'Shared with me' : 'My documents'}</h2>
          <p>{visibleDocuments.length} {visibleDocuments.length === 1 ? 'document' : 'documents'}</p>
        </div>
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Search documents"
            placeholder="Search documents"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {visibleDocuments.length > 0 ? (
        <div className="document-grid">
          {visibleDocuments.map((document) => (
            <DocumentListItem
              key={document.id}
              document={document}
              currentUserId={currentUserId}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={query ? 'No matching documents' : scope === 'shared' ? 'Nothing shared with you yet' : 'Create your first document'}
          description={query ? 'Try a different search term.' : scope === 'shared' ? 'Documents shared by other users will appear here.' : 'Start with a blank document or import a text or Markdown file.'}
        />
      )}
    </section>
  );
}
