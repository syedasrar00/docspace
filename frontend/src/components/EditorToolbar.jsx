import {
  Bold, Heading1, Heading2, Italic, List, ListOrdered, Underline as UnderlineIcon,
} from 'lucide-react';

function ToolbarButton({ label, active, disabled, onClick, children }) {
  return (
    <button
      className={`toolbar-button${active ? ' is-active' : ''}`}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function EditorToolbar({ editor, readOnly = false }) {
  if (!editor) return null;
  const run = (command) => {
    if (!readOnly) command().run();
  };

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
      <ToolbarButton label="Bold" active={editor.isActive('bold')} disabled={readOnly} onClick={() => run(() => editor.chain().focus().toggleBold())}>
        <Bold size={17} />
      </ToolbarButton>
      <ToolbarButton label="Italic" active={editor.isActive('italic')} disabled={readOnly} onClick={() => run(() => editor.chain().focus().toggleItalic())}>
        <Italic size={17} />
      </ToolbarButton>
      <ToolbarButton label="Underline" active={editor.isActive('underline')} disabled={readOnly} onClick={() => run(() => editor.chain().focus().toggleUnderline())}>
        <UnderlineIcon size={17} />
      </ToolbarButton>
      <span className="toolbar-divider" />
      <ToolbarButton label="Heading 1" active={editor.isActive('heading', { level: 1 })} disabled={readOnly} onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 1 }))}>
        <Heading1 size={18} />
      </ToolbarButton>
      <ToolbarButton label="Heading 2" active={editor.isActive('heading', { level: 2 })} disabled={readOnly} onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 2 }))}>
        <Heading2 size={18} />
      </ToolbarButton>
      <span className="toolbar-divider" />
      <ToolbarButton label="Bulleted list" active={editor.isActive('bulletList')} disabled={readOnly} onClick={() => run(() => editor.chain().focus().toggleBulletList())}>
        <List size={18} />
      </ToolbarButton>
      <ToolbarButton label="Numbered list" active={editor.isActive('orderedList')} disabled={readOnly} onClick={() => run(() => editor.chain().focus().toggleOrderedList())}>
        <ListOrdered size={18} />
      </ToolbarButton>
    </div>
  );
}
