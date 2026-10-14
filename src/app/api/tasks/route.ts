import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask, getTaskSummary } from '@/lib/tasks';
import { createTaskSchema, taskFilterSchema } from '@/lib/validation';
import { ZodError } from 'zod';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';
    const includeSummary = searchParams.get('summary') === 'true';

    const filterResult = taskFilterSchema.safeParse({ status, type, search });
    if (!filterResult.success) {
      return NextResponse.json(
        { success: false, errors: filterResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const tasks = await getTasks(user.id, filterResult.data);
    const summary = includeSummary ? await getTaskSummary(user.id) : undefined;

    return NextResponse.json({
      success: true,
      tasks,
      summary,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = createTaskSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const newTask = await createTask(user.id, parseResult.data);
    const summary = await getTaskSummary(user.id);

    return NextResponse.json(
      {
        success: true,
        task: newTask,
        summary,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload', errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create task in database' },
      { status: 500 }
    );
  }
}
