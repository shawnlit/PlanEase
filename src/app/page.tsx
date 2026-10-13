'use client';

import * as React from 'react';
import { Header } from '@/components/dashboard/header';
import { Sidebar, ActiveTab } from '@/components/dashboard/sidebar';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { TaskList } from '@/components/tasks/task-list';
import { TaskCalendar } from '@/components/calendar/task-calendar';
import { TaskDialog } from '@/components/tasks/task-dialog';
import { DeleteDialog } from '@/components/tasks/delete-dialog';
import { useToast } from '@/components/ui/toast';
import { TaskItem, TaskSummary } from '@/lib/validation';

export default function DashboardPage() {
  const [tasks, setTasks] = React.useState<TaskItem[]>([]);
  const [summary, setSummary] = React.useState<TaskSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('all');

  // Dialog states
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false);
  const [taskToEdit, setTaskToEdit] = React.useState<TaskItem | null>(null);
  const [initialDate, setInitialDate] = React.useState<string | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [taskToDelete, setTaskToDelete] = React.useState<TaskItem | null>(null);

  const { success, error } = useToast();

  const fetchTasks = React.useCallback(async () => {
    try {
      const res = await fetch('/api/tasks?summary=true');
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.message) msg = errData.message;
        } catch {
          // ignore non-json error responses
        }
        error('Failed to load tasks', msg);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        error('Failed to load tasks', data.message);
      }
    } catch (err) {
      console.error(err);
      error('Connection Error', 'Could not retrieve tasks from SQLite database.');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Open create task modal
  const handleOpenCreate = (date?: string) => {
    setTaskToEdit(null);
    setInitialDate(date || null);
    setIsTaskDialogOpen(true);
  };

  // Open edit task modal
  const handleOpenEdit = (task: TaskItem) => {
    setTaskToEdit(task);
    setInitialDate(null);
    setIsTaskDialogOpen(true);
  };

  // Open delete confirmation modal
  const handleOpenDelete = (task: TaskItem) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };

  // Toggle status between pending and completed
  const handleToggleStatus = async (task: TaskItem) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update task status');
      }

      if (data.summary) {
        setSummary(data.summary);
      }

      if (nextStatus === 'completed') {
        success('Task completed', `"${task.title}" marked as complete.`);
      } else {
        success('Task pending', `"${task.title}" marked as pending again.`);
      }
    } catch (err) {
      // Revert optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
      error('Update failed', err instanceof Error ? err.message : 'Could not change status');
    }
  };

  // Handle task saved (created or updated)
  const handleTaskSaved = (savedTask: TaskItem, isNew: boolean) => {
    fetchTasks();
    if (isNew) {
      success('Task created', `"${savedTask.title}" has been saved to SQLite.`);
    } else {
      success('Task updated', `"${savedTask.title}" changes saved.`);
    }
  };

  // Handle task deleted
  const handleTaskDeleted = () => {
    fetchTasks();
    success('Task deleted', 'The task was permanently removed.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* Top Header */}
      <Header onOpenCreate={() => handleOpenCreate()} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Metric Summary Cards */}
        <SummaryCards summary={summary} isLoading={isLoading} />

        {/* Layout with Sidebar & Active View */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Navigation Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            taskCount={tasks.length}
          />

          {/* Center Dynamic Area */}
          <div className="flex-1 w-full space-y-6">
            {/* Tab: Overview (Both Checklist & Calendar) */}
            {activeTab === 'all' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        Task Checklist
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Manage your assignments and exams
                      </p>
                    </div>
                  </div>
                  <TaskList
                    tasks={tasks}
                    isLoading={isLoading}
                    onToggleStatus={handleToggleStatus}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                    onOpenCreate={() => handleOpenCreate()}
                  />
                </div>

                <div className="lg:col-span-7">
                  <TaskCalendar
                    tasks={tasks}
                    onTaskClick={handleOpenEdit}
                    onDateClick={(dateStr) => handleOpenCreate(dateStr)}
                  />
                </div>
              </div>
            )}

            {/* Tab: Checklist Only */}
            {activeTab === 'tasks' && (
              <div className="max-w-4xl space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Tasks & Deadlines
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Filter, search, and manage all your academic items
                  </p>
                </div>
                <TaskList
                  tasks={tasks}
                  isLoading={isLoading}
                  onToggleStatus={handleToggleStatus}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                  onOpenCreate={() => handleOpenCreate()}
                />
              </div>
            )}

            {/* Tab: Calendar Only */}
            {activeTab === 'calendar' && (
              <div className="space-y-4">
                <TaskCalendar
                  tasks={tasks}
                  onTaskClick={handleOpenEdit}
                  onDateClick={(dateStr) => handleOpenCreate(dateStr)}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Task Create / Edit Dialog */}
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        taskToEdit={taskToEdit}
        initialDate={initialDate}
        onSaved={handleTaskSaved}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        task={taskToDelete}
        onDeleted={handleTaskDeleted}
      />
    </div>
  );
}
