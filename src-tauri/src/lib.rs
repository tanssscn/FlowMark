// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use log::LevelFilter;
use tauri_plugin_log::{Builder, Target, TargetKind};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
fn configure_logging() -> Builder {
    let level = if cfg!(debug_assertions) {
        // LevelFilter::Trace // 开发环境更详细的日志
        LevelFilter::Info // 生产环境基本日志
    } else {
        LevelFilter::Info // 生产环境基本日志
    };

    tauri_plugin_log::Builder::new().level(level).targets([
        Target::new(TargetKind::Stdout),
        Target::new(TargetKind::LogDir { file_name: None }),
        Target::new(TargetKind::Webview),
    ])
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(configure_logging().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
