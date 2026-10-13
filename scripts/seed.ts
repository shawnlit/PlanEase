import fs from 'fs';
import path from 'path';
import { getDb } from '../src/lib/db';

async function main() {
  console.log('🌱 PlanEase Database Seeder');

  const db = getDb();
  const countRow = db.prepare('SELECT count(*) as count FROM item').get() as { count: number };

  const isForce = process.argv.includes('--force');

  if (countRow.count > 0 && !isForce) {
    console.log(
      `ℹ️  Database already contains ${countRow.count} tasks. Seeding skipped.`
    );
    console.log('   Use `npm run seed -- --force` to append seed data anyway.');
    process.exit(0);
  }

  const seedSqlPath = path.resolve(process.cwd(), 'db', 'seed.sql');
  if (!fs.existsSync(seedSqlPath)) {
    console.error(`❌ Seed file not found at: ${seedSqlPath}`);
    process.exit(1);
  }

  const seedSql = fs.readFileSync(seedSqlPath, 'utf-8');
  db.exec(seedSql);

  const updatedCountRow = db.prepare('SELECT count(*) as count FROM item').get() as { count: number };
  console.log(`✅ Seed data inserted successfully! Total tasks in database: ${updatedCountRow.count}`);
}

main().catch((err) => {
  console.error('❌ Failed to seed database:', err);
  process.exit(1);
});
