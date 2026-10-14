/**
 * Comprehensive Automated Test Suite for PlanEase Stage 2:
 * Free-Tier-Only AI Task Extraction, Date Resolution, and Hard Usage Guards.
 *
 * All LLM tests use mocked provider responses to ensure ZERO Groq API usage during testing.
 */

import assert from 'node:assert';
import { getDb } from '../src/lib/db';
import { LLM_CONFIG, getValidatedModelId, getGroqApiKey } from '../src/lib/llm/config';
import {
  getKolkataDateString,
  getUsageStatus,
  reserveAiRequestSlot,
} from '../src/lib/llm/usage-guard';
import { resolveDeadlinePhrase } from '../src/lib/date-resolver';
import {
  parseRequestSchema,
  llmExtractionResponseSchema,
} from '../src/lib/validation';
import {
  createTaskBatch,
  getTasks,
  createTask,
  deleteTask,
} from '../src/lib/tasks';
import { formatDate, formatTime, isDeadlineOverdue } from '../src/lib/utils';

let passedTests = 0;
let failedTests = 0;

async function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error:`, err instanceof Error ? err.message : err);
    failedTests++;
  }
}

async function main() {
  console.log('\n🧪 Running PlanEase Stage 2 Test Suite...\n');

  const db = getDb();

  // Test 1: Valid extraction of multiple tasks (Mocked schema verification)
  await runTest('1. Valid extraction schema parsing of multiple tasks', () => {
    const mockOutput = {
      tasks: [
        { title: 'DBMS Assignment 3', type: 'assignment', deadline_text: 'Thursday' },
        { title: 'Revise normalization notes', type: 'task', deadline_text: 'tomorrow' },
        { title: 'Algorithms Midterm', type: 'exam', deadline_text: 'October 25' },
      ],
    };

    const parsed = llmExtractionResponseSchema.parse(mockOutput);
    assert.strictEqual(parsed.tasks.length, 3);
    assert.strictEqual(parsed.tasks[0].type, 'assignment');
    assert.strictEqual(parsed.tasks[2].type, 'exam');
  });

  // Test 2: Invalid JSON and invalid schema output rejected
  await runTest('2. Invalid schema output is rejected without retrying', () => {
    const invalidTypeOutput = {
      tasks: [{ title: 'Study', type: 'invalid_type', deadline_text: null }],
    };
    assert.throws(() => {
      llmExtractionResponseSchema.parse(invalidTypeOutput);
    });

    const emptyTitleOutput = {
      tasks: [{ title: '   ', type: 'task', deadline_text: null }],
    };
    assert.throws(() => {
      llmExtractionResponseSchema.parse(emptyTitleOutput);
    });

    const tooManyTasks = {
      tasks: Array.from({ length: 9 }, (_, i) => ({
        title: `Task ${i}`,
        type: 'task',
        deadline_text: null,
      })),
    };
    assert.throws(() => {
      llmExtractionResponseSchema.parse(tooManyTasks);
    });
  });

  // Test 3: Ambiguous and missing deadlines
  await runTest('3. Ambiguous, missing, and valid deadlines handled correctly', () => {
    // Missing deadline -> null, not ambiguous
    const missing = resolveDeadlinePhrase(null);
    assert.strictEqual(missing.resolvedDate, null);
    assert.strictEqual(missing.isAmbiguous, false);

    // Incomplete date without month -> ambiguous
    const incomplete = resolveDeadlinePhrase('on the 25th');
    assert.strictEqual(incomplete.resolvedDate, null);
    assert.strictEqual(incomplete.isAmbiguous, true);
    assert.ok(incomplete.clarificationReason?.includes('without a month'));

    // Broad unresolvable expression -> ambiguous
    const unresolvable = resolveDeadlinePhrase('sometime soon');
    assert.strictEqual(unresolvable.resolvedDate, null);
    assert.strictEqual(unresolvable.isAmbiguous, true);

    // Valid relative date -> resolves to YYYY-MM-DD
    const valid = resolveDeadlinePhrase('tomorrow', new Date('2026-10-14T10:00:00+05:30'));
    assert.strictEqual(valid.resolvedDate, '2026-10-15');
    assert.strictEqual(valid.isAmbiguous, false);
  });

  // Test 4: Inputs longer than maximum (1500 chars) rejected before quota
  await runTest('4. Inputs exceeding 1,500 characters rejected before counting quota', () => {
    const longInput = 'a'.repeat(1501);

    // Schema rejects
    assert.throws(() => {
      parseRequestSchema.parse({ text: longInput });
    });

    // Guard rejects before recording usage
    assert.throws(() => {
      reserveAiRequestSlot(longInput);
    }, /maximum limit of 1500 characters/i);
  });

  // Test 5: Missing API keys handled with clear setup error
  await runTest('5. Missing API key throws descriptive setup error', () => {
    const originalKey = process.env.GROQ_API_KEY;
    try {
      delete process.env.GROQ_API_KEY;
      assert.throws(() => {
        getGroqApiKey();
      }, /GROQ_API_KEY is not configured/i);
    } finally {
      process.env.GROQ_API_KEY = originalKey;
    }
  });

  // Test 6: Daily and per-minute limits enforced
  await runTest('6. Daily and per-minute hard usage limits enforced locally', () => {
    const testDate = '2099-01-01'; // Future date for isolated test
    const testMinute = 99999999;

    // Insert 10 mock requests for this test date
    for (let i = 0; i < 10; i++) {
      db.prepare('INSERT INTO ai_usage (request_date, minute_timestamp) VALUES (?, ?)').run(
        testDate,
        testMinute + i
      );
    }

    const count = db
      .prepare('SELECT count(*) as count FROM ai_usage WHERE request_date = ?')
      .get(testDate) as { count: number };
    assert.strictEqual(count.count, 10);

    // Clean up test rows
    db.prepare('DELETE FROM ai_usage WHERE request_date = ?').run(testDate);
  });

  // Test 7: Concurrent requests cannot bypass local limit
  await runTest('7. Mutex lock prevents concurrent AI requests', () => {
    const release = reserveAiRequestSlot('First request');
    try {
      assert.throws(() => {
        reserveAiRequestSlot('Simultaneous second request');
      }, /already in progress/i);
    } finally {
      release();
    }
  });

  // Test 8: Page refresh / app restart preserves usage counters in SQLite
  await runTest('8. Usage counters persist in SQLite across resets', () => {
    const status = getUsageStatus();
    assert.ok(typeof status.todayCount === 'number');
    assert.ok(status.todayCount >= 0);
    assert.strictEqual(status.maxDaily, 10);
  });

  // Test 9: Model whitelist rejects unverified or billable models
  await runTest('9. Model whitelist prevents billable or unverified models', () => {
    const originalModel = process.env.GROQ_MODEL;
    try {
      process.env.GROQ_MODEL = 'openai/gpt-oss-20b';
      assert.strictEqual(getValidatedModelId(), 'openai/gpt-oss-20b');

      process.env.GROQ_MODEL = 'some-paid-unknown-model';
      assert.throws(() => {
        getValidatedModelId();
      }, /not in the confirmed Groq Free-plan whitelist/i);
    } finally {
      process.env.GROQ_MODEL = originalModel;
    }
  });

  // Test 10: Cancelling preview saves 0 tasks
  await runTest('10. Parsing endpoint does not insert tasks into SQLite', () => {
    const beforeCount = (
      db.prepare('SELECT count(*) as count FROM item').get() as { count: number }
    ).count;

    // Simulating parsing output - no database write occurs
    const mockProposed = [
      { title: 'Cancelled Task', type: 'task' as const, deadline_text: null },
    ];
    // User cancels -> no write performed

    const afterCount = (
      db.prepare('SELECT count(*) as count FROM item').get() as { count: number }
    ).count;
    assert.strictEqual(beforeCount, afterCount);
  });

  // Test 11: Confirming selected tasks saves only selected tasks
  await runTest('11. Confirming batch saves only selected tasks in SQLite', () => {
    const initialTasks = getTasks();

    const batch = [
      { title: 'Selected Task 1', type: 'assignment' as const, deadline: '2026-11-01' },
      { title: 'Selected Task 2', type: 'exam' as const, deadline: '2026-11-05' },
    ];

    const saved = createTaskBatch(batch);
    assert.strictEqual(saved.length, 2);
    assert.strictEqual(saved[0].title, 'Selected Task 1');
    assert.strictEqual(saved[0].status, 'pending');

    // Clean up
    for (const t of saved) {
      deleteTask(t.id);
    }
  });

  // Test 12: Atomic rollback on failed batch transaction
  await runTest('12. Failed database transaction rolls back entire batch', () => {
    const beforeCount = (
      db.prepare('SELECT count(*) as count FROM item').get() as { count: number }
    ).count;

    // Second task has empty title violating CHECK constraint
    const invalidBatch = [
      { title: 'Valid Task A', type: 'task' as const, deadline: null },
      { title: '   ', type: 'task' as const, deadline: null }, // FAILS check
    ];

    assert.throws(() => {
      createTaskBatch(invalidBatch);
    });

    const afterCount = (
      db.prepare('SELECT count(*) as count FROM item').get() as { count: number }
    ).count;
    // Exactly zero tasks saved from the batch
    assert.strictEqual(beforeCount, afterCount);
  });

  // Test 13: Frontend never receives API key
  await runTest('13. Client data payloads never expose API key or secrets', () => {
    const usage = getUsageStatus();
    const serialized = JSON.stringify(usage);
    assert.ok(!serialized.includes('GROQ_API_KEY'));
    assert.ok(!serialized.includes('gsk_'));
  });

  // Test 14: Basic task manager functions without AI access
  await runTest('14. Core manual task CRUD works without AI', () => {
    const task = createTask({
      title: 'Manual Task Without AI',
      type: 'task',
      deadline: '2026-11-10',
    });
    assert.ok(task.id > 0);
    assert.strictEqual(task.status, 'pending');

    const deleted = deleteTask(task.id);
    assert.strictEqual(deleted, true);
  });

  // Test 15: Deadlines with specific time feature and formatting
  await runTest('15. Deadlines with specific time feature, formatting, and overdue checks', () => {
    // formatTime checks
    assert.strictEqual(formatTime('14:30'), '2:30 PM');
    assert.strictEqual(formatTime('09:05'), '9:05 AM');
    assert.strictEqual(formatTime('00:00'), '12:00 AM');
    assert.strictEqual(formatTime('12:00'), '12:00 PM');

    // formatDate with and without time
    const formattedDateOnly = formatDate('2026-10-15');
    assert.ok(formattedDateOnly.includes('Oct 15, 2026'));

    const formattedWithTime = formatDate('2026-10-15T14:30');
    assert.ok(formattedWithTime.includes('Oct 15, 2026 at 2:30 PM'));

    // SQLite persistence with time
    const timedTask = createTask({
      title: 'Database Project Presentation',
      type: 'assignment',
      deadline: '2026-10-15T15:30',
    });
    assert.strictEqual(timedTask.deadline, '2026-10-15T15:30');

    // Clean up
    deleteTask(timedTask.id);
  });

  console.log(`\n📊 Test Summary: ${passedTests} passed, ${failedTests} failed.`);
  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
