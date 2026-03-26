import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('unDraw CLI', () => {
  it('should display help message', () => {
    const output = execSync('node dist/index.js --help').toString();
    expect(output).toContain('Usage: undraw [options] [command]');
    expect(output).toContain('sync');
    expect(output).toContain('search');
    expect(output).toContain('list');
    expect(output).toContain('download');
  });

  it('should search for illustrations (requires inventory)', () => {
    // This assumes 'undraw sync' has been run during the audit
    const output = execSync('node dist/index.js search astronomy').toString();
    expect(output).toContain('Found 1 matches');
    expect(output).toContain('astronomy_ied1');
  });
});
