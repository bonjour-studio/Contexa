import { invoke } from "@tauri-apps/api/core";
import type {
  ApplyHistoryItem,
  ApplyPlan,
  ApplyResult,
  CommandError,
  ConnectionTestResult,
  GitIdentityProfile,
  PreflightResult,
  ProfileInput,
  RepositoryStatus,
  SshKeyStatus,
} from "../domain/gitscope";

export type {
  ApplyHistoryItem,
  ApplyPlan,
  ApplyResult,
  ConnectionTestResult,
  GitIdentityProfile,
  PreflightResult,
  ProfileInput,
  RepositoryStatus,
  SshKeyStatus,
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
      return "Contexa commands are available in the Tauri desktop shell. Use bun run tauri dev to scan and apply repository config.";
    }

    return message;
  }

  return "Unexpected command error.";
}
