// Windows リリースビルドでコンソールが開かないようにする
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    restart_client_lib::run()
}
