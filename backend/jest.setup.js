// Increase default Jest timeouts for mongodb-memory-server startup on slower CI/macOS (ESM context)
import { jest } from '@jest/globals';
jest.setTimeout(30000);
