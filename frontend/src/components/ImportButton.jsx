import { FileUp } from 'lucide-react';
import { useRef, useState } from 'react';
import { importDocument } from '../services/documentService.js';
import { ErrorBanner } from './Feedback.jsx';

const MAX_FILE_SIZE = 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.txt', '.md'];

export default function ImportButton({ onImported }) {
  const inputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const extension = `.${file.name.split('.').pop().toLowerCase()}`;
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError('Only .txt and .md files are supported.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('The maximum supported file size is 1 MB.');
      return;
    }

    setError('');
    setIsImporting(true);
    try {
      const document = await importDocument(file);
      onImported(document);
    } catch (importError) {
      setError(importError.message);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="import-control">
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        onChange={handleFileChange}
      />
      <button
        type="button"
        className="button button-secondary button-full"
        onClick={() => inputRef.current?.click()}
        disabled={isImporting}
      >
        <FileUp size={17} />
        {isImporting ? 'Importing…' : 'Import file'}
      </button>
      <ErrorBanner error={error} compact />
      <p className="field-help">TXT or Markdown · Up to 1 MB</p>
    </div>
  );
}
