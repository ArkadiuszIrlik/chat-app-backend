/** @type {import('ts-jest').JestConfigWithTsJest} */
import { pathsToModuleNameMapper } from 'ts-jest';
import fs from 'fs/promises';
import json5 from 'json5';

const tsconfig = await fs.readFile('./tsconfig.json');
const { compilerOptions } = json5.parse(tsconfig);

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>',
    useESM: true,
  }),
};
