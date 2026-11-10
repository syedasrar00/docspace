import Sidebar from './Sidebar.jsx';

export default function WorkspaceLayout({
  scope,
  onScopeChange,
  onCreateDocument,
  onImported,
  children,
}) {
  return (
    <div className="workspace-shell">
      <Sidebar
        scope={scope}
        onScopeChange={onScopeChange}
        onCreateDocument={onCreateDocument}
        onImported={onImported}
      />
      {children}
    </div>
  );
}
