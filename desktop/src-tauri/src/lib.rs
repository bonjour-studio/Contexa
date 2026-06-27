use std::{
    path::{Path, PathBuf},
    process::Command,
};

use serde::{Deserialize, Serialize};
use tauri::{
    menu::{AboutMetadataBuilder, Menu, MenuItem, SubmenuBuilder},
    tray::TrayIconBuilder,
    Manager,
};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CommandError {
    code: &'static str,
    message: String,
}

impl CommandError {
    fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
}

type CommandResult<T> = Result<T, CommandError>;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GitRepository {
    root_path: String,
    git_dir_path: String,
    config_path: String,
    current_branch: Option<String>,
    remote: Option<GitRemote>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GitRemote {
    name: String,
    url: String,
    host: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GitConfigSnapshot {
    repository: GitRepository,
    user_name: Option<String>,
    user_email: Option<String>,
    core_ssh_command: Option<String>,
    inferred_ssh_key_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RepositoryStatus {
    repository: GitRepository,
    config: GitConfigSnapshot,
}

#[tauri::command]
fn detect_repository(path: Option<String>) -> CommandResult<GitRepository> {
    let cwd = resolve_user_path(path.as_deref())?;
    read_repository(&cwd)
}

#[tauri::command]
fn read_repository_status(path: Option<String>) -> CommandResult<RepositoryStatus> {
    let cwd = resolve_user_path(path.as_deref())?;
    let repository = read_repository(&cwd)?;
    let config = read_local_config(&repository)?;

    Ok(RepositoryStatus { repository, config })
}

fn resolve_user_path(path: Option<&str>) -> CommandResult<PathBuf> {
    let raw_path = match path {
        Some(path) if !path.trim().is_empty() => expand_tilde(path.trim())?,
        _ => std::env::current_dir()
            .map_err(|err| CommandError::new("cwd_unavailable", err.to_string()))?,
    };

    raw_path
        .canonicalize()
        .map_err(|err| CommandError::new("invalid_path", err.to_string()))
}

fn expand_tilde(path: &str) -> CommandResult<PathBuf> {
    if path == "~" {
        return home_dir()
            .ok_or_else(|| CommandError::new("home_unavailable", "Could not resolve home path"));
    }

    if let Some(rest) = path.strip_prefix("~/") {
        return home_dir()
            .map(|home| home.join(rest))
            .ok_or_else(|| CommandError::new("home_unavailable", "Could not resolve home path"));
    }

    Ok(PathBuf::from(path))
}

fn home_dir() -> Option<PathBuf> {
    std::env::var_os("HOME").map(PathBuf::from)
}

fn read_repository(cwd: &Path) -> CommandResult<GitRepository> {
    let root = git_output(cwd, &["rev-parse", "--show-toplevel"])?;
    let git_dir = git_output(cwd, &["rev-parse", "--absolute-git-dir"])?;
    let root_path = PathBuf::from(root);
    let git_dir_path = PathBuf::from(git_dir);

    let current_branch =
        optional_git_output(&root_path, &["branch", "--show-current"]).and_then(blank_to_none);
    let remote_name = optional_git_output(&root_path, &["remote"])
        .and_then(|remotes| remotes.lines().next().map(str::to_owned));
    let remote = remote_name.and_then(|name| {
        optional_git_output(&root_path, &["remote", "get-url", &name]).map(|url| GitRemote {
            name,
            host: parse_remote_host(&url),
            url,
        })
    });

    Ok(GitRepository {
        root_path: path_string(&root_path),
        git_dir_path: path_string(&git_dir_path),
        config_path: path_string(&git_dir_path.join("config")),
        current_branch,
        remote,
    })
}

fn read_local_config(repository: &GitRepository) -> CommandResult<GitConfigSnapshot> {
    let root = PathBuf::from(&repository.root_path);
    let user_name = optional_git_output(&root, &["config", "--local", "--get", "user.name"]);
    let user_email = optional_git_output(&root, &["config", "--local", "--get", "user.email"]);
    let core_ssh_command =
        optional_git_output(&root, &["config", "--local", "--get", "core.sshCommand"]);
    let inferred_ssh_key_path = core_ssh_command.as_deref().and_then(infer_ssh_key_path);

    Ok(GitConfigSnapshot {
        repository: GitRepository {
            root_path: repository.root_path.clone(),
            git_dir_path: repository.git_dir_path.clone(),
            config_path: repository.config_path.clone(),
            current_branch: repository.current_branch.clone(),
            remote: repository.remote.clone(),
        },
        user_name,
        user_email,
        core_ssh_command,
        inferred_ssh_key_path,
    })
}

fn git_output(cwd: &Path, args: &[&str]) -> CommandResult<String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(cwd)
        .output()
        .map_err(|err| CommandError::new("git_unavailable", err.to_string()))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_owned();
        return Ok(stdout);
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_owned();
    Err(CommandError::new(
        "git_failed",
        if stderr.is_empty() {
            format!("git {} failed", args.join(" "))
        } else {
            stderr
        },
    ))
}

fn optional_git_output(cwd: &Path, args: &[&str]) -> Option<String> {
    git_output(cwd, args).ok().and_then(blank_to_none)
}

fn blank_to_none(value: String) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_owned())
    }
}

fn path_string(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

fn parse_remote_host(remote_url: &str) -> Option<String> {
    if let Some(rest) = remote_url.strip_prefix("git@") {
        return rest.split(':').next().map(str::to_owned);
    }

    if let Some(after_scheme) = remote_url.split("://").nth(1) {
        let without_user = after_scheme.rsplit('@').next().unwrap_or(after_scheme);
        return without_user
            .split(['/', ':'])
            .next()
            .filter(|host| !host.is_empty())
            .map(str::to_owned);
    }

    None
}

fn infer_ssh_key_path(ssh_command: &str) -> Option<String> {
    let mut parts = ssh_command.split_whitespace();

    while let Some(part) = parts.next() {
        if part == "-i" {
            return parts.next().map(str::to_owned);
        }

        if let Some(path) = part.strip_prefix("-i") {
            if !path.is_empty() {
                return Some(path.to_owned());
            }
        }
    }

    None
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
                .copyright(Some(
                    "Copyright © 2026 Bonjour Studio.\nAll rights reserved.",
                ))
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
        .invoke_handler(tauri::generate_handler![
            detect_repository,
            read_repository_status
        ])
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
