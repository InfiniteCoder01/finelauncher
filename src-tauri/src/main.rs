// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Utc;
use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};

mod download;
mod run;
mod unzip;

use crate::download::download_file;
use crate::run::{build_game, run_game, terminate_process};
use crate::unzip::unzip;

// Из tauri.conf.json, это конфиг для окна оверлея (когда будет готов функционал для поддержки оверлея нужно будет это вернуть)
// {
// 	"title": "finelauncher Overlay",
// 	"fullscreen": true,
// 	"maximized": true,
// 	"resizable": false,
// 	"transparent": true,
// 	"decorations": false,
// 	"url": "/overlay",
//     "label": "overlay"
// }

#[tauri::command(rename_all = "snake_case")]
async fn discord_presence(
    client: tauri::State<'_, std::sync::Mutex<DiscordIpcClient>>,
    message: &str,
) ->Result<(), String>{
    let timestamp = Utc::now().timestamp();
    let payload = activity::Activity::new()
        .details(message)
        .timestamps(discord_rich_presence::activity::Timestamps::new().start(timestamp))
        .assets(discord_rich_presence::activity::Assets::new().large_image("logo"))
        .buttons(vec![activity::Button::new("Присоединиться к Discord серверу", "https://discord.com/invite/KU4dXuWBVv")]);

    client.lock().unwrap()
        .set_activity(payload)
        .map_err(|err| format!("Failed to set activity: {}", err))
}

#[tauri::command(rename_all = "snake_case")]
async fn reconnect_discord(
    client: tauri::State<'_, std::sync::Mutex<DiscordIpcClient>>,
) ->Result<(), String>{
    client.lock().unwrap()
        .reconnect().map_err(|err| format!("Failed to reconnect: {}", err))
}

fn main() {
    let client_id = "1249433232915824751";
    let mut client = DiscordIpcClient::new(client_id).expect("Discord Rich Presence error");
    match client.connect() {
        Ok(()) => (),
        Err(err) if format!("{}", err) == "Couldn't connect to the Discord IPC socket" => (),
        Err(..) => panic!("Discord Rich Presence not connected"),
    };

    #[cfg(target_os = "linux")]
    std::env::set_var(
        "GDK_BACKEND",
        std::env::var("XDG_SESSION_TYPE").unwrap_or("x11".to_owned()),
    );
    tauri::Builder::default()
        .manage(std::sync::Mutex::new(client))
        .invoke_handler(tauri::generate_handler![
            discord_presence,
            reconnect_discord,
            download_file,
            unzip,
            run_game,
            build_game,
            terminate_process
        ])
        .run(tauri::generate_context!())
        .expect("error while running finelauncher");
}
