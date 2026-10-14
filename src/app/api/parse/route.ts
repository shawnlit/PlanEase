import { NextRequest, NextResponse } from 'next/server';
import { extractTasksWithGroq } from '@/lib/llm/groq';
import { getUsageStatus } from '@/lib/llm/usage-guard';
import { resolveDeadlinePhrase } from '@/lib/date-resolver';
import { parseRequestSchema, ProposedTask } from '@/lib/validation';

export async function GET() {
  try {
    const usage = getUsageStatus();
    return NextResponse.json({
      success: true,
      usage,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve usage stats',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = parseRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: parseResult.error.flatten().fieldErrors,
          usage: getUsageStatus(),
        },
        { status: 400 }
      );
    }

    // Call Groq (hard usage limits & audit logging enforced inside)
    const extraction = await extractTasksWithGroq(parseResult.data.text);

    // Resolve natural language deadlines with chrono-node
    const proposedTasks: ProposedTask[] = extraction.tasks.map((task, idx) => {
      const dateRes = resolveDeadlinePhrase(task.deadline_text);
      return {
        tempId: `prop-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        title: task.title,
        type: task.type,
        deadline_text: task.deadline_text,
        resolvedDate: dateRes.resolvedDate,
        isAmbiguous: dateRes.isAmbiguous,
        isPast: dateRes.isPast,
        clarificationReason: dateRes.clarificationReason,
        warning: dateRes.warning,
        // Tasks requiring clarification are unselected by default until user clarifies
        selected: !dateRes.isAmbiguous,
      };
    });

    const updatedUsage = getUsageStatus();

    return NextResponse.json({
      success: true,
      tasks: proposedTasks,
      referenceDate: extraction.referenceDate,
      modelUsed: extraction.modelUsed,
      tokensUsed: extraction.tokensUsed,
      usage: updatedUsage,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An error occurred during AI task extraction.';

    console.error('[PlanEase AI Extraction Error]', message);

    return NextResponse.json(
      {
        success: false,
        message,
        usage: getUsageStatus(),
      },
      { status: 422 }
    );
  }
}
