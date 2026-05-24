import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('dist/sankofa-frontend/browser');
const target = resolve('browser');

if (!existsSync(source)) {
  throw new Error(`Angular browser output not found at ${source}`);
}

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });

console.log(`Prepared Vercel output at ${target}`);
