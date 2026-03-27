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
from .inventory import load_inventory, COMPRESSED_INVENTORY

console = Console()

BASE_URL = 'https://undraw.co'
CDN_URL = 'https://cdn.undraw.co/illustration'

def fetch_url(url: str) -> bytes:
    req = urllib.request.Request(url, headers={'User-Agent': 'undraw-py/1.0.37'})
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

@click.group()
@click.version_option(version="1.0.36")
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
                    all_items.append([i['newSlug'], i['title']])
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
            console.print(f"[red]Error: {str(e)}[/]")

@cli.command()
@click.argument('query', required=False)
@click.option('--page', '-p', default=1, help='Page number (20 items per page)')
def list(query, page):
    """List or search illustrations."""
    inv = load_inventory()
    if not inv:
        console.print("[yellow]Inventory not found. Run 'undraw sync' first.[/]")
        return

    filtered = inv
    if query:
        query = query.lower()
        filtered = [i for i in inv if query in i[1].lower()]

    total_pages = (len(filtered) + 19) // 20
    start = (page - 1) * 20
    items = filtered[start:start+20]

    if not items:
        console.print("[red]No illustrations found.[/]")
        return

    table = Table(title=f"Search: {query}" if query else f"Page {page}/{total_pages} ({len(filtered)} items)")
    table.add_column("Title", style="bold green")
    table.add_column("ID", style="cyan")

    for id, title in items:
        table.add_row(title, id)

    console.print(table)

@cli.command()
@click.argument('id')
@click.option('--color', '-c', default='#6c63ff', help='Custom hex color')
@click.option('--out', '-o', default='.', help='Output directory')
def download(id, color, out):
    """Download an SVG illustration."""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
    ) as progress:
        progress.add_task(f"Downloading {id}...", total=None)
        try:
            url = f"{CDN_URL}/{id}.svg"
            svg = fetch_url(url).decode('utf-8')
            
            if color != '#6c63ff':
                svg = svg.replace('#6c63ff', color)
            
            os.makedirs(out, exist_ok=True)
            filename = os.path.join(out, f"{id}.svg")
            with open(filename, 'w') as f:
                f.write(svg)
            
            console.print(f"[green]Saved to {filename}[/]")
        except Exception as e:
            console.print(f"[red]Error: {str(e)}[/]")

if __name__ == '__main__':
    cli()
