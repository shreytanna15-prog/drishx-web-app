"use client";

import { Check, ClipboardCheck, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchMyTasks,
  updateTaskStatus,
  type TaskRecord,
} from "@/lib/tasks-api";
import { cn } from "@/lib/utils";

type FilterKey = "ALL" | "PENDING" | "COMPLETED";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "COMPLETED", label: "Completed" },
];

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return "No date";
  }
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function TaskCard({
  task,
  onToggle,
  disabled,
}: {
  task: TaskRecord;
  onToggle: () => void;
  disabled: boolean;
}) {
  const isDone = task.status === "COMPLETED";

  return (
    <article className="rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold text-[var(--brand-text)]">
            {task.title}
          </h3>
          {task.details?.trim() ? (
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--brand-text-muted)]">
              {task.details.trim()}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={isDone ? "Mark as pending" : "Mark as completed"}
          aria-pressed={isDone}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg border-2 transition-colors",
            isDone
              ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-primary-text)]"
              : "border-[var(--brand-card-border)] bg-transparent text-transparent hover:border-[var(--brand-primary)]/60",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          {disabled ? (
            <Loader2 className="size-4 animate-spin text-[var(--brand-primary)]" />
          ) : isDone ? (
            <Check className="size-4" strokeWidth={3} />
          ) : null}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-[var(--brand-text-muted)]">
          Due: {formatDueDate(task.dueDate)}
        </p>
        <span
          className={cn(
            "rounded-lg border px-2.5 py-1 text-xs font-bold",
            isDone
              ? "border-emerald-500/35 bg-emerald-500/14 text-emerald-500"
              : "border-[var(--brand-primary)]/35 bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]"
          )}
        >
          {isDone ? "Completed" : "Pending"}
        </span>
      </div>
    </article>
  );
}

export function EmployeeTasksScreen() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchMyTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    if (activeFilter === "ALL") {
      return tasks;
    }
    return tasks.filter((task) => task.status === activeFilter);
  }, [activeFilter, tasks]);

  async function toggleTask(task: TaskRecord) {
    const next = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    const optimisticTask: TaskRecord = {
      ...task,
      status: next,
      completedAt: next === "COMPLETED" ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };

    setUpdateError(null);
    setTasks((prev) =>
      prev.map((current) => (current.id === task.id ? optimisticTask : current))
    );
    setUpdatingId(task.id);

    try {
      const updated = await updateTaskStatus(task.id, next);
      setTasks((prev) =>
        prev.map((current) =>
          current.id === updated.id ? { ...current, ...updated } : current
        )
      );
    } catch (err) {
      setTasks((prev) =>
        prev.map((current) => (current.id === task.id ? task : current))
      );
      setUpdateError(
        err instanceof Error ? err.message : "Failed to update task."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(100%,36rem)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--brand-text)] sm:text-3xl">
              My Tasks
            </h1>
            <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
              Tasks assigned by admin
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-9 shrink-0 rounded-xl border-[var(--brand-input-border)]"
            onClick={() => {
              setRefreshing(true);
              void loadTasks();
            }}
            disabled={loading || refreshing}
            aria-label="Refresh tasks"
          >
            {refreshing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                  active
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]"
                    : "border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {updateError ? (
          <div className="mb-4 rounded-2xl border border-[var(--brand-danger)]/35 bg-[var(--brand-danger)]/10 px-4 py-3 text-sm font-medium text-[var(--brand-danger)]">
            {updateError}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-12 text-center">
            <p className="text-sm font-medium text-[var(--brand-danger)]">
              {error}
            </p>
            <Button
              onClick={() => {
                setLoading(true);
                void loadTasks();
              }}
              className="rounded-xl bg-[var(--brand-primary)] font-bold text-[var(--brand-primary-text)]"
            >
              Retry
            </Button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-16 text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full border border-[var(--brand-card-border)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)]">
              <ClipboardCheck className="size-7 text-[var(--brand-text-muted)]" />
            </div>
            <p className="text-sm font-medium text-[var(--brand-text-muted)]">
              No tasks available.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                disabled={updatingId === task.id}
                onToggle={() => void toggleTask(task)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
