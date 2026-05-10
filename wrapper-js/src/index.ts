#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import chalk from 'chalk';
import ora from 'ora';
import { COMPRESSED_INVENTORY } from './inventory-data.js';

const program = new Command(),
  BASE = 'https://undraw.co',
  CDN = 'https://cdn.undraw.co';

type InventoryItem = {
  id: string;
  title: string;
  svg_url: string;
};

const SCHEMA_VERSION = 1,
  PER_PAGE = 20,
  DEFAULT_COLOR = '#6c63ff';

const fetchPage = async (bid: string, p: number) => {
  const url =
    p === 1
      ? `${BASE}/_next/data/${bid}/illustrations.json`
      : `${BASE}/_next/data/${bid}/illustrations/${p}.json?page=${p}`;
  const res = await fetch(url);
  return res.ok ? ((await res.json()) as any).pageProps.illustrations : null;
};

const fallbackUrl = (id: string, pathPart = 'illustration') => `${CDN}/${pathPart}/${id}.svg`;

const normalizeItem = (item: unknown): InventoryItem | null => {
  if (Array.isArray(item) && typeof item[0] === 'string' && typeof item[1] === 'string') {
    return { id: item[0], title: item[1], svg_url: fallbackUrl(item[0]) };
  }
  if (item && typeof item === 'object') {
    const record = item as Partial<InventoryItem> & { media?: string; newSlug?: string };
    const id = record.id ?? record.newSlug;
    const svgUrl = record.svg_url ?? record.media;
    if (typeof id === 'string' && typeof record.title === 'string' && typeof svgUrl === 'string') {
      return { id, title: record.title, svg_url: svgUrl };
    }
  }
  return null;
};

const loadInv = (): InventoryItem[] | null => {
  if (!COMPRESSED_INVENTORY) return null;
  const parsed = JSON.parse(zlib.gunzipSync(Buffer.from(COMPRESSED_INVENTORY, 'base64')).toString()) as unknown[];
  return parsed.map(normalizeItem).filter((item): item is InventoryItem => item !== null);
};

const print = (items: InventoryItem[], title: string) => {
  if (!items.length) return console.log(chalk.red('No illustrations found.'));
  console.log(chalk.green(`\n${title} (${items.length}):\n${chalk.gray('─'.repeat(50))}`));
  items.forEach((i) => console.log(`${chalk.bold(i.title.padEnd(30))} id: ${chalk.cyan(i.id)}`));
  console.log(chalk.gray('─'.repeat(50)) + '\n');
};

const printJson = (query: string | undefined, page: number, filtered: InventoryItem[], items: InventoryItem[]) => {
  console.log(
    JSON.stringify({
      schema_version: SCHEMA_VERSION,
      query: query ?? null,
      page,
      per_page: PER_PAGE,
      total: filtered.length,
      total_pages: Math.ceil(filtered.length / PER_PAGE),
      items: items.map(({ id, title, svg_url }) => ({ id, title, svg_url })),
    })
  );
};

const printJsonError = (error: string, extra: Record<string, unknown> = {}) => {
  console.log(JSON.stringify({ schema_version: SCHEMA_VERSION, error, ...extra }));
};

const fail = (json: boolean, error: string, message: string, extra: Record<string, unknown> = {}) => {
  if (json) printJsonError(error, extra);
  else console.error(chalk.red(message));
  process.exitCode = 1;
};

const parsePage = (value: string) => {
  const page = Number.parseInt(value, 10);
  return Number.isInteger(page) ? page : Number.NaN;
};

const fetchSvg = async (id: string, item: InventoryItem | undefined) => {
  const urls = item ? [item.svg_url] : [fallbackUrl(id), fallbackUrl(id, 'illustrations')];
  let lastError = 'Not found';
  for (const url of urls) {
    const res = await fetch(url);
    if (res.ok) return { url, svg: await res.text() };
    lastError = `${res.status} ${res.statusText}`.trim();
  }
  throw new Error(lastError);
};

