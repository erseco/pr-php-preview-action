import fs from 'node:fs';
import path from 'node:path';

const actionFile = path.resolve(new URL('../action.yml', import.meta.url).pathname);
const actionExists = fs.existsSync(actionFile);
if (!actionExists) {
  throw new Error('action.yml is missing');
}

const packageLockExists = fs.existsSync(path.resolve(new URL('../package-lock.json', import.meta.url).pathname));

process.stdout.write(`action.yml present at ${actionFile}\n`);
process.stdout.write(`package-lock present: ${packageLockExists}\n`);
