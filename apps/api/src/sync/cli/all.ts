import { prisma } from '../../db.js';
import { runAllJobs } from '../lib/runner.js';

/**
 * CLI entry for `npm run sync:all`. Runs every registered job in order
 * (Congress → FEC → judicial → executive) in a single process, continuing past
 * failures and exiting non-zero if any job failed. Pass `--force` to bypass the
 * cache windows.
 */
const force = process.argv.includes('--force');
console.log(force ? '[sync:all] starting (forced)…' : '[sync:all] starting…');

const results = await runAllJobs({ force });

console.log('\n[sync:all] summary:');
for (const r of results) {
  console.log(`  ${r.status.toUpperCase().padEnd(7)} ${r.key} — ${r.message}`);
}

await prisma.$disconnect();
if (results.some((r) => r.status === 'error')) {
  console.error('[sync:all] one or more jobs failed.');
  process.exitCode = 1;
} else {
  console.log('[sync:all] complete.');
}
