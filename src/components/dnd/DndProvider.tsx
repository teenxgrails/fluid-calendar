"use client";

import { type ReactNode } from "react";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { logger } from "@/lib/logger";

import { useTaskMutations } from "@/hooks/useTaskMutations";

import { useProjectStore } from "@/store/project";

const LOG_SOURCE = "DndProvider";

interface DndProviderProps {
  children: ReactNode;
}

export function DndProvider({ children }: DndProviderProps) {
  const { moveTask } = useTaskMutations();
  const { fetchProjects } = useProjectStore();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over) return;

    // Handle dropping a task onto a project
    if (
      active.data.current?.type === "task" &&
      over.data.current?.type === "project"
    ) {
      const taskId = active.id as string;
      const projectId =
        over.id === "remove-project" ? null : (over.id as string);

      try {
        await moveTask(taskId, { projectId });
        await fetchProjects();
      } catch (error) {
        void logger.error(
          "Failed to move task to project",
          {
            taskId,
            projectId,
            error: error instanceof Error ? error.message : String(error),
          },
          LOG_SOURCE
        );
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {children}
      <DragOverlay />
    </DndContext>
  );
}
