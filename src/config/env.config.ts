import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import fs from 'fs';
import path from 'path';

if (!process.env.NODE_ENV) {
  throw Error('NODE_ENV environment variable missing');
} else {
  const envPath = path.resolve(
    process.cwd(),
    'env',
    `.env.${process.env.NODE_ENV}`,
  );

  try {
    fs.accessSync(envPath);
  } catch (err) {
    console.error('.env file not found: ' + envPath);
  }
  dotenvExpand.expand(dotenv.config({ path: envPath }));
}
