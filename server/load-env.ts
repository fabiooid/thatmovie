import { existsSync } from 'node:fs';
import { join } from 'node:path';

const candidates = [
  join(process.cwd(), '.env'),
  join(process.cwd(), '..', '.env'),
];

for (const envPath of candidates) {
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
    break;
  }
}
