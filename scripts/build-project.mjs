import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
for (const args of [
  ['build.mjs', '--light', '--audit'],
  ['build.mjs', '--audit'],
  ['urinal.mjs', '--light', '--audit'],
  ['urinal.mjs', '--audit'],
  ['combine.mjs'],
  ['scripts/prepare-site.mjs']
]) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
