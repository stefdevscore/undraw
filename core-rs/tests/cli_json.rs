use std::process::Command;
use std::{fs, path::PathBuf};

#[test]
fn list_json_outputs_structured_search_results() {
    let output = Command::new(env!("CARGO_BIN_EXE_undraw-rs"))
        .args(["list", "astronomy", "--json"])
        .output()
        .expect("failed to run undraw-rs");

    assert!(
        output.status.success(),
        "stderr: {}",
        String::from_utf8_lossy(&output.stderr)
    );

    let payload: serde_json::Value =
        serde_json::from_slice(&output.stdout).expect("stdout should be valid JSON");

    assert_eq!(payload["schema_version"], 1);
    assert_eq!(payload["query"], "astronomy");
    assert_eq!(payload["page"], 1);
    assert_eq!(payload["per_page"], 20);
    assert!(payload["total"].as_u64().unwrap_or_default() >= 1);
    assert!(payload["total_pages"].as_u64().unwrap_or_default() >= 1);
    assert!(payload["items"]
        .as_array()
        .expect("items should be an array")
        .iter()
        .any(|item| {
            item["id"] == "astronomy_ied1"
                && item["title"] == "Astronomy"
                && item["svg_url"]
                    .as_str()
                    .is_some_and(|url| url.starts_with("https://cdn.undraw.co/illustration"))
        }));
}

#[test]
fn download_json_outputs_manifest_and_writes_file() {
    let out_dir = std::env::temp_dir().join(format!(
        "undraw-rs-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("system time should be after epoch")
            .as_nanos()
    ));
    fs::create_dir_all(&out_dir).expect("failed to create temp output directory");

    let output = Command::new(env!("CARGO_BIN_EXE_undraw-rs"))
        .args([
            "download",
            "astronomy_ied1",
            "--json",
            "--out",
            out_dir.to_str().expect("temp path should be utf-8"),
        ])
        .output()
        .expect("failed to run undraw-rs");

    assert!(
        output.status.success(),
        "stderr: {}",
        String::from_utf8_lossy(&output.stderr)
    );

    let payload: serde_json::Value =
        serde_json::from_slice(&output.stdout).expect("stdout should be valid JSON");
    let expected_path: PathBuf = out_dir.join("astronomy_ied1.svg");

    assert_eq!(payload["schema_version"], 1);
    assert_eq!(payload["id"], "astronomy_ied1");
    assert_eq!(payload["title"], "Astronomy");
    assert_eq!(payload["color"], "#6c63ff");
    assert_eq!(payload["path"], expected_path.to_string_lossy().as_ref());
    assert!(payload["bytes"].as_u64().unwrap_or_default() > 0);
    assert!(payload["svg_url"]
        .as_str()
        .is_some_and(|url| url.starts_with("https://cdn.undraw.co/illustration")));
    assert!(expected_path.exists());
}

#[test]
fn list_json_rejects_page_zero_without_panic() {
    let output = Command::new(env!("CARGO_BIN_EXE_undraw-rs"))
        .args(["list", "astronomy", "--page", "0", "--json"])
        .output()
        .expect("failed to run undraw-rs");

    assert!(!output.status.success());

    let payload: serde_json::Value =
        serde_json::from_slice(&output.stdout).expect("stdout should be valid JSON");

    assert_eq!(payload["schema_version"], 1);
    assert_eq!(payload["error"], "invalid_page");
    assert_eq!(payload["page"], 0);
}

#[test]
fn download_json_fails_missing_assets_with_nonzero_status() {
    let out_dir = std::env::temp_dir().join(format!(
        "undraw-rs-missing-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("system time should be after epoch")
            .as_nanos()
    ));
    fs::create_dir_all(&out_dir).expect("failed to create temp output directory");

    let output = Command::new(env!("CARGO_BIN_EXE_undraw-rs"))
        .args([
            "download",
            "definitely_missing_asset_zzzz",
            "--json",
            "--out",
            out_dir.to_str().expect("temp path should be utf-8"),
        ])
        .output()
        .expect("failed to run undraw-rs");

    assert!(!output.status.success());

    let payload: serde_json::Value =
        serde_json::from_slice(&output.stdout).expect("stdout should be valid JSON");

    assert_eq!(payload["schema_version"], 1);
    assert_eq!(payload["error"], "download_failed");
    assert_eq!(payload["id"], "definitely_missing_asset_zzzz");
}
