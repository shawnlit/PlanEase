import { NextRequest, NextResponse } from 'next/server';
import { createTaskBatch, getTaskSummary } from '@/lib/tasks';
import { batchCreateTasksSchema } from '@/lib/validation';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

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

    const savedTasks = await createTaskBatch(user.id, parseResult.data.tasks);
    const summary = await getTaskSummary(user.id);

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
