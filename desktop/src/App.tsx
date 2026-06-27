import { FormEvent, useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  ApplyHistoryItem,
  ApplyPlan,
  CheckStatus,
  ConnectionTestResult,
  GitIdentityProfile,
  ProfileInput,
  RepositoryStatus,
  SshKeyStatus,
  commandErrorMessage,
  gitscopeApi,
} from "./services/gitscope";

type WorkspaceTab = "overview" | "profiles" | "review";

const emptyProfile: ProfileInput = {
  label: "",
  userName: "",
  userEmail: "",
  sshKeyPath: "",
  remoteHost: "github.com",
};

function App() {
  const [tab, setTab] = useState<WorkspaceTab>("overview");
  const [repoPath, setRepoPath] = useState("");
  const [status, setStatus] = useState<RepositoryStatus | null>(null);
  const [profiles, setProfiles] = useState<GitIdentityProfile[]>([]);
  const [history, setHistory] = useState<ApplyHistoryItem[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profileForm, setProfileForm] = useState<ProfileInput>(emptyProfile);
  const [keyStatus, setKeyStatus] = useState<SshKeyStatus | null>(null);
  const [applyPlan, setApplyPlan] = useState<ApplyPlan | null>(null);
  const [preflight, setPreflight] = useState<Awaited<
    ReturnType<typeof gitscopeApi.runPreflight>
  > | null>(null);
  const [connectionResult, setConnectionResult] =
    useState<ConnectionTestResult | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedProfile || !status) {
      setApplyPlan(null);
      setPreflight(null);
      return;
    }

    void refreshApplyPreview(selectedProfile, status.repository.rootPath);
  }, [selectedProfile, status]);

  async function loadInitialData() {
    setBusy(true);
    setMessage("");

    try {
      const [storedProfiles, applyHistory] = await Promise.all([
        gitscopeApi.listProfiles(),
        gitscopeApi.listApplyHistory(),
      ]);

      setProfiles(storedProfiles);
      setHistory(applyHistory);

      if (storedProfiles.length > 0) {
        setSelectedProfileId(storedProfiles[0].id);
      }

      try {
        const repoStatus = await gitscopeApi.readRepositoryStatus(undefined);
        setStatus(repoStatus);
        setRepoPath(repoStatus.repository.rootPath);
      } catch (repoError) {
        setMessage(commandErrorMessage(repoError));
      }
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function refreshRepository(path = repoPath) {
    setBusy(true);
    setMessage("");

    try {
      const repoStatus = await gitscopeApi.readRepositoryStatus(path || undefined);
      setStatus(repoStatus);
      setRepoPath(repoStatus.repository.rootPath);
    } catch (error) {
      setStatus(null);
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function refreshApplyPreview(
    profile: GitIdentityProfile,
    path: string,
  ) {
    setConnectionResult(null);

    try {
      const [plan, checks] = await Promise.all([
        gitscopeApi.createApplyPlan(path, profile),
        gitscopeApi.runPreflight(path, profile),
      ]);
      setApplyPlan(plan);
      setPreflight(checks);
    } catch (error) {
      setApplyPlan(null);
      setPreflight(null);
      setMessage(commandErrorMessage(error));
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const saved = await gitscopeApi.saveProfile(profileForm);
      const nextProfiles = await gitscopeApi.listProfiles();
      setProfiles(nextProfiles);
      setSelectedProfileId(saved.id);
      setProfileForm(emptyProfile);
      setKeyStatus(null);
      setTab("review");
      setMessage(`Saved profile ${saved.label}.`);
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function editProfile(profile: GitIdentityProfile) {
    setProfileForm({
      id: profile.id,
      label: profile.label,
      userName: profile.userName,
      userEmail: profile.userEmail,
      sshKeyPath: profile.sshKeyPath,
      remoteHost: profile.remoteHost,
    });
    setTab("profiles");
  }

  async function deleteProfile(profile: GitIdentityProfile) {
    const confirmed = window.confirm(`Delete profile "${profile.label}"?`);
    if (!confirmed) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const nextProfiles = await gitscopeApi.deleteProfile(profile.id);
      setProfiles(nextProfiles);
      setSelectedProfileId(nextProfiles[0]?.id ?? "");
      setMessage(`Deleted profile ${profile.label}.`);
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function inspectKey() {
    if (!profileForm.sshKeyPath.trim()) {
      setKeyStatus(null);
      return;
    }

    try {
      setKeyStatus(await gitscopeApi.checkSshKey(profileForm.sshKeyPath));
    } catch (error) {
      setMessage(commandErrorMessage(error));
    }
  }

  async function applySelectedProfile() {
    if (!selectedProfile || !status) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const result = await gitscopeApi.applyProfile(
        status.repository.rootPath,
        selectedProfile,
      );
      setStatus({
        repository: result.repository,
        config: result.config,
      });
      const applyHistory = await gitscopeApi.listApplyHistory();
      setHistory(applyHistory);
      setMessage(result.historyItem.message);
      await refreshApplyPreview(selectedProfile, result.repository.rootPath);
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function runConnectionTest(kind: "ssh" | "remote") {
    if (!selectedProfile || !status) {
      return;
    }

    setBusy(true);
    setConnectionResult(null);
    setMessage("");

    try {
      const result =
        kind === "ssh"
          ? await gitscopeApi.testSshConnection(selectedProfile)
          : await gitscopeApi.testGitLsRemote(
              status.repository.rootPath,
              selectedProfile,
            );
      setConnectionResult(result);
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const identityMatch = Boolean(selectedProfile && applyPlan) && applyPlan?.changes.length === 0;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">GS</span>
          <div>
            <h1>GitScope</h1>
            <p>Repository identity safety belt</p>
          </div>
        </div>

        <nav className="nav-list" aria-label="GitScope workspace">
          <button
            className={tab === "overview" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("overview")}
            type="button"
          >
            Overview
          </button>
          <button
            className={tab === "profiles" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("profiles")}
            type="button"
          >
            Profiles
          </button>
          <button
            className={tab === "review" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("review")}
            type="button"
          >
            Apply Review
          </button>
        </nav>

        <section className="sidebar-panel">
          <span className="eyebrow">Current Repo</span>
          <strong>{status ? shortPath(status.repository.rootPath) : "Not detected"}</strong>
          <p>{status?.repository.currentBranch ?? "No branch selected"}</p>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="repo-path-control">
            <label htmlFor="repo-path">Repository path</label>
            <div className="inline-control">
              <input
                id="repo-path"
                value={repoPath}
                onChange={(event) => setRepoPath(event.currentTarget.value)}
                placeholder="/path/to/git/repo"
              />
              <button
                disabled={busy}
                onClick={() => void refreshRepository()}
                type="button"
              >
                Scan
              </button>
            </div>
          </div>

          <div className="profile-picker">
            <label htmlFor="profile-select">Profile</label>
            <select
              id="profile-select"
              value={selectedProfileId}
              onChange={(event) => setSelectedProfileId(event.currentTarget.value)}
            >
              <option value="">Select profile</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        {message && <div className="message-bar">{message}</div>}

        {tab === "overview" && (
          <OverviewPanel
            status={status}
            selectedProfile={selectedProfile}
            identityMatch={identityMatch}
            history={history}
            onOpenReview={() => setTab("review")}
          />
        )}

        {tab === "profiles" && (
          <ProfilesPanel
            profiles={profiles}
            profileForm={profileForm}
            keyStatus={keyStatus}
            busy={busy}
            onFormChange={setProfileForm}
            onSave={saveProfile}
            onInspectKey={() => void inspectKey()}
            onEdit={editProfile}
            onDelete={(profile) => void deleteProfile(profile)}
          />
        )}

        {tab === "review" && (
          <ReviewPanel
            status={status}
            selectedProfile={selectedProfile}
            applyPlan={applyPlan}
            preflight={preflight}
            connectionResult={connectionResult}
            busy={busy}
            onApply={() => void applySelectedProfile()}
            onTestSsh={() => void runConnectionTest("ssh")}
            onTestRemote={() => void runConnectionTest("remote")}
            onOpenProfiles={() => setTab("profiles")}
          />
        )}
      </section>
    </main>
  );
}

type OverviewPanelProps = {
  status: RepositoryStatus | null;
  selectedProfile: GitIdentityProfile | null;
  identityMatch: boolean;
  history: ApplyHistoryItem[];
  onOpenReview: () => void;
};

function OverviewPanel({
  status,
  selectedProfile,
  identityMatch,
  history,
  onOpenReview,
}: OverviewPanelProps) {
  return (
    <div className="panel-grid">
      <section className="panel panel-wide">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Local Git Config</span>
            <h2>Repository identity</h2>
          </div>
          <StatusBadge
            status={identityMatch ? "passed" : "warning"}
            label={identityMatch ? "Matched" : "Needs Review"}
          />
        </div>

        <dl className="identity-grid">
          <div>
            <dt>user.name</dt>
            <dd>{status?.config.userName ?? "Unset"}</dd>
          </div>
          <div>
            <dt>user.email</dt>
            <dd>{status?.config.userEmail ?? "Unset"}</dd>
          </div>
          <div>
            <dt>SSH key</dt>
            <dd>{status?.config.inferredSshKeyPath ?? "Unset"}</dd>
          </div>
          <div>
            <dt>Remote</dt>
            <dd>{status?.repository.remote?.url ?? "No remote"}</dd>
          </div>
        </dl>

        <button
          className="primary-action"
          disabled={!selectedProfile || !status}
          onClick={onOpenReview}
          type="button"
        >
          Review Apply Plan
        </button>
      </section>

      <section className="panel">
        <span className="eyebrow">Selected Profile</span>
        {selectedProfile ? (
          <dl className="compact-list">
            <div>
              <dt>Label</dt>
              <dd>{selectedProfile.label}</dd>
            </div>
            <div>
              <dt>Name</dt>
              <dd>{selectedProfile.userName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{selectedProfile.userEmail}</dd>
            </div>
            <div>
              <dt>Host</dt>
              <dd>{selectedProfile.remoteHost}</dd>
            </div>
          </dl>
        ) : (
          <p className="empty-copy">Create or select a profile to compare against this repo.</p>
        )}
      </section>

      <section className="panel">
        <span className="eyebrow">Apply History</span>
        {history.length === 0 ? (
          <p className="empty-copy">No profile has been applied from GitScope yet.</p>
        ) : (
          <div className="history-list">
            {history.slice(0, 5).map((item) => (
              <div key={item.id} className="history-item">
                <strong>{item.profileLabel}</strong>
                <span>{shortPath(item.repoPath)}</span>
                <time>{formatDate(item.appliedAt)}</time>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type ProfilesPanelProps = {
  profiles: GitIdentityProfile[];
  profileForm: ProfileInput;
  keyStatus: SshKeyStatus | null;
  busy: boolean;
  onFormChange: (profile: ProfileInput) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onInspectKey: () => void;
  onEdit: (profile: GitIdentityProfile) => void;
  onDelete: (profile: GitIdentityProfile) => void;
};

function ProfilesPanel({
  profiles,
  profileForm,
  keyStatus,
  busy,
  onFormChange,
  onSave,
  onInspectKey,
  onEdit,
  onDelete,
}: ProfilesPanelProps) {
  return (
    <div className="profiles-layout">
      <section className="panel profile-editor">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Profile</span>
            <h2>{profileForm.id ? "Edit identity" : "Create identity"}</h2>
          </div>
        </div>

        <form className="profile-form" onSubmit={onSave}>
          <label>
            Label
            <input
              value={profileForm.label}
              onChange={(event) =>
                onFormChange({ ...profileForm, label: event.currentTarget.value })
              }
              placeholder="Work"
            />
          </label>
          <label>
            user.name
            <input
              value={profileForm.userName}
              onChange={(event) =>
                onFormChange({
                  ...profileForm,
                  userName: event.currentTarget.value,
                })
              }
              placeholder="Hao Wang"
            />
          </label>
          <label>
            user.email
            <input
              value={profileForm.userEmail}
              onChange={(event) =>
                onFormChange({
                  ...profileForm,
                  userEmail: event.currentTarget.value,
                })
              }
              placeholder="name@example.com"
            />
          </label>
          <label>
            SSH private key path reference
            <div className="inline-control">
              <input
                value={profileForm.sshKeyPath}
                onChange={(event) =>
                  onFormChange({
                    ...profileForm,
                    sshKeyPath: event.currentTarget.value,
                  })
                }
                onBlur={onInspectKey}
                placeholder="~/.ssh/work_ed25519"
              />
              <button type="button" onClick={onInspectKey}>
                Check
              </button>
            </div>
          </label>
          <label>
            Remote host
            <input
              value={profileForm.remoteHost}
              onChange={(event) =>
                onFormChange({
                  ...profileForm,
                  remoteHost: event.currentTarget.value,
                })
              }
              placeholder="github.com"
            />
          </label>

          {keyStatus && (
            <div className="key-status">
              <StatusBadge
                status={
                  keyStatus.exists && keyStatus.isFile && keyStatus.readable
                    ? "passed"
                    : "failed"
                }
                label={
                  keyStatus.exists && keyStatus.isFile && keyStatus.readable
                    ? "Key Ready"
                    : "Key Issue"
                }
              />
              <span>{keyStatus.message ?? keyStatus.expandedPath}</span>
            </div>
          )}

          <div className="form-actions">
            <button className="primary-action" disabled={busy} type="submit">
              Save Profile
            </button>
            <button
              type="button"
              onClick={() => onFormChange(emptyProfile)}
              disabled={busy}
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="panel profiles-list-panel">
        <span className="eyebrow">Saved Profiles</span>
        <div className="profile-list">
          {profiles.length === 0 ? (
            <p className="empty-copy">No profiles saved yet.</p>
          ) : (
            profiles.map((profile) => (
              <article className="profile-row" key={profile.id}>
                <div>
                  <h3>{profile.label}</h3>
                  <p>{profile.userName}</p>
                  <span>{profile.userEmail}</span>
                </div>
                <div className="row-actions">
                  <button type="button" onClick={() => onEdit(profile)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => onDelete(profile)}>
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

type ReviewPanelProps = {
  status: RepositoryStatus | null;
  selectedProfile: GitIdentityProfile | null;
  applyPlan: ApplyPlan | null;
  preflight: Awaited<ReturnType<typeof gitscopeApi.runPreflight>> | null;
  connectionResult: ConnectionTestResult | null;
  busy: boolean;
  onApply: () => void;
  onTestSsh: () => void;
  onTestRemote: () => void;
  onOpenProfiles: () => void;
};

function ReviewPanel({
  status,
  selectedProfile,
  applyPlan,
  preflight,
  connectionResult,
  busy,
  onApply,
  onTestSsh,
  onTestRemote,
  onOpenProfiles,
}: ReviewPanelProps) {
  if (!status) {
    return (
      <section className="panel">
        <h2>No repository detected</h2>
        <p className="empty-copy">Scan a Git repository before reviewing an apply plan.</p>
      </section>
    );
  }

  if (!selectedProfile) {
    return (
      <section className="panel">
        <h2>No profile selected</h2>
        <p className="empty-copy">Create or select a profile before applying config.</p>
        <button className="primary-action" onClick={onOpenProfiles} type="button">
          Create Profile
        </button>
      </section>
    );
  }

  return (
    <div className="review-layout">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Apply Target</span>
            <h2>{selectedProfile.label}</h2>
          </div>
          <StatusBadge
            status={preflight?.canApply ? "passed" : "warning"}
            label={preflight?.canApply ? "Ready" : "Review"}
          />
        </div>

        <dl className="compact-list">
          <div>
            <dt>Repository</dt>
            <dd>{status.repository.rootPath}</dd>
          </div>
          <div>
            <dt>Writes</dt>
            <dd>.git/config via git config --local</dd>
          </div>
          <div>
            <dt>SSH command</dt>
            <dd>{applyPlan?.sshCommand ?? "Waiting for profile"}</dd>
          </div>
        </dl>

        <div className="review-actions">
          <button disabled={busy} onClick={onTestSsh} type="button">
            Test SSH
          </button>
          <button disabled={busy} onClick={onTestRemote} type="button">
            Test Remote
          </button>
          <button
            className="primary-action"
            disabled={busy || !preflight?.canApply}
            onClick={onApply}
            type="button"
          >
            Apply to This Repo
          </button>
        </div>
      </section>

      <section className="panel">
        <span className="eyebrow">Preflight</span>
        <div className="check-list">
          {preflight?.checks.map((check) => (
            <div className="check-row" key={check.id}>
              <StatusDot status={check.status} />
              <div>
                <strong>{check.label}</strong>
                <p>{check.message}</p>
              </div>
            </div>
          )) ?? <p className="empty-copy">Preflight will run when a profile is selected.</p>}
        </div>
      </section>

      <section className="panel panel-wide">
        <span className="eyebrow">Diff Preview</span>
        <pre className="diff-view">{applyPlan?.diff ?? "No preview available."}</pre>
      </section>

      {connectionResult && (
        <section className="panel panel-wide">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Connection Test</span>
              <h2>{connectionResult.commandLabel}</h2>
            </div>
            <StatusBadge
              status={connectionResult.success ? "passed" : "failed"}
              label={connectionResult.success ? "Passed" : "Failed"}
            />
          </div>
          <pre className="command-output">
            {[connectionResult.stdout, connectionResult.stderr]
              .filter(Boolean)
              .join("\n") || `Exit code ${connectionResult.exitCode ?? "unknown"}`}
          </pre>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status, label }: { status: CheckStatus; label: string }) {
  return <span className={`status-badge ${status}`}>{label}</span>;
}

function StatusDot({ status }: { status: CheckStatus }) {
  return <span className={`status-dot ${status}`} aria-hidden="true" />;
}

function shortPath(path: string) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 3) {
    return path;
  }

  return `.../${parts.slice(-3).join("/")}`;
}

function formatDate(epochSeconds: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(epochSeconds * 1000));
}

export default App;