const VERSION = '1.0.40';

program.name('undraw').description('CLI for unDraw illustrations').version(VERSION);

program
  .command('sync')
  .description('Sync library to embedded storage')
  .action(async () => {
    const s = ora('Syncing...').start();
    try {
      const bid = (await (await fetch(BASE)).text()).match(/"buildId":"([^"]+)"/)?.[1];
      if (!bid) throw new Error('No buildId');
      const all: InventoryItem[] = [];
      for (let p = 1; ; p++) {
        s.text = `Fetching page ${p}... (${all.length} items)`;
        const imgs = await fetchPage(bid, p);
        if (!imgs?.length) break;
        imgs.forEach((i: any) => {
          const item = normalizeItem(i);
          if (item) all.push(item);
        });
      }
      const b64 = zlib.gzipSync(JSON.stringify(all)).toString('base64');
      await fs.writeFile(
        path.resolve(process.cwd(), 'src/inventory-data.ts'),
        `export const COMPRESSED_INVENTORY = "${b64}";\n`
      );
      s.succeed(chalk.green(`Synced ${all.length} items. Rebuild to apply.`));
    } catch (e: any) {
      s.fail(chalk.red(e.message));
      process.exitCode = 1;
    }
  });

program
  .command('list')
  .description('List/Search illustrations')
  .argument('[query]', 'search query')
  .option('-p, --page <n>', 'page', '1')
  .option('--json', 'emit machine-readable JSON')
  .action(async (q, o) => {
    const p = parsePage(o.page);
    if (!Number.isInteger(p) || p < 1) {
      fail(o.json, 'invalid_page', 'Page must be greater than or equal to 1.', { page: Number.isNaN(p) ? o.page : p });
      return;
    }
    const inv = loadInv();
    if (!inv) {
      if (o.json) {
        fail(o.json, 'inventory_not_found', 'Run "undraw sync" first.', {
          query: q ?? null,
          page: p,
          per_page: PER_PAGE,
          total: 0,
          total_pages: 0,
          items: [],
        });
        return;
      }
      fail(o.json, 'inventory_not_found', 'Run "undraw sync" first.');
      return;
    }
    const filtered = q ? inv.filter((i) => i.title.toLowerCase().includes(q.toLowerCase())) : inv;
    const start = (p - 1) * PER_PAGE,
      items = filtered.slice(start, start + PER_PAGE);
    if (o.json) return printJson(q, p, filtered, items);
    print(items, q ? `Search: ${q}` : `Page ${p}/${Math.ceil(filtered.length / PER_PAGE)}`);
  });

program
  .command('download')
  .description('Download SVG')
  .argument('<id>')
  .option('-c, --color <hex>', 'color', DEFAULT_COLOR)
  .option('-o, --out <path>', 'out', '.')
  .option('--json', 'emit machine-readable JSON')
  .action(async (id, o) => {
    const s = o.json ? null : ora(`Downloading ${id}...`).start();
    try {
      const inv = loadInv() ?? [];
      const item = inv.find((candidate) => candidate.id === id);
      const result = await fetchSvg(id, item);
      let svg = result.svg;
      if (o.color !== DEFAULT_COLOR) svg = svg.split(DEFAULT_COLOR).join(o.color);
      await fs.mkdir(path.resolve(o.out), { recursive: true });
      const filename = path.resolve(o.out, `${id}.svg`);
      await fs.writeFile(filename, svg);
      const manifest = {
        schema_version: SCHEMA_VERSION,
        id,
        title: item?.title ?? null,
        svg_url: result.url,
        path: filename,
        color: o.color,
        bytes: Buffer.byteLength(svg),
      };
      if (o.json) console.log(JSON.stringify(manifest));
      else s?.succeed(chalk.green(`Saved to ${filename}`));
    } catch (e: any) {
      s?.fail(chalk.red(e.message));
      fail(o.json, 'download_failed', e.message, { id, message: e.message });
    }
  });

program.parse();
