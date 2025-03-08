import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import fs from 'fs';

if (!process.env.NODE_ENV) {
  throw Error('NODE_ENV environment variable missing');
} else {
  const envPath = `./env/.env.${process.env.NODE_ENV}`;
  try {
    fs.accessSync(envPath);
  } catch (err) {
    console.error('.env file not found: ' + envPath);
  }
  dotenvExpand.expand(dotenv.config({ path: envPath }));
}
