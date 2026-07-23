"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  type ReactNodeViewProps,
  ReactNodeViewRenderer,
} from "@tiptap/react";

import {
  type AgendaGroup,
  AgendaTaskSection,
} from "@/components/today/AgendaTaskSection";

import { useTaskStore } from "@/store/task";

import type { Task } from "@/types/task";

interface TaskGroupReferenceOptions {
  getGroup: (groupId: string) => AgendaGroup | undefined;
  onOpenTask: (task: Task) => void;
  onComplete: (task: Task) => Promise<void>;
  onDateChange: (task: Task, date: Date | null) => Promise<void>;
  onDurationChange: (task: Task, duration: number | null) => Promise<void>;
}

function TaskGroupReferenceView({ node, extension }: ReactNodeViewProps) {
  // Subscribe so the node view follows optimistic task mutations while its
  // position remains part of the persisted document.
  useTaskStore((state) => state.tasks);
  const options = extension.options as TaskGroupReferenceOptions;
  const group = options.getGroup(String(node.attrs.groupId ?? ""));

  if (!group?.tasks.length) return null;

  return (
    <NodeViewWrapper
      as="div"
      data-type="taskGroupReference"
      className="my-5"
      contentEditable={false}
    >
      <AgendaTaskSection
        group={group}
        onOpenTask={options.onOpenTask}
        onComplete={options.onComplete}
        onDateChange={options.onDateChange}
        onDurationChange={options.onDurationChange}
      />
    </NodeViewWrapper>
  );
}

export const TaskGroupReference = Node.create<TaskGroupReferenceOptions>({
  name: "taskGroupReference",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addOptions() {
    return {
      getGroup: () => undefined,
      onOpenTask: () => undefined,
      onComplete: async () => undefined,
      onDateChange: async () => undefined,
      onDurationChange: async () => undefined,
    };
  },

  addAttributes() {
    return {
      groupId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-group-id"),
        renderHTML: (attributes) => ({
          "data-group-id": attributes.groupId,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="taskGroupReference"][data-group-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "taskGroupReference" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TaskGroupReferenceView);
  },
});
