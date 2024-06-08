import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  verbose: true,
  moduleFileExtensions: ["js", "ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  }
};

export default config;