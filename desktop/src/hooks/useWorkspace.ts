import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ApplyHistoryItem,
  ApplyPlan,
  ConnectionTestResult,
  emptyProfile,
  GenerateKeyInput,
  GitIdentityProfile,
  PreflightResult,
  ProfileInput,
  Project,
  RepositoryStatus,
  SshKeyInfo,
} from "../domain/gitscope";
import { commandErrorMessage, gitscopeApi } from "../services/gitscope";
import { chooseDirectory, chooseFile } from "../services/dialog";

/**
 * Workspace store. Owns the project-independent Profiles library plus the
 * managed list of Projects (and which one is open). Per-project git status is
 * scanned on demand and cached by project id. The apply flow is layered on in a
 * later module; this store covers list, persistence, and open/close.
 */
export function useWorkspace() {
  const [profiles, setProfiles] = useState<GitIdentityProfile[]>([]);
  const [profileForm, setProfileForm] = useState<ProfileInput>(emptyProfile);
  const [sshKeys, setSshKeys] = useState<SshKeyInfo[]>([]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<
    Record<string, RepositoryStatus | null>
  >({});
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [history, setHistory] = useState<ApplyHistoryItem[]>([]);
  const [applyPlan, setApplyPlan] = useState<ApplyPlan | null>(null);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [connectionResult, setConnectionResult] =
    useState<ConnectionTestResult | null>(null);

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const openProject = useMemo(
    () => projects.find((project) => project.id === openProjectId) ?? null,
    [projects, openProjectId],
  );

  const openProjectStatus = openProjectId
    ? projectStatuses[openProjectId] ?? null
    : null;

  const linkedProfile = useMemo(
    () =>
      openProject?.linkedProfileId
        ? profiles.find((profile) => profile.id === openProject.linkedProfileId) ??
          null
        : null,
    [openProject, profiles],
  );

  // Drift is derived from the apply plan: a linked profile whose desired config
  // already matches the repo produces zero changes.
  const identityState: "matched" | "drift" | "unlinked" = !linkedProfile
    ? "unlinked"
    : applyPlan && applyPlan.changes.length === 0
      ? "matched"
      : "drift";

  const projectHistory = useMemo(
    () =>
      openProject
        ? history.filter((item) => item.repoPath === openProject.path)
        : [],
    [history, openProject],
  );

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    // A new project/profile/status context invalidates any prior connection test.
    setConnectionResult(null);

    if (!openProject || !linkedProfile || !openProjectStatus) {
      setApplyPlan(null);
      setPreflight(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const [plan, checks] = await Promise.all([
          gitscopeApi.createApplyPlan(openProject.path, linkedProfile),
          gitscopeApi.runPreflight(openProject.path, linkedProfile),
        ]);
        if (!cancelled) {
          setApplyPlan(plan);
          setPreflight(checks);
        }
      } catch {
        if (!cancelled) {
          setApplyPlan(null);
          setPreflight(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [openProject, linkedProfile, openProjectStatus]);

  async function loadInitialData() {
    setBusy(true);
    setMessage("");

    try {
      const [storedProfiles, storedProjects, applyHistory, keys] =
        await Promise.all([
          gitscopeApi.listProfiles(),
          gitscopeApi.listProjects(),
          gitscopeApi.listApplyHistory(),
          gitscopeApi.listSshKeys(),
        ]);

      setProfiles(storedProfiles);
      setProjects(storedProjects);
      setHistory(applyHistory);
      setSshKeys(keys);
      void scanProjects(storedProjects);
      // The app always opens on the Projects list; opening a project is
      // in-memory navigation, not a persisted selection.
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function scanProjects(list: Project[]) {
    const entries = await Promise.all(
      list.map(async (project) => {
        try {
          const status = await gitscopeApi.readRepositoryStatus(project.path);
          return [project.id, status] as const;
        } catch {
          return [project.id, null] as const;
        }
      }),
    );

    setProjectStatuses((previous) => {
      const next = { ...previous };
      for (const [id, status] of entries) {
        next[id] = status;
      }
      return next;
    });
  }

  async function refreshProjectStatus(project: Project) {
    try {
      const status = await gitscopeApi.readRepositoryStatus(project.path);
      setProjectStatuses((previous) => ({ ...previous, [project.id]: status }));
    } catch {
      setProjectStatuses((previous) => ({ ...previous, [project.id]: null }));
    }
  }

  async function addProject() {
    setBusy(true);
    setMessage("");

    try {
      const directory = await chooseDirectory();
      if (!directory) {
        return;
      }

      const project = await gitscopeApi.addProject(directory);
      setProjects(await gitscopeApi.listProjects());
      await refreshProjectStatus(project);
      setOpenProjectId(project.id);
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function removeProject(project: Project) {
    const confirmed = window.confirm(
      `Remove "${project.name}" from Contexa? This does not delete any files.`,
    );
    if (!confirmed) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const nextProjects = await gitscopeApi.removeProject(project.id);
      setProjects(nextProjects);
      if (openProjectId === project.id) {
        setOpenProjectId(null);
      }
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function openProjectById(project: Project) {
    // Navigate to the project's detail page (in-memory only) and refresh its
    // git status in the background; no persisted "current project".
    setMessage("");
    setOpenProjectId(project.id);
    void refreshProjectStatus(project);
  }

  function closeProject() {
    setOpenProjectId(null);
    setMessage("");
  }

  async function linkProfile(profileId: string | null) {
    if (!openProject) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const updated = await gitscopeApi.linkProfileToProject(
        openProject.id,
        profileId,
      );
      setProjects((previous) =>
        previous.map((project) =>
          project.id === updated.id ? updated : project,
        ),
      );
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function applyIdentity() {
    if (!openProject || !linkedProfile) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const result = await gitscopeApi.applyProfile(
        openProject.path,
        linkedProfile,
      );
      // Update this project's cached status so drift/diff recompute as matched.
      setProjectStatuses((previous) => ({
        ...previous,
        [openProject.id]: { repository: result.repository, config: result.config },
      }));
      setHistory(await gitscopeApi.listApplyHistory());
      setMessage(result.historyItem.message);
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function runConnectionTest(kind: "ssh" | "remote") {
    if (!openProject || !linkedProfile) {
      return;
    }

    setBusy(true);
    setConnectionResult(null);
    setMessage("");

    try {
      const result =
        kind === "ssh"
          ? await gitscopeApi.testSshConnection(linkedProfile)
          : await gitscopeApi.testGitLsRemote(openProject.path, linkedProfile);
      setConnectionResult(result);
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(
    event: FormEvent<HTMLFormElement>,
  ): Promise<boolean> {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const saved = await gitscopeApi.saveProfile(profileForm);
      setProfiles(await gitscopeApi.listProfiles());
      setProfileForm(emptyProfile);
      setMessage(`Saved profile ${saved.label}.`);
      return true;
    } catch (error) {
      setMessage(commandErrorMessage(error));
      return false;
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
  }

  async function deleteProfile(profile: GitIdentityProfile) {
    const confirmed = window.confirm(`Delete profile "${profile.label}"?`);
    if (!confirmed) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      setProfiles(await gitscopeApi.deleteProfile(profile.id));
      setMessage(`Deleted profile ${profile.label}.`);
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function refreshSshKeys() {
    try {
      setSshKeys(await gitscopeApi.listSshKeys());
    } catch (error) {
      setMessage(commandErrorMessage(error));
    }
  }

  async function addSshKeyFromFile() {
    setBusy(true);
    setMessage("");

    try {
      const selectedPath = await chooseFile();
      if (!selectedPath) {
        return;
      }
      setSshKeys(await gitscopeApi.addSshKey(selectedPath));
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function removeSshKey(key: SshKeyInfo) {
    setBusy(true);
    setMessage("");

    try {
      setSshKeys(await gitscopeApi.removeSshKey(key.path));
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function deleteSshKey(key: SshKeyInfo) {
    const confirmed = window.confirm(
      `Delete ${key.name} and its public key from disk? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      setSshKeys(await gitscopeApi.deleteSshKey(key.path));
      setMessage(`Deleted ${key.name}.`);
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function generateSshKey(input: GenerateKeyInput): Promise<boolean> {
    setBusy(true);
    setMessage("");

    try {
      const created = await gitscopeApi.generateSshKey(input);
      await refreshSshKeys();
      setMessage(`Generated ${created.name}.`);
      return true;
    } catch (error) {
      setMessage(commandErrorMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function copyPublicKey(key: SshKeyInfo) {
    try {
      const contents = await gitscopeApi.readPublicKey(key.path);
      await navigator.clipboard.writeText(contents);
      setMessage(`Copied public key for ${key.name}.`);
    } catch (error) {
      setMessage(commandErrorMessage(error));
    }
  }

  async function copyKeyPath(key: SshKeyInfo) {
    try {
      await navigator.clipboard.writeText(key.path);
      setMessage("Copied key path to clipboard.");
    } catch (error) {
      setMessage(commandErrorMessage(error));
    }
  }

  async function revealSshKey(key: SshKeyInfo) {
    try {
      await gitscopeApi.revealSshKey(key.path);
    } catch (error) {
      setMessage(commandErrorMessage(error));
    }
  }

  return {
    actions: {
      addProject,
      removeProject,
      openProject: openProjectById,
      closeProject,
      linkProfile,
      applyIdentity,
      runConnectionTest,
      saveProfile,
      editProfile,
      deleteProfile,
      setProfileForm,
      refreshSshKeys,
      addSshKey: addSshKeyFromFile,
      removeSshKey,
      deleteSshKey,
      generateSshKey,
      copyPublicKey,
      copyKeyPath,
      revealSshKey,
    },
    state: {
      profiles,
      profileForm,
      sshKeys,
      projects,
      projectStatuses,
      openProject,
      openProjectStatus,
      linkedProfile,
      identityState,
      applyPlan,
      preflight,
      connectionResult,
      projectHistory,
      busy,
      message,
    },
  };
}
