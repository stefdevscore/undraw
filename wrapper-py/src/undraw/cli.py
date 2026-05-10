import os
import re
import base64
import gzip
import json
import urllib.request
import click
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from .inventory import COMPRESSED_INVENTORY, fallback_svg_url, load_inventory, normalize_inventory_item

console = Console()

BASE_URL = 'https://undraw.co'
DEFAULT_COLOR = '#6c63ff'
PER_PAGE = 20
SCHEMA_VERSION = 1

def fetch_url(url: str) -> bytes:
    req = urllib.request.Request(url, headers={'User-Agent': 'undraw-py/1.0.40'})
    with urllib.request.urlopen(req) as response:
        return response.read()

def fetch_page(build_id: str, page: int):
    url = (
        f"{BASE_URL}/_next/data/{build_id}/illustrations.json"
        if page == 1
        else f"{BASE_URL}/_next/data/{build_id}/illustrations/{page}.json?page={page}"
    )
    try:
        data = json.loads(fetch_url(url))
        return data.get('pageProps', {}).get('illustrations', [])
    except Exception:
        return None

def emit_json(payload):
    click.echo(json.dumps({"schema_version": SCHEMA_VERSION, **payload}))

def exit_json_error(error: str, **payload):
    emit_json({"error": error, **payload})
    raise click.exceptions.Exit(1)

def fetch_svg(id: str, item):
    urls = [item["svg_url"]] if item else [fallback_svg_url(id), fallback_svg_url(id, "illustrations")]
    last_error = "not found"
    for url in urls:
        try:
            return url, fetch_url(url).decode('utf-8')
        except Exception as exc:
            last_error = str(exc)
    raise RuntimeError(last_error)

@click.group()
@click.version_option(version="1.0.40")
def cli():
    """CLI for unDraw illustrations."""
    pass

@cli.command()
def sync():
    """Sync library to embedded storage."""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
    ) as progress:
        task = progress.add_task("Syncing...", total=None)
        try:
            html = fetch_url(BASE_URL).decode('utf-8')
            match = re.search(r'"buildId":"([^"]+)"', html)
            if not match:
                raise Exception("Could not find buildId")
            build_id = match.group(1)
            
            all_items = []
            page = 1
            while True:
                progress.update(task, description=f"Fetching page {page}... ({len(all_items)} items)")
                imgs = fetch_page(build_id, page)
                if not imgs:
                    break
                for i in imgs:
                    item = normalize_inventory_item(i)
                    if item:
                        all_items.append(item)
                page += 1
            
            b64 = base64.b64encode(gzip.compress(json.dumps(all_items).encode('utf-8'))).decode('utf-8')
            
            # Write back to inventory.py
            # Note: We need to be careful with the file path
            pkg_path = os.path.dirname(os.path.abspath(__file__))
            inv_file = os.path.join(pkg_path, "inventory.py")
            
            with open(inv_file, 'r') as f:
                lines = f.readlines()
            
            with open(inv_file, 'w') as f:
                for line in lines:
                    if line.startswith("COMPRESSED_INVENTORY = "):
                        f.write(f"COMPRESSED_INVENTORY = '{b64}'\n")
                    else:
                        f.write(line)
            
            console.print(f"[green]Synced {len(all_items)} items. Rebuild package to apply changes.[/]")
        except Exception as e:
            raise click.ClickException(str(e))

@cli.command()
@click.argument('query', required=False)
@click.option('--page', '-p', default=1, type=int, help='Page number (20 items per page)')
@click.option('--json', 'json_output', is_flag=True, help='Emit machine-readable JSON')
def list(query, page, json_output):
    """List or search illustrations."""
    if page < 1:
        if json_output:
            exit_json_error("invalid_page", page=page)
        raise click.BadParameter("must be greater than or equal to 1", param_hint="--page")

    inv = load_inventory()
    if not inv:
        if json_output:
            exit_json_error(
                "inventory_not_found",
                query=query,
                page=page,
                per_page=PER_PAGE,
                total=0,
                total_pages=0,
                items=[],
            )
        raise click.ClickException("Inventory not found. Run 'undraw sync' first.")

    filtered = inv
    if query:
        normalized_query = query.lower()
        filtered = [i for i in inv if normalized_query in i["title"].lower()]

    total_pages = (len(filtered) + PER_PAGE - 1) // PER_PAGE
    start = (page - 1) * PER_PAGE
    items = filtered[start:start+PER_PAGE]

    if json_output:
        emit_json({
            "query": query,
            "page": page,
            "per_page": PER_PAGE,
            "total": len(filtered),
            "total_pages": total_pages,
            "items": [
                {"id": item["id"], "title": item["title"], "svg_url": item["svg_url"]}
                for item in items
            ],
        })
        return

    if not items:
        console.print("[red]No illustrations found.[/]")
        return

    table = Table(title=f"Search: {query}" if query else f"Page {page}/{total_pages} ({len(filtered)} items)")
    table.add_column("Title", style="bold green")
    table.add_column("ID", style="cyan")

    for item in items:
        table.add_row(item["title"], item["id"])

    console.print(table)

@cli.command()
@click.argument('id')
@click.option('--color', '-c', default=DEFAULT_COLOR, help='Custom hex color')
@click.option('--out', '-o', default='.', help='Output directory')
@click.option('--json', 'json_output', is_flag=True, help='Emit machine-readable JSON')
def download(id, color, out, json_output):
    """Download an SVG illustration."""
    def run_download():
        inv = load_inventory() or []
        item = next((candidate for candidate in inv if candidate["id"] == id), None)
        url, svg = fetch_svg(id, item)

        if color != DEFAULT_COLOR:
            svg = svg.replace(DEFAULT_COLOR, color)

        os.makedirs(out, exist_ok=True)
        filename = os.path.join(out, f"{id}.svg")
        with open(filename, 'w') as f:
            f.write(svg)
        return item, url, filename, len(svg.encode('utf-8'))

    if json_output:
        try:
            item, url, filename, byte_count = run_download()
            emit_json({
                "id": id,
                "title": item["title"] if item else None,
                "svg_url": url,
                "path": filename,
                "color": color,
                "bytes": byte_count,
            })
        except Exception as e:
            exit_json_error("download_failed", id=id, message=str(e))
        return

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
    ) as progress:
        progress.add_task(f"Downloading {id}...", total=None)
        try:
            _, _, filename, _ = run_download()
            console.print(f"[green]Saved to {filename}[/]")
        except Exception as e:
            raise click.ClickException(str(e))

if __name__ == '__main__':
    cli()
