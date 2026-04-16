// トークンを OS のセキュアストレージ(macOS Keychain, Windows Credential Manager,
// Linux Secret Service) に保存・読み出しするコマンドを提供する。
// `Authorization: Bearer <token>` の <token> 部分のみを扱う。

use keyring::Entry;
use serde::{Deserialize, Serialize};

const SERVICE: &str = "com.restart.client";
const TOKEN_USER: &str = "access_token";
const META_USER: &str = "access_token_meta";

#[derive(thiserror::Error, Debug)]
pub enum AuthError {
    #[error("keyring error: {0}")]
    Keyring(#[from] keyring::Error),
    #[error("serde error: {0}")]
    Serde(#[from] serde_json::Error),
}

/// フロントに返すための String 化ラッパ。
/// Tauri の command は `Error: Serialize` を要求するため。
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
    /// Discord ユーザーID (精度保持のため文字列)
    pub user_id: String,
    /// Unix 秒でのトークン失効時刻
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
        // 存在しない場合のエラーは握りつぶす
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![save_token, load_token, clear_token])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
