import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect, useRef } from 'react';
import EditorToolbar from './EditorToolbar.jsx';

const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
  Underline,
];

const EMPTY_DOCUMENT = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export default function RichTextEditor({ content, editable, onChange }) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions,
    content: content || EMPTY_DOCUMENT,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap-content',
        'aria-label': 'Document content',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChangeRef.current?.(activeEditor.getJSON());
    },
  }, []);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  return (
    <div className="editor-frame">
      <EditorToolbar editor={editor} readOnly={!editable} />
      <div className={`editor-canvas${!editable ? ' editor-readonly' : ''}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
