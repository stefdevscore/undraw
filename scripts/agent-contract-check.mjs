#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const BASE_URL = 'https://undraw.co';
const CDN_URL = 'https://cdn.undraw.co';
const SCHEMA_VERSION = 1;
const DEFAULT_SAMPLE_SIZE = 8;

const args = process.argv.slice(2);
const human = args.includes('--human');
const sampleSizeFlag = args.findIndex((arg) => arg === '--sample-size');
const sampleSize =
  sampleSizeFlag >= 0 && args[sampleSizeFlag + 1]
    ? Number.parseInt(args[sampleSizeFlag + 1], 10)
    : DEFAULT_SAMPLE_SIZE;

const fallbackSvgUrl = (id, pathPart = 'illustration') => `${CDN_URL}/${pathPart}/${id}.svg`;

const normalizeItem = (item) => {
  if (Array.isArray(item) && typeof item[0] === 'string' && typeof item[1] === 'string') {
    return { id: item[0], title: item[1], svg_url: fallbackSvgUrl(item[0]) };
  }

  if (item && typeof item === 'object') {
    const id = item.id ?? item.newSlug;
    const svgUrl = item.svg_url ?? item.media;
    if (typeof id === 'string' && typeof item.title === 'string' && typeof svgUrl === 'string') {
      return { id, title: item.title, svg_url: svgUrl };
    }
  }

  return null;
};

const fetchText = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': 'undraw-agent-contract-check/1' } });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.text();
};

const fetchJson = async (url) => JSON.parse(await fetchText(url));

const fetchLiveInventory = async () => {
  const html = await fetchText(BASE_URL);
  const buildId = html.match(/"buildId":"([^"]+)"/)?.[1];
  if (!buildId) throw new Error('Could not find unDraw buildId');

  const items = [];
  for (let page = 1; ; page += 1) {
    const url =
      page === 1
        ? `${BASE_URL}/_next/data/${buildId}/illustrations.json`
        : `${BASE_URL}/_next/data/${buildId}/illustrations/${page}.json?page=${page}`;

    let data;
    try {
      data = await fetchJson(url);
    } catch {
      break;
    }

    const pageItems = data?.pageProps?.illustrations;
    if (!Array.isArray(pageItems) || pageItems.length === 0) break;

    for (const raw of pageItems) {
      const item = normalizeItem(raw);
      if (item) items.push(item);
    }
  }

  return { build_id: buildId, items };
};

const readCompressedInventory = async (file, pattern) => {
  const content = await fs.readFile(path.join(root, file), 'utf8');
  const compressed = content.match(pattern)?.[1];
  if (!compressed) throw new Error(`Could not find COMPRESSED_INVENTORY in ${file}`);
  const raw = zlib.gunzipSync(Buffer.from(compressed, 'base64')).toString('utf8');
  return JSON.parse(raw).map(normalizeItem).filter(Boolean);
};

const compareInventory = (liveItems, embeddedItems) => {
  const liveById = new Map(liveItems.map((item) => [item.id, item]));
  const embeddedById = new Map(embeddedItems.map((item) => [item.id, item]));
  const missing_ids = liveItems.filter((item) => !embeddedById.has(item.id)).map((item) => item.id);
  const stale_ids = embeddedItems.filter((item) => !liveById.has(item.id)).map((item) => item.id);
  const url_mismatches = embeddedItems
    .filter((item) => liveById.has(item.id) && liveById.get(item.id).svg_url !== item.svg_url)
    .map((item) => ({
      id: item.id,
      embedded: item.svg_url,
      live: liveById.get(item.id).svg_url,
    }));

  return {
    count: embeddedItems.length,
    missing_ids,
    stale_ids,
    url_mismatches,
    ok: missing_ids.length === 0 && stale_ids.length === 0 && url_mismatches.length === 0,
  };
};

const selectSamples = (items) => {
  const preferred = ['astronomy_ied1', 'social-tree_p8cw'];
  const byId = new Map(items.map((item) => [item.id, item]));
  const selected = preferred.map((id) => byId.get(id)).filter(Boolean);

  for (const item of items) {
    if (selected.length >= sampleSize) break;
    if (!selected.some((candidate) => candidate.id === item.id)) selected.push(item);
  }

  return selected;
};

