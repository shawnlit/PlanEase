import { createSupabaseAdminClient } from './supabase/admin';
import {
  TaskItem,
  TaskSummary,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilterInput,
} from './validation';

function throwIfError(error: { message: string } | null, operation: string): void {
  if (error) {
    throw new Error(`Failed to ${operation}: ${error.message}`);
  }
}

export async function getTasks(
  userId: string,
  filter?: Partial<TaskFilterInput>
): Promise<TaskItem[]> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('tasks')
    .select('id, title, type, deadline, status, created_at')
    .eq('user_id', userId)
    .order('status', { ascending: true })
    .order('deadline', { ascending: true, nullsFirst: false })
    .order('id', { ascending: false });

  if (filter?.status && filter.status !== 'all') {
    query = query.eq('status', filter.status);
  }
  if (filter?.type && filter.type !== 'all') {
    query = query.eq('type', filter.type);
  }
  if (filter?.search && filter.search.trim().length > 0) {
    query = query.ilike('title', `%${filter.search.trim()}%`);
  }

  const { data, error } = await query;
  throwIfError(error, 'retrieve tasks');
  return ((data ?? []) as TaskItem[]).sort((a, b) => {
    if (a.status !== b.status) return a.status === 'completed' ? 1 : -1;
    if (a.deadline === null && b.deadline !== null) return 1;
    if (a.deadline !== null && b.deadline === null) return -1;
    if (a.deadline !== b.deadline) return (a.deadline ?? '').localeCompare(b.deadline ?? '');
    return b.id - a.id;
  });
}

export async function getTaskById(userId: string, id: number): Promise<TaskItem | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, type, deadline, status, created_at')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();

  throwIfError(error, 'retrieve task');
  return (data as TaskItem | null) ?? null;
}

export async function createTask(userId: string, data: CreateTaskInput): Promise<TaskItem> {
  const supabase = createSupabaseAdminClient();
  const { data: created, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: data.title,
      type: data.type,
      deadline: data.deadline ?? null,
      status: data.status ?? 'pending',
    })
    .select('id, title, type, deadline, status, created_at')
    .single();

  throwIfError(error, 'create task');
  if (!created) throw new Error('Failed to retrieve newly created task');
  return created as TaskItem;
}

export async function updateTask(
  userId: string,
  id: number,
  data: UpdateTaskInput
): Promise<TaskItem | null> {
  const updates: Record<string, string | null> = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.type !== undefined) updates.type = data.type;
  if (data.deadline !== undefined) updates.deadline = data.deadline ?? null;
  if (data.status !== undefined) updates.status = data.status;

  if (Object.keys(updates).length === 0) {
    return getTaskById(userId, id);
  }

  const supabase = createSupabaseAdminClient();
  const { data: updated, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', id)
    .select('id, title, type, deadline, status, created_at')
    .maybeSingle();

  throwIfError(error, 'update task');
  return (updated as TaskItem | null) ?? null;
}

export async function deleteTask(userId: string, id: number): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('user_id', userId)
    .eq('id', id)
    .select('id');

  throwIfError(error, 'delete task');
  return (data?.length ?? 0) > 0;
}

export async function getTaskSummary(userId: string): Promise<TaskSummary> {
  const tasks = await getTasks(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    total: tasks.length,
    pending: tasks.filter((task) => task.status === 'pending').length,
    completed: tasks.filter((task) => task.status === 'completed').length,
    overdue: tasks.filter((task) => {
      if (task.status !== 'pending' || !task.deadline) return false;
      const deadlineDate = new Date(task.deadline.split('T')[0]);
      return !Number.isNaN(deadlineDate.getTime()) && deadlineDate < today;
    }).length,
  };
}

export async function getOverdueTasks(userId: string): Promise<TaskItem[]> {
  const tasks = await getTasks(userId, { status: 'pending' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return tasks.filter((task) => {
    if (!task.deadline) return false;
    const deadlineDate = new Date(task.deadline.split('T')[0]);
    return !Number.isNaN(deadlineDate.getTime()) && deadlineDate < today;
  });
}

export async function getUpcomingTasks(userId: string): Promise<TaskItem[]> {
  const tasks = await getTasks(userId, { status: 'pending' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return tasks.filter((task) => {
    if (!task.deadline) return false;
    const deadlineDate = new Date(task.deadline.split('T')[0]);
    return !Number.isNaN(deadlineDate.getTime()) && deadlineDate >= today;
  });
}

export async function createTaskBatch(
  userId: string,
  tasks: CreateTaskInput[]
): Promise<TaskItem[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert(
      tasks.map((task) => ({
        user_id: userId,
        title: task.title,
        type: task.type,
        deadline: task.deadline ?? null,
        status: task.status ?? 'pending',
      }))
    )
    .select('id, title, type, deadline, status, created_at');

  throwIfError(error, 'create task batch');
  return (data ?? []) as TaskItem[];
}
