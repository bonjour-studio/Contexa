export type WorkspaceTab = "overview" | "profiles" | "review";

export type Project = {
  id: string;
  name: string;
  path: string;
  addedAt: number;
  lastOpenedAt: number;
  linkedProfileId?: string | null;
};

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

export type SshKeyType = "ed25519" | "rsa" | "ecdsa";

export type SshKeyInfo = {
  path: string;
  publicPath?: string | null;
  name: string;
  keyType?: string | null;
  bits?: number | null;
  comment?: string | null;
  fingerprint?: string | null;
  hasPrivate: boolean;
  hasPublic: boolean;
  source: "scan" | "manual";
};

export type GenerateKeyInput = {
  name: string;
  keyType: SshKeyType;
  bits?: number | null;
  comment: string;
  passphrase: string;
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

export const emptyProfile: ProfileInput = {
  label: "",
  userName: "",
  userEmail: "",
  sshKeyPath: "",
  remoteHost: "github.com",
};
