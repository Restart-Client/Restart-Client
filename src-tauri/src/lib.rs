// OS セキュアストレージへのトークン保存・読み出し、ウィンドウ管理、
// グローバルホットキー登録、トレイアイコン設定を提供する。

use keyring::Entry;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, LogicalPosition, LogicalSize, Manager};

const SERVICE: &str = "com.restart.client";
const TOKEN_USER: &str = "access_token";
const META_USER: &str = "access_token_meta";
const HUD_WIDTH: f64 = 360.0;

// ─────────────────────────────────────────────────────────
// Auth types & errors
// ─────────────────────────────────────────────────────────

#[derive(thiserror::Error, Debug)]
pub enum AuthError {
    #[error("keyring error: {0}")]
    Keyring(#[from] keyring::Error),
    #[error("serde error: {0}")]
    Serde(#[from] serde_json::Error),
}

pub struct AuthErrorWrapper(String);

impl serde::Serialize for AuthErrorWrapper {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.0)
    }
}

impl From<AuthError> for AuthErrorWrapper {
    fn from(e: AuthError) -> Self {
        AuthErrorWrapper(e.to_string())
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TokenMeta {
    pub user_id: String,
    pub expires_at: i64,
}

#[derive(Serialize, Deserialize)]
pub struct StoredToken {
    pub access_token: String,
    pub meta: TokenMeta,
}

fn token_entry() -> Result<Entry, AuthError> {
    Ok(Entry::new(SERVICE, TOKEN_USER)?)
}

fn meta_entry() -> Result<Entry, AuthError> {
    Ok(Entry::new(SERVICE, META_USER)?)
}

// ─────────────────────────────────────────────────────────
// Auth commands
// ─────────────────────────────────────────────────────────

#[tauri::command]
fn save_token(
    access_token: String,
    user_id: String,
    expires_at: i64,
) -> Result<(), AuthErrorWrapper> {
    let inner = || -> Result<(), AuthError> {
        token_entry()?.set_password(&access_token)?;
        let meta = TokenMeta {
            user_id,
            expires_at,
        };
        meta_entry()?.set_password(&serde_json::to_string(&meta)?)?;
        Ok(())
    };
    inner().map_err(AuthErrorWrapper::from)
}

#[tauri::command]
fn load_token() -> Result<Option<StoredToken>, AuthErrorWrapper> {
    let inner = || -> Result<Option<StoredToken>, AuthError> {
        let token_e = token_entry()?;
        let token = match token_e.get_password() {
            Ok(t) => t,
            Err(keyring::Error::NoEntry) => return Ok(None),
            Err(e) => return Err(e.into()),
        };
        let meta_e = meta_entry()?;
        let meta_str = match meta_e.get_password() {
            Ok(t) => t,
            Err(keyring::Error::NoEntry) => return Ok(None),
            Err(e) => return Err(e.into()),
        };
        let meta: TokenMeta = serde_json::from_str(&meta_str)?;
        Ok(Some(StoredToken {
            access_token: token,
            meta,
        }))
    };
    inner().map_err(AuthErrorWrapper::from)
}

#[tauri::command]
fn clear_token() -> Result<(), AuthErrorWrapper> {
    let inner = || -> Result<(), AuthError> {
        if let Ok(e) = token_entry() {
            let _ = e.delete_credential();
        }
        if let Ok(e) = meta_entry() {
            let _ = e.delete_credential();
        }
        Ok(())
    };
    inner().map_err(AuthErrorWrapper::from)
}

// ─────────────────────────────────────────────────────────
// Window commands
// ─────────────────────────────────────────────────────────

#[tauri::command]
fn show_hud(app: AppHandle) -> Result<(), String> {
    let w = app.get_webview_window("hud").ok_or("HUD ウィンドウが見つかりません")?;

    // プライマリモニターのサイズに合わせて位置とサイズを設定
    if let Ok(Some(monitor)) = w.primary_monitor() {
        let scale = monitor.scale_factor();
        let size = monitor.size();
        let screen_w = size.width as f64 / scale;
        let screen_h = size.height as f64 / scale;

        let _ = w.set_size(LogicalSize::new(HUD_WIDTH, screen_h));
        let _ = w.set_position(LogicalPosition::new(screen_w - HUD_WIDTH, 0.0));
    }

    w.show().map_err(|e| e.to_string())?;
    w.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn hide_hud(app: AppHandle) -> Result<(), String> {
    app.get_webview_window("hud")
        .ok_or("HUD ウィンドウが見つかりません")?
        .hide()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn show_desk(app: AppHandle) -> Result<(), String> {
    let w = app
        .get_webview_window("desk")
        .ok_or("Desk ウィンドウが見つかりません")?;
    w.show().map_err(|e| e.to_string())?;
    w.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

// ─────────────────────────────────────────────────────────
// Autostart commands
// ─────────────────────────────────────────────────────────

#[tauri::command]
fn set_autostart(app: AppHandle, enable: bool) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;
    let manager = app.autolaunch();
    if enable {
        manager.enable().map_err(|e| e.to_string())
    } else {
        manager.disable().map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn get_autostart(app: AppHandle) -> Result<bool, String> {
    use tauri_plugin_autostart::ManagerExt;
    app.autolaunch().is_enabled().map_err(|e| e.to_string())
}

// ─────────────────────────────────────────────────────────
// Tray setup
// ─────────────────────────────────────────────────────────

fn setup_tray(app: &mut tauri::App) -> tauri::Result<()> {
    use tauri::{
        menu::{Menu, MenuItem, PredefinedMenuItem},
        tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    };

    let open_desk =
        MenuItem::with_id(app, "open_desk", "Desk を開く", true, None::<&str>)?;
    let open_hud =
        MenuItem::with_id(app, "open_hud", "HUD を開く", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "終了", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&open_desk, &open_hud, &sep, &quit])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("Re'start Client")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open_desk" => {
                if let Some(w) = app.get_webview_window("desk") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            "open_hud" => {
                if let Some(w) = app.get_webview_window("hud") {
                    let is_hidden = w.is_visible().map(|v| !v).unwrap_or(true);
                    if is_hidden {
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
                let _ = app.emit("hud:toggle", ());
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            // 左クリックで HUD トグル
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(w) = app.get_webview_window("hud") {
                    let is_hidden = w.is_visible().map(|v| !v).unwrap_or(true);
                    if is_hidden {
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
                let _ = app.emit("hud:toggle", ());
            }
        })
        .build(app)?;

    Ok(())
}

// ─────────────────────────────────────────────────────────
// Global shortcut setup
// ─────────────────────────────────────────────────────────

fn setup_hotkeys(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

    let handle = app.handle().clone();
    app.handle()
        .global_shortcut()
        .on_shortcut("CommandOrControl+Shift+R", move |_app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                let app = handle.clone();
                // 非表示なら先に表示・フォーカス
                if let Some(w) = app.get_webview_window("hud") {
                    let is_hidden = w.is_visible().map(|v| !v).unwrap_or(true);
                    if is_hidden {
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
                let _ = app.emit("hud:toggle", ());
            }
        })?;

    // プリセット個別ホットキー Ctrl+Shift+1〜5
    for i in 1u8..=5 {
        let handle2 = app.handle().clone();
        let shortcut = format!("CommandOrControl+Shift+{i}");
        app.handle()
            .global_shortcut()
            .on_shortcut(shortcut.as_str(), move |_app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    let _ = handle2.emit("preset:apply", i);
                }
            })?;
    }

    Ok(())
}

// ─────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--desk"]),
        ))
        .setup(|app| {
            setup_tray(app)?;
            setup_hotkeys(app)?;
            // Desk ウィンドウを起動時に表示
            if let Some(w) = app.get_webview_window("desk") {
                let _ = w.show();
                let _ = w.set_focus();
                // × ボタンで破棄せず非表示にする (トレイから再表示できるように)
                let w2 = w.clone();
                w.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = w2.hide();
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_token,
            load_token,
            clear_token,
            show_hud,
            hide_hud,
            show_desk,
            set_autostart,
            get_autostart,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
