import { getDb } from './db';
import {
  TaskItem,
  TaskSummary,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilterInput,
} from './validation';

/**
 * Retrieve tasks with optional status, type, and search filters.
 * Uses parameterized SQL queries exclusively.
 */
export function getTasks(filter?: Partial<TaskFilterInput>): TaskItem[] {
  const db = getDb();
  const conditions: string[] = ['1=1'];
  const params: (string | number)[] = [];

  if (filter?.status && filter.status !== 'all') {
    conditions.push('status = ?');
    params.push(filter.status);
  }

  if (filter?.type && filter.type !== 'all') {
    conditions.push('type = ?');
    params.push(filter.type);
  }

  if (filter?.search && filter.search.trim().length > 0) {
    conditions.push('title LIKE ?');
    params.push(`%${filter.search.trim()}%`);
  }

  const query = `
    SELECT id, title, type, deadline, status, created_at
    FROM item
    WHERE ${conditions.join(' AND ')}
    ORDER BY 
      CASE WHEN status = 'completed' THEN 1 ELSE 0 END ASC,
      CASE WHEN deadline IS NULL THEN 1 ELSE 0 END ASC,
      deadline ASC,
      id DESC
  `;

  return db.prepare(query).all(...params) as TaskItem[];
}

/**
 * Retrieve a single task by ID.
 */
export function getTaskById(id: number): TaskItem | null {
  const db = getDb();
  const row = db
    .prepare('SELECT id, title, type, deadline, status, created_at FROM item WHERE id = ?')
    .get(id);

  return (row as TaskItem) || null;
}

/**
 * Insert a new task into the database.
 */
export function createTask(data: CreateTaskInput): TaskItem {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO item (title, type, deadline, status)
    VALUES (?, ?, ?, ?)
  `);

  const info = stmt.run(
    data.title,
    data.type,
    data.deadline ?? null,
    data.status ?? 'pending'
  );

  const inserted = getTaskById(Number(info.lastInsertRowid));
  if (!inserted) {
    throw new Error('Failed to retrieve newly created task');
  }

  return inserted;
}

/**
 * Update task properties.
 */
export function updateTask(id: number, data: UpdateTaskInput): TaskItem | null {
  const db = getDb();
  const existing = getTaskById(id);
  if (!existing) {
    return null;
  }

  const fields: string[] = [];
  const params: (string | number | null)[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    params.push(data.title);
  }

  if (data.type !== undefined) {
    fields.push('type = ?');
    params.push(data.type);
  }

  if (data.deadline !== undefined) {
    fields.push('deadline = ?');
    params.push(data.deadline ?? null);
  }

  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }

  if (fields.length === 0) {
    return existing;
  }

  params.push(id);
  const query = `UPDATE item SET ${fields.join(', ')} WHERE id = ?`;
  db.prepare(query).run(...params);

  return getTaskById(id);
}

/**
 * Delete a task by ID.
 */
export function deleteTask(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM item WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * Retrieve task summary statistics.
 * Leverages the overdue_items view for overdue counts.
 */
export function getTaskSummary(): TaskSummary {
  const db = getDb();

  const totalRow = db.prepare('SELECT count(*) as count FROM item').get() as { count: number };
  const pendingRow = db
    .prepare("SELECT count(*) as count FROM item WHERE status = 'pending'")
    .get() as { count: number };
  const completedRow = db
    .prepare("SELECT count(*) as count FROM item WHERE status = 'completed'")
    .get() as { count: number };
  const overdueRow = db
    .prepare('SELECT count(*) as count FROM overdue_items')
    .get() as { count: number };

  return {
    total: totalRow.count,
    pending: pendingRow.count,
    completed: completedRow.count,
    overdue: overdueRow.count,
  };
}

/**
 * Retrieve overdue tasks via the SQL view.
 */
export function getOverdueTasks(): TaskItem[] {
  const db = getDb();
  return db.prepare('SELECT * FROM overdue_items ORDER BY deadline ASC').all() as TaskItem[];
}

/**
 * Retrieve upcoming tasks via the SQL view.
 */
export function getUpcomingTasks(): TaskItem[] {
  const db = getDb();
  return db.prepare('SELECT * FROM upcoming_items ORDER BY deadline ASC').all() as TaskItem[];
}

/**
 * Insert multiple tasks inside a single SQLite transaction.
 * If any insertion fails, the entire batch is automatically rolled back.
 */
export function createTaskBatch(tasks: CreateTaskInput[]): TaskItem[] {
  const db = getDb();
  const insertStmt = db.prepare(`
    INSERT INTO item (title, type, deadline, status)
    VALUES (?, ?, ?, ?)
  `);

  const insertedIds: number[] = [];

  const batchTx = db.transaction((items: CreateTaskInput[]) => {
    for (const item of items) {
      const info = insertStmt.run(
        item.title,
        item.type,
        item.deadline ?? null,
        item.status ?? 'pending'
      );
      insertedIds.push(Number(info.lastInsertRowid));
    }
  });

  batchTx(tasks);

  return insertedIds
    .map((id) => getTaskById(id))
    .filter((t): t is TaskItem => t !== null);
}
