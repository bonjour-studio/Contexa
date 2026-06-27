import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ApplyHistoryItem,
  ApplyPlan,
  emptyProfile,
  GitIdentityProfile,
  ProfileInput,
  Project,
  RepositoryStatus,
  SshKeyStatus,
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
  const [keyStatus, setKeyStatus] = useState<SshKeyStatus | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<
    Record<string, RepositoryStatus | null>
  >({});
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [history, setHistory] = useState<ApplyHistoryItem[]>([]);
  const [applyPlan, setApplyPlan] = useState<ApplyPlan | null>(null);

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
    if (!openProject || !linkedProfile || !openProjectStatus) {
      setApplyPlan(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const plan = await gitscopeApi.createApplyPlan(
          openProject.path,
          linkedProfile,
        );
        if (!cancelled) {
          setApplyPlan(plan);
        }
      } catch {
        if (!cancelled) {
          setApplyPlan(null);
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
      const [storedProfiles, storedProjects, current, applyHistory] =
        await Promise.all([
          gitscopeApi.listProfiles(),
          gitscopeApi.listProjects(),
          gitscopeApi.getCurrentProject(),
          gitscopeApi.listApplyHistory(),
        ]);

      setProfiles(storedProfiles);
      setProjects(storedProjects);
      setHistory(applyHistory);
      void scanProjects(storedProjects);

      // Restore the last-opened project straight into its workbench.
      if (current) {
        setOpenProjectId(current.id);
      }
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

  async function openProjectById(project: Project) {
    setBusy(true);
    setMessage("");

    try {
      await gitscopeApi.setCurrentProject(project.id);
      await refreshProjectStatus(project);
      setOpenProjectId(project.id);
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function closeProject() {
    // Keep the persisted current project as the last-opened one for restore.
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

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const saved = await gitscopeApi.saveProfile(profileForm);
      setProfiles(await gitscopeApi.listProfiles());
      setProfileForm(emptyProfile);
      setKeyStatus(null);
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

  async function chooseSshKeyFile() {
    setBusy(true);
    setMessage("");

    try {
      const selectedPath = await chooseFile(profileForm.sshKeyPath || undefined);
      if (!selectedPath) {
        return;
      }

      setProfileForm({ ...profileForm, sshKeyPath: selectedPath });
      setKeyStatus(await gitscopeApi.checkSshKey(selectedPath));
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return {
    actions: {
      addProject,
      removeProject,
      openProject: openProjectById,
      closeProject,
      linkProfile,
      saveProfile,
      editProfile,
      deleteProfile,
      chooseSshKeyFile,
      setProfileForm,
    },
    state: {
      profiles,
      profileForm,
      keyStatus,
      projects,
      projectStatuses,
      openProject,
      openProjectStatus,
      linkedProfile,
      identityState,
      applyPlan,
      projectHistory,
      busy,
      message,
    },
  };
}
