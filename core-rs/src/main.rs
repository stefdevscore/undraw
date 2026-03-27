use base64::{engine::general_purpose, Engine as _};
use clap::{Parser, Subcommand};
use colored::*;
use flate2::read::GzDecoder;
use indicatif::{ProgressBar, ProgressStyle};
use regex::Regex;
use serde_json::Value;
use std::fs;
use std::io::Read;
use std::path::Path;

mod inventory;
use inventory::load_inventory;

const BASE_URL: &str = "https://undraw.co";
const CDN_URL: &str = "https://cdn.undraw.co/illustration";
const USER_AGENT: &str = "undraw-rs/1.0.37";

#[derive(Parser)]
#[command(author, version = "1.0.37", about = "CLI for unDraw illustrations", long_about = None)]
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
    },
    /// Download an SVG illustration
    Download {
        /// Illustration ID (slug)
        id: String,
        /// Custom hex color (e.g. #ff0077)
        #[arg(short, long, default_value = "#6c63ff")]
        color: String,
        /// Output directory
        #[arg(short, long, default_value = ".")]
        out: String,
    },
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

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Sync {} => {
            println!("{}", "Syncing...".cyan());
            let html = String::from_utf8(fetch_url(BASE_URL)?)?;
            let re = Regex::new(r#""buildId":"([^"]+)""#)?;
            let build_id = re.captures(&html)
                .and_then(|cap| cap.get(1))
                .ok_or("Could not find buildId")?
                .as_str();

            let mut all_items = Vec::new();
            let mut page = 1;
            loop {
                print!("\rFetching page {}... ({} items)", page, all_items.len());
                let url = if page == 1 {
                    format!("{}/_next/data/{}/illustrations.json", BASE_URL, build_id)
                } else {
                    format!("{}/_next/data/{}/illustrations/{}.json?page={}", BASE_URL, build_id, page, page)
                };

                let resp = fetch_url(&url);
                if resp.is_err() { break; }
                let data: Value = serde_json::from_slice(&resp?)?;
                let imgs = data["pageProps"]["illustrations"].as_array();
                
                if let Some(imgs) = imgs {
                    if imgs.is_empty() { break; }
                    for i in imgs {
                        all_items.push(vec![
                            i["newSlug"].as_str().unwrap_or("").to_string(),
                            i["title"].as_str().unwrap_or("").to_string()
                        ]);
                    }
                } else {
                    break;
                }
                page += 1;
            }
            println!();

            let json_data = serde_json::to_string(&all_items)?;
            let mut encoder = flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::default());
            std::io::Write::write_all(&mut encoder, json_data.as_bytes())?;
            let compressed = encoder.finish()?;
            let b64 = general_purpose::STANDARD.encode(compressed);

            // Update inventory.rs
            let inv_path = Path::new("src/inventory.rs");
            let content = fs::read_to_string(inv_path)?;
            let re_inv = Regex::new(r#"pub const COMPRESSED_INVENTORY: &str = "[^"]+";"#)?;
            let new_content = re_inv.replace(&content, format!(r#"pub const COMPRESSED_INVENTORY: &str = "{}";"#, b64));
            fs::write(inv_path, new_content.to_string())?;

            println!("{}", format!("Synced {} items. Rebuild to apply changes.", all_items.len()).green());
        }
        Commands::List { query, page } => {
            let inv = load_inventory().ok_or("Inventory not found. Run 'sync' first.")?;
            let filtered: Vec<_> = if let Some(q) = query {
                let q = q.to_lowercase();
                inv.into_iter().filter(|i| i[1].to_lowercase().contains(&q)).collect()
            } else {
                inv
            };

            let total_pages = (filtered.len() + 19) / 20;
            let start = (page - 1) * 20;
            let items = filtered.iter().skip(start).take(20);

            if filtered.is_empty() {
                println!("{}", "No illustrations found.".red());
                return Ok(());
            }

            println!("{}", format!("Page {}/{} ({} items)", page, total_pages, filtered.len()).bold());
            println!("{:<30} {:<30}", "Title".green().bold(), "ID".cyan());
            println!("{}", "-".repeat(60));

            for item in items {
                println!("{:<30} {:<30}", item[1], item[0]);
            }
        }
        Commands::Download { id, color, out } => {
            let pb = ProgressBar::new_spinner();
            pb.set_message(format!("Downloading {}...", id));
            pb.enable_steady_tick(std::time::Duration::from_millis(100));

            let url = format!("{}/{}.svg", CDN_URL, id);
            let mut svg = String::from_utf8(fetch_url(&url)?)?;

            if color != "#6c63ff" {
                svg = svg.replace("#6c63ff", color);
            }

            fs::create_dir_all(out)?;
            let filename = format!("{}/{}.svg", out, id);
            fs::write(&filename, svg)?;

            pb.finish_and_clear();
            println!("{}", format!("Saved to {}", filename).green());
        }
    }

    Ok(())
}
