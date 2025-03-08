import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
dotenvExpand.expand(
  dotenv.config({ path: `./env/.env.${process.env.NODE_ENV}` }),
);
