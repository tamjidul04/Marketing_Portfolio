// Applies all migrations to an in-memory Postgres (PGlite) and runs every *.test.sql file.
// Each '-- TEST:' block runs in its own transaction; titles containing 'EXPECT FAIL' must error.
// Run with:  npm run test:db
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb } from './bootstrap.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

let db, applied;
try {
  ({ db, applied } = await createDb());
} catch (e) {
  console.log('FAIL', e.message);
  process.exit(1);
}
for (const f of applied) console.log('migration ok  ', f);

let failed = 0;
for (const testFile of fs.readdirSync(here).filter((f) => f.endsWith('.test.sql')).sort()) {
  console.log('\n#', testFile);
  const sql = fs.readFileSync(path.join(here, testFile), 'utf8');
  for (const block of sql.split(/^-- TEST:/m).slice(1)) {
    const [firstLine, ...rest] = block.split('\n');
    let title = firstLine.trim();
    const expectFail = /EXPECT FAIL/.test(title);
    let ok;
    try {
      await db.exec('begin;\n' + rest.join('\n') + '\n;rollback;');
      ok = !expectFail;
      if (!ok) title += '  → expected an error but it succeeded';
    } catch (e) {
      await db.exec('rollback').catch(() => {});
      ok = expectFail;
      title += (ok ? '  ✓ blocked: ' : '  → ') + e.message; // show WHY it failed, so a typo can't pass as "blocked"
    }
    if (!ok) failed++;
    console.log(ok ? '  pass' : '  FAIL', title);
  }
}
console.log(failed ? `\n${failed} test(s) failed` : '\nall tests passed');
await db.close();
process.exitCode = failed ? 1 : 0;
