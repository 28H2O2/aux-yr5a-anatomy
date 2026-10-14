import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, '奥克斯YR-5-A-整机与热水原理.html');
copyFileSync(source, join(root, 'index.html'));
const hostedDirectory = join(root, '.sites-source', 'dist');
if (existsSync(hostedDirectory)) copyFileSync(source, join(hostedDirectory, 'index.html'));
console.log('Prepared index.html from the standalone interactive page.');
