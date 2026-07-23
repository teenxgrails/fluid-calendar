"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Extension, type JSONContent } from "@tiptap/core";
import ImageExtension from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Placeholder from "@tiptap/extension-placeholder";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bell,
  Bookmark,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  Clock3,
  Code2,
  Columns3,
  File,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Link2,
  List,
  ListOrdered,
  LockKeyhole,
  MessageSquareQuote,
  Minus,
  MoreHorizontal,
  Pilcrow,
  Quote,
  Redo2,
  Sparkles,
  Star,
  Table2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import { PageBlockNode } from "@/components/pages/PageBlockNode";
import {
  documentFromPageBlocks,
  legacyPageHtml,
  pageBlocksFromDocument,
} from "@/components/pages/page-document";
import type { PageDetail } from "@/components/pages/page-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { cn } from "@/lib/utils";

type SaveState = "saved" | "saving" | "failed";
type BasicCommand =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bullet"
  | "ordered"
  | "checklist"
  | "quote"
  | "code"
  | "divider";
type SpecialKind =
  | "CALLOUT"
  | "TOGGLE"
  | "LINK"
  | "BOOKMARK"
  | "IMAGE"
  | "FILE"
  | "TABLE"
  | "COLUMNS"
  | "PAGE_MENTION"
  | "DATE_MENTION";
type PageCommand = BasicCommand | SpecialKind;

const BlockIdentity = Extension.create({
  name: "blockIdentity",
  addGlobalAttributes() {
    return [
      {
        types: [
          "paragraph",
          "heading",
          "bulletList",
          "orderedList",
          "taskList",
          "blockquote",
          "codeBlock",
          "horizontalRule",
          "image",
        ],
        attributes: {
          blockId: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-block-id"),
            renderHTML: (attributes) =>
              attributes.blockId
                ? { "data-block-id": String(attributes.blockId) }
                : {},
          },
        },
      },
    ];
  },
});

const COMMANDS: Array<{
  id: PageCommand;
  label: string;
  hint: string;
  keywords: string;
  icon: typeof Pilcrow;
}> = [
  {
    id: "paragraph",
    label: "Text",
    hint: "Plain text block",
    keywords: "paragraph text",
    icon: Pilcrow,
  },
  {
    id: "heading1",
    label: "Heading 1",
    hint: "Large section heading",
    keywords: "title heading",
    icon: Heading1,
  },
  {
    id: "heading2",
    label: "Heading 2",
    hint: "Medium section heading",
    keywords: "heading",
    icon: Heading2,
  },
  {
    id: "heading3",
    label: "Heading 3",
    hint: "Small section heading",
    keywords: "heading",
    icon: Heading3,
  },
  {
    id: "bullet",
    label: "Bulleted list",
    hint: "Create a simple list",
    keywords: "unordered list",
    icon: List,
  },
  {
    id: "ordered",
    label: "Numbered list",
    hint: "Create ordered steps",
    keywords: "number list",
    icon: ListOrdered,
  },
  {
    id: "checklist",
    label: "Checklist",
    hint: "Track lightweight items",
    keywords: "todo check task",
    icon: CheckSquare,
  },
  {
    id: "quote",
    label: "Quote",
    hint: "Emphasize a quotation",
    keywords: "blockquote",
    icon: Quote,
  },
  {
    id: "CALLOUT",
    label: "Callout",
    hint: "Highlight important context",
    keywords: "notice info",
    icon: Bell,
  },
  {
    id: "TOGGLE",
    label: "Toggle",
    hint: "Add collapsible context",
    keywords: "details disclosure",
    icon: MessageSquareQuote,
  },
  {
    id: "code",
    label: "Code",
    hint: "Monospaced code block",
    keywords: "snippet",
    icon: Code2,
  },
  {
    id: "divider",
    label: "Divider",
    hint: "Separate sections",
    keywords: "line separator",
    icon: Minus,
  },
  {
    id: "LINK",
    label: "Link",
    hint: "Add a labeled URL",
    keywords: "url",
    icon: Link2,
  },
  {
    id: "BOOKMARK",
    label: "Bookmark",
    hint: "Save a rich link",
    keywords: "url card",
    icon: Bookmark,
  },
  {
    id: "IMAGE",
    label: "Image",
    hint: "Embed a private or remote image",
    keywords: "photo upload",
    icon: Image,
  },
  {
    id: "FILE",
    label: "File",
    hint: "Attach a file",
    keywords: "attachment upload",
    icon: File,
  },
  {
    id: "TABLE",
    label: "Table",
    hint: "Insert a compact table",
    keywords: "grid rows columns",
    icon: Table2,
  },
  {
    id: "COLUMNS",
    label: "Columns",
    hint: "Split content into columns",
    keywords: "layout",
    icon: Columns3,
  },
  {
    id: "PAGE_MENTION",
    label: "Page mention",
    hint: "Reference another Page",
    keywords: "page link",
    icon: FileText,
  },
  {
    id: "DATE_MENTION",
    label: "Date mention",
    hint: "Reference a date",
    keywords: "calendar date",
    icon: CalendarDays,
  },
];

