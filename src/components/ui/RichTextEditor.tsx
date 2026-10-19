"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, Color, FontSize, BackgroundColor } from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  ImagePlus,
  Undo2,
  Redo2,
  Eraser,
  Palette,
  Highlighter,
  Loader2,
} from "lucide-react";
import { CropDialog } from "./CropDialog";
import { uploadImage } from "@/lib/image";
import { promptDialog, toast } from "@/lib/feedback";

const COLORS = ["#0F172A", "#475569", "#DC2626", "#EA580C", "#CA8A04", "#16A34A", "#0891B2", "#2563EB", "#7C3AED", "#DB2777", "#C79A3B", "#FFFFFF"];
const HIGHLIGHTS = ["#FEF08A", "#BBF7D0", "#BAE6FD", "#FBCFE8", "#FED7AA", "#E9D5FF"];
const SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];

/**
 * Word-style editor for long admin-written pages (e.g. the rulebook): headings,
 * text size and colour, highlight, lists, alignment, links and uploaded images.
 * Emits HTML; the server sanitises it before saving.
 */
export function RichTextEditor({ value, onChange, placeholder = "Start writing…" }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false, autolink: true } }),
      TextStyle,
      Color,
      FontSize,
      BackgroundColor,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false }),
    ],
    content: value || "",
    editorProps: {
      attributes: { class: "rich-content min-h-[320px] max-h-[65vh] overflow-y-auto px-4 py-3 focus:outline-none text-sm", "data-placeholder": placeholder },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Load saved content once it arrives (settings are fetched after the editor mounts).
  useEffect(() => {
    if (editor && value && editor.isEmpty) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return <div className="h-[380px] rounded-2xl border border-slate-200 bg-slate-50 animate-pulse" />;

  const insertImage = async (blob: Blob) => {
    setCropFile(null);
    setUploading(true);
    try {
      const src = await uploadImage(blob, blob.type === "image/png" ? "image.png" : "image.jpg");
      editor.chain().focus().setImage({ src }).run();
    } catch (e: any) {
      toast.error(e.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const setLink = async () => {
    const prev = editor.getAttributes("link").href || "";
    const url = await promptDialog({ title: "Link address", value: prev, placeholder: "https://…", confirmText: "Apply" });
    if (url === null) return;
    if (!url.trim()) return editor.chain().focus().extendMarkRange("link").unsetLink().run();
    if (!/^(https?:\/\/|mailto:|\/)/i.test(url.trim())) return toast.error("Use a link starting with https://");
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const block = editor.isActive("heading", { level: 1 }) ? "h1" : editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : "p";
  const size = (editor.getAttributes("textStyle").fontSize as string) || "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden focus-within:border-slate-400">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
        <select
          value={block}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run();
          }}
          className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
          aria-label="Text style"
        >
          <option value="p">Normal text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <select
          value={size}
          onChange={(e) => (e.target.value ? editor.chain().focus().setFontSize(e.target.value).run() : editor.chain().focus().unsetFontSize().run())}
          className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
          aria-label="Text size"
        >
          <option value="">Size</option>
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {parseInt(s)}
            </option>
          ))}
        </select>
        <Sep />
        <Btn editor={editor} on={() => editor.chain().focus().toggleBold().run()} active="bold" label="Bold"><Bold className="w-4 h-4" /></Btn>
        <Btn editor={editor} on={() => editor.chain().focus().toggleItalic().run()} active="italic" label="Italic"><Italic className="w-4 h-4" /></Btn>
        <Btn editor={editor} on={() => editor.chain().focus().toggleUnderline().run()} active="underline" label="Underline"><UnderlineIcon className="w-4 h-4" /></Btn>
        <Btn editor={editor} on={() => editor.chain().focus().toggleStrike().run()} active="strike" label="Strikethrough"><Strikethrough className="w-4 h-4" /></Btn>
        <Swatches
          icon={<Palette className="w-4 h-4" />}
          label="Text colour"
          colors={COLORS}
          current={editor.getAttributes("textStyle").color}
          onPick={(c) => (c ? editor.chain().focus().setColor(c).run() : editor.chain().focus().unsetColor().run())}
        />
        <Swatches
          icon={<Highlighter className="w-4 h-4" />}
          label="Highlight"
          colors={HIGHLIGHTS}
          current={editor.getAttributes("textStyle").backgroundColor}
          onPick={(c) => (c ? editor.chain().focus().setBackgroundColor(c).run() : editor.chain().focus().unsetBackgroundColor().run())}
        />
        <Sep />
        <Btn editor={editor} on={() => editor.chain().focus().setTextAlign("left").run()} active={{ textAlign: "left" }} label="Align left"><AlignLeft className="w-4 h-4" /></Btn>
        <Btn editor={editor} on={() => editor.chain().focus().setTextAlign("center").run()} active={{ textAlign: "center" }} label="Align centre"><AlignCenter className="w-4 h-4" /></Btn>
        <Btn editor={editor} on={() => editor.chain().focus().setTextAlign("right").run()} active={{ textAlign: "right" }} label="Align right"><AlignRight className="w-4 h-4" /></Btn>
        <Sep />
        <Btn editor={editor} on={() => editor.chain().focus().toggleBulletList().run()} active="bulletList" label="Bullet list"><List className="w-4 h-4" /></Btn>
        <Btn editor={editor} on={() => editor.chain().focus().toggleOrderedList().run()} active="orderedList" label="Numbered list"><ListOrdered className="w-4 h-4" /></Btn>
        <Btn editor={editor} on={() => editor.chain().focus().toggleBlockquote().run()} active="blockquote" label="Quote"><Quote className="w-4 h-4" /></Btn>
        <Btn editor={editor} on={() => editor.chain().focus().setHorizontalRule().run()} label="Divider line"><Minus className="w-4 h-4" /></Btn>
        <Sep />
        <Btn editor={editor} on={setLink} active="link" label="Link"><Link2 className="w-4 h-4" /></Btn>
        <Btn editor={editor} on={() => fileRef.current?.click()} label="Insert image" disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        </Btn>
        <Btn editor={editor} on={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} label="Clear formatting"><Eraser className="w-4 h-4" /></Btn>
        <Sep />
        <Btn editor={editor} on={() => editor.chain().focus().undo().run()} label="Undo" disabled={!editor.can().undo()}><Undo2 className="w-4 h-4" /></Btn>
        <Btn editor={editor} on={() => editor.chain().focus().redo().run()} label="Redo" disabled={!editor.can().redo()}><Redo2 className="w-4 h-4" /></Btn>
      </div>

      <EditorContent editor={editor} />

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (fileRef.current) fileRef.current.value = "";
          if (f) setCropFile(f);
        }}
      />
      <CropDialog file={cropFile} aspect={16 / 9} maxSize={1600} title="Adjust the image" onCancel={() => setCropFile(null)} onDone={insertImage} />
    </div>
  );
}

