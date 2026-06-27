import { invoke } from "@tauri-apps/api/core";

export type GitRemote = {
  name: string;
  url: string;
  host?: string | null;
};

export type GitRepository = {
  rootPath: string;
  gitDirPath: string;
  configPath: string;
  currentBranch?: string | null;
  remote?: GitRemote | null;
};

export type GitConfigSnapshot = {
  repository: GitRepository;
  userName?: string | null;
  userEmail?: string | null;
  coreSshCommand?: string | null;
  inferredSshKeyPath?: string | null;
};

export type RepositoryStatus = {
  repository: GitRepository;
  config: GitConfigSnapshot;
};

export type GitIdentityProfile = {
  id: string;
  label: string;
  userName: string;
  userEmail: string;
  sshKeyPath: string;
  remoteHost: string;
  createdAt: number;
  updatedAt: number;
};

export type ProfileInput = {
  id?: string;
  label: string;
  userName: string;
  userEmail: string;
  sshKeyPath: string;
  remoteHost: string;
};

export type SshKeyStatus = {
  path: string;
  expandedPath: string;
  exists: boolean;
  isFile: boolean;
  readable: boolean;
  message?: string | null;
};

export type ConfigChange = {
  key: string;
  currentValue?: string | null;
  nextValue: string;
};

export type ApplyPlan = {
  repository: GitRepository;
  profile: GitIdentityProfile;
  sshCommand: string;
  changes: ConfigChange[];
  diff: string;
};

export type CheckStatus = "passed" | "warning" | "failed";

export type PreflightCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
};

export type PreflightResult = {
  canApply: boolean;
  checks: PreflightCheck[];
};

export type ApplyHistoryItem = {
  id: string;
  repoPath: string;
  profileId: string;
  profileLabel: string;
  appliedAt: number;
  changes: ConfigChange[];
  success: boolean;
  message: string;
};

export type ApplyResult = {
  applied: boolean;
  repository: GitRepository;
  config: GitConfigSnapshot;
  historyItem: ApplyHistoryItem;
};

export type ConnectionTestResult = {
  commandLabel: string;
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode?: number | null;
};

export type CommandError = {
  code?: string;
  message?: string;
};

export const gitscopeApi = {
  readRepositoryStatus(path?: string) {
    return invoke<RepositoryStatus>("read_repository_status", { path });
  },
  listProfiles() {
    return invoke<GitIdentityProfile[]>("list_profiles");
  },
  saveProfile(profile: ProfileInput) {
    return invoke<GitIdentityProfile>("save_profile", { profile });
  },
  deleteProfile(profileId: string) {
    return invoke<GitIdentityProfile[]>("delete_profile", { profileId });
  },
  listApplyHistory() {
    return invoke<ApplyHistoryItem[]>("list_apply_history");
  },
  checkSshKey(path: string) {
    return invoke<SshKeyStatus>("check_ssh_key", { path });
  },
  createApplyPlan(path: string, profile: GitIdentityProfile) {
    return invoke<ApplyPlan>("create_apply_plan", { path, profile });
  },
  runPreflight(path: string, profile: GitIdentityProfile) {
    return invoke<PreflightResult>("run_preflight", { path, profile });
  },
  applyProfile(path: string, profile: GitIdentityProfile) {
    return invoke<ApplyResult>("apply_profile", { path, profile });
  },
  testSshConnection(profile: GitIdentityProfile) {
    return invoke<ConnectionTestResult>("test_ssh_connection", { profile });
  },
  testGitLsRemote(path: string, profile: GitIdentityProfile) {
    return invoke<ConnectionTestResult>("test_git_ls_remote", {
      path,
      profile,
    });
  },
};

export function commandErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const commandError = error as CommandError;
    const message = commandError.message ?? commandError.code ?? JSON.stringify(error);
    if (message.includes("invoke")) {
      return "GitScope commands are available in the Tauri desktop shell. Use bun run tauri dev to scan and apply repository config.";
    }

    return message;
  }

  return "Unexpected command error.";
}
