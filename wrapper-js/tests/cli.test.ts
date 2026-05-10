import { describe, it, expect } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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

  it('should emit structured JSON for list/search results', () => {
    const output = execSync('node dist/index.js list astronomy --json').toString();
    const payload = JSON.parse(output);

    expect(payload).toMatchObject({
      schema_version: 1,
      query: 'astronomy',
      page: 1,
      per_page: 20,
    });
    expect(payload.total).toBeGreaterThanOrEqual(1);
    expect(payload.total_pages).toBeGreaterThanOrEqual(1);
    expect(payload.items).toContainEqual({
      id: 'astronomy_ied1',
      title: 'Astronomy',
      svg_url: expect.stringMatching(/^https:\/\/cdn\.undraw\.co\/illustrations?\//),
    });
  });

  it('should emit a JSON manifest for downloads', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'undraw-js-'));
    const output = execSync(`node dist/index.js download astronomy_ied1 --json --out ${outDir}`).toString();
    const payload = JSON.parse(output);

    expect(payload).toMatchObject({
      schema_version: 1,
      id: 'astronomy_ied1',
      title: 'Astronomy',
      color: '#6c63ff',
      svg_url: expect.stringMatching(/^https:\/\/cdn\.undraw\.co\/illustrations?\//),
    });
    expect(payload.path).toBe(path.join(outDir, 'astronomy_ied1.svg'));
    expect(payload.bytes).toBeGreaterThan(0);
    expect(fs.existsSync(payload.path)).toBe(true);
  });

  it('should reject invalid pages with a non-zero JSON error', () => {
    const result = spawnSync('node', ['dist/index.js', 'list', 'astronomy', '--page', '0', '--json'], {
      encoding: 'utf8',
    });

    expect(result.status).not.toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      schema_version: 1,
      error: 'invalid_page',
      page: 0,
    });
  });

  it('should fail missing downloads with a non-zero exit code', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'undraw-js-missing-'));
    const result = spawnSync(
      'node',
      ['dist/index.js', 'download', 'definitely_missing_asset_zzzz', '--json', '--out', outDir],
      { encoding: 'utf8' }
    );

    expect(result.status).not.toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      schema_version: 1,
      error: 'download_failed',
      id: 'definitely_missing_asset_zzzz',
    });
  });
});
