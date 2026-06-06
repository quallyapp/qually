import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading1, Heading2, Code, Undo, Redo } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "Write something...", minHeight = "200px" }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3 text-sm',
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-surface-container">
        <ToolbarBtn
          icon={<Bold className="size-3.5" />}
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        />
        <ToolbarBtn
          icon={<Italic className="size-3.5" />}
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        />
        <ToolbarBtn
          icon={<UnderlineIcon className="size-3.5" />}
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        />
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarBtn
          icon={<Heading1 className="size-3.5" />}
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        />
        <ToolbarBtn
          icon={<Heading2 className="size-3.5" />}
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        />
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarBtn
          icon={<List className="size-3.5" />}
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        />
        <ToolbarBtn
          icon={<ListOrdered className="size-3.5" />}
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        />
        <ToolbarBtn
          icon={<Code className="size-3.5" />}
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        />
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarBtn
          icon={<Undo className="size-3.5" />}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        />
        <ToolbarBtn
          icon={<Redo className="size-3.5" />}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Shift+Z)"
        />
      </div>
      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarBtn({ icon, active, onClick, disabled, title }: {
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`size-7 rounded grid place-items-center transition-colors ${
        active
          ? 'bg-primary/15 text-primary'
          : 'text-on-surface-variant hover:bg-surface-container-high hover:text-foreground'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {icon}
    </button>
  );
}