const validateSvgUrls = async (items) => {
  const results = [];
  for (const item of selectSamples(items)) {
    try {
      const res = await fetch(item.svg_url, { headers: { 'User-Agent': 'undraw-agent-contract-check/1' } });
      const body = res.ok ? await res.text() : '';
      results.push({
        id: item.id,
        svg_url: item.svg_url,
        status: res.status,
        bytes: Buffer.byteLength(body),
        ok: res.ok && body.includes('<svg'),
      });
    } catch (error) {
      results.push({
        id: item.id,
        svg_url: item.svg_url,
        status: null,
        bytes: 0,
        ok: false,
        error: error.message,
      });
    }
  }
  return results;
};

const run = (command, commandArgs, options = {}) => {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd ?? root,
    env: { ...process.env, ...(options.env ?? {}) },
    encoding: 'utf8',
    timeout: 45000,
  });

  return {
    command: [command, ...commandArgs].join(' '),
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error?.message,
  };
};

const parseJson = (text) => {
  try {
    return { value: JSON.parse(text), error: null };
  } catch (error) {
    return { value: null, error: error.message };
  }
};

const commandExists = (command) => run(command, ['--version']).status === 0;

const findPython = () => {
  const candidates = [
    process.env.PYTHON,
    process.env.VIRTUAL_ENV ? path.join(process.env.VIRTUAL_ENV, 'bin', 'python') : null,
    'python3.13',
    'python3.12',
    'python3',
  ].filter(Boolean);

  return candidates.find(commandExists);
};

const canRunPythonSource = (python) => {
  if (!python) return false;
  const result = run(python, ['-c', 'import click, rich'], {
    env: { PYTHONPATH: path.join(root, 'wrapper-py', 'src') },
  });
  return result.status === 0;
};

const localCliTargets = (python) => {
  const targets = [];
  const jsDist = path.join(root, 'wrapper-js', 'dist', 'index.js');
  const rustDebug = path.join(root, 'core-rs', 'target', 'debug', 'undraw-rs');
  const rustRelease = path.join(root, 'core-rs', 'target', 'release', 'undraw-rs');

  targets.push(
    existsSync(jsDist)
      ? {
          name: 'js',
          available: true,
          run: (commandArgs) => run('node', [jsDist, ...commandArgs]),
        }
      : { name: 'js', available: false, reason: 'wrapper-js/dist/index.js not found' }
  );

  const rustBinary = existsSync(rustDebug) ? rustDebug : existsSync(rustRelease) ? rustRelease : null;
  targets.push(
    rustBinary
      ? {
          name: 'rust',
          available: true,
          run: (commandArgs) => run(rustBinary, commandArgs),
        }
      : { name: 'rust', available: false, reason: 'core-rs target binary not found' }
  );

  targets.push(
    canRunPythonSource(python)
      ? {
          name: 'python',
          available: true,
          run: (commandArgs) =>
            run(python, ['-m', 'undraw.cli', ...commandArgs], {
              env: { PYTHONPATH: path.join(root, 'wrapper-py', 'src') },
            }),
        }
      : { name: 'python', available: false, reason: 'Python source dependencies not available' }
  );

  return targets;
};

