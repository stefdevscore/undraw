use base64::{engine::general_purpose, Engine as _};
use clap::{Parser, Subcommand};
use colored::*;
use indicatif::ProgressBar;
use regex::Regex;
use serde::Serialize;
use serde_json::{json, Value};
use std::fs;
use std::io::Read;
use std::path::Path;

mod inventory;
use inventory::{fallback_svg_url, load_inventory, InventoryItem};

const BASE_URL: &str = "https://undraw.co";
const DEFAULT_COLOR: &str = "#6c63ff";
const PER_PAGE: usize = 20;
const SCHEMA_VERSION: u8 = 1;
const USER_AGENT: &str = "undraw-rs/1.0.40";

#[derive(Parser)]
#[command(author, version = "1.0.40", about = "CLI for unDraw illustrations", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Sync library to embedded storage
    Sync {},
    /// List or search illustrations
    List {
        /// Search keyword
        query: Option<String>,
        /// Page number (20 items per page)
        #[arg(short, long, default_value_t = 1)]
        page: usize,
        /// Emit machine-readable JSON
        #[arg(long)]
        json: bool,
    },
    /// Download an SVG illustration
    Download {
        /// Illustration ID (slug)
        id: String,
        /// Custom hex color (e.g. #ff0077)
        #[arg(short, long, default_value = DEFAULT_COLOR)]
        color: String,
        /// Output directory
        #[arg(short, long, default_value = ".")]
        out: String,
        /// Emit machine-readable JSON
        #[arg(long)]
        json: bool,
    },
}

#[derive(Serialize)]
struct ListItem {
    id: String,
    title: String,
    svg_url: String,
}

#[derive(Serialize)]
struct ListOutput {
    schema_version: u8,
    query: Option<String>,
    page: usize,
    per_page: usize,
    total: usize,
    total_pages: usize,
    items: Vec<ListItem>,
}

#[derive(Serialize)]
struct DownloadOutput {
    schema_version: u8,
    id: String,
    title: Option<String>,
    svg_url: String,
    path: String,
    color: String,
    bytes: usize,
}

fn fetch_url(url: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let mut bytes = Vec::new();
    ureq::get(url)
        .set("User-Agent", USER_AGENT)
        .call()?
        .into_reader()
        .read_to_end(&mut bytes)?;
    Ok(bytes)
}

fn emit_json_error(error: &str, payload: Value) -> Result<(), Box<dyn std::error::Error>> {
    let mut output = serde_json::Map::new();
    output.insert("schema_version".to_string(), json!(SCHEMA_VERSION));
    output.insert("error".to_string(), json!(error));
    if let Some(extra) = payload.as_object() {
        for (key, value) in extra {
            output.insert(key.clone(), value.clone());
        }
    }
    println!("{}", Value::Object(output));
    Ok(())
}

