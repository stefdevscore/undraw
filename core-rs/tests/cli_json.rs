use std::process::Command;

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

    assert_eq!(payload["query"], "astronomy");
    assert_eq!(payload["page"], 1);
    assert_eq!(payload["per_page"], 20);
    assert!(payload["total"].as_u64().unwrap_or_default() >= 1);
    assert!(payload["total_pages"].as_u64().unwrap_or_default() >= 1);
    assert!(payload["items"]
        .as_array()
        .expect("items should be an array")
        .iter()
        .any(|item| item["id"] == "astronomy_ied1" && item["title"] == "Astronomy"));
}
