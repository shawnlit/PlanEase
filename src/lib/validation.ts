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

export type CreateTaskInput = z.input<typeof createTaskSchema>;

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

// ==========================================
// Stage 2: AI Task Extraction Schemas
// ==========================================

export const parseRequestSchema = z.object({
  text: z
    .string({ required_error: 'Text input is required' })
    .trim()
    .min(1, 'Please enter some text to extract tasks')
    .max(1500, 'Text exceeds maximum limit of 1,500 characters'),
});

export type ParseRequestInput = z.infer<typeof parseRequestSchema>;

// Individual task item returned from Groq
export const llmExtractedTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title cannot be empty'),
  type: TaskTypeEnum,
  deadline_text: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type LlmExtractedTask = z.infer<typeof llmExtractedTaskSchema>;

// Whole structured output expected from Groq
export const llmExtractionResponseSchema = z.object({
  tasks: z
    .array(llmExtractedTaskSchema)
    .max(8, 'Maximum 8 proposed tasks allowed per extraction'),
});

export type LlmExtractionResponse = z.infer<typeof llmExtractionResponseSchema>;

// Proposed task in confirmation preview
export interface ProposedTask {
  tempId: string;
  title: string;
  type: TaskType;
  deadline_text: string | null;
  resolvedDate: string | null;
  isAmbiguous: boolean;
  isPast: boolean;
  clarificationReason?: string;
  warning?: string;
  selected: boolean;
}

// Batch task creation schema for confirming extracted tasks
export const batchCreateTasksSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().trim().min(1, 'Task title cannot be empty'),
        type: TaskTypeEnum,
        deadline: z
          .string()
          .trim()
          .nullable()
          .optional()
          .transform((val) => (val && val.length > 0 ? val : null)),
        status: TaskStatusEnum.optional().default('pending'),
      })
    )
    .min(1, 'At least one task must be selected to save')
    .max(8, 'Maximum 8 tasks can be saved in a single batch'),
});

export type BatchCreateTasksInput = z.infer<typeof batchCreateTasksSchema>;
