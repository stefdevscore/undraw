import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('unDraw CLI', () => {
  it('should display help message', () => {
    const output = execSync('node dist/index.js --help').toString();
    expect(output).toContain('Usage: undraw [options] [command]');
    expect(output).toContain('sync');
    expect(output).toContain('list');
    expect(output).toContain('download');
  });

  it('should list/search for illustrations (requires inventory)', () => {
    const output = execSync('node dist/index.js list astronomy').toString();
    expect(output).toContain('Search: astronomy');
    expect(output).toContain('astronomy_ied1');
  });
});