const validateCli = async (target, id) => {
  if (!target.available) return { name: target.name, status: 'skipped', reason: target.reason };

  const checks = [];
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), `undraw-contract-${target.name}-`));

  const list = target.run(['list', 'astronomy', '--json']);
  const listJson = parseJson(list.stdout);
  checks.push({
    name: 'list_json',
    ok:
      list.status === 0 &&
      listJson.value?.schema_version === SCHEMA_VERSION &&
      Array.isArray(listJson.value?.items) &&
      listJson.value.items.some((item) => item.id === 'astronomy_ied1' && typeof item.svg_url === 'string'),
    command: list.command,
    status: list.status,
    error: listJson.error ?? list.error ?? null,
  });

  const download = target.run(['download', id, '--json', '--out', outDir]);
  const downloadJson = parseJson(download.stdout);
  const expectedPath = path.join(outDir, `${id}.svg`);
  checks.push({
    name: 'download_json',
    ok:
      download.status === 0 &&
      downloadJson.value?.schema_version === SCHEMA_VERSION &&
      downloadJson.value?.id === id &&
      typeof downloadJson.value?.svg_url === 'string' &&
      downloadJson.value?.path === expectedPath &&
      downloadJson.value?.bytes > 0 &&
      existsSync(expectedPath),
    command: download.command,
    status: download.status,
    error: downloadJson.error ?? download.error ?? null,
  });

  const invalidPage = target.run(['list', 'astronomy', '--page', '0', '--json']);
  const invalidPageJson = parseJson(invalidPage.stdout);
  checks.push({
    name: 'invalid_page_json',
    ok:
      invalidPage.status !== 0 &&
      invalidPageJson.value?.schema_version === SCHEMA_VERSION &&
      invalidPageJson.value?.error === 'invalid_page',
    command: invalidPage.command,
    status: invalidPage.status,
    error: invalidPageJson.error ?? invalidPage.error ?? null,
  });

  const missing = target.run(['download', 'definitely_missing_asset_zzzz', '--json', '--out', outDir]);
  const missingJson = parseJson(missing.stdout);
  checks.push({
    name: 'missing_download_json',
    ok:
      missing.status !== 0 &&
      missingJson.value?.schema_version === SCHEMA_VERSION &&
      missingJson.value?.error === 'download_failed',
    command: missing.command,
    status: missing.status,
    error: missingJson.error ?? missing.error ?? null,
  });

  return {
    name: target.name,
    status: checks.every((check) => check.ok) ? 'passed' : 'failed',
    checks,
  };
};

const renderHuman = (result) => {
  const lines = [];
  lines.push(`Agent contract check: ${result.ok ? 'PASS' : 'FAIL'}`);
  lines.push(`Live unDraw: ${result.live.count} items, build ${result.live.build_id}`);
  for (const [name, embedded] of Object.entries(result.embedded)) {
    lines.push(
      `${name}: ${embedded.count} embedded, ${embedded.missing_ids.length} missing, ` +
        `${embedded.stale_ids.length} stale, ${embedded.url_mismatches.length} URL mismatches`
    );
  }
  const failedUrls = result.svg_url_sample.filter((item) => !item.ok);
  lines.push(`SVG URL sample: ${result.svg_url_sample.length} checked, ${failedUrls.length} failed`);
  for (const check of result.cli_checks) {
    lines.push(`CLI ${check.name}: ${check.status}`);
    if (check.checks) {
      for (const subcheck of check.checks) {
        lines.push(`  - ${subcheck.name}: ${subcheck.ok ? 'pass' : 'fail'}`);
      }
    }
  }
  return lines.join('\n');
};

const main = async () => {
  const live = await fetchLiveInventory();
  const embeddedSources = {
    js: await readCompressedInventory('wrapper-js/src/inventory-data.ts', /COMPRESSED_INVENTORY\s*=\s*"([^"]+)"/),
    python: await readCompressedInventory('wrapper-py/src/undraw/inventory.py', /COMPRESSED_INVENTORY\s*=\s*['"]([^'"]+)['"]/),
    rust: await readCompressedInventory('core-rs/src/inventory.rs', /COMPRESSED_INVENTORY:\s*&str\s*=\s*"([^"]+)"/),
  };

  const embedded = Object.fromEntries(
    Object.entries(embeddedSources).map(([name, items]) => [name, compareInventory(live.items, items)])
  );
  const svgUrlSample = await validateSvgUrls(live.items);
  const sampleId = live.items.find((item) => item.id === 'astronomy_ied1')?.id ?? live.items[0]?.id;
  const python = findPython();
  const cliChecks = [];
  for (const target of localCliTargets(python)) {
    cliChecks.push(await validateCli(target, sampleId));
  }

  const result = {
    schema_version: SCHEMA_VERSION,
    ok:
      Object.values(embedded).every((item) => item.ok) &&
      svgUrlSample.every((item) => item.ok) &&
      cliChecks.every((check) => check.status !== 'failed'),
    live: { build_id: live.build_id, count: live.items.length },
    embedded,
    svg_url_sample: svgUrlSample,
    cli_checks: cliChecks,
  };

  if (human) console.log(renderHuman(result));
  else console.log(JSON.stringify(result, null, 2));

  if (!result.ok) process.exitCode = 1;
};

main().catch((error) => {
  const payload = {
    schema_version: SCHEMA_VERSION,
    ok: false,
    error: error.message,
  };
  if (human) console.error(`Agent contract check: FAIL\n${error.message}`);
  else console.log(JSON.stringify(payload, null, 2));
  process.exitCode = 1;
});
