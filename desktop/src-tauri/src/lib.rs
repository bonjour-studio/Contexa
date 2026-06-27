// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{
    menu::{AboutMetadataBuilder, Menu, MenuItem, SubmenuBuilder},
    tray::TrayIconBuilder,
    Manager,
};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // App menu so the macOS About panel carries copyright + repo URL.
            // (On macOS muda only renders name/version/copyright/credits — website
            // and license fields are ignored, so the repo URL goes into credits.)
            let about = AboutMetadataBuilder::new()
                .name(Some("Contexa"))
                .version(Some(app.package_info().version.to_string()))
                .icon(app.default_window_icon().cloned())
                .copyright(Some("Copyright © 2026 Bonjour Studio.\nAll rights reserved."))
                .build();
            let app_menu = SubmenuBuilder::new(app, "Contexa")
                .about(Some(about))
                .separator()
                .services()
                .separator()
                .hide()
                .hide_others()
                .show_all()
                .separator()
                .quit()
                .build()?;
            // Keep Edit/Window so copy-paste shortcuts still work in the webview.
            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;
            let window_menu = SubmenuBuilder::new(app, "Window")
                .minimize()
                .separator()
                .close_window()
                .build()?;
            let menubar = Menu::with_items(app, &[&app_menu, &edit_menu, &window_menu])?;
            app.set_menu(menubar)?;

            // Menu bar (macOS) / system tray icon with a Show / Quit menu.
            let show_i = MenuItem::with_id(app, "show", "Show Contexa", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit Contexa", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Contexa")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            // Closing the main window hides it to the tray instead of quitting the app.
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Reveal and focus the main window (creating it from the tray when hidden).
fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}