function Sep() {
  return <span className="w-px h-5 bg-slate-200 mx-0.5" />;
}

function Btn({ editor, on, active, label, disabled, children }: { editor: Editor; on: () => void; active?: string | Record<string, string>; label: string; disabled?: boolean; children: React.ReactNode }) {
  const isOn = typeof active === "string" ? editor.isActive(active) : active ? editor.isActive(active) : false;
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={on}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={isOn}
      className={`w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors disabled:opacity-40 ${isOn ? "bg-black text-white" : "text-slate-700 hover:bg-slate-200"}`}
    >
      {children}
    </button>
  );
}

function Swatches({ icon, label, colors, current, onPick }: { icon: React.ReactNode; label: string; colors: string[]; current?: string; onPick: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        title={label}
        aria-label={label}
        className="w-8 h-8 rounded-lg inline-flex flex-col items-center justify-center text-slate-700 hover:bg-slate-200"
      >
        {icon}
        <span className="block w-4 h-1 rounded-full -mt-0.5" style={{ background: current || "transparent" }} />
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-20 w-44 p-2 rounded-xl bg-white border border-slate-200 shadow-lg space-y-2">
          <div className="grid grid-cols-6 gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(c);
                  setOpen(false);
                }}
                className={`w-5 h-5 rounded-md border ${current === c ? "ring-2 ring-black ring-offset-1" : "border-slate-300"}`}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
              <input
                type="color"
                defaultValue={current || "#000000"}
                onChange={(e) => onPick(e.target.value)}
                className="w-6 h-6 rounded border-0 p-0 bg-transparent"
                aria-label="Custom colour"
              />
              Custom
            </label>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick("");
                setOpen(false);
              }}
              className="text-[11px] font-bold text-slate-500 hover:text-black"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
