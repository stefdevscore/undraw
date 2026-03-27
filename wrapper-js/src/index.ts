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
  CDN = 'https://cdn.undraw.co/illustration';

const fetchPage = async (bid: string, p: number) => {
  const url =
    p === 1
      ? `${BASE}/_next/data/${bid}/illustrations.json`
      : `${BASE}/_next/data/${bid}/illustrations/${p}.json?page=${p}`;
  const res = await fetch(url);
  return res.ok ? ((await res.json()) as any).pageProps.illustrations : null;
};

const loadInv = () => {
  if (!COMPRESSED_INVENTORY) return null;
  return JSON.parse(zlib.gunzipSync(Buffer.from(COMPRESSED_INVENTORY, 'base64')).toString());
};

const print = (items: string[][], title: string) => {
  if (!items.length) return console.log(chalk.red('No illustrations found.'));
  console.log(chalk.green(`\n${title} (${items.length}):\n${chalk.gray('─'.repeat(50))}`));
  items.forEach((i) => console.log(`${chalk.bold(i[1].padEnd(30))} id: ${chalk.cyan(i[0])}`));
  console.log(chalk.gray('─'.repeat(50)) + '\n');
};

program.name('undraw').description('CLI for unDraw illustrations').version('1.0.35');

program
  .command('sync')
  .description('Sync library to embedded storage')
  .action(async () => {
    const s = ora('Syncing...').start();
    try {
      const bid = (await (await fetch(BASE)).text()).match(/"buildId":"([^"]+)"/)?.[1];
      if (!bid) throw new Error('No buildId');
      const all: string[][] = [];
      for (let p = 1; ; p++) {
        s.text = `Fetching page ${p}... (${all.length} items)`;
        const imgs = await fetchPage(bid, p);
        if (!imgs?.length) break;
        imgs.forEach((i: any) => all.push([i.newSlug, i.title]));
      }
      const b64 = zlib.gzipSync(JSON.stringify(all)).toString('base64');
      await fs.writeFile(
        path.resolve(process.cwd(), 'src/inventory-data.ts'),
        `export const COMPRESSED_INVENTORY = "${b64}";\n`
      );
      s.succeed(chalk.green(`Synced ${all.length} items. Rebuild to apply.`));
    } catch (e: any) {
      s.fail(chalk.red(e.message));
    }
  });

program
  .command('list')
  .description('List/Search illustrations')
  .argument('[query]', 'search query')
  .option('-p, --page <n>', 'page', '1')
  .action(async (q, o) => {
    const inv = loadInv();
    if (!inv) return console.log(chalk.yellow('Run "undraw sync" first.'));
    const filtered = q ? inv.filter((i: any) => i[1].toLowerCase().includes(q.toLowerCase())) : inv;
    const p = parseInt(o.page, 10),
      start = (p - 1) * 20,
      items = filtered.slice(start, start + 20);
    print(items, q ? `Search: ${q}` : `Page ${p}/${Math.ceil(filtered.length / 20)}`);
  });

program
  .command('download')
  .description('Download SVG')
  .argument('<id>')
  .option('-c, --color <hex>', 'color', '#6c63ff')
  .option('-o, --out <path>', 'out', '.')
  .action(async (id, o) => {
    const s = ora(`Downloading ${id}...`).start();
    try {
      const res = await fetch(`${CDN}/${id}.svg`);
      if (!res.ok) throw new Error('Not found');
      let svg = await res.text();
      if (o.color !== '#6c63ff') svg = svg.split('#6c63ff').join(o.color);
      await fs.writeFile(path.resolve(o.out, `${id}.svg`), svg);
      s.succeed(chalk.green(`Saved to ${o.out}/${id}.svg`));
    } catch (e: any) {
      s.fail(chalk.red(e.message));
    }
  });

program.parse();
