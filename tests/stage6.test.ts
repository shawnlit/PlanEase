import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createTaskSchema, llmExtractionResponseSchema, parseRequestSchema } from '@/lib/validation';
import { resolveDeadlinePhrase } from '@/lib/date-resolver';
import { getValidatedModelId, VERIFIED_FREE_MODELS } from '@/lib/llm/config';

const projectRoot = path.resolve(__dirname, '..');

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

function test(name: string, callback: () => void): void {
  try {
    callback();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}`);
    throw error;
  }
}

console.log('\n🧪 Running PlanEase Stage 6 Migration Test Suite...\n');

test('task payload validation preserves date-time deadlines', () => {
  const result = createTaskSchema.parse({
    title: 'Compiler',
    type: 'exam',
    deadline: '2026-10-21T12:00',
  });

  assert.equal(result.deadline, '2026-10-21T12:00');
  assert.equal(result.status, 'pending');
});

test('AI extraction schema rejects unsupported task types', () => {
  const result = llmExtractionResponseSchema.safeParse({
    tasks: [{ title: 'Compiler', type: 'lecture', deadline_text: null }],
  });

  assert.equal(result.success, false);
});

test('parse requests reject input over the configured limit', () => {
  const result = parseRequestSchema.safeParse({ text: 'x'.repeat(1501) });
  assert.equal(result.success, false);
});

test('deadline preview preserves an explicit time', () => {
  const result = resolveDeadlinePhrase(
    '21st October at 12 pm',
    new Date('2026-10-15T01:20:16+05:30')
  );

  assert.equal(result.isAmbiguous, false);
  assert.equal(result.resolvedDate, '2026-10-21T12:00');
});

test('deadline preview keeps date-only phrases date-only', () => {
  const result = resolveDeadlinePhrase(
    '21st October',
    new Date('2026-10-15T01:20:16+05:30')
  );

  assert.equal(result.resolvedDate, '2026-10-21');
});

test('task persistence scopes every operation to the authenticated user', () => {
  const source = readProjectFile('src/lib/tasks.ts');
  const userScopedOperations = [
    ".eq('user_id', userId)",
    'user_id: userId',
  ];

  for (const operation of userScopedOperations) {
    assert.ok(source.includes(operation), `Missing task ownership guard: ${operation}`);
  }
  assert.ok(!source.includes('user_id: data.user_id'));
});

test('task routes obtain the user from the server session', () => {
  for (const file of [
    'src/app/api/tasks/route.ts',
    'src/app/api/tasks/[id]/route.ts',
    'src/app/api/tasks/batch/route.ts',
  ]) {
    const source = readProjectFile(file);
    assert.ok(source.includes('getAuthenticatedUser()'), `${file} does not verify a session`);
    assert.ok(source.includes('Authentication required'), `${file} does not reject anonymous requests`);
  }
});

test('AI extraction uses authenticated user ownership and trusted database operations', () => {
  const groqSource = readProjectFile('src/lib/llm/groq.ts');
  const usageSource = readProjectFile('src/lib/llm/usage-guard.ts');

  assert.ok(groqSource.includes('extractTasksWithGroq(userId: string'));
  assert.ok(groqSource.includes('reserveAiRequestSlot(userId, userText)'));
  assert.ok(groqSource.includes('logLlmAudit(userId'));
  assert.ok(usageSource.includes("rpc('reserve_ai_request'"));
  assert.ok(usageSource.includes("rpc('insert_llm_log'"));
});

test('server secret is not exposed through public environment variables', () => {
  const sourceFiles = [
    'src/lib/supabase/admin.ts',
    'src/lib/supabase/browser.ts',
    'src/lib/supabase/server.ts',
    'proxy.ts',
  ];

  const combinedSource = sourceFiles.map(readProjectFile).join('\n');
  assert.ok(combinedSource.includes('SUPABASE_SECRET_KEY'));
  assert.ok(!combinedSource.includes('NEXT_PUBLIC_SUPABASE_SECRET_KEY'));
  assert.ok(!combinedSource.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'));
});

test('configured Groq model remains on the verified allowlist', () => {
  const model = getValidatedModelId();
  assert.ok((VERIFIED_FREE_MODELS as readonly string[]).includes(model));
});

console.log('\n✅ Stage 6 checks passed.\n');
