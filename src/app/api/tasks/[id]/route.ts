import { NextRequest, NextResponse } from 'next/server';
import { getTaskById, updateTask, deleteTask, getTaskSummary } from '@/lib/tasks';
import { updateTaskSchema } from '@/lib/validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseInt(rawId, 10);

    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const task = getTaskById(id);
    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Error fetching task by ID:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseInt(rawId, 10);

    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parseResult = updateTaskSchema.safeParse(body);

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

    const updatedTask = updateTask(id, parseResult.data);
    if (!updatedTask) {
      return NextResponse.json(
        { success: false, message: 'Task not found' },
        { status: 404 }
      );
    }

    const summary = getTaskSummary();

    return NextResponse.json({
      success: true,
      task: updatedTask,
      summary,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseInt(rawId, 10);

    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const deleted = deleteTask(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Task not found or already deleted' },
        { status: 404 }
      );
    }

    const summary = getTaskSummary();

    return NextResponse.json({
      success: true,
      message: 'Task successfully deleted',
      summary,
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting task' },
      { status: 500 }
    );
  }
}
