import { NextRequest, NextResponse } from 'next/server';
import { createTaskBatch, getTaskSummary } from '@/lib/tasks';
import { batchCreateTasksSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = batchCreateTasksSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed for task batch',
          errors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Save all tasks inside a single SQLite transaction (atomic)
    const savedTasks = createTaskBatch(parseResult.data.tasks);
    const summary = getTaskSummary();

    return NextResponse.json(
      {
        success: true,
        count: savedTasks.length,
        tasks: savedTasks,
        summary,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in batch task creation:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Database error while saving batch tasks. Transaction was rolled back.',
      },
      { status: 500 }
    );
  }
}
