"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { useBoardsStore } from "@/store/boards";

interface Template {
  key: string;
  name: string;
  columns: string[];
}

// A board starts minimal by default ("Start empty"); templates seed a few
// columns as a head start.
const TEMPLATES: Template[] = [
  { key: "tasks", name: "Tasks Tracker", columns: ["To do", "Doing", "Done"] },
  {
    key: "semester",
    name: "Semester plan",
    columns: ["Backlog", "This week", "In progress", "Done"],
  },
];

export function NewBoardDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createBoard = useBoardsStore((state) => state.createBoard);
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const create = async (columns?: string[]) => {
    const trimmed = name.trim() || "Untitled board";
    setCreating(true);
    try {
      const board = await createBoard({ name: trimmed, columns });
      onOpenChange(false);
      setName("");
      if (board) router.push(`/boards/${board.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New board</DialogTitle>
        </DialogHeader>

        <Input
          autoFocus
          value={name}
          placeholder="Board name"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void create();
          }}
        />

        <div className="mt-1 grid gap-2">
          <button
            type="button"
            disabled={creating}
            onClick={() => create()}
            className="rounded-md border border-[var(--border-control)] bg-[var(--surface-raised)] px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          >
            <span className="font-medium">Start empty</span>
            <span className="block text-xs text-[var(--text-secondary)]">
              Just a name — add columns as you go.
            </span>
          </button>

          {TEMPLATES.map((template) => (
            <button
              key={template.key}
              type="button"
              disabled={creating}
              onClick={() => create(template.columns)}
              className="rounded-md border border-[var(--border-control)] bg-[var(--surface-raised)] px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
            >
              <span className="font-medium">{template.name}</span>
              <span className="block text-xs text-[var(--text-secondary)]">
                {template.columns.join(" · ")}
              </span>
            </button>
          ))}

          {/* //todo(boards): "Import CSV" (v2) and an "Describe what you want to
              build" AI input that scaffolds columns via the existing agent —
              shown only when an AI agent is configured. */}
        </div>

        <div className="mt-1 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