fn fetch_svg(
    id: &str,
    item: Option<&InventoryItem>,
) -> Result<(String, String), Box<dyn std::error::Error>> {
    let urls = if let Some(item) = item {
        vec![item.svg_url.clone()]
    } else {
        vec![
            fallback_svg_url(id, "illustration"),
            fallback_svg_url(id, "illustrations"),
        ]
    };

    let mut last_error = String::from("not found");
    for url in urls {
        match fetch_url(&url) {
            Ok(bytes) => return Ok((url, String::from_utf8(bytes)?)),
            Err(error) => last_error = error.to_string(),
        }
    }

    Err(last_error.into())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Sync {} => {
            println!("{}", "Syncing...".cyan());
            let html = String::from_utf8(fetch_url(BASE_URL)?)?;
            let re = Regex::new(r#""buildId":"([^"]+)""#)?;
            let build_id = re
                .captures(&html)
                .and_then(|cap| cap.get(1))
                .ok_or("Could not find buildId")?
                .as_str();

            let mut all_items: Vec<InventoryItem> = Vec::new();
            let mut page = 1;
            loop {
                print!("\rFetching page {}... ({} items)", page, all_items.len());
                let url = if page == 1 {
                    format!("{}/_next/data/{}/illustrations.json", BASE_URL, build_id)
                } else {
                    format!(
                        "{}/_next/data/{}/illustrations/{}.json?page={}",
                        BASE_URL, build_id, page, page
                    )
                };

                let resp = fetch_url(&url);
                if resp.is_err() {
                    break;
                }
                let data: Value = serde_json::from_slice(&resp?)?;
                let imgs = data["pageProps"]["illustrations"].as_array();

                if let Some(imgs) = imgs {
                    if imgs.is_empty() {
                        break;
                    }
                    for i in imgs {
                        if let (Some(id), Some(title)) =
                            (i["newSlug"].as_str(), i["title"].as_str())
                        {
                            let svg_url = i["media"]
                                .as_str()
                                .map(str::to_string)
                                .unwrap_or_else(|| fallback_svg_url(id, "illustration"));
                            all_items.push(InventoryItem {
                                id: id.to_string(),
                                title: title.to_string(),
                                svg_url,
                            });
                        }
                    }
                } else {
                    break;
                }
                page += 1;
            }
            println!();

            let json_data = serde_json::to_string(&all_items)?;
            let mut encoder =
                flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::default());
            std::io::Write::write_all(&mut encoder, json_data.as_bytes())?;
            let compressed = encoder.finish()?;
            let b64 = general_purpose::STANDARD.encode(compressed);

            // Update inventory.rs
            let inv_path = Path::new("src/inventory.rs");
            let content = fs::read_to_string(inv_path)?;
            let re_inv = Regex::new(r#"pub const COMPRESSED_INVENTORY: &str = "[^"]+";"#)?;
            let new_content = re_inv.replace(
                &content,
                format!(r#"pub const COMPRESSED_INVENTORY: &str = "{}";"#, b64),
            );
            fs::write(inv_path, new_content.to_string())?;

            println!(
                "{}",
                format!(
                    "Synced {} items. Rebuild to apply changes.",
                    all_items.len()
                )
                .green()
            );
        }
        Commands::List { query, page, json } => {
            if *page < 1 {
                if *json {
                    emit_json_error("invalid_page", json!({ "page": page }))?;
                    std::process::exit(1);
                }
                return Err("Page must be greater than or equal to 1".into());
            }

            let inv = match load_inventory() {
                Some(inv) => inv,
                None => {
                    if *json {
                        emit_json_error(
                            "inventory_not_found",
                            json!({
                                "query": query,
                                "page": page,
                                "per_page": PER_PAGE,
                                "total": 0,
                                "total_pages": 0,
                                "items": []
                            }),
                        )?;
                        std::process::exit(1);
                    }
                    return Err("Inventory not found. Run 'sync' first.".into());
                }
            };
            let filtered: Vec<_> = if let Some(q) = query {
                let q = q.to_lowercase();
                inv.into_iter()
                    .filter(|i| i.title.to_lowercase().contains(&q))
                    .collect()
            } else {
                inv
            };

            let total_pages = (filtered.len() + PER_PAGE - 1) / PER_PAGE;
            let start = (page - 1) * PER_PAGE;
            let items: Vec<_> = filtered.iter().skip(start).take(PER_PAGE).collect();

            if *json {
                let output = ListOutput {
                    schema_version: SCHEMA_VERSION,
                    query: query.clone(),
                    page: *page,
                    per_page: PER_PAGE,
                    total: filtered.len(),
                    total_pages,
                    items: items
                        .iter()
                        .map(|item| ListItem {
                            id: item.id.clone(),
                            title: item.title.clone(),
                            svg_url: item.svg_url.clone(),
                        })
                        .collect(),
                };
                println!("{}", serde_json::to_string(&output)?);
                return Ok(());
            }

            if filtered.is_empty() {
                println!("{}", "No illustrations found.".red());
                return Ok(());
            }

            println!(
                "{}",
                format!("Page {}/{} ({} items)", page, total_pages, filtered.len()).bold()
            );
            println!("{:<30} {:<30}", "Title".green().bold(), "ID".cyan());
            println!("{}", "-".repeat(60));

            for item in items {
                println!("{:<30} {:<30}", item.title, item.id);
            }
        }
        Commands::Download {
            id,
            color,
            out,
            json,
        } => {
            let pb = if *json {
                None
            } else {
                let pb = ProgressBar::new_spinner();
                pb.set_message(format!("Downloading {}...", id));
                pb.enable_steady_tick(std::time::Duration::from_millis(100));
                Some(pb)
            };

            let inv = load_inventory().unwrap_or_default();
            let item = inv.iter().find(|candidate| candidate.id == *id);
            let (url, mut svg) = match fetch_svg(id, item) {
                Ok(result) => result,
                Err(error) => {
                    if *json {
                        emit_json_error(
                            "download_failed",
                            json!({ "id": id, "message": error.to_string() }),
                        )?;
                        std::process::exit(1);
                    }
                    return Err(error);
                }
            };

            if color != DEFAULT_COLOR {
                svg = svg.replace("#6c63ff", color);
            }

            if let Err(error) = fs::create_dir_all(out) {
                if *json {
                    emit_json_error(
                        "download_failed",
                        json!({ "id": id, "message": error.to_string() }),
                    )?;
                    std::process::exit(1);
                }
                return Err(error.into());
            }
            let filename = Path::new(out).join(format!("{}.svg", id));
            if let Err(error) = fs::write(&filename, &svg) {
                if *json {
                    emit_json_error(
                        "download_failed",
                        json!({ "id": id, "message": error.to_string() }),
                    )?;
                    std::process::exit(1);
                }
                return Err(error.into());
            }

            if *json {
                let output = DownloadOutput {
                    schema_version: SCHEMA_VERSION,
                    id: id.clone(),
                    title: item.map(|item| item.title.clone()),
                    svg_url: url,
                    path: filename.to_string_lossy().to_string(),
                    color: color.clone(),
                    bytes: svg.len(),
                };
                println!("{}", serde_json::to_string(&output)?);
            } else if let Some(pb) = pb {
                pb.finish_and_clear();
                println!(
                    "{}",
                    format!("Saved to {}", filename.to_string_lossy()).green()
                );
            }
        }
    }

    Ok(())
}
