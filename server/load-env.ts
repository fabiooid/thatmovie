import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Optional local .env for laptop runs. Cursor Cloud secrets are already in
// process.env; Node's loadEnvFile does not overwrite existing variables.
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
