import { z } from 'zod';

export const TaskTypeEnum = z.enum(['exam', 'assignment', 'task']);
export type TaskType = z.infer<typeof TaskTypeEnum>;

export const TaskStatusEnum = z.enum(['pending', 'completed']);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export interface TaskItem {
  id: number;
  title: string;
  type: TaskType;
  deadline: string | null;
  status: TaskStatus;
  created_at: string;
}

export interface TaskSummary {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
}

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Task title is required' })
    .trim()
    .min(1, 'Task title cannot be empty'),
  type: TaskTypeEnum,
  deadline: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  status: TaskStatusEnum.optional().default('pending'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title cannot be empty')
    .optional(),
  type: TaskTypeEnum.optional(),
  deadline: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  status: TaskStatusEnum.optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const taskFilterSchema = z.object({
  status: z.enum(['all', 'pending', 'completed']).optional().default('all'),
  type: z.enum(['all', 'exam', 'assignment', 'task']).optional().default('all'),
  search: z.string().optional().default(''),
});

export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
