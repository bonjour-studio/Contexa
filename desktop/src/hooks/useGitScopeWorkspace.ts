import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  emptyProfile,
  GitIdentityProfile,
  ProfileInput,
  RepositoryStatus,
  SshKeyStatus,
  WorkspaceTab,
} from "../domain/gitscope";
import {
  ApplyHistoryItem,
  ApplyPlan,
  ConnectionTestResult,
  PreflightResult,
  commandErrorMessage,
  gitscopeApi,
} from "../services/gitscope";
import { chooseDirectory, chooseFile } from "../services/dialog";

export function useGitScopeWorkspace() {
  const [tab, setTab] = useState<WorkspaceTab>("overview");
  const [repoPath, setRepoPath] = useState("");
  const [status, setStatus] = useState<RepositoryStatus | null>(null);
  const [profiles, setProfiles] = useState<GitIdentityProfile[]>([]);
  const [history, setHistory] = useState<ApplyHistoryItem[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profileForm, setProfileForm] = useState<ProfileInput>(emptyProfile);
  const [keyStatus, setKeyStatus] = useState<SshKeyStatus | null>(null);
  const [applyPlan, setApplyPlan] = useState<ApplyPlan | null>(null);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [connectionResult, setConnectionResult] =
    useState<ConnectionTestResult | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );

  const identityMatch = Boolean(
    selectedProfile && applyPlan && applyPlan.changes.length === 0,
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

  async function chooseRepositoryDirectory() {
    setBusy(true);
    setMessage("");

    let selectedPath: string | null = null;

    try {
      selectedPath = await chooseDirectory(repoPath || undefined);
      if (selectedPath) {
        await refreshRepository(selectedPath);
      }
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      if (!selectedPath) {
        setBusy(false);
      }
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

  async function chooseSshKeyFile() {
    setBusy(true);
    setMessage("");

    try {
      const selectedPath = await chooseFile(profileForm.sshKeyPath || undefined);
      if (!selectedPath) {
        return;
      }

      setProfileForm({
        ...profileForm,
        sshKeyPath: selectedPath,
      });
      setKeyStatus(await gitscopeApi.checkSshKey(selectedPath));
    } catch (error) {
      setMessage(commandErrorMessage(error));
    } finally {
      setBusy(false);
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

  return {
    actions: {
      applySelectedProfile,
      chooseRepositoryDirectory,
      chooseSshKeyFile,
      deleteProfile,
      editProfile,
      runConnectionTest,
      saveProfile,
      setProfileForm,
      setSelectedProfileId,
      setTab,
    },
    state: {
      applyPlan,
      busy,
      connectionResult,
      history,
      identityMatch,
      keyStatus,
      message,
      preflight,
      profileForm,
      profiles,
      repoPath,
      selectedProfile,
      selectedProfileId,
      status,
      tab,
    },
  };
}
