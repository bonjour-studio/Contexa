use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
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

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GitIdentityProfile {
    id: String,
    label: String,
    user_name: String,
    user_email: String,
    ssh_key_path: String,
    remote_host: String,
    created_at: u64,
    updated_at: u64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProfileInput {
    id: Option<String>,
    label: String,
    user_name: String,
    user_email: String,
    ssh_key_path: String,
    remote_host: String,
}

#[derive(Default, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AppStorage {
    profiles: Vec<GitIdentityProfile>,
    apply_history: Vec<ApplyHistoryItem>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SshKeyStatus {
    path: String,
    expanded_path: String,
    exists: bool,
    is_file: bool,
    readable: bool,
    message: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConfigChange {
    key: String,
    current_value: Option<String>,
    next_value: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ApplyPlan {
    repository: GitRepository,
    profile: GitIdentityProfile,
    ssh_command: String,
    changes: Vec<ConfigChange>,
    diff: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PreflightCheck {
    id: String,
    label: String,
    status: CheckStatus,
    message: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
enum CheckStatus {
    Passed,
    Warning,
    Failed,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PreflightResult {
    can_apply: bool,
    checks: Vec<PreflightCheck>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ApplyResult {
    applied: bool,
    repository: GitRepository,
    config: GitConfigSnapshot,
    history_item: ApplyHistoryItem,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ApplyHistoryItem {
    id: String,
    repo_path: String,
    profile_id: String,
    profile_label: String,
    applied_at: u64,
    changes: Vec<ConfigChange>,
    success: bool,
    message: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConnectionTestResult {
    command_label: String,
    success: bool,
    stdout: String,
    stderr: String,
    exit_code: Option<i32>,
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

#[tauri::command]
fn list_profiles(app: tauri::AppHandle) -> CommandResult<Vec<GitIdentityProfile>> {
    Ok(read_storage(&app)?.profiles)
}

#[tauri::command]
fn save_profile(app: tauri::AppHandle, profile: ProfileInput) -> CommandResult<GitIdentityProfile> {
    let mut storage = read_storage(&app)?;
    let now = now_epoch_seconds()?;
    let normalized = normalize_profile_input(profile)?;
    let id = normalized
        .id
        .clone()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or(unique_id("profile")?);

    let existing_created_at = storage
        .profiles
        .iter()
        .find(|profile| profile.id == id)
        .map(|profile| profile.created_at)
        .unwrap_or(now);

    let saved_profile = GitIdentityProfile {
        id: id.clone(),
        label: normalized.label,
        user_name: normalized.user_name,
        user_email: normalized.user_email,
        ssh_key_path: normalized.ssh_key_path,
        remote_host: normalized.remote_host,
        created_at: existing_created_at,
        updated_at: now,
    };

    if let Some(index) = storage.profiles.iter().position(|profile| profile.id == id) {
        storage.profiles[index] = saved_profile.clone();
    } else {
        storage.profiles.push(saved_profile.clone());
    }

    write_storage(&app, &storage)?;
    Ok(saved_profile)
}

#[tauri::command]
fn delete_profile(
    app: tauri::AppHandle,
    profile_id: String,
) -> CommandResult<Vec<GitIdentityProfile>> {
    let mut storage = read_storage(&app)?;
    storage
        .profiles
        .retain(|profile| profile.id != profile_id.trim());
    write_storage(&app, &storage)?;

    Ok(storage.profiles)
}

#[tauri::command]
fn list_apply_history(app: tauri::AppHandle) -> CommandResult<Vec<ApplyHistoryItem>> {
    Ok(read_storage(&app)?.apply_history)
}

#[tauri::command]
fn check_ssh_key(path: String) -> CommandResult<SshKeyStatus> {
    inspect_ssh_key(&path)
}

#[tauri::command]
fn create_apply_plan(path: String, profile: GitIdentityProfile) -> CommandResult<ApplyPlan> {
    build_apply_plan(&path, profile)
}

#[tauri::command]
fn run_preflight(path: String, profile: GitIdentityProfile) -> CommandResult<PreflightResult> {
    let plan = build_apply_plan(&path, profile)?;
    run_local_preflight(&plan)
}

#[tauri::command]
fn apply_profile(
    app: tauri::AppHandle,
    path: String,
    profile: GitIdentityProfile,
) -> CommandResult<ApplyResult> {
    let plan = build_apply_plan(&path, profile)?;
    let preflight = run_local_preflight(&plan)?;

    if !preflight.can_apply {
        return Err(CommandError::new(
            "preflight_failed",
            "Preflight checks failed; review the failed checks before applying.",
        ));
    }

    let repo_root = PathBuf::from(&plan.repository.root_path);
    for change in &plan.changes {
        git_output(
            &repo_root,
            &["config", "--local", &change.key, &change.next_value],
        )?;
    }

    let repository = read_repository(&repo_root)?;
    let config = read_local_config(&repository)?;
    let history_item = ApplyHistoryItem {
        id: unique_id("apply")?,
        repo_path: repository.root_path.clone(),
        profile_id: plan.profile.id.clone(),
        profile_label: plan.profile.label.clone(),
        applied_at: now_epoch_seconds()?,
        changes: plan.changes,
        success: true,
        message: "Applied to this repository's local git config.".to_owned(),
    };

    let mut storage = read_storage(&app)?;
    storage.apply_history.insert(0, history_item.clone());
    storage.apply_history.truncate(100);
    write_storage(&app, &storage)?;

    Ok(ApplyResult {
        applied: true,
        repository,
        config,
        history_item,
    })
}

#[tauri::command]
fn test_ssh_connection(profile: GitIdentityProfile) -> CommandResult<ConnectionTestResult> {
    validate_profile(&profile)?;

    let key_status = inspect_ssh_key(&profile.ssh_key_path)?;
    if !key_status.exists || !key_status.is_file || !key_status.readable {
        return Err(CommandError::new(
            "ssh_key_unavailable",
            key_status
                .message
                .unwrap_or_else(|| "SSH key path is not ready.".to_owned()),
        ));
    }

    command_with_output(
        "ssh connection",
        Command::new("ssh")
            .arg("-T")
            .arg("-o")
            .arg("BatchMode=yes")
            .arg("-o")
            .arg("StrictHostKeyChecking=yes")
            .arg("-i")
            .arg(&key_status.expanded_path)
            .arg("-F")
            .arg("none")
            .arg(format!("git@{}", profile.remote_host)),
    )
}

#[tauri::command]
fn test_git_ls_remote(
    path: String,
    profile: GitIdentityProfile,
) -> CommandResult<ConnectionTestResult> {
    let plan = build_apply_plan(&path, profile)?;
    let repo_root = PathBuf::from(&plan.repository.root_path);
    let remote_name = plan
        .repository
        .remote
        .as_ref()
        .map(|remote| remote.name.as_str())
        .unwrap_or("origin");

    command_with_output(
        "git ls-remote",
        Command::new("git")
            .env("GIT_TERMINAL_PROMPT", "0")
            .arg("-c")
            .arg(format!(
                "core.sshCommand={} -o BatchMode=yes -o StrictHostKeyChecking=yes",
                plan.ssh_command
            ))
            .arg("ls-remote")
            .arg("--heads")
            .arg(remote_name)
            .current_dir(repo_root),
    )
}

fn normalize_profile_input(profile: ProfileInput) -> CommandResult<ProfileInput> {
    let normalized = ProfileInput {
        id: profile.id.map(|id| id.trim().to_owned()),
        label: profile.label.trim().to_owned(),
        user_name: profile.user_name.trim().to_owned(),
        user_email: profile.user_email.trim().to_owned(),
        ssh_key_path: profile.ssh_key_path.trim().to_owned(),
        remote_host: profile.remote_host.trim().to_ascii_lowercase(),
    };

    if normalized.label.is_empty() {
        return Err(CommandError::new(
            "invalid_profile",
            "Profile label is required.",
        ));
    }

    if normalized.user_name.is_empty() {
        return Err(CommandError::new(
            "invalid_profile",
            "Git user.name is required.",
        ));
    }

    if normalized.user_email.is_empty() {
        return Err(CommandError::new(
            "invalid_profile",
            "Git user.email is required.",
        ));
    }

    if normalized.ssh_key_path.is_empty() {
        return Err(CommandError::new(
            "invalid_profile",
            "SSH private key path reference is required.",
        ));
    }

    validate_remote_host(&normalized.remote_host)?;

    Ok(normalized)
}

fn validate_profile(profile: &GitIdentityProfile) -> CommandResult<()> {
    normalize_profile_input(ProfileInput {
        id: Some(profile.id.clone()),
        label: profile.label.clone(),
        user_name: profile.user_name.clone(),
        user_email: profile.user_email.clone(),
        ssh_key_path: profile.ssh_key_path.clone(),
        remote_host: profile.remote_host.clone(),
    })?;

    Ok(())
}

fn validate_remote_host(remote_host: &str) -> CommandResult<()> {
    if remote_host.is_empty() {
        return Err(CommandError::new(
            "invalid_profile",
            "Remote host is required.",
        ));
    }

    if remote_host
        .chars()
        .any(|ch| ch.is_whitespace() || matches!(ch, '/' | '\\' | ':'))
    {
        return Err(CommandError::new(
            "invalid_profile",
            "Remote host must be a host name such as github.com.",
        ));
    }

    Ok(())
}

fn read_storage(app: &tauri::AppHandle) -> CommandResult<AppStorage> {
    let path = storage_path(app)?;
    if !path.exists() {
        return Ok(AppStorage::default());
    }

    let contents = fs::read_to_string(&path).map_err(|err| {
        CommandError::new(
            "storage_read_failed",
            format!("Could not read app storage: {err}"),
        )
    })?;

    serde_json::from_str(&contents).map_err(|err| {
        CommandError::new(
            "storage_parse_failed",
            format!("Could not parse app storage: {err}"),
        )
    })
}

fn write_storage(app: &tauri::AppHandle, storage: &AppStorage) -> CommandResult<()> {
    let path = storage_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|err| {
            CommandError::new(
                "storage_write_failed",
                format!("Could not create app storage directory: {err}"),
            )
        })?;
    }

    let contents = serde_json::to_string_pretty(storage).map_err(|err| {
        CommandError::new(
            "storage_write_failed",
            format!("Could not serialize app storage: {err}"),
        )
    })?;

    fs::write(path, contents).map_err(|err| {
        CommandError::new(
            "storage_write_failed",
            format!("Could not write app storage: {err}"),
        )
    })
}

fn storage_path(app: &tauri::AppHandle) -> CommandResult<PathBuf> {
    app.path()
        .app_data_dir()
        .map(|path| path.join("gitscope.json"))
        .map_err(|err| {
            CommandError::new(
                "storage_path_failed",
                format!("Could not resolve app storage directory: {err}"),
            )
        })
}

fn build_apply_plan(path: &str, profile: GitIdentityProfile) -> CommandResult<ApplyPlan> {
    validate_profile(&profile)?;

    let cwd = resolve_user_path(Some(path))?;
    let repository = read_repository(&cwd)?;
    let config = read_local_config(&repository)?;
    let key_status = inspect_ssh_key(&profile.ssh_key_path)?;
    let ssh_key_path = if key_status.exists {
        key_status.expanded_path
    } else {
        profile.ssh_key_path.clone()
    };
    let ssh_command = format!("ssh -i {} -F none", shell_quote(&ssh_key_path));
    let desired = vec![
        (
            "user.name".to_owned(),
            config.user_name.clone(),
            profile.user_name.clone(),
        ),
        (
            "user.email".to_owned(),
            config.user_email.clone(),
            profile.user_email.clone(),
        ),
        (
            "core.sshCommand".to_owned(),
            config.core_ssh_command.clone(),
            ssh_command.clone(),
        ),
    ];
    let changes = desired
        .into_iter()
        .filter_map(|(key, current_value, next_value)| {
            if current_value.as_deref() == Some(next_value.as_str()) {
                None
            } else {
                Some(ConfigChange {
                    key,
                    current_value,
                    next_value,
                })
            }
        })
        .collect::<Vec<_>>();
    let diff = render_diff(&repository, &changes);

    Ok(ApplyPlan {
        repository,
        profile,
        ssh_command,
        changes,
        diff,
    })
}

fn inspect_ssh_key(path: &str) -> CommandResult<SshKeyStatus> {
    let expanded_path = expand_tilde(path.trim())?;
    let expanded_path_string = path_string(&expanded_path);

    match fs::metadata(&expanded_path) {
        Ok(metadata) => {
            let is_file = metadata.is_file();
            let readable = fs::File::open(&expanded_path).is_ok();
            let message = if !is_file {
                Some("Path exists but is not a file.".to_owned())
            } else if !readable {
                Some("Key file exists but is not readable.".to_owned())
            } else {
                None
            };

            Ok(SshKeyStatus {
                path: path.trim().to_owned(),
                expanded_path: expanded_path_string,
                exists: true,
                is_file,
                readable,
                message,
            })
        }
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(SshKeyStatus {
            path: path.trim().to_owned(),
            expanded_path: expanded_path_string,
            exists: false,
            is_file: false,
            readable: false,
            message: Some("Key file does not exist.".to_owned()),
        }),
        Err(err) => Err(CommandError::new(
            "ssh_key_check_failed",
            format!("Could not inspect SSH key path: {err}"),
        )),
    }
}

fn run_local_preflight(plan: &ApplyPlan) -> CommandResult<PreflightResult> {
    let checks = vec![
        check_config_writable(&plan.repository),
        check_profile_key(&plan.profile)?,
        check_remote_host(&plan.repository, &plan.profile),
    ];

    let can_apply = checks
        .iter()
        .all(|check| !matches!(check.status, CheckStatus::Failed));

    Ok(PreflightResult { can_apply, checks })
}

fn check_config_writable(repository: &GitRepository) -> PreflightCheck {
    let config_path = PathBuf::from(&repository.config_path);
    let target = if config_path.exists() {
        config_path.as_path()
    } else {
        config_path.parent().unwrap_or(config_path.as_path())
    };

    match fs::metadata(target) {
        Ok(metadata) if metadata.permissions().readonly() => PreflightCheck {
            id: "config-writable".to_owned(),
            label: "Local git config writable".to_owned(),
            status: CheckStatus::Failed,
            message: "The repository local git config target is read-only.".to_owned(),
        },
        Ok(_) => PreflightCheck {
            id: "config-writable".to_owned(),
            label: "Local git config writable".to_owned(),
            status: CheckStatus::Passed,
            message: "This repo's local git config can be updated.".to_owned(),
        },
        Err(err) => PreflightCheck {
            id: "config-writable".to_owned(),
            label: "Local git config writable".to_owned(),
            status: CheckStatus::Failed,
            message: format!("Could not inspect git config target: {err}"),
        },
    }
}

fn check_profile_key(profile: &GitIdentityProfile) -> CommandResult<PreflightCheck> {
    let key_status = inspect_ssh_key(&profile.ssh_key_path)?;

    if key_status.exists && key_status.is_file && key_status.readable {
        Ok(PreflightCheck {
            id: "ssh-key".to_owned(),
            label: "SSH key reference".to_owned(),
            status: CheckStatus::Passed,
            message: "SSH key path exists and is readable.".to_owned(),
        })
    } else {
        Ok(PreflightCheck {
            id: "ssh-key".to_owned(),
            label: "SSH key reference".to_owned(),
            status: CheckStatus::Failed,
            message: key_status
                .message
                .unwrap_or_else(|| "SSH key path is not usable.".to_owned()),
        })
    }
}

fn check_remote_host(repository: &GitRepository, profile: &GitIdentityProfile) -> PreflightCheck {
    let Some(remote) = &repository.remote else {
        return PreflightCheck {
            id: "remote-host".to_owned(),
            label: "Remote host match".to_owned(),
            status: CheckStatus::Warning,
            message: "No git remote found; apply can proceed, but connection tests need an origin remote."
                .to_owned(),
        };
    };

    let Some(host) = &remote.host else {
        return PreflightCheck {
            id: "remote-host".to_owned(),
            label: "Remote host match".to_owned(),
            status: CheckStatus::Warning,
            message: format!("Could not infer a host from remote {}.", remote.name),
        };
    };

    if host.eq_ignore_ascii_case(&profile.remote_host) {
        PreflightCheck {
            id: "remote-host".to_owned(),
            label: "Remote host match".to_owned(),
            status: CheckStatus::Passed,
            message: format!("Remote {} matches {}.", remote.name, profile.remote_host),
        }
    } else {
        PreflightCheck {
            id: "remote-host".to_owned(),
            label: "Remote host match".to_owned(),
            status: CheckStatus::Failed,
            message: format!(
                "Remote {} points to {}, but profile expects {}.",
                remote.name, host, profile.remote_host
            ),
        }
    }
}

fn render_diff(repository: &GitRepository, changes: &[ConfigChange]) -> String {
    if changes.is_empty() {
        return "No local git config changes needed.".to_owned();
    }

    let mut lines = vec![
        format!(
            "diff --git a/{} b/{}",
            repository.config_path, repository.config_path
        ),
        "--- current local config".to_owned(),
        "+++ preview local config".to_owned(),
    ];

    for change in changes {
        lines.push(format!("@@ {} @@", change.key));
        lines.push(format!(
            "-{} = {}",
            change.key,
            format_config_value(change.current_value.as_deref())
        ));
        lines.push(format!(
            "+{} = {}",
            change.key,
            format_config_value(Some(&change.next_value))
        ));
    }

    lines.join("\n")
}

fn format_config_value(value: Option<&str>) -> String {
    value.unwrap_or("<unset>").to_owned()
}

fn shell_quote(value: &str) -> String {
    if value
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '/' | '.' | '_' | '-' | '~'))
    {
        return value.to_owned();
    }

    format!("'{}'", value.replace('\'', "'\\''"))
}

fn command_with_output(
    command_label: &str,
    command: &mut Command,
) -> CommandResult<ConnectionTestResult> {
    let output = command
        .output()
        .map_err(|err| CommandError::new("command_failed", err.to_string()))?;
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_owned();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_owned();
    let exit_code = output.status.code();
    let auth_success = stdout.contains("successfully authenticated")
        || stderr.contains("successfully authenticated");

    Ok(ConnectionTestResult {
        command_label: command_label.to_owned(),
        success: output.status.success() || auth_success,
        stdout,
        stderr,
        exit_code,
    })
}

fn now_epoch_seconds() -> CommandResult<u64> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .map_err(|err| CommandError::new("clock_error", err.to_string()))
}

fn unique_id(prefix: &str) -> CommandResult<String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| format!("{prefix}-{}", duration.as_nanos()))
        .map_err(|err| CommandError::new("clock_error", err.to_string()))
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
    let config = git_output(cwd, &["rev-parse", "--git-path", "config"])?;
    let root_path = PathBuf::from(root);
    let git_dir_path = PathBuf::from(git_dir);
    let raw_config_path = PathBuf::from(config);
    let config_path = if raw_config_path.is_absolute() {
        raw_config_path
    } else {
        root_path.join(raw_config_path)
    };

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
        config_path: path_string(&config_path),
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
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
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
            read_repository_status,
            list_profiles,
            save_profile,
            delete_profile,
            list_apply_history,
            check_ssh_key,
            create_apply_plan,
            run_preflight,
            apply_profile,
            test_ssh_connection,
            test_git_ls_remote
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_common_remote_hosts() {
        assert_eq!(
            parse_remote_host("git@github.com:owner/repo.git"),
            Some("github.com".to_owned())
        );
        assert_eq!(
            parse_remote_host("ssh://git@gitlab.com/group/repo.git"),
            Some("gitlab.com".to_owned())
        );
        assert_eq!(
            parse_remote_host("https://github.com/owner/repo.git"),
            Some("github.com".to_owned())
        );
    }

    #[test]
    fn infers_ssh_key_from_command() {
        assert_eq!(
            infer_ssh_key_path("ssh -i ~/.ssh/work_ed25519 -F none"),
            Some("~/.ssh/work_ed25519".to_owned())
        );
        assert_eq!(
            infer_ssh_key_path("ssh -i/Users/example/.ssh/id_client -F none"),
            Some("/Users/example/.ssh/id_client".to_owned())
        );
    }

    #[test]
    fn quotes_shell_paths_with_spaces() {
        assert_eq!(
            shell_quote("/Users/example/.ssh/id_ed25519"),
            "/Users/example/.ssh/id_ed25519"
        );
        assert_eq!(
            shell_quote("/Users/example/My Keys/id_ed25519"),
            "'/Users/example/My Keys/id_ed25519'"
        );
        assert_eq!(
            shell_quote("/Users/example/client's key"),
            "'/Users/example/client'\\''s key'"
        );
    }

    #[test]
    fn renders_noop_diff_when_no_changes() {
        let repository = GitRepository {
            root_path: "/repo".to_owned(),
            git_dir_path: "/repo/.git".to_owned(),
            config_path: "/repo/.git/config".to_owned(),
            current_branch: Some("main".to_owned()),
            remote: None,
        };

        assert_eq!(
            render_diff(&repository, &[]),
            "No local git config changes needed."
        );
    }
}
