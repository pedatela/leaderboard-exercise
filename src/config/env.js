import { loadEnvFile } from 'node:process';

try {
  // Resolve from the project root even when a script is started elsewhere.
  // Variables supplied by the shell or Docker take precedence over this file.
  loadEnvFile(new URL('../../.env', import.meta.url));
} catch (error) {
  // Containers receive their environment directly and do not contain .env files.
  if (error.code !== 'ENOENT') throw error;
}
