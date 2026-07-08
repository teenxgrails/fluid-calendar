import { useCallback, useEffect, useRef, useState } from "react";

import { RRule } from "rrule";

import { TaskTimer } from "@/components/tasks/TaskTimer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { format, newDate } from "@/lib/date-utils";
import { RecurrenceConverterFactory } from "@/lib/task-sync/recurrence/recurrence-converter-factory";
import { cn } from "@/lib/utils";

import { useProjectStore } from "@/store/project";

import {
  EnergyLevel,
  NewTask,
  Priority,
  SchedulingEnergyLevel,
  SchedulingTaskPriority,
  Tag,
  Task,
  TaskStatus,
  TimePreference,
} from "@/types/task";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: NewTask) => Promise<void>;
  task?: Task;
  tags: Tag[];
  onCreateTag: (name: string, color?: string) => Promise<Tag>;
  initialProjectId?: string | null;
  initialStart?: Date;
  initialEnd?: Date;
}

//TODO: move to utils
const formatEnumValue = (value: string) => {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper function to convert external recurrence rule to RRule format
function getStandardRRule(task?: Task): RRule {
  if (!task?.recurrenceRule) {
    return new RRule({
      freq: RRule.WEEKLY,
      interval: 1,
      byweekday: [RRule.MO],
    });
  }

  // If the task has a source (e.g., OUTLOOK), use the appropriate converter
  if (task.source) {
    const converter = RecurrenceConverterFactory.getConverter(task.source);
    const standardRule = converter.convertFromString(task.recurrenceRule);
    return RRule.fromString(standardRule);
  }

  // If no source or internal task, assume it's already in RRule format
  return RRule.fromString(task.recurrenceRule);
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  tags,
  onCreateTag,
  initialProjectId,
  initialStart,
  initialEnd,
}: TaskModalProps) {
  const { projects } = useProjectStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [dueDate, setDueDate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>("");
  const [estOptimistic, setEstOptimistic] = useState<string>("");
  const [estLikely, setEstLikely] = useState<string>("");
  const [estPessimistic, setEstPessimistic] = useState<string>("");
  const [minChunkMinutes, setMinChunkMinutes] = useState<string>("");
  const [maxChunkMinutes, setMaxChunkMinutes] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("");
  const [contextTag, setContextTag] = useState("");
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | "">("");
  const [energyRequired, setEnergyRequired] = useState<SchedulingEnergyLevel>(
    SchedulingEnergyLevel.MEDIUM
  );
  const [preferredTime, setPreferredTime] = useState<TimePreference | "">("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#E5E7EB");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectId, setProjectId] = useState<string | null | undefined>(
    initialProjectId || task?.projectId
  );
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<string | undefined>();
  const [isAutoScheduled, setIsAutoScheduled] = useState(
    task?.isAutoScheduled || false
  );
  const [scheduleLocked, setScheduleLocked] = useState(
    task?.scheduleLocked || false
  );
  const [isFrozen, setIsFrozen] = useState(task?.isFrozen || false);
  const [priority, setPriority] = useState<Priority | null>(
    task?.priority || null
  );
  const [priorityLevel, setPriorityLevel] = useState<SchedulingTaskPriority>(
    SchedulingTaskPriority.MEDIUM
  );
  const [calibrationFactors, setCalibrationFactors] = useState<
    Record<string, number>
  >({});
  const titleInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setStatus(TaskStatus.TODO);
    setDueDate("");
    setStartDate("");
    setDuration("");
    setEstimatedMinutes("");
    setEstOptimistic("");
    setEstLikely("");
    setEstPessimistic("");
    setMinChunkMinutes("");
    setMaxChunkMinutes("");
    setDeadline("");
    setContextTag("");
    setEnergyLevel("");
    setEnergyRequired(SchedulingEnergyLevel.MEDIUM);
    setPreferredTime("");
    setSelectedTagIds([]);
    setNewTagName("");
    setNewTagColor("#E5E7EB");
    setProjectId(initialProjectId ?? null);
    setIsRecurring(false);
    setRecurrenceRule(undefined);
    setIsAutoScheduled(true);
    setScheduleLocked(false);
    setIsFrozen(false);
    setPriority(null);
    setPriorityLevel(SchedulingTaskPriority.MEDIUM);
  }, [initialProjectId]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Populate form with task data when editing
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      // Handle date string from API
      if (task.dueDate) {
        const date = newDate(task.dueDate);
        setDueDate(date.toISOString().split("T")[0]);
      } else {
        setDueDate("");
      }
      if (task.startDate) {
        const date = newDate(task.startDate);
        setStartDate(date.toISOString().split("T")[0]);
      } else {
        setStartDate("");
      }
      setDuration(task.duration?.toString() || "");
      setEstimatedMinutes(
        (task.estimatedMinutes ?? task.duration)?.toString() || ""
      );
      setEstOptimistic(task.estOptimistic?.toString() || "");
      setEstLikely(
        (
          task.estLikely ??
          task.estimatedMinutes ??
          task.duration
        )?.toString() || ""
      );
      setEstPessimistic(task.estPessimistic?.toString() || "");
      setMinChunkMinutes(task.minChunkMinutes?.toString() || "");
      setMaxChunkMinutes(task.maxChunkMinutes?.toString() || "");
      if (task.deadline) {
        const date = newDate(task.deadline);
        setDeadline(date.toISOString().slice(0, 16));
      } else {
        setDeadline("");
      }
      setContextTag(task.contextTag || "");
      setEnergyLevel(task.energyLevel || "");
      setEnergyRequired(task.energyRequired || SchedulingEnergyLevel.MEDIUM);
      setPreferredTime(task.preferredTime || "");
      setSelectedTagIds(task.tags.map((t) => t.id));
      setProjectId(task.projectId || null);
      setIsRecurring(task.isRecurring);
      setRecurrenceRule(task.recurrenceRule || undefined);
      setIsAutoScheduled(task.isAutoScheduled);
      setScheduleLocked(task.scheduleLocked);
      setIsFrozen(task.isFrozen || false);
      setPriority(task.priority || null);
      setPriorityLevel(task.priorityLevel || SchedulingTaskPriority.MEDIUM);
    } else if (!task && isOpen) {
      resetForm();
      if (initialStart) {
        setStartDate(initialStart.toISOString().split("T")[0]);
        setDeadline(initialStart.toISOString().slice(0, 16));
      }
      if (initialStart && initialEnd) {
        const diffMinutes = Math.max(
          15,
          Math.round((initialEnd.getTime() - initialStart.getTime()) / 60000)
        );
        setDuration(String(diffMinutes));
        setEstimatedMinutes(String(diffMinutes));
        setEstLikely(String(diffMinutes));
      }
    }
  }, [task, isOpen, initialProjectId, initialStart, initialEnd, resetForm]);

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/calibration")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.factors && typeof data.factors === "object") {
          setCalibrationFactors(data.factors);
        }
      })
      .catch(() => setCalibrationFactors({}));
  }, [isOpen]);

  const parsedLikely = estLikely
    ? parseInt(estLikely, 10)
    : estimatedMinutes
      ? parseInt(estimatedMinutes, 10)
      : duration
        ? parseInt(duration, 10)
        : null;
  const contextFactor = contextTag.trim()
    ? calibrationFactors[contextTag.trim().toLowerCase()]
    : undefined;
  const suggestedLikely =
    contextFactor && parsedLikely
      ? Math.max(1, Math.round(parsedLikely * contextFactor))
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        dueDate: dueDate ? newDate(dueDate) : null,
        startDate: startDate ? newDate(startDate) : null,
        duration: duration ? parseInt(duration, 10) : undefined,
        estimatedMinutes: estimatedMinutes
          ? parseInt(estimatedMinutes, 10)
          : duration
            ? parseInt(duration, 10)
            : undefined,
        estOptimistic: estOptimistic ? parseInt(estOptimistic, 10) : undefined,
        estLikely: parsedLikely ?? undefined,
        estPessimistic: estPessimistic
          ? parseInt(estPessimistic, 10)
          : undefined,
        minChunkMinutes: minChunkMinutes
          ? parseInt(minChunkMinutes, 10)
          : undefined,
        maxChunkMinutes: maxChunkMinutes
          ? parseInt(maxChunkMinutes, 10)
          : undefined,
        deadline: deadline
          ? newDate(deadline)
          : dueDate
            ? newDate(dueDate)
            : null,
        energyLevel: energyLevel || undefined,
        energyRequired,
        preferredTime: preferredTime || undefined,
        priorityLevel,
        contextTag: contextTag.trim() || undefined,
        tagIds: selectedTagIds,
        projectId: projectId,
        isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : undefined,
        isAutoScheduled,
        autoScheduled: isAutoScheduled,
        scheduleLocked,
        isFrozen,
        priority,
      });
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const tag = await onCreateTag(newTagName.trim(), newTagColor);
      setSelectedTagIds([...selectedTagIds, tag.id]);
      setNewTagName("");
      setNewTagColor("#E5E7EB");
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] flex-col rounded-lg border-[#323234] bg-[#1A1D1E] p-0 text-white sm:max-w-[1040px]">
        {isSubmitting && <LoadingOverlay />}
        <DialogHeader className="border-b border-[#323234] px-5 py-4">
          <DialogTitle className="flex items-center gap-3 text-base">
            <span className="rounded-md border border-[#323234] bg-[#262627] px-2.5 py-1 text-xs font-medium text-[#9AA0A6]">
              Task
            </span>
            {task ? "Edit task" : "Create task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto">
          {task && (
            <div className="px-5 pt-5">
              <TaskTimer
                taskId={task.id}
                actualMinutes={task.actualMinutes}
                likelyDelta={task.likelyDelta}
              />
            </div>
          )}

          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5 p-5">
              <div>
                <Label htmlFor="title" className="sr-only">
                  Task name
                </Label>
                <Input
                  id="title"
                  ref={titleInputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Task name"
                  className="h-14 rounded-md border-[#323234] bg-[#262627] text-2xl font-normal text-white placeholder:text-[#9AA0A6]"
                />
              </div>

              <div
                aria-label="Description toolbar"
                className="flex flex-wrap gap-1 rounded-md border border-[#323234] bg-[#262627] p-1.5 text-xs text-[#9AA0A6]"
              >
                {[
                  "B",
                  "I",
                  "U",
                  "S",
                  "H1",
                  "H2",
                  "•",
                  "1.",
                  "Img",
                  "Code",
                  "Link",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded px-2.5 py-1.5 hover:bg-[#2B2F31] hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={10}
                  placeholder="Add notes, links, acceptance criteria, or a quick brain dump."
                  className="mt-2 resize-none rounded-md border-[#323234] bg-[#262627] text-white placeholder:text-[#9AA0A6]"
                />
              </div>

              <div className="rounded-md border border-[#323234] bg-[#262627] p-4">
                <div className="text-sm font-medium">Attachments</div>
                <p className="mt-1 text-sm text-[#9AA0A6]">
                  Add references in the description, or attach files after
                  saving.
                </p>
              </div>
            </div>

            <div className="space-y-4 border-t border-[#323234] p-5 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between rounded-md border border-[#323234] bg-[#262627] px-3 py-2 text-sm">
                <span>Auto-scheduled</span>
                <Switch
                  checked={isAutoScheduled}
                  onCheckedChange={setIsAutoScheduled}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as TaskStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue>{formatEnumValue(status)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskStatus).map((s) => (
                        <SelectItem key={s} value={s}>
                          {formatEnumValue(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={priority || Priority.NONE}
                    onValueChange={(value) => setPriority(value as Priority)}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {formatEnumValue(priority || Priority.NONE)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Priority).map((level) => (
                        <SelectItem key={level} value={level}>
                          {formatEnumValue(level)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    type="number"
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="0"
                    placeholder="30"
                  />
                </div>

                <div>
                  <Label htmlFor="minChunkMinutes">Min chunk</Label>
                  <Input
                    type="number"
                    id="minChunkMinutes"
                    value={minChunkMinutes}
                    onChange={(e) => setMinChunkMinutes(e.target.value)}
                    min="0"
                    placeholder="No chunks"
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Start date</Label>
                  <Input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    type="datetime-local"
                    id="deadline"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border border-[#323234] bg-[#262627] px-3 py-2">
                  <div>
                    <Label>Hard deadline</Label>
                    <p className="text-xs text-[#9AA0A6]">
                      Keep this block fixed when reflowing.
                    </p>
                  </div>
                  <Switch checked={isFrozen} onCheckedChange={setIsFrozen} />
                </div>

                <div>
                  <Label htmlFor="preferredTime">Schedule</Label>
                  <Select
                    value={preferredTime || "none"}
                    onValueChange={(value) =>
                      setPreferredTime(
                        value === "none" ? "" : (value as TimePreference)
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Work hours">
                        {preferredTime
                          ? formatEnumValue(preferredTime)
                          : "Work hours"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Work hours</SelectItem>
                      {Object.values(TimePreference).map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatEnumValue(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-[#323234] pt-4 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <Label htmlFor="estimatedMinutes">Planner estimate</Label>
                  <Input
                    type="number"
                    id="estimatedMinutes"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    min="0"
                    placeholder={duration || "45"}
                  />
                </div>

                <div>
                  <Label htmlFor="estOptimistic">Optimistic</Label>
                  <Input
                    type="number"
                    id="estOptimistic"
                    value={estOptimistic}
                    onChange={(e) => setEstOptimistic(e.target.value)}
                    min="0"
                    placeholder="30"
                  />
                </div>

                <div>
                  <Label htmlFor="estLikely">Likely</Label>
                  <Input
                    type="number"
                    id="estLikely"
                    value={estLikely}
                    onChange={(e) => setEstLikely(e.target.value)}
                    min="0"
                    placeholder={estimatedMinutes || duration || "45"}
                  />
                </div>

                <div>
                  <Label htmlFor="estPessimistic">Pessimistic</Label>
                  <Input
                    type="number"
                    id="estPessimistic"
                    value={estPessimistic}
                    onChange={(e) => setEstPessimistic(e.target.value)}
                    min="0"
                    placeholder="75"
                  />
                </div>

                <div>
                  <Label htmlFor="maxChunkMinutes">Max chunk</Label>
                  <Input
                    type="number"
                    id="maxChunkMinutes"
                    value={maxChunkMinutes}
                    onChange={(e) => setMaxChunkMinutes(e.target.value)}
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="contextTag">Labels</Label>
                  <Input
                    id="contextTag"
                    value={contextTag}
                    onChange={(e) => setContextTag(e.target.value)}
                    placeholder="deep work"
                  />
                  {contextFactor && suggestedLikely && (
                    <button
                      type="button"
                      onClick={() => setEstLikely(String(suggestedLikely))}
                      className="mt-1 text-left text-xs text-[#8FB0FF] hover:text-white"
                    >
                      You usually run {contextFactor.toFixed(1)}x on &quot;
                      {contextTag.trim()}&quot;. Suggest {suggestedLikely} min.
                    </button>
                  )}
                </div>

                <div>
                  <Label htmlFor="priorityLevel">Planner priority</Label>
                  <Select
                    value={priorityLevel}
                    onValueChange={(value) =>
                      setPriorityLevel(value as SchedulingTaskPriority)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {formatEnumValue(priorityLevel)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SchedulingTaskPriority).map((level) => (
                        <SelectItem key={level} value={level}>
                          {formatEnumValue(level)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="energyRequired">Focus required</Label>
                  <Select
                    value={energyRequired}
                    onValueChange={(value) =>
                      setEnergyRequired(value as SchedulingEnergyLevel)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {formatEnumValue(energyRequired)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SchedulingEnergyLevel).map((level) => (
                        <SelectItem key={level} value={level}>
                          {formatEnumValue(level)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="energyLevel">Energy level</Label>
                  <Select
                    value={energyLevel || "none"}
                    onValueChange={(value) =>
                      setEnergyLevel(
                        value === "none" ? "" : (value as EnergyLevel)
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None">
                        {energyLevel ? formatEnumValue(energyLevel) : "None"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {Object.values(EnergyLevel).map((level) => (
                        <SelectItem key={level} value={level}>
                          {formatEnumValue(level)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isAutoScheduled && (
                <div className="space-y-4 border-t border-[#323234] pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Lock schedule</Label>
                      <p className="text-sm text-[#9AA0A6]">
                        Prevent automatic rescheduling
                      </p>
                    </div>
                    <Switch
                      checked={scheduleLocked}
                      onCheckedChange={setScheduleLocked}
                    />
                  </div>

                  {task?.scheduledStart && task?.scheduledEnd && (
                    <div className="rounded-md border border-[#323234] bg-[#262627] p-3">
                      <div className="text-sm text-white">
                        Scheduled for{" "}
                        {format(newDate(task.scheduledStart), "PPp")} to{" "}
                        {format(newDate(task.scheduledEnd), "p")}
                      </div>
                      {task.scheduleScore && (
                        <div className="mt-1 text-sm text-[#9AA0A6]">
                          Confidence: {Math.round(task.scheduleScore * 100)}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="project">Project</Label>
                <Select
                  value={projectId || "none"}
                  onValueChange={(value) =>
                    setProjectId(value === "none" ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {projects
                      .filter((p) => p.status === "active")
                      .map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <label
                      key={tag.id}
                      className={cn(
                        "inline-flex cursor-pointer items-center rounded-md px-3 py-1.5 text-sm transition-colors",
                        selectedTagIds.includes(tag.id)
                          ? "bg-[#2B2F31] text-white"
                          : "bg-[#262627] text-[#9AA0A6] hover:bg-[#2B2F31] hover:text-white"
                      )}
                    >
                      <Checkbox
                        className="sr-only"
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTagIds([...selectedTagIds, tag.id]);
                          } else {
                            setSelectedTagIds(
                              selectedTagIds.filter((id) => id !== tag.id)
                            );
                          }
                        }}
                      />
                      <span
                        className="mr-2 h-2 w-2 rounded-full"
                        style={{ backgroundColor: tag.color || "var(--muted)" }}
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="New tag name"
                  />
                  <Input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="h-9 w-9 p-1"
                  />
                  <Button
                    type="button"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim()}
                    variant="secondary"
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2 border-t border-[#323234] pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => {
                      setIsRecurring(checked as boolean);
                      if (checked) {
                        if (!dueDate) {
                          const today = newDate();
                          setDueDate(today.toISOString().split("T")[0]);
                        }
                        if (!recurrenceRule) {
                          setRecurrenceRule(
                            new RRule({
                              freq: RRule.WEEKLY,
                              interval: 1,
                              byweekday: [RRule.MO],
                            }).toString()
                          );
                        }
                      }
                    }}
                  />
                  <Label htmlFor="recurring">Recurring task</Label>
                </div>
                {isRecurring && !dueDate && (
                  <div className="ml-6 mt-1 text-sm text-[#8FB0FF]">
                    A recurring task needs a start date. Today has been set as
                    the default.
                  </div>
                )}
                {isRecurring && (
                  <div className="mt-2 space-y-3 pl-6">
                    <div>
                      <Label>Repeat every</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={
                            recurrenceRule
                              ? getStandardRRule({
                                  recurrenceRule,
                                  source: task?.source,
                                } as Task).options.interval || 1
                              : 1
                          }
                          onChange={(e) => {
                            const interval = parseInt(e.target.value) || 1;
                            const currentRule = recurrenceRule
                              ? getStandardRRule({
                                  recurrenceRule,
                                  source: task?.source,
                                } as Task)
                              : new RRule({
                                  freq: RRule.WEEKLY,
                                  interval: 1,
                                  byweekday: [RRule.MO],
                                });
                            setRecurrenceRule(
                              new RRule({
                                ...currentRule.options,
                                interval,
                              }).toString()
                            );
                          }}
                          className="w-20"
                        />
                        <Select
                          value={
                            recurrenceRule
                              ? getStandardRRule({
                                  recurrenceRule,
                                  source: task?.source,
                                } as Task).options.freq.toString()
                              : RRule.WEEKLY.toString()
                          }
                          onValueChange={(value) => {
                            const freq = parseInt(value);
                            const currentRule = recurrenceRule
                              ? getStandardRRule({
                                  recurrenceRule,
                                  source: task?.source,
                                } as Task)
                              : new RRule({
                                  freq: RRule.WEEKLY,
                                  interval: 1,
                                  byweekday: [RRule.MO],
                                });
                            setRecurrenceRule(
                              new RRule({
                                ...currentRule.options,
                                freq,
                                byweekday:
                                  freq === RRule.WEEKLY ? [RRule.MO] : null,
                              }).toString()
                            );
                          }}
                        >
                          <SelectTrigger className="w-[110px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={RRule.DAILY.toString()}>
                              days
                            </SelectItem>
                            <SelectItem value={RRule.WEEKLY.toString()}>
                              weeks
                            </SelectItem>
                            <SelectItem value={RRule.MONTHLY.toString()}>
                              months
                            </SelectItem>
                            <SelectItem value={RRule.YEARLY.toString()}>
                              years
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-full flex justify-end gap-3 border-t border-[#323234] px-5 py-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel (Esc)
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="rounded-md bg-[#3E63DD] text-white hover:bg-[#3658c6]"
              >
                {isSubmitting
                  ? "Saving..."
                  : task
                    ? "Save changes"
                    : "Save task"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
