import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask, getTaskSummary } from '@/lib/tasks';
import { createTaskSchema, taskFilterSchema } from '@/lib/validation';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
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

    const tasks = getTasks(filterResult.data);
    const summary = includeSummary ? getTaskSummary() : undefined;

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

    const newTask = createTask(parseResult.data);
    const summary = getTaskSummary();

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
