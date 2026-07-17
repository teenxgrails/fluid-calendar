"use client";

import { useMemo, useState } from "react";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskModal } from "@/components/tasks/TaskModal";

import { cn } from "@/lib/utils";

import { useBoardDetail } from "@/hooks/use-board-detail";
import { useTaskMutations } from "@/hooks/useTaskMutations";

import { useBoardsStore } from "@/store/boards";
import { useTaskStore } from "@/store/task";

import { NewTask, Task } from "@/types/task";

interface BoardCanvasProps {
  boardId: string;
}

export function BoardCanvas({ boardId }: BoardCanvasProps) {
  const { board, loading, error, moveCard, addCard, refresh } =
    useBoardDetail(boardId);
  const addColumn = useBoardsStore((state) => state.addColumn);
  const { updateTask } = useTaskMutations();
  const { tags, createTag } = useTaskStore();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Derive per-column ordered card lists from the flat task list.
  const cardsByColumn = useMemo(() => {
    const map = new Map<string, Task[]>();
    if (!board) return map;
    for (const column of board.columns) map.set(column.id, []);
    for (const task of board.tasks) {
      if (task.boardColumnId && map.has(task.boardColumnId)) {
        map.get(task.boardColumnId)!.push(task);
      }
    }
    for (const [, list] of map) {
      list.sort((a, b) => (a.boardPosition ?? 0) - (b.boardPosition ?? 0));
    }
    return map;
  }, [board]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !board) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    // The drop target is either a column (empty area) or another card.
    let targetColumnId: string | null = null;
    let targetIndex = 0;

    const overColumn = board.columns.find((c) => `col:${c.id}` === overId);
    if (overColumn) {
      targetColumnId = overColumn.id;
      targetIndex = cardsByColumn.get(overColumn.id)?.length ?? 0;
    } else {
      // over a card: find its column and index
      for (const column of board.columns) {
        const list = cardsByColumn.get(column.id) ?? [];
        const index = list.findIndex((t) => t.id === overId);
        if (index !== -1) {
          targetColumnId = column.id;
          targetIndex = index;
          break;
        }
      }
    }

    if (!targetColumnId) return;
    void moveCard(taskId, targetColumnId, targetIndex);
  };

  if (loading) {
    return (
      <div className="grid h-full place-items-center text-sm text-[var(--text-secondary)]">
        Loading board…
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="grid h-full place-items-center px-6 text-center text-sm text-[var(--text-secondary)]">
        This board couldn&apos;t be loaded.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[var(--surface-canvas)]">
      <header className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-3">
        {board.icon && <span className="text-lg">{board.icon}</span>}
        <h1 className="text-base font-semibold text-[var(--text-primary)]">
          {board.name}
        </h1>
        {/* //todo(boards): Group by · Sort · Filters · view switcher toolbar,
            persisted per SavedView. */}
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto p-3 md:snap-none">
          {board.columns.map((column) => {
            const cards = cardsByColumn.get(column.id) ?? [];
            return (
              <BoardColumnView
                key={column.id}
                columnId={column.id}
                name={column.name}
                color={column.color}
                cards={cards}
                onOpenCard={setEditingTask}
                onAddCard={(title) => addCard(column.id, title)}
              />
            );
          })}

          <button
            type="button"
            onClick={() => addColumn(board.id, "New column").then(refresh)}
            className="flex h-10 w-64 flex-none items-center gap-2 rounded-lg border border-dashed border-[var(--border-control)] px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
          >
            <Plus className="h-4 w-4" />
            Add column
          </button>
        </div>
      </DndContext>

      <TaskModal
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        task={editingTask ?? undefined}
        tags={tags}
        onCreateTag={(name, color) => createTag({ name, color: color || "" })}
        onSave={async (payload: NewTask) => {
          if (editingTask) await updateTask(editingTask.id, payload);
          setEditingTask(null);
          await refresh();
        }}
      />
    </div>
  );
}

function BoardColumnView({
  columnId,
  name,
  color,
  cards,
  onOpenCard,
  onAddCard,
}: {
  columnId: string;
  name: string;
  color: string | null;
  cards: Task[];
  onOpenCard: (task: Task) => void;
  onAddCard: (title: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await onAddCard(trimmed);
    setTitle("");
    setAdding(false);
  };

  return (
    <section className="flex w-64 flex-none snap-start flex-col rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-raised)]">
      <header className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
        {color && (
          <span
            className="h-2.5 w-2.5 flex-none rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--text-primary)]">
          {name}
        </span>
        <span className="flex-none rounded bg-[var(--surface-control)] px-1.5 text-[11px] tabular-nums text-[var(--text-secondary)]">
          {cards.length}
        </span>
      </header>

      <ColumnDroppable columnId={columnId}>
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex min-h-[24px] flex-col gap-2 p-2">
            {cards.map((task) => (
              <SortableCard key={task.id} task={task} onOpen={onOpenCard} />
            ))}
          </div>
        </SortableContext>
      </ColumnDroppable>

      <div className="p-2">
        {adding ? (
          <div className="flex flex-col gap-2">
            <Input
              autoFocus
              value={title}
              placeholder="Card title"
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void submit();
                if (event.key === "Escape") setAdding(false);
              }}
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={submit}>
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAdding(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        )}
      </div>
    </section>
  );
}

function ColumnDroppable({
  columnId,
  children,
}: {
  columnId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useSortable({ id: `col:${columnId}` });
  return (
    <div ref={setNodeRef} className="flex-1">
      {children}
    </div>
  );
}

function SortableCard({
  task,
  onOpen,
}: {
  task: Task;
  onOpen: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={() => onOpen(task)}
      className={cn(
        "cursor-grab rounded-md border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-3 py-2 text-left text-[13px] text-[var(--text-primary)] shadow-sm active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
      {...attributes}
      {...listeners}
    >
      <span className="line-clamp-3">{task.title}</span>
    </button>
  );
}