const SPECIAL_LABELS: Record<SpecialKind, string> = {
  CALLOUT: "Callout text",
  TOGGLE: "Toggle summary",
  LINK: "Link URL",
  BOOKMARK: "Bookmark URL",
  IMAGE: "Image URL",
  FILE: "File URL",
  TABLE: "Table title",
  COLUMNS: "Columns label",
  PAGE_MENTION: "Page title",
  DATE_MENTION: "Date",
};

function ensureBlockIds(editor: Editor) {
  let changed = false;
  const transaction = editor.state.tr;
  editor.state.doc.forEach((node, offset) => {
    if (!node.type.spec.attrs?.blockId || node.attrs.blockId) return;
    transaction.setNodeMarkup(offset, undefined, {
      ...node.attrs,
      blockId: crypto.randomUUID(),
    });
    changed = true;
  });
  if (changed) editor.view.dispatch(transaction);
  return changed;
}

function removeSlashText(editor: Editor) {
  const { $from } = editor.state.selection;
  return editor
    .chain()
    .focus()
    .deleteRange({ from: $from.start(), to: $from.end() });
}

export function PageWorkspace({ pageId }: { pageId: string }) {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revision = useRef(0);
  const hydrated = useRef(false);
  const pendingRange = useRef<{ from: number; to: number } | null>(null);
  const [page, setPage] = useState<PageDetail | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [slash, setSlash] = useState<{
    query: string;
    top: number;
    left: number;
  } | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [pendingInsert, setPendingInsert] = useState<SpecialKind | null>(null);
  const [pendingValue, setPendingValue] = useState("");
  const [coverOpen, setCoverOpen] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");

  const saveBlocks = useCallback(
    async (document: JSONContent, requestRevision: number) => {
      setSaveState("saving");
      const blocks = pageBlocksFromDocument(document);
      try {
        const response = await fetch(`/api/pages/${pageId}/blocks`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocks }),
        });
        if (!response.ok) throw new Error("Save failed");
        if (revision.current === requestRevision) setSaveState("saved");
        localStorage.removeItem(`needt-page-draft:${pageId}`);
        window.dispatchEvent(new Event("pages-changed"));
      } catch {
        localStorage.setItem(
          `needt-page-draft:${pageId}`,
          JSON.stringify(document)
        );
        if (revision.current === requestRevision) setSaveState("failed");
      }
    },
    [pageId]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({
        placeholder: "Write anything, or type / for commands…",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      ImageExtension.configure({ allowBase64: false }),
      BlockIdentity,
      PageBlockNode,
    ],
    content: "<p></p>",
    editorProps: {
      attributes: {
        class: "needt-page-editor min-h-[55vh] cursor-text pb-48 outline-none",
        "aria-label": "Page document",
      },
      handleKeyDown: (_view, event) => {
        if (slash && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
          event.preventDefault();
          setSlashIndex((index) => {
            const count = Math.max(1, filteredCommands.length);
            return event.key === "ArrowDown"
              ? (index + 1) % count
              : (index - 1 + count) % count;
          });
          return true;
        }
        if (slash && event.key === "Enter" && filteredCommands[slashIndex]) {
          event.preventDefault();
          applyCommand(filteredCommands[slashIndex].id);
          return true;
        }
        if (event.key === "Escape") setSlash(null);
        return false;
      },
    },
    onUpdate: ({ editor: current }) => {
      if (!hydrated.current) return;
      ensureBlockIds(current);
      const document = current.getJSON();
      revision.current += 1;
      const requestRevision = revision.current;
      localStorage.setItem(
        `needt-page-draft:${pageId}`,
        JSON.stringify(document)
      );
      setSaveState("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(
        () => void saveBlocks(document, requestRevision),
        650
      );

      const { $from } = current.state.selection;
      const match = $from.parent.textContent.match(/^\/([^\s]*)$/);
      const host = hostRef.current;
      if (!match || !host) {
        setSlash(null);
        return;
      }
      const caret = current.view.coordsAtPos(current.state.selection.from);
      const bounds = host.getBoundingClientRect();
      setSlash({
        query: match[1].toLowerCase(),
        top: caret.bottom - bounds.top + 8,
        left: Math.max(
          0,
          Math.min(caret.left - bounds.left, bounds.width - 320)
        ),
      });
      setSlashIndex(0);
    },
    onSelectionUpdate: ({ editor: current }) => {
      if (
        !/^\/([^\s]*)$/.test(current.state.selection.$from.parent.textContent)
      )
        setSlash(null);
    },
  });

  const filteredCommands = useMemo(() => {
    if (!slash?.query) return COMMANDS;
    return COMMANDS.filter((command) =>
      `${command.label} ${command.keywords}`.toLowerCase().includes(slash.query)
    );
  }, [slash?.query]);

  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    hydrated.current = false;
    void fetch(`/api/pages/${pageId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Page not found");
        return response.json() as Promise<{ page: PageDetail }>;
      })
      .then(({ page: loaded }) => {
        if (cancelled) return;
        setPage(loaded);
        const localDraft = localStorage.getItem(`needt-page-draft:${pageId}`);
        if (localDraft) {
          try {
            editor.commands.setContent(JSON.parse(localDraft) as JSONContent, {
              emitUpdate: false,
            });
          } catch {
            editor.commands.setContent(legacyPageHtml(loaded.blocks), {
              emitUpdate: false,
            });
          }
          setSaveState("failed");
        } else {
          const document = documentFromPageBlocks(loaded.blocks);
          editor.commands.setContent(
            document || legacyPageHtml(loaded.blocks),
            { emitUpdate: false }
          );
        }
        ensureBlockIds(editor);
        hydrated.current = true;
      })
      .catch(() => router.replace("/pages"));
    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [editor, pageId, router]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (saveState !== "saved") event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [saveState]);

  const patchPage = async (values: Record<string, unknown>) => {
    setPage((current) =>
      current ? ({ ...current, ...values } as PageDetail) : current
    );
    const response = await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) toast.error("Could not update page");
    window.dispatchEvent(new Event("pages-changed"));
  };

  const insertSpecial = (kind: SpecialKind, value: string) => {
    if (!editor) return;
    const data =
      kind === "DATE_MENTION"
        ? { date: value }
        : kind === "PAGE_MENTION" || kind === "TABLE" || kind === "COLUMNS"
          ? { title: value }
          : kind === "CALLOUT" || kind === "TOGGLE"
            ? { text: value }
            : { url: value };
    const range = pendingRange.current;
    const content = [
      {
        type: "needtPageBlock",
        attrs: {
          blockId: crypto.randomUUID(),
          kind,
          data: JSON.stringify(data),
        },
      },
      { type: "paragraph" },
    ];
    const chain = editor.chain().focus();
    if (range) chain.insertContentAt(range, content).run();
    else chain.insertContent(content).run();
    pendingRange.current = null;
    setPendingInsert(null);
    setPendingValue("");
    setSlash(null);
  };

  const applyCommand = (command: PageCommand) => {
    if (!editor) return;
    if (
      command === "CALLOUT" ||
      command === "TOGGLE" ||
      command === "LINK" ||
      command === "BOOKMARK" ||
      command === "IMAGE" ||
      command === "FILE" ||
      command === "TABLE" ||
      command === "COLUMNS" ||
      command === "PAGE_MENTION" ||
      command === "DATE_MENTION"
    ) {
      if (editor.isActive("blockquote")) {
        editor.chain().focus().lift("blockquote").run();
      }
      if (editor.isActive("listItem")) {
        editor.chain().focus().liftListItem("listItem").run();
      }
      if (editor.isActive("taskItem")) {
        editor.chain().focus().liftListItem("taskItem").run();
      }
      const { $from } = editor.state.selection;
      pendingRange.current = { from: $from.start(), to: $from.end() };
      setPendingInsert(command);
      setPendingValue(
        command === "DATE_MENTION"
          ? new Date().toISOString().slice(0, 10)
          : command === "TABLE"
            ? "Table"
            : command === "COLUMNS"
              ? "Two columns"
              : ""
      );
      return;
    }

    const chain = removeSlashText(editor);
    if (command === "paragraph") chain.setParagraph().run();
    else if (command === "heading1") chain.toggleHeading({ level: 1 }).run();
    else if (command === "heading2") chain.toggleHeading({ level: 2 }).run();
    else if (command === "heading3") chain.toggleHeading({ level: 3 }).run();
    else if (command === "bullet") chain.toggleBulletList().run();
    else if (command === "ordered") chain.toggleOrderedList().run();
    else if (command === "checklist") chain.toggleTaskList().run();
    else if (command === "quote") chain.toggleBlockquote().run();
    else if (command === "code") chain.toggleCodeBlock().run();
    else if (command === "divider") chain.setHorizontalRule().run();
    setSlash(null);
  };

  if (!page) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse px-8 py-16">
        <div className="mb-8 h-9 w-2/3 rounded bg-[var(--surface-raised)]" />
        <div className="h-64 rounded bg-[var(--surface-raised)]" />
      </div>
    );
  }
  if (page.database)
    return <DatabaseWorkspace page={page} onPatch={patchPage} />;

  return (
    <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-20 flex h-11 items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--app-bg)] px-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/pages")}
          aria-label="Back to pages"
        >
          <ChevronLeft />
        </Button>
        <span className="min-w-0 flex-1 truncate text-sm">
          {page.icon} {page.title}
        </span>
        <span className="text-[11px] text-[var(--text-muted)]">
          {saveState === "saving"
            ? "Saving…"
            : saveState === "failed"
              ? "Failed · draft kept"
              : "Saved"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          aria-label="Undo"
        >
          <Undo2 />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          aria-label="Redo"
        >
          <Redo2 />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void patchPage({ isFavorite: !page.isFavorite })}
          aria-label="Favorite"
        >
          <Star
            className={page.isFavorite ? "fill-current text-amber-400" : ""}
          />
        </Button>
        <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <LockKeyhole className="h-3.5 w-3.5" />
          <Switch
            checked={page.isPrivate}
            onCheckedChange={(checked) =>
              void patchPage({ isPrivate: checked })
            }
          />
        </label>
        <Button variant="ghost" size="icon" aria-label="Page options">
          <MoreHorizontal />
        </Button>
      </header>

      {page.coverUrl && (
        <button
          type="button"
          aria-label="Change cover"
          onClick={() => {
            setCoverUrl(page.coverUrl || "");
            setCoverOpen(true);
          }}
          className="h-44 w-full bg-cover bg-center"
          style={{ backgroundImage: `url("${page.coverUrl}")` }}
        />
      )}

      <main
        ref={hostRef}
        className={cn(
          "relative mx-auto max-w-[900px] px-7 pb-32 sm:px-12 lg:px-20",
          page.coverUrl ? "pt-8" : "pt-16"
        )}
        onClick={(event) => {
          if (event.target === event.currentTarget)
            editor?.commands.focus("end");
        }}
      >
        <div className="mb-2 flex h-7 items-center gap-3 text-[12px] text-[var(--text-muted)]">
          <button
            type="button"
            onClick={() => void patchPage({ icon: page.icon ? null : "📄" })}
            className="rounded px-1.5 py-1 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            {page.icon ? "Remove icon" : "Add icon"}
          </button>
          {!page.coverUrl && (
            <button
              type="button"
              onClick={() => {
                setCoverUrl("");
                setCoverOpen(true);
              }}
              className="rounded px-1.5 py-1 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            >
              Add cover
            </button>
          )}
        </div>
        {page.icon && <div className="mb-2 text-5xl">{page.icon}</div>}
        <input
          value={page.title}
          onChange={(event) => setPage({ ...page, title: event.target.value })}
          onBlur={() => void patchPage({ title: page.title })}
          className="mb-5 w-full border-0 bg-transparent p-0 text-4xl font-semibold tracking-[-0.045em] outline-none ring-0 placeholder:text-[var(--text-disabled)] focus:ring-0"
          placeholder="Untitled"
        />
        <div className="mb-4 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <Clock3 className="h-3.5 w-3.5" /> Edited just now
          {page.blocks.some((block) => block.createdBy === "AI") && (
            <span className="ml-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Written with AI
            </span>
          )}
        </div>
        <div
          onClick={(event) => {
            if (event.target === event.currentTarget)
              editor?.commands.focus("end");
          }}
        >
          <EditorContent editor={editor} />
        </div>

        {slash && filteredCommands.length > 0 && (
          <div
            role="menu"
            aria-label="Page commands"
            className="needt-overlay-depth absolute z-30 max-h-[430px] w-[320px] overflow-y-auto rounded-[var(--panel-radius)] border border-[var(--popover-border)] p-1.5 shadow-lg"
            style={{ top: slash.top, left: slash.left }}
          >
            <div className="px-2.5 pb-1.5 pt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Blocks
            </div>
            {filteredCommands.map((command, index) => {
              const Icon = command.icon;
              return (
                <button
                  key={command.id}
                  type="button"
                  role="menuitem"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyCommand(command.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[var(--control-radius)] px-2.5 py-2 text-left hover:bg-[var(--menu-item-hover)]",
                    index === slashIndex && "bg-[var(--menu-item-hover)]"
                  )}
                >
                  <Icon className="h-4 w-4 flex-none text-[var(--text-muted)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium">
                      {command.label}
                    </span>
                    <span className="block truncate text-[11px] text-[var(--text-muted)]">
                      {command.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <Dialog
        open={Boolean(pendingInsert)}
        onOpenChange={(open) => !open && setPendingInsert(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add {pendingInsert ? SPECIAL_LABELS[pendingInsert] : "block"}
            </DialogTitle>
            <DialogDescription>
              This value stays in the private page document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="page-block-value">
              {pendingInsert ? SPECIAL_LABELS[pendingInsert] : "Value"}
            </Label>
            <Input
              id="page-block-value"
              type={pendingInsert === "DATE_MENTION" ? "date" : "text"}
              value={pendingValue}
              onChange={(event) => setPendingValue(event.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingInsert(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                pendingInsert && insertSpecial(pendingInsert, pendingValue)
              }
              disabled={!pendingValue.trim()}
            >
              Add block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={coverOpen} onOpenChange={setCoverOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Page cover</DialogTitle>
            <DialogDescription>
              Use an image URL. The cover remains private with this page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="page-cover-url">Image URL</Label>
            <Input
              id="page-cover-url"
              type="url"
              value={coverUrl}
              onChange={(event) => setCoverUrl(event.target.value)}
              placeholder="https://…"
            />
          </div>
          <DialogFooter>
            {page.coverUrl && (
              <Button
                variant="outline"
                onClick={() => {
                  void patchPage({ coverUrl: null });
                  setCoverOpen(false);
                }}
              >
                Remove cover
              </Button>
            )}
            <Button
              onClick={() => {
                void patchPage({ coverUrl: coverUrl.trim() || null });
                setCoverOpen(false);
              }}
            >
              Save cover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DatabaseWorkspace({
  page,
  onPatch,
}: {
  page: PageDetail;
  onPatch: (values: Record<string, unknown>) => Promise<void>;
}) {
  const [view, setView] = useState("TABLE");
  const [title, setTitle] = useState(page.title);
  const database = page.database as unknown as {
    records?: Array<{ id: string; page: { title: string } }>;
  };
  const views = ["TABLE", "BOARD", "LIST", "TIMELINE", "CALENDAR", "GALLERY"];
  return (
    <div className="min-h-dvh bg-[var(--app-bg)] p-6 text-[var(--text-primary)] lg:p-10">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={() => {
          if (title !== page.title) void onPatch({ title });
        }}
        className="mb-7 w-full bg-transparent text-3xl font-semibold outline-none"
      />
      <div className="mb-5 flex flex-wrap items-center gap-1 border-b border-[var(--border-subtle)] pb-2">
        {views.map((item) => (
          <Button
            key={item}
            variant={view === item ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView(item)}
          >
            {item[0]}
            {item.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>
      {view === "TABLE" ? (
        <div className="overflow-hidden rounded-[var(--panel-radius)] border border-[var(--border-subtle)]">
          <div className="grid grid-cols-[2fr_1fr_1fr] bg-[var(--surface-raised)] text-xs text-[var(--text-muted)]">
            <div className="p-2.5">Name</div>
            <div className="p-2.5">Status</div>
            <div className="p-2.5">Date</div>
          </div>
          {(database.records || []).map((record) => (
            <div
              key={record.id}
              className="grid grid-cols-[2fr_1fr_1fr] border-t border-[var(--border-subtle)] text-sm"
            >
              <div className="p-2.5">{record.page.title}</div>
              <div className="p-2.5 text-[var(--text-muted)]">—</div>
              <div className="p-2.5 text-[var(--text-muted)]">—</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="min-h-[420px] rounded-[var(--panel-radius)] bg-[var(--surface-raised)] p-8 text-sm text-[var(--text-muted)]">
          {view[0]}
          {view.slice(1).toLowerCase()} view uses this database’s same records.
          Configure its grouping, dates and visible properties here.
        </div>
      )}
    </div>
  );
}
